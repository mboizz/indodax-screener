import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseSummaries } from "../lib/indodax.mjs";
import { ema, idrCompact, marketStats, pct, rsi, signal } from "../public/js/analytics.mjs";

const tickers = parseSummaries(JSON.parse(readFileSync(new URL("./fixtures/summaries.json", import.meta.url), "utf8")));

test("EMA: nilai awal SMA lalu rekursif", () => {
  const e = ema([1, 2, 3, 4, 5], 3);
  assert.deepEqual(e.slice(0, 2), [null, null]);
  assert.equal(e[2], 2);
  assert.equal(e[3], 3); // 4*0.5 + 2*0.5
  assert.equal(e[4], 4);
});

test("RSI: naik terus = 100, turun terus = 0, data kurang = null", () => {
  const up = Array.from({ length: 20 }, (_, i) => i + 1);
  assert.equal(rsi(up, 14).at(-1), 100);
  const dn = up.slice().reverse();
  assert.equal(rsi(dn, 14).at(-1), 0);
  assert.equal(rsi([1, 2, 3], 14).at(-1), null);
});

test("sinyal: pasang sepi atau spread lebar tidak dinilai", () => {
  const base = { change24h: 10, high: 110, low: 90, last: 109, spread: 0.5, volIdr: 5e8 };
  assert.equal(signal(base).key, "up2");
  assert.equal(signal({ ...base, volIdr: 5e6 }).key, "na");
  assert.equal(signal({ ...base, spread: 4 }).key, "na");
  assert.equal(signal({ ...base, change24h: null }).key, "na");
  assert.equal(signal({ ...base, change24h: -6, last: 91 }).key, "dn2");
});

test("sinyal pada data asli: tidak semuanya netral, label deskriptif", () => {
  const counts = {};
  for (const t of tickers) counts[signal(t).key] = (counts[signal(t).key] || 0) + 1;
  assert.ok(Object.keys(counts).length >= 4, JSON.stringify(counts));
  assert.ok(counts.na > 200); // sebagian besar pasang tidak likuid
});

test("statistik pasar: juara naik/turun hanya dari pasang likuid", () => {
  const s = marketStats(tickers);
  assert.equal(s.count, 438);
  assert.ok(s.topGainer.volIdr >= 1e8);
  assert.notEqual(s.topGainer.id, "cjlidr"); // +100% tapi volume Rp9 jt
  assert.ok(s.gainers + s.losers <= 438);
});

test("format id-ID", () => {
  assert.equal(idrCompact(213947015368), "Rp213,95 M");
  assert.equal(pct(-1.346), "-1,35%");
  assert.equal(pct(2), "+2,00%");
});
