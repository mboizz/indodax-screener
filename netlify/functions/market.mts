// GET /api/market → ringkasan semua pasang IDR, sudah dinormalisasi.
// Di-cache di CDN Netlify 20 detik (+40 detik stale-while-revalidate), sehingga
// berapa pun jumlah pengunjung, Indodax hanya dipanggil sekitar 3 kali per menit.
import { INDODAX_BASE, cacheHeaders, fetchIndodax, jsonError, parseSummaries } from "../../lib/indodax.mjs";

export default async () => {
  try {
    const raw = await fetchIndodax(`${INDODAX_BASE}/api/summaries`);
    const tickers = parseSummaries(raw);
    if (tickers.length === 0) throw Object.assign(new Error("Data pasar kosong"), { code: "empty", status: 502 });
    const body = JSON.stringify({ fetchedAt: Date.now(), count: tickers.length, tickers });
    return new Response(body, { headers: cacheHeaders(20, 40) });
  } catch (e) {
    return jsonError(e);
  }
};

export const config = { path: "/api/market", method: "GET" };
