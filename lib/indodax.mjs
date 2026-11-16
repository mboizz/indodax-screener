// Parser & helper untuk API publik Indodax.
// Dipakai oleh Netlify Functions dan oleh tes (test/*.test.mjs).
// Semua fungsi murni (tanpa I/O) kecuali fetchIndodax.

export const INDODAX_BASE = "https://indodax.com";

/** Kunci pasang yang valid untuk endpoint trades/depth/OHLC: huruf kecil + angka, diakhiri "idr". */
export const PAIR_RE = /^[a-z0-9]{1,24}idr$/;

/** Timeframe OHLC yang diizinkan → detik per candle. */
export const TIMEFRAMES = { "15": 900, "60": 3600, "240": 14400, "1D": 86400 };

const STABLES = new Set(["usdt", "usdc", "dai", "busd", "tusd", "fdusd", "usdx", "idrx", "pyusd", "usde", "usd1"]);
const GOLD = new Set(["paxg", "xaut", "gid"]);

export class IndodaxError extends Error {
  constructor(message, code = "upstream_error", status = 502) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const num = (v) => {
  const n = typeof v === "number" ? v : Number.parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

/** Lempar IndodaxError bila respons berisi objek error (Indodax membalas error dengan HTTP 200). */
export function assertNoApiError(data) {
  if (data && typeof data === "object" && !Array.isArray(data) && ("error" in data || "error_code" in data)) {
    const code = String(data.error_code || data.error || "api_error");
    const msg = String(data.error_description || data.error || "Indodax mengembalikan error");
    throw new IndodaxError(msg, code, code === "invalid_pair" ? 404 : 502);
  }
}

/** Kategori aset dari kunci dasar dan namanya. */
export function categorize(base, name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("tokenized stock") || n.includes("xstock")) return "saham";
  if (GOLD.has(base) || /\b(pax|tether) gold\b/.test(n)) return "emas";
  if (STABLES.has(base) || /\bstablecoin\b|tether usd/.test(n)) return "stablecoin";
  return "kripto";
}

/**
 * Normalisasi respons /api/summaries.
 * Kunci asli berbentuk "btc_idr"; prices_24h/prices_7d memakai "btcidr".
 * Hanya pasang IDR yang dikembalikan, diurutkan dari volume IDR terbesar.
 */
export function parseSummaries(data) {
  assertNoApiError(data);
  const T = data && data.tickers;
  if (!T || typeof T !== "object") throw new IndodaxError("Format summaries tidak dikenal", "bad_format");
  const p24 = data.prices_24h || {};
  const p7 = data.prices_7d || {};
  const out = [];
  for (const key of Object.keys(T)) {
    const m = /^([a-z0-9]+)_idr$/.exec(key);
    if (!m) continue;
    const base = m[1];
    const id = `${base}idr`;
    const r = T[key] || {};
    const last = num(r.last);
    const buy = num(r.buy);
    const sell = num(r.sell);
    const o24 = num(p24[id]);
    const o7 = num(p7[id]);
    const spread = buy > 0 && sell > 0 && sell >= buy ? ((sell - buy) / sell) * 100 : null;
    out.push({
      id,
      base: base.toUpperCase(),
      name: String(r.name || base.toUpperCase()),
      category: categorize(base, r.name),
      last,
      buy,
      sell,
      high: num(r.high),
      low: num(r.low),
      volCoin: num(r[`vol_${base}`]),
      volIdr: num(r.vol_idr),
      change24h: o24 > 0 ? ((last - o24) / o24) * 100 : null,
      change7d: o7 > 0 ? ((last - o7) / o7) * 100 : null,
      spread,
    });
  }
  out.sort((a, b) => b.volIdr - a.volIdr);
  return out;
}

/** Normalisasi /api/depth/{pair}: n level teratas tiap sisi + kumulatif IDR. */
export function parseDepth(data, levels = 30) {
  assertNoApiError(data);
  const side = (arr) => {
    let cum = 0;
    return (Array.isArray(arr) ? arr : []).slice(0, levels).map(([p, a]) => {
      const price = num(p);
      const amount = num(a);
      cum += price * amount;
      return { price, amount, cumIdr: cum };
    });
  };
  return { bids: side(data && data.buy), asks: side(data && data.sell) };
}

/** Normalisasi /api/trades/{pair}. Respons sukses berupa array. */
export function parseTrades(data, limit = 100) {
  assertNoApiError(data);
  if (!Array.isArray(data)) throw new IndodaxError("Format trades tidak dikenal", "bad_format");
  return data.slice(0, limit).map((t) => {
    const price = num(t.price);
    const amount = num(t.amount);
    return {
      id: String(t.tid ?? t.trade_id ?? `${t.date}-${t.price}-${t.amount}`),
      type: String(t.type).toLowerCase() === "sell" ? "sell" : "buy",
      price,
      amount,
      totalIdr: price * amount,
      time: num(t.date),
    };
  });
}

/** Normalisasi /tradingview/history_v2 → [{t,o,h,l,c,v}] urut waktu naik. */
export function parseOhlc(data) {
  assertNoApiError(data);
  if (!Array.isArray(data)) throw new IndodaxError("Format OHLC tidak dikenal", "bad_format");
  return data
    .map((k) => ({ t: num(k.Time), o: num(k.Open), h: num(k.High), l: num(k.Low), c: num(k.Close), v: num(k.Volume) }))
    .filter((k) => k.t > 0 && k.c > 0)
    .sort((a, b) => a.t - b.t);
}

/** URL OHLC untuk pasang (mis. "btcidr") dan timeframe, sebanyak `count` candle terakhir. */
export function ohlcUrl(pair, tf, count, nowSec = Math.floor(Date.now() / 1000)) {
  const step = TIMEFRAMES[tf];
  if (!step) throw new IndodaxError("Timeframe tidak didukung", "bad_tf", 400);
  const from = nowSec - step * count;
  return `${INDODAX_BASE}/tradingview/history_v2?symbol=${pair.toUpperCase()}&tf=${tf}&from=${from}&to=${nowSec}`;
}

/** GET JSON dari Indodax dengan batas waktu. */
export async function fetchIndodax(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { accept: "application/json", "user-agent": "indodax-screener (+https://indodax-screener.netlify.app)" },
    });
    const text = await res.text();
    if (!res.ok) throw new IndodaxError(`Indodax HTTP ${res.status}`, "upstream_http", 502);
    try {
      return JSON.parse(text);
    } catch {
      throw new IndodaxError("Respons Indodax bukan JSON", "bad_json", 502);
    }
  } catch (e) {
    if (e instanceof IndodaxError) throw e;
    throw new IndodaxError(e && e.name === "AbortError" ? "Indodax tidak merespons (timeout)" : "Gagal menghubungi Indodax", "upstream_unreachable", 504);
  } finally {
    clearTimeout(timer);
  }
}

/** Header cache CDN Netlify (fungsi tidak di-cache tanpa ini). */
export function cacheHeaders(ttl, swr, extra = {}) {
  return {
    "content-type": "application/json; charset=utf-8",
    "Netlify-CDN-Cache-Control": `public, durable, s-maxage=${ttl}, stale-while-revalidate=${swr}`,
    "Cache-Control": "public, max-age=0, must-revalidate",
    ...extra,
  };
}

export function jsonError(e) {
  const status = e && e.status ? e.status : 500;
  return new Response(JSON.stringify({ error: e && e.code ? e.code : "internal_error", message: e && e.message ? e.message : "Kesalahan internal" }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
