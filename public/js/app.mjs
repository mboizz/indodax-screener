// Indodax Screener — aplikasi utama (vanilla JS, tanpa dependensi).
// Data dari Netlify Functions (/api/*) yang mem-proxy dan meng-cache API publik Indodax.
import { LIQ_MIN_DEFAULT, amount, idr, idrCompact, marketStats, pct, signal, technicalSummary } from "./analytics.mjs";
import { drawCandles, sparklineSvg } from "./charts.mjs";

/* ---------------- utilitas ---------------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* mode privat: abaikan */ } },
};
const timeWIB = (ms) => new Date(ms).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB";
const ICON_SEARCH = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`;

async function api(path) {
  const res = await fetch(path, { headers: { accept: "application/json" } });
  let body = null;
  try { body = await res.json(); } catch { /* bukan JSON */ }
  if (!res.ok || !body || body.error) {
    const err = new Error((body && body.message) || `HTTP ${res.status}`);
    err.code = body && body.error; err.status = res.status;
    throw err;
  }
  return body;
}

/* ---------------- state ---------------- */
const S = {
  tickers: [], byId: new Map(), fetchedAt: 0, loading: false, error: null,
  watch: new Set(store.get("ix.watch", ["btcidr", "ethidr"])),
  alerts: store.get("ix.alerts", []),
  auto: store.get("ix.auto", true),
  spark: new Map(), sparkPending: new Set(),
  pair: null, // { id, data, ohlc, tf, error, loading }
  cleanupChart: null,
  lastMarketHash: "#/",
};
const PER_PAGE = 25;
const CATS = [["semua", "Semua"], ["kripto", "Kripto"], ["saham", "Saham (xStocks)"], ["emas", "Emas"], ["stablecoin", "Stablecoin"], ["watch", "★ Watchlist"]];
const LIQ = [["0", "Semua volume"], ["10000000", "Vol ≥ Rp10 Jt"], ["100000000", "Vol ≥ Rp100 Jt"], ["1000000000", "Vol ≥ Rp1 M"]];
const SIGS = [["", "Semua sinyal"], ["up", "Momentum naik"], ["neu", "Netral"], ["dn", "Tekanan jual"], ["na", "Tidak dinilai"]];
const TFS = [["15", "15m"], ["60", "1j"], ["240", "4j"], ["1D", "1H"]];

/* ---------------- routing (#/ dan #/pair/btcidr) ---------------- */
function route() {
  const h = location.hash.replace(/^#/, "") || "/";
  const [path, qs] = h.split("?");
  const q = new URLSearchParams(qs || "");
  const m = /^\/pair\/([a-z0-9]+idr)$/.exec(path);
  return m ? { view: "pair", id: m[1], q } : { view: "market", q };
}
function marketParams() {
  const q = route().q;
  const cat = CATS.some(([k]) => k === q.get("cat")) ? q.get("cat") : "semua";
  return {
    cat,
    liq: LIQ.some(([k]) => k === q.get("liq")) ? Number(q.get("liq")) : defaultLiq(cat),
    sig: SIGS.some(([k]) => k === q.get("sig")) ? q.get("sig") : "",
    q: q.get("q") || "",
    sort: q.get("sort") || "volIdr",
    dir: q.get("dir") === "asc" ? "asc" : "desc",
    p: Math.max(1, Number.parseInt(q.get("p") || "1", 10) || 1),
  };
}
// Saham, emas, dan stablecoin di Indodax jauh lebih sepi daripada kripto utama, jadi tanpa filter volume bawaan.
function defaultLiq(cat) { return cat === "semua" || cat === "kripto" ? LIQ_MIN_DEFAULT : 0; }
const liqLabel = (v) => (LIQ.find(([k]) => Number(k) === v) || [, ""])[1].replace("Vol ≥ ", "");
const fmtSpread = (v) => (v == null ? "–" : v < 0.01 ? "<0,01%" : `${v.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`);
function setMarketParams(patch, { resetPage = true } = {}) {
  const prev = marketParams();
  if (patch.cat && patch.cat !== prev.cat && !("liq" in patch)) patch.liq = defaultLiq(patch.cat);
  const cur = { ...prev, ...(resetPage ? { p: 1 } : {}), ...patch };
  const q = new URLSearchParams();
  if (cur.cat !== "semua") q.set("cat", cur.cat);
  if (cur.liq !== defaultLiq(cur.cat)) q.set("liq", String(cur.liq));
  if (cur.sig) q.set("sig", cur.sig);
  if (cur.q) q.set("q", cur.q);
  if (cur.sort !== "volIdr") q.set("sort", cur.sort);
  if (cur.dir !== "desc") q.set("dir", cur.dir);
  if (cur.p > 1) q.set("p", String(cur.p));
  const s = q.toString();
  history.replaceState(null, "", `#/${s ? `?${s}` : ""}`);
  render();
}

