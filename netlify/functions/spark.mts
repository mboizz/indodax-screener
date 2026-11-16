// GET /api/spark?pairs=btcidr,ethidr,... (maks 30) → harga penutupan harian 8 hari terakhir per pasang.
// Dipakai untuk sparkline 7 hari di tabel. Di-cache 15 menit; klien mengirim daftar yang sudah diurutkan
// supaya kunci cache sama untuk halaman yang sama.
import { IndodaxError, PAIR_RE, cacheHeaders, fetchIndodax, jsonError, ohlcUrl, parseOhlc } from "../../lib/indodax.mjs";

const MAX_PAIRS = 30;
const CONCURRENCY = 6;

export default async (req: Request) => {
  try {
    const list = (new URL(req.url).searchParams.get("pairs") || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const pairs = [...new Set(list)];
    if (pairs.length === 0) throw new IndodaxError("Parameter pairs kosong", "bad_request", 400);
    if (pairs.length > MAX_PAIRS) throw new IndodaxError(`Maksimal ${MAX_PAIRS} pasang`, "bad_request", 400);
    if (!pairs.every((p) => PAIR_RE.test(p))) throw new IndodaxError("Format pasang tidak valid", "invalid_pair", 400);

    const out: Record<string, number[] | null> = {};
    let i = 0;
    const worker = async () => {
      while (i < pairs.length) {
        const p = pairs[i++];
        try {
          out[p] = parseOhlc(await fetchIndodax(ohlcUrl(p, "1D", 8), 6000)).map((k) => k.c);
        } catch {
          out[p] = null; // satu pasang gagal tidak menggagalkan semuanya
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pairs.length) }, worker));
    return new Response(JSON.stringify({ fetchedAt: Date.now(), series: out }), {
      headers: cacheHeaders(900, 1800, { "Netlify-Vary": "query=pairs" }),
    });
  } catch (e) {
    return jsonError(e);
  }
};

export const config = {
  path: "/api/spark", method: "GET",
  // Batas per IP: lindungi kuota Indodax dari penyalahgunaan (respons tetap dilayani dari cache CDN bila ada).
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 20 },
};
