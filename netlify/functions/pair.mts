// GET /api/pair/:pair → order book (30 level) + 100 transaksi terakhir.
// pairId divalidasi dulu (format "btcidr"); pasang tak dikenal dibalas 404, bukan tabel kosong.
import { INDODAX_BASE, IndodaxError, PAIR_RE, cacheHeaders, fetchIndodax, jsonError, parseDepth, parseTrades } from "../../lib/indodax.mjs";

export default async (_req: Request, context: { params: Record<string, string> }) => {
  try {
    const pair = String(context.params.pair || "").toLowerCase();
    if (!PAIR_RE.test(pair)) throw new IndodaxError("Format pasang tidak valid", "invalid_pair", 400);
    const [depthRaw, tradesRaw] = await Promise.all([
      fetchIndodax(`${INDODAX_BASE}/api/depth/${pair}`),
      fetchIndodax(`${INDODAX_BASE}/api/trades/${pair}`),
    ]);
    const depth = parseDepth(depthRaw, 30);
    const trades = parseTrades(tradesRaw, 100);
    return new Response(JSON.stringify({ pair, fetchedAt: Date.now(), depth, trades }), { headers: cacheHeaders(10, 20) });
  } catch (e) {
    return jsonError(e);
  }
};

export const config = {
  path: "/api/pair/:pair", method: "GET",
  // Batas per IP: lindungi kuota Indodax dari penyalahgunaan (respons tetap dilayani dari cache CDN bila ada).
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 60 },
};
