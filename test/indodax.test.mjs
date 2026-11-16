// Tes parser terhadap respons ASLI Indodax (test/fixtures, diambil 16 Nov 2026).
// Mock lama memakai format karangan (btcidr + percent_change); fixture ini mencegah bug serupa terulang.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  IndodaxError, PAIR_RE, assertNoApiError, categorize, ohlcUrl,
  parseDepth, parseOhlc, parseSummaries, parseTrades,
} from "../lib/indodax.mjs";

const fx = (n) => JSON.parse(readFileSync(new URL(`./fixtures/${n}`, import.meta.url), "utf8"));
const summaries = fx("summaries.json");

test("summaries: hanya pasang IDR, 438 pasang, urut volume", () => {
  const t = parseSummaries(summaries);
  assert.equal(t.length, 438);
  assert.ok(t.every((x) => x.id.endsWith("idr") && !x.id.includes("_")));
  for (let i = 1; i < t.length; i++) assert.ok(t[i - 1].volIdr >= t[i].volIdr);
});

test("summaries: perubahan 24 jam dihitung dari prices_24h (bug lama: selalu 0)", () => {
  const t = parseSummaries(summaries);
  const btc = t.find((x) => x.id === "btcidr");
  const expected = ((1180309000 - Number(summaries.prices_24h.btcidr)) / Number(summaries.prices_24h.btcidr)) * 100;
  assert.ok(Math.abs(btc.change24h - expected) < 1e-9);
  assert.ok(btc.change7d != null);
  assert.ok(t.filter((x) => x.change24h !== 0 && x.change24h != null).length > 300);
});

test("summaries: nama, kode, dan volume koin benar (bug lama: 'BTC_/IDR', vol 0)", () => {
  const t = parseSummaries(summaries);
  const btc = t.find((x) => x.id === "btcidr");
  assert.equal(btc.base, "BTC");
  assert.equal(btc.name, "Bitcoin");
  assert.ok(Math.abs(btc.volCoin - 18.88905734) < 1e-9);
  const gl = t.find((x) => x.id === "glidridr");
  assert.equal(gl.base, "GLIDR"); // bug lama: "GL_IDR"
  assert.ok(btc.spread > 0 && btc.spread < 0.01);
});

test("kategori: 7 saham tertokenisasi, emas, stablecoin", () => {
  const t = parseSummaries(summaries);
  const saham = t.filter((x) => x.category === "saham").map((x) => x.base).sort();
  assert.deepEqual(saham, ["AAPLX", "AMZNX", "COINX", "CRCLX", "GOOGLX", "NVDAX", "TSLAX"]);
  assert.equal(t.find((x) => x.id === "paxgidr").category, "emas");
  assert.equal(t.find((x) => x.id === "xautidr").category, "emas");
  assert.equal(t.find((x) => x.id === "usdtidr").category, "stablecoin");
  assert.equal(categorize("btc", "Bitcoin"), "kripto");
});

test("depth: level + kumulatif IDR", () => {
  const d = parseDepth(fx("depth-btcidr.json"), 10);
  assert.equal(d.bids.length, 10);
  assert.equal(d.asks.length, 10);
  assert.equal(d.bids[0].price, 1180309000);
  assert.ok(d.bids[1].cumIdr > d.bids[0].cumIdr);
  assert.ok(d.asks[0].price > d.bids[0].price);
});

test("trades: ID dari 'tid' (bug lama: Math.random)", () => {
  const raw = fx("trades-btcidr.json");
  const tr = parseTrades(raw, 50);
  assert.equal(tr.length, 50);
  assert.equal(tr[0].id, raw[0].tid);
  assert.equal(new Set(tr.map((x) => x.id)).size, 50);
  assert.ok(tr.every((x) => x.type === "buy" || x.type === "sell"));
});

test("error API (HTTP 200 berisi error) dilempar, bukan jadi tabel kosong", () => {
  const err = fx("error-invalid-pair.json");
  assert.throws(() => assertNoApiError(err), (e) => e instanceof IndodaxError && e.code === "invalid_pair" && e.status === 404);
  assert.throws(() => parseDepth(err), IndodaxError);
  assert.throws(() => parseTrades(err), IndodaxError);
});

test("OHLC: urut waktu, angka valid; URL dan timeframe tervalidasi", () => {
  const k = parseOhlc(fx("ohlc-btcidr-1D.json"));
  assert.equal(k.length, 11);
  assert.ok(k.every((x, i) => i === 0 || x.t > k[i - 1].t));
  assert.equal(k.at(-1).c, 1181155000);
  assert.match(ohlcUrl("btcidr", "1D", 8, 1794831000), /symbol=BTCIDR&tf=1D&from=1794139800&to=1794831000$/);
  assert.throws(() => ohlcUrl("btcidr", "5", 10), IndodaxError);
});

test("validasi pairId", () => {
  for (const ok of ["btcidr", "1inchidr", "glidridr"]) assert.ok(PAIR_RE.test(ok));
  for (const bad of ["btc_idr", "BTCIDR", "../x", "btcidr?x=1", "btcusdt", ""]) assert.ok(!PAIR_RE.test(bad));
});
