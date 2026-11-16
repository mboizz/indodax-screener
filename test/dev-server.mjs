// Server lokal untuk uji tanpa internet: menyajikan public/ dan menjalankan
// handler Netlify Functions ASLI, dengan fetch ke Indodax diganti fixture.
// Jalankan: node --experimental-strip-types test/dev-server.mjs [port]
import http from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const fx = (n) => readFileSync(join(root, "test/fixtures", n), "utf8");

// Deret OHLC sintetis (random walk deterministik) agar EMA50/RSI punya cukup data saat uji lokal.
function synthOhlc(url) {
  const u = new URL(url);
  const step = { "15": 900, "60": 3600, "240": 14400, "1D": 86400 }[u.searchParams.get("tf")];
  const from = Number(u.searchParams.get("from")), to = Number(u.searchParams.get("to"));
  const sym = u.searchParams.get("symbol");
  let seed = [...sym].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  let p = sym === "BTCIDR" ? 1_300_000_000 : 1000 + (seed % 5000);
  const out = [];
  for (let t = Math.ceil(from / step) * step; t <= to; t += step) {
    const o = p, c = o * (1 + (rnd() - 0.52) * 0.02);
    out.push({ Time: t, Open: o, High: Math.max(o, c) * (1 + rnd() * 0.006), Low: Math.min(o, c) * (1 - rnd() * 0.006), Close: c, Volume: String((rnd() * 40).toFixed(6)) });
    p = c;
  }
  return out;
}

globalThis.fetch = async (url) => {
  const u = String(url);
  let body;
  if (u.endsWith("/api/summaries")) body = fx("summaries.json");
  else if (u.endsWith("/api/depth/btcidr")) body = fx("depth-btcidr.json");
  else if (u.endsWith("/api/trades/btcidr")) body = fx("trades-btcidr.json");
  else if (/\/api\/(depth|trades)\/[a-z0-9]+idr$/.test(u)) {
    const pair = u.split("/").pop();
    const known = JSON.parse(fx("summaries.json")).tickers[pair.replace(/idr$/, "_idr")];
    if (!known) body = fx("error-invalid-pair.json");
    else if (u.includes("/depth/")) body = fx("depth-btcidr.json").replace(/"(\d{6,})"/g, (_, n) => `"${Math.round(Number(n) / 1180309000 * Number(known.last) * 1e6) / 1e6}"`);
    else body = JSON.stringify(JSON.parse(fx("trades-btcidr.json")).map((t) => ({ ...t, price: String(Number(t.price) / 1180309000 * Number(known.last)) })));
  }
  else if (u.includes("/tradingview/history_v2")) body = JSON.stringify(synthOhlc(u));
  else body = fx("error-invalid-pair.json");
  return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
};

const fns = {
  market: (await import("../netlify/functions/market.mts")).default,
  pair: (await import("../netlify/functions/pair.mts")).default,
  ohlc: (await import("../netlify/functions/ohlc.mts")).default,
  spark: (await import("../netlify/functions/spark.mts")).default,
};
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".mjs": "text/javascript", ".js": "text/javascript", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  let fn, params = {};
  if (url.pathname === "/api/market") fn = fns.market;
  else if (url.pathname === "/api/spark") fn = fns.spark;
  else if (url.pathname.startsWith("/api/pair/")) { fn = fns.pair; params.pair = url.pathname.split("/")[3]; }
  else if (url.pathname.startsWith("/api/ohlc/")) { fn = fns.ohlc; params.pair = url.pathname.split("/")[3]; }
  if (fn) {
    const r = await fn(new Request(url), { params });
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(await r.text());
    return;
  }
  let p = normalize(join(root, "public", url.pathname === "/" ? "index.html" : url.pathname));
  if (!p.startsWith(join(root, "public")) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); res.end("not found"); return; }
  res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" });
  res.end(readFileSync(p));
}).listen(Number(process.argv[2] || 8888), () => console.log("dev server siap"));