/* ---------------- data ---------------- */
async function loadMarket() {
  if (S.loading) return;
  S.loading = true; header();
  try {
    const d = await api("/api/market");
    S.tickers = d.tickers; S.byId = new Map(d.tickers.map((t) => [t.id, t])); S.fetchedAt = d.fetchedAt; S.error = null;
    checkAlerts();
  } catch (e) {
    S.error = e.message || "Gagal memuat data pasar";
  }
  S.loading = false; header();
  keepInputs(() => { if (route().view === "market") renderMarket(); else if (S.pair) renderPair(); });
}

async function loadPair(id, { ohlc = true } = {}) {
  const p = S.pair && S.pair.id === id ? S.pair : (S.pair = { id, data: null, ohlc: null, tf: store.get("ix.tf", "60"), error: null });
  p.loading = true; header();
  try {
    const jobs = [api(`/api/pair/${id}`)];
    if (ohlc) jobs.push(api(`/api/ohlc/${id}?tf=${encodeURIComponent(p.tf)}`));
    const [d, o] = await Promise.all(jobs);
    if (S.pair !== p) return;
    p.data = d; if (o) p.ohlc = o; p.error = null;
  } catch (e) {
    if (S.pair !== p) return;
    p.error = e.status === 404 || e.code === "invalid_pair" ? "Pasang ini tidak dikenali Indodax." : (e.message || "Gagal memuat data pasang");
  }
  p.loading = false; header();
  if (route().view === "pair" && route().id === id) keepInputs(renderPair);
}

async function loadSparks(ids) {
  const need = ids.filter((id) => !S.spark.has(id) && !S.sparkPending.has(id)).sort();
  if (!need.length) return;
  need.forEach((id) => S.sparkPending.add(id));
  try {
    const d = await api(`/api/spark?pairs=${need.join(",")}`);
    for (const id of need) S.spark.set(id, d.series[id] || null);
  } catch {
    for (const id of need) S.spark.set(id, null);
  } finally {
    need.forEach((id) => S.sparkPending.delete(id));
  }
  for (const id of need) {
    const cell = document.querySelector(`[data-spark="${id}"]`);
    if (cell) cell.innerHTML = sparklineSvg(S.spark.get(id), id.toUpperCase());
  }
}

/* ---------------- watchlist & peringatan ---------------- */
function toggleWatch(id) {
  S.watch.has(id) ? S.watch.delete(id) : S.watch.add(id);
  store.set("ix.watch", [...S.watch]);
}
function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  $("#toasts").append(el);
  setTimeout(() => el.remove(), 9000);
}
function checkAlerts() {
  let changed = false;
  for (const a of S.alerts) {
    if (a.done) continue;
    const t = S.byId.get(a.pair);
    if (!t) continue;
    const hit = a.op === ">=" ? t.last >= a.price : t.last <= a.price;
    if (!hit) continue;
    a.done = Date.now(); changed = true;
    const msg = `${t.base}/IDR ${a.op === ">=" ? "naik ke" : "turun ke"} ${idr(t.last)} (batas ${idr(a.price)})`;
    toast(`Peringatan harga: ${msg}`);
    try { if ("Notification" in window && Notification.permission === "granted") new Notification("Indodax Screener", { body: msg }); } catch { /* abaikan */ }
  }
  if (changed) store.set("ix.alerts", S.alerts);
}

