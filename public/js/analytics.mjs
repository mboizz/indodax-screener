// Logika murni untuk frontend: sinyal, indikator teknikal, format angka.
// Tidak menyentuh DOM, sehingga bisa diuji dengan `node --test`.

export const LIQ_MIN_DEFAULT = 100_000_000; // Rp100 juta / 24 jam
export const SIGNAL_MIN_VOL = 10_000_000; // di bawah ini sinyal tidak dihitung
export const SIGNAL_MAX_SPREAD = 3; // %

/**
 * Sinyal momentum deskriptif (bukan rekomendasi).
 * Aturan dasar dari aplikasi lama (perubahan 24 jam + posisi harga di rentang 24 jam),
 * ditambah syarat likuiditas dan spread supaya pasang sepi tidak menghasilkan sinyal palsu.
 */
export function signal(t) {
  if (t.change24h == null || t.volIdr < SIGNAL_MIN_VOL || t.spread == null || t.spread > SIGNAL_MAX_SPREAD) {
    return { key: "na", label: "Tidak dinilai", rank: -1, why: "Volume < Rp10 jt atau spread > 3%" };
  }
  const range = t.high - t.low;
  const pos = range > 0 ? (t.last - t.low) / range : 0.5;
  const c = t.change24h;
  if (c > 5 && pos > 0.7) return { key: "up2", label: "Momentum naik kuat", rank: 4, why: "Naik > 5% dan harga di 30% teratas rentang 24 jam" };
  if (c > 2 && pos > 0.5) return { key: "up1", label: "Momentum naik", rank: 3, why: "Naik > 2% dan harga di paruh atas rentang 24 jam" };
  if (c < -5 && pos < 0.3) return { key: "dn2", label: "Tekanan jual kuat", rank: 0, why: "Turun > 5% dan harga di 30% terbawah rentang 24 jam" };
  if (c < -2 && pos < 0.5) return { key: "dn1", label: "Tekanan jual", rank: 1, why: "Turun > 2% dan harga di paruh bawah rentang 24 jam" };
  return { key: "neu", label: "Netral", rank: 2, why: "Tidak memenuhi syarat momentum" };
}

/** EMA dengan SMA sebagai nilai awal. Mengembalikan array sepanjang input (null sebelum cukup data). */
export function ema(values, period) {
  const out = new Array(values.length).fill(null);
  if (values.length < period) return out;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  let prev = sum / period;
  out[period - 1] = prev;
  const k = 2 / (period + 1);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** RSI Wilder. Mengembalikan array sepanjang input (null sebelum cukup data). */
export function rsi(values, period = 14) {
  const out = new Array(values.length).fill(null);
  if (values.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  out[period] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

/** Ringkasan teknikal dari candle: posisi terhadap EMA20/50 dan zona RSI. */
export function technicalSummary(candles) {
  const closes = candles.map((k) => k.c);
  const e20 = ema(closes, 20);
  const e50 = ema(closes, 50);
  const r = rsi(closes, 14);
  const i = closes.length - 1;
  const last = closes[i];
  const res = { last, ema20: e20[i], ema50: e50[i], rsi14: r[i], notes: [] };
  if (res.ema20 != null) res.notes.push(last >= res.ema20 ? "Harga di atas EMA20" : "Harga di bawah EMA20");
  if (res.ema20 != null && res.ema50 != null) res.notes.push(res.ema20 >= res.ema50 ? "EMA20 di atas EMA50 (tren naik)" : "EMA20 di bawah EMA50 (tren turun)");
  if (res.rsi14 != null) res.notes.push(res.rsi14 >= 70 ? "RSI ≥ 70: jenuh beli" : res.rsi14 <= 30 ? "RSI ≤ 30: jenuh jual" : "RSI di zona tengah");
  return { ...res, series: { ema20: e20, ema50: e50, rsi14: r } };
}

/* ---------- format (id-ID) ---------- */
const nf0 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export function idr(n) {
  if (n == null || !Number.isFinite(n)) return "–";
  const a = Math.abs(n);
  if (a > 0 && a < 1) return `Rp${n.toLocaleString("id-ID", { maximumSignificantDigits: 4 })}`;
  if (a < 100) return `Rp${n.toLocaleString("id-ID", { maximumFractionDigits: 2 })}`;
  return `Rp${nf0.format(n)}`;
}

export function idrCompact(n) {
  if (n == null || !Number.isFinite(n)) return "–";
  const f = (v) => v.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1e12) return `Rp${f(n / 1e12)} T`;
  if (n >= 1e9) return `Rp${f(n / 1e9)} M`;
  if (n >= 1e6) return `Rp${f(n / 1e6)} Jt`;
  return idr(n);
}

export function pct(n, digits = 2) {
  if (n == null || !Number.isFinite(n)) return "–";
  return `${n >= 0 ? "+" : ""}${n.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

export function amount(n) {
  if (n == null || !Number.isFinite(n)) return "–";
  return n.toLocaleString("id-ID", { maximumFractionDigits: n < 1 ? 8 : 4 });
}

/** Statistik ringkas pasar untuk kartu atas. Kenaikan/penurunan hanya dari pasang likuid. */
export function marketStats(tickers, liqMin = LIQ_MIN_DEFAULT) {
  const withChange = tickers.filter((t) => t.change24h != null);
  const liquid = withChange.filter((t) => t.volIdr >= liqMin);
  const totalVol = tickers.reduce((s, t) => s + t.volIdr, 0);
  const by = (f) => liquid.reduce((a, b) => (a == null || f(b, a) ? b : a), null);
  return {
    totalVol,
    count: tickers.length,
    liquidCount: tickers.filter((t) => t.volIdr >= liqMin).length,
    gainers: withChange.filter((t) => t.change24h > 0).length,
    losers: withChange.filter((t) => t.change24h < 0).length,
    topGainer: by((b, a) => b.change24h > a.change24h),
    topLoser: by((b, a) => b.change24h < a.change24h),
  };
}
