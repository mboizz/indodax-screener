// GET /api/ohlc/:pair?tf=15|60|240|1D → 200 candle terakhir untuk candlestick + EMA/RSI.
import { IndodaxError, PAIR_RE, TIMEFRAMES, cacheHeaders, fetchIndodax, jsonError, ohlcUrl, parseOhlc } from "../../lib/indodax.mjs";

const TTL: Record<string, number> = { "15": 60, "60": 120, "240": 300, "1D": 600 };

export default async (req: Request, context: { params: Record<string, string> }) => {
  try {
    const pair = String(context.params.pair || "").toLowerCase();
    if (!PAIR_RE.test(pair)) throw new IndodaxError("Format pasang tidak valid", "invalid_pair", 400);
    const tf = new URL(req.url).searchParams.get("tf") || "60";
    if (!(tf in TIMEFRAMES)) throw new IndodaxError("Timeframe harus 15, 60, 240 atau 1D", "bad_tf", 400);
    const candles = parseOhlc(await fetchIndodax(ohlcUrl(pair, tf, 200)));
    const ttl = TTL[tf];
    return new Response(JSON.stringify({ pair, tf, fetchedAt: Date.now(), candles }), {
      headers: cacheHeaders(ttl, ttl * 2, { "Netlify-Vary": "query=tf" }),
    });
  } catch (e) {
    return jsonError(e);
  }
};

export const config = {
  path: "/api/ohlc/:pair", method: "GET",
  // Batas per IP: lindungi kuota Indodax dari penyalahgunaan (respons tetap dilayani dari cache CDN bila ada).
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 60 },
};