/* ---------------- header ---------------- */
function header() {
  const busy = S.loading || (S.pair && S.pair.loading);
  $("#dot").className = `dot ${S.error ? "err" : S.fetchedAt ? "live" : ""}`;
  $("#state").textContent = S.error ? "GAGAL" : S.fetchedAt ? "LIVE" : "MEMUAT";
  $("#updated").textContent = S.fetchedAt ? `Diperbarui ${timeWIB(S.fetchedAt)}` : "";
  $("#refresh").disabled = !!busy;
  $("#rico").classList.toggle("spin", !!busy);
  const auto = $("#auto");
  auto.classList.toggle("on", S.auto); auto.setAttribute("aria-pressed", String(S.auto));
}

/* ---------------- tampilan pasar ---------------- */
function filtered(P) {
  const q = P.q.trim().toLowerCase();
  let rows = S.tickers;
  if (P.cat === "watch") rows = rows.filter((t) => S.watch.has(t.id));
  else if (P.cat !== "semua") rows = rows.filter((t) => t.category === P.cat);
  if (P.cat !== "watch" && P.liq > 0) rows = rows.filter((t) => t.volIdr >= P.liq);
  if (q) rows = rows.filter((t) => t.base.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
  if (P.sig) rows = rows.filter((t) => { const k = signal(t).key; return P.sig === "up" ? k.startsWith("up") : P.sig === "dn" ? k.startsWith("dn") : k === P.sig; });
  const d = P.dir === "asc" ? 1 : -1;
  const val = (t) => (P.sort === "signal" ? signal(t).rank : t[P.sort]);
  return rows.slice().sort((a, b) => {
    if (P.sort === "base") return a.base.localeCompare(b.base) * d;
    const va = val(a), vb = val(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1; // kosong selalu di bawah
    if (vb == null) return -1;
    return (va - vb) * d;
  });
}

function renderMarket() {
  if (S.cleanupChart) { S.cleanupChart(); S.cleanupChart = null; }
  const app = $("#app");
  const P = marketParams();
  S.lastMarketHash = location.hash || "#/";
  if (!S.tickers.length) {
    app.innerHTML = S.error
      ? `<div class="banner err"><span>Data pasar gagal dimuat: ${esc(S.error)}</span><button class="btn" type="button" data-act="retry">COBA LAGI</button></div>`
      : `<h1>Pasar Kripto</h1><div class="tbl" aria-busy="true"><table><tbody>${Array.from({ length: 10 }, () => `<tr class="skel">${"<td><span></span></td>".repeat(7)}</tr>`).join("")}</tbody></table></div>`;
    return;
  }
  const st = marketStats(S.tickers, P.liq || LIQ_MIN_DEFAULT);
  const rows = filtered(P);
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(P.p, pages);
  const view = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const counts = Object.fromEntries(CATS.map(([k]) => [k, k === "semua" ? S.tickers.length : k === "watch" ? S.watch.size : S.tickers.filter((t) => t.category === k).length]));
  const th = (key, label, cls = "") => {
    const on = P.sort === key;
    return `<th class="${cls}" ${on ? `aria-sort="${P.dir === "asc" ? "ascending" : "descending"}"` : ""}><button type="button" data-sort="${key}">${label}<span aria-hidden="true">${on ? (P.dir === "asc" ? "▲" : "▼") : ""}</span></button></th>`;
  };

  app.innerHTML = `
  <h1>Pasar Kripto</h1>
  <div class="sub">${st.count} pasang IDR · ${st.liquidCount} pasang bervolume ≥ ${liqLabel(P.liq || LIQ_MIN_DEFAULT)}</div>
  ${S.error ? `<div class="banner err"><span>Pembaruan terakhir gagal (${esc(S.error)}). Menampilkan data ${timeWIB(S.fetchedAt)}.</span><button class="btn" type="button" data-act="retry">COBA LAGI</button></div>` : ""}
  <section class="stats" aria-label="Ringkasan pasar">
    <div class="stat"><div class="l">Volume 24 jam</div><div class="v">${idrCompact(st.totalVol)}</div><div class="s">semua pasang IDR</div></div>
    <div class="stat"><div class="l">Naik / Turun</div><div class="v ${st.gainers >= st.losers ? "up" : "down"}">${st.gainers} / ${st.losers}</div><div class="s">dari ${st.count} pasang</div></div>
    <div class="stat"><div class="l">Naik tertinggi*</div>${st.topGainer ? `<a class="v" href="#/pair/${st.topGainer.id}">${esc(st.topGainer.base)}</a><div class="s up">${pct(st.topGainer.change24h)} · ${idrCompact(st.topGainer.volIdr)}</div>` : `<div class="v">–</div>`}</div>
    <div class="stat"><div class="l">Turun terdalam*</div>${st.topLoser ? `<a class="v" href="#/pair/${st.topLoser.id}">${esc(st.topLoser.base)}</a><div class="s down">${pct(st.topLoser.change24h)} · ${idrCompact(st.topLoser.volIdr)}</div>` : `<div class="v">–</div>`}</div>
    <div class="stat"><div class="l">Pasang likuid</div><div class="v">${st.liquidCount}</div><div class="s">vol ≥ ${liqLabel(P.liq || LIQ_MIN_DEFAULT)}</div></div>
  </section>
  <nav class="tabs" aria-label="Kategori">${CATS.map(([k, l]) => `<button type="button" class="tab ${P.cat === k ? "on" : ""}" data-cat="${k}" ${P.cat === k ? 'aria-current="true"' : ""}>${l}<span class="n">${counts[k]}</span></button>`).join("")}</nav>
  <div class="tools">
    <label class="search">${ICON_SEARCH}<span class="sr">Cari pasang</span><input id="q" type="search" placeholder="Cari kode atau nama (BTC, Tesla…)" value="${esc(P.q)}" autocomplete="off"></label>
    <label class="field"><span class="sr">Likuiditas</span><select id="liq" ${P.cat === "watch" ? "disabled" : ""}>${LIQ.map(([k, l]) => `<option value="${k}" ${Number(k) === P.liq ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="field"><span class="sr">Sinyal</span><select id="sig">${SIGS.map(([k, l]) => `<option value="${k}" ${k === P.sig ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <span class="spacer"></span>
    ${P.liq > 0 && P.cat !== "watch" ? `<button class="btn" type="button" data-act="all">TAMPILKAN SEMUA VOLUME</button>` : ""}
  </div>
  <div class="tbl"><table>
    <caption class="sr">Daftar pasang ${esc(CATS.find(([k]) => k === P.cat)[1])}${P.liq ? `, volume ≥ ${liqLabel(P.liq)}` : ""}</caption>
    <thead><tr>
      <th class="c"><span class="sr">Watchlist</span></th><th class="l h-sm">#</th>${th("base", "Pasang", "l")}${th("last", "Harga")}${th("change24h", "24j")}${th("change7d", "7h", "h-md")}<th class="h-md">7 hari</th>${th("signal", "Sinyal", "c")}${th("volIdr", "Volume 24j", "h-md")}${th("spread", "Spread", "h-lg")}${th("high", "Tertinggi", "h-lg")}${th("low", "Terendah", "h-lg")}
    </tr></thead>
    <tbody>${view.length ? view.map((t, i) => rowHtml(t, (page - 1) * PER_PAGE + i + 1)).join("") : `<tr><td colspan="12" class="empty">${P.cat === "watch" && !S.watch.size ? "Watchlist masih kosong. Tekan ☆ di baris mana pun untuk menambahkan." : `Tidak ada pasang yang cocok.${P.liq > 0 ? " Coba tampilkan semua volume." : ""}`}</td></tr>`}</tbody>
  </table></div>
  <div class="pg"><span>${rows.length} pasang · halaman ${page} dari ${pages}</span><span class="btns">
    <button class="btn" type="button" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>‹ SEBELUMNYA</button>
    <button class="btn" type="button" data-page="${page + 1}" ${page >= pages ? "disabled" : ""}>BERIKUTNYA ›</button></span></div>
  <p class="note"><b>Cara membaca.</b> Perubahan 24j/7h dihitung dari harga Indodax 24 jam dan 7 hari lalu. Spread = selisih harga jual terendah dan beli tertinggi. Sinyal hanya mengukur momentum 24 jam (perubahan harga + posisi harga dalam rentang tertinggi–terendah) dan <b>tidak dinilai</b> untuk pasang bervolume di bawah Rp10 jt atau spread di atas 3%. *Kartu naik/turun hanya menghitung pasang bervolume ≥ ${liqLabel(P.liq || LIQ_MIN_DEFAULT)}. Bukan rekomendasi investasi.</p>`;

  loadSparks(view.map((t) => t.id));
}

function rowHtml(t, rank) {
  const s = signal(t);
  const w = S.watch.has(t.id);
  const sp = S.spark.has(t.id) ? sparklineSvg(S.spark.get(t.id), t.base) : `<svg class="spark" viewBox="0 0 84 24" aria-hidden="true"></svg>`;
  const tag = t.category === "saham" ? "SAHAM" : t.category === "emas" ? "EMAS" : t.category === "stablecoin" ? "STABLE" : "";
  return `<tr data-pair="${t.id}" tabindex="0" aria-label="${esc(t.base)}/IDR, buka detail">
    <td class="c"><button type="button" class="star ${w ? "on" : ""}" data-star="${t.id}" aria-pressed="${w}" aria-label="${w ? "Hapus dari" : "Tambah ke"} watchlist">${w ? "★" : "☆"}</button></td>
    <td class="l muted h-sm">${rank}</td>
    <td class="l"><div class="coin"><div class="ic" aria-hidden="true">${esc(t.base.slice(0, 4))}</div><div class="cn"><b>${esc(t.base)}/IDR${tag ? `<span class="tag">${tag}</span>` : ""}</b><small>${esc(t.name)}</small></div></div></td>
    <td><b>${idr(t.last)}</b></td>
    <td class="${t.change24h == null ? "muted" : t.change24h >= 0 ? "up" : "down"}"><b>${pct(t.change24h)}</b></td>
    <td class="h-md ${t.change7d == null ? "muted" : t.change7d >= 0 ? "up" : "down"}">${pct(t.change7d)}</td>
    <td class="h-md" data-spark="${t.id}">${sp}</td>
    <td class="c"><span class="sig s-${s.key}" title="${esc(s.why)}">${s.label}</span></td>
    <td class="h-md muted">${idrCompact(t.volIdr)}</td>
    <td class="h-lg ${t.spread != null && t.spread > 3 ? "wide" : "muted"}">${fmtSpread(t.spread)}</td>
    <td class="h-lg">${idr(t.high)}</td><td class="h-lg">${idr(t.low)}</td></tr>`;
}

/* ---------------- tampilan detail pasang ---------------- */
function renderPair() {
  const { id } = route();
  const app = $("#app");
  const t = S.byId.get(id);
  const p = S.pair && S.pair.id === id ? S.pair : null;
  const w = S.watch.has(id);
  if (S.cleanupChart) { S.cleanupChart(); S.cleanupChart = null; }

  if (!t && S.tickers.length) {
    app.innerHTML = `<button class="btn back" type="button" data-act="back">‹ KEMBALI KE PASAR</button><div class="banner err"><span>Pasang ${esc(id.toUpperCase())} tidak ada di daftar pasang IDR Indodax.</span></div>`;
    return;
  }
  const s = t ? signal(t) : null;
  const tech = p && p.ohlc && p.ohlc.candles.length >= 20 ? technicalSummary(p.ohlc.candles) : null;
  const myAlerts = S.alerts.filter((a) => a.pair === id);

  app.innerHTML = `
  <button class="btn back" type="button" data-act="back">‹ KEMBALI KE PASAR</button>
  ${p && p.error ? `<div class="banner err"><span>${esc(p.error)}</span><button class="btn" type="button" data-act="retry-pair">COBA LAGI</button></div>` : ""}
  <div class="dh">
    <div class="coin"><div class="ic" aria-hidden="true">${esc((t ? t.base : id).slice(0, 4).toUpperCase())}</div>
      <div class="cn"><b>${t ? `${esc(t.base)}/IDR` : esc(id.toUpperCase())}</b><small>${t ? esc(t.name) : ""}</small></div>
      <button type="button" class="star ${w ? "on" : ""}" data-star="${id}" aria-pressed="${w}" aria-label="${w ? "Hapus dari" : "Tambah ke"} watchlist" style="font-size:20px">${w ? "★" : "☆"}</button></div>
    ${t ? `<div><div class="price">${idr(t.last)}</div><div class="chg"><span class="${t.change24h == null ? "muted" : t.change24h >= 0 ? "up" : "down"}">${pct(t.change24h)} (24j)</span> · <span class="${t.change7d == null ? "muted" : t.change7d >= 0 ? "up" : "down"}">${pct(t.change7d)} (7h)</span> · <span class="sig s-${s.key}" title="${esc(s.why)}">${s.label}</span></div></div>` : ""}
  </div>
  ${t ? `<section class="mini" aria-label="Statistik 24 jam">
    <div class="stat"><div class="l">Tertinggi 24j</div><div class="v">${idr(t.high)}</div></div>
    <div class="stat"><div class="l">Terendah 24j</div><div class="v">${idr(t.low)}</div></div>
    <div class="stat"><div class="l">Volume 24j</div><div class="v">${idrCompact(t.volIdr)}</div><div class="s">${amount(t.volCoin)} ${esc(t.base)}</div></div>
    <div class="stat"><div class="l">Beli tertinggi</div><div class="v up">${idr(t.buy)}</div></div>
    <div class="stat"><div class="l">Jual terendah</div><div class="v down">${idr(t.sell)}</div></div>
    <div class="stat"><div class="l">Spread</div><div class="v ${t.spread != null && t.spread > 3 ? "wide" : ""}">${fmtSpread(t.spread)}</div><div class="s">${idr(t.sell - t.buy)} jual − beli</div></div>
  </section>` : ""}
  <div class="grid2">
    <div>
      <section class="panel" aria-label="Grafik harga">
        <div class="ph"><span>Grafik candlestick · EMA20/50 · RSI14</span><span role="group" aria-label="Timeframe">${TFS.map(([k, l]) => `<button type="button" class="btn ${p && p.tf === k ? "on" : ""}" data-tf="${k}" aria-pressed="${p && p.tf === k}">${l}</button>`).join(" ")}</span></div>
        ${p && p.ohlc && p.ohlc.candles.length >= 2 ? `<div class="legend"><span><i style="background:#e0b341"></i>EMA20 ${tech && tech.ema20 != null ? idrCompact(tech.ema20) : "–"}</span><span><i style="background:#1fa3c9"></i>EMA50 ${tech && tech.ema50 != null ? idrCompact(tech.ema50) : "–"}</span><span><i style="background:#b48cf2"></i>RSI14 ${tech && tech.rsi14 != null ? tech.rsi14.toLocaleString("id-ID", { maximumFractionDigits: 1 }) : "–"}</span><span>${p.ohlc.candles.length} candle</span></div>
        <div class="chart-wrap"><canvas id="cv-main" role="img" aria-label="Candlestick ${esc(id.toUpperCase())}"></canvas><canvas id="cv-rsi" role="img" aria-label="RSI 14"></canvas><div class="tip" id="tip"></div></div>
        ${tech ? `<ul class="notes">${tech.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}`
        : `<div class="empty">${p && p.loading ? "Memuat grafik…" : "Data grafik belum tersedia untuk timeframe ini."}</div>`}
      </section>
      <section class="panel" aria-label="Transaksi terakhir">
        <div class="ph"><span>Transaksi terakhir</span><span>${p && p.data ? `${p.data.trades.length} terbaru · ${timeWIB(p.data.fetchedAt)}` : ""}</span></div>
        <div class="scroll">${p && p.data ? `<table class="tr"><thead><tr><th class="l">Waktu</th><th class="l">Tipe</th><th>Harga</th><th>Jumlah</th><th class="h-md">Total</th></tr></thead><tbody>${p.data.trades.slice(0, 60).map((x) => `<tr><td class="l muted">${new Date(x.time * 1000).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })}</td><td class="l ${x.type === "buy" ? "up" : "down"}">${x.type === "buy" ? "BELI" : "JUAL"}</td><td>${idr(x.price)}</td><td>${amount(x.amount)}</td><td class="h-md muted">${idr(x.totalIdr)}</td></tr>`).join("")}</tbody></table>` : `<div class="empty">${p && p.loading ? "Memuat…" : "–"}</div>`}</div>
      </section>
    </div>
    <div>
      <section class="panel" aria-label="Order book">
        <div class="ph"><span>Order book</span><span>${p && p.data && p.data.depth.asks[0] && p.data.depth.bids[0] ? `spread ${idr(p.data.depth.asks[0].price - p.data.depth.bids[0].price)}` : ""}</span></div>
        ${p && p.data ? orderBookHtml(p.data.depth, t) : `<div class="empty">${p && p.loading ? "Memuat…" : "–"}</div>`}
      </section>
      <section class="panel" aria-label="Peringatan harga">
        <div class="ph"><span>Peringatan harga</span><span>${myAlerts.filter((a) => !a.done).length} aktif</span></div>
        ${myAlerts.length ? `<ul class="alerts">${myAlerts.map((a) => `<li><span>${a.op === ">=" ? "≥" : "≤"} ${idr(a.price)} ${a.done ? `<span class="muted">· terpicu ${timeWIB(a.done)}</span>` : ""}</span><button class="x" type="button" data-del-alert="${a.id}" aria-label="Hapus peringatan">✕</button></li>`).join("")}</ul>` : `<p class="pb muted" style="margin:0">Belum ada peringatan untuk pasang ini.</p>`}
        <form class="alert-form" id="alert-form">
          <label class="sr" for="al-op">Kondisi</label><select id="al-op"><option value=">=">Harga ≥</option><option value="<=">Harga ≤</option></select>
          <label class="sr" for="al-price">Harga (Rp)</label><input id="al-price" inputmode="decimal" placeholder="${t ? Math.round(t.last).toLocaleString("id-ID") : "Harga"}" required>
          <button class="btn primary" type="submit">TAMBAH</button>
        </form>
        <p class="pb muted" style="margin:0;font-size:11px">Dicek setiap data pasar diperbarui (±30 detik) selama halaman ini terbuka. Disimpan di browser Anda saja.</p>
      </section>
    </div>
  </div>`;

  if (p && p.ohlc && p.ohlc.candles.length >= 2) {
    requestAnimationFrame(() => {
      const main = $("#cv-main");
      if (main) S.cleanupChart = drawCandles({ main, rsiCv: $("#cv-rsi"), tip: $("#tip"), candles: p.ohlc.candles, tf: p.tf });
    });
  }
}

function orderBookHtml(depth, t) {
  const asks = depth.asks.slice(0, 14), bids = depth.bids.slice(0, 14);
  const max = Math.max(1, ...asks.map((x) => x.cumIdr), ...bids.map((x) => x.cumIdr));
  const row = (x, side) => {
    const w = ((x.cumIdr / max) * 100).toFixed(1), col = side === "ask" ? "rgba(239,83,80,.13)" : "rgba(47,191,113,.13)";
    return `<tr style="background:linear-gradient(to left, ${col} ${w}%, transparent ${w}%)"><td class="${side === "ask" ? "down" : "up"}">${idr(x.price)}</td><td>${amount(x.amount)}</td><td class="muted">${idrCompact(x.cumIdr)}</td></tr>`;
  };
  return `<table class="ob"><thead><tr><th>Harga</th><th>Jumlah</th><th>Kumulatif</th></tr></thead><tbody>
    ${asks.slice().reverse().map((x) => row(x, "ask")).join("")}
    <tr class="mid"><td colspan="3">${t ? idr(t.last) : ""}</td></tr>
    ${bids.map((x) => row(x, "bid")).join("")}</tbody></table>`;
}

/* Simpan isi & fokus input saat render ulang (auto refresh tidak boleh menghapus ketikan). */
function keepInputs(fn) {
  const ids = ["q", "al-price", "al-op"];
  const saved = ids.map((id) => { const el = document.getElementById(id); return el ? { id, v: el.value, f: document.activeElement === el, s: el.selectionStart } : null; }).filter(Boolean);
  fn();
  for (const x of saved) {
    const el = document.getElementById(x.id);
    if (!el) continue;
    el.value = x.v;
    if (x.f) { el.focus(); try { el.setSelectionRange(x.s, x.s); } catch { /* select */ } }
  }
}

/* ---------------- render + event ---------------- */
function render() {
  header();
  const r = route();
  document.title = r.view === "pair" ? `${r.id.replace(/idr$/, "").toUpperCase()}/IDR · Indodax Screener` : "Indodax Screener";
  if (r.view === "pair") {
    if (!S.pair || S.pair.id !== r.id) { S.pair = null; loadPair(r.id); }
    renderPair();
  } else {
    S.pair = null;
    renderMarket();
  }
}

document.addEventListener("click", (ev) => {
  const el = ev.target.closest("button, tr[data-pair], a");
  if (!el) return;
  if (el.dataset.star) { ev.stopPropagation(); toggleWatch(el.dataset.star); route().view === "pair" ? renderPair() : renderMarket(); return; }
  if (el.dataset.sort) { const P = marketParams(); setMarketParams({ sort: el.dataset.sort, dir: P.sort === el.dataset.sort && P.dir === "desc" ? "asc" : el.dataset.sort === "base" ? "asc" : "desc" }); return; }
  if (el.dataset.cat) { setMarketParams({ cat: el.dataset.cat }); return; }
  if (el.dataset.page) { setMarketParams({ p: Number(el.dataset.page) }, { resetPage: false }); window.scrollTo(0, 0); return; }
  if (el.dataset.tf && S.pair) { S.pair.tf = el.dataset.tf; store.set("ix.tf", el.dataset.tf); S.pair.ohlc = null; renderPair(); loadPair(S.pair.id); return; }
  if (el.dataset.delAlert) { S.alerts = S.alerts.filter((a) => a.id !== el.dataset.delAlert); store.set("ix.alerts", S.alerts); renderPair(); return; }
  if (el.dataset.pair) { location.hash = `#/pair/${el.dataset.pair}`; return; }
  const act = el.dataset.act;
  if (act === "retry") loadMarket();
  if (act === "retry-pair" && S.pair) loadPair(S.pair.id);
  if (act === "all") setMarketParams({ liq: 0 });
  if (act === "back") location.hash = S.lastMarketHash;
});
document.addEventListener("keydown", (ev) => {
  const tr = ev.target.closest && ev.target.closest("tr[data-pair]");
  if (tr && ev.target === tr && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); location.hash = `#/pair/${tr.dataset.pair}`; }
});
let qTimer;
document.addEventListener("input", (ev) => {
  if (ev.target.id !== "q") return;
  clearTimeout(qTimer);
  const v = ev.target.value, pos = ev.target.selectionStart;
  qTimer = setTimeout(() => { setMarketParams({ q: v }); const n = $("#q"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 200);
});
document.addEventListener("change", (ev) => {
  if (ev.target.id === "liq") setMarketParams({ liq: Number(ev.target.value) });
  if (ev.target.id === "sig") setMarketParams({ sig: ev.target.value });
});
document.addEventListener("submit", (ev) => {
  if (ev.target.id !== "alert-form") return;
  ev.preventDefault();
  const raw = $("#al-price").value.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const price = Number.parseFloat(raw);
  if (!Number.isFinite(price) || price <= 0 || !S.pair) { toast("Masukkan harga yang valid, misalnya 1.200.000.000"); return; }
  S.alerts.push({ id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, pair: S.pair.id, op: $("#al-op").value, price, created: Date.now() });
  store.set("ix.alerts", S.alerts);
  try { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); } catch { /* abaikan */ }
  checkAlerts();
  renderPair();
});
$("#refresh").addEventListener("click", () => { loadMarket(); if (S.pair) loadPair(S.pair.id); });
$("#auto").addEventListener("click", () => { S.auto = !S.auto; store.set("ix.auto", S.auto); header(); });
window.addEventListener("hashchange", () => { render(); $("#app").focus({ preventScroll: true }); });

// Muat ulang otomatis: pasar tiap 30 detik, detail pasang tiap 15 detik, OHLC tiap 60 detik. Berhenti saat tab tersembunyi.
let tick = 0;
setInterval(() => {
  if (!S.auto || document.hidden) return;
  tick += 15;
  if (tick % 30 === 0) loadMarket();
  if (S.pair && route().view === "pair") loadPair(S.pair.id, { ohlc: tick % 60 === 0 });
}, 15_000);
document.addEventListener("visibilitychange", () => { if (!document.hidden && S.auto && Date.now() - S.fetchedAt > 30_000) loadMarket(); });

render();
loadMarket();
