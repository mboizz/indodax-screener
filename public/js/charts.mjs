// Grafik tanpa pustaka luar: sparkline (SVG) dan candlestick + EMA + volume + RSI (canvas).
import { ema, idr, idrCompact, rsi } from "./analytics.mjs";

const C = {
  up: "#2fbf71", down: "#ef5350", grid: "#2a2a2a", axis: "#6f6f6f", text: "#9b9b9b",
  ema20: "#e0b341", ema50: "#1fa3c9", rsi: "#b48cf2", band: "rgba(255,255,255,.04)", cross: "rgba(255,255,255,.35)",
};

/** Sparkline sebagai string SVG. Warna mengikuti arah awal → akhir. */
export function sparklineSvg(values, label = "") {
  const v = (values || []).filter((x) => Number.isFinite(x) && x > 0);
  if (v.length < 2) return `<svg class="spark" viewBox="0 0 84 24" role="img" aria-label="Tidak ada data 7 hari"><line x1="2" y1="12" x2="82" y2="12" stroke="#3a3a3a" stroke-dasharray="2 3"/></svg>`;
  const min = Math.min(...v), max = Math.max(...v), span = max - min || max * 0.001 || 1;
  const pts = v.map((y, i) => `${(2 + (i / (v.length - 1)) * 80).toFixed(1)},${(21 - ((y - min) / span) * 18).toFixed(1)}`).join(" ");
  const col = v.at(-1) >= v[0] ? C.up : C.down;
  const chg = ((v.at(-1) - v[0]) / v[0]) * 100;
  return `<svg class="spark" viewBox="0 0 84 24" role="img" aria-label="${label} 7 hari ${chg >= 0 ? "naik" : "turun"} ${Math.abs(chg).toFixed(1)}%"><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

function setupCanvas(cv) {
  const dpr = window.devicePixelRatio || 1;
  const w = cv.clientWidth, h = cv.clientHeight;
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  const g = cv.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  return { g, w, h };
}

function fmtTime(t, tf) {
  const d = new Date(t * 1000);
  const o = { timeZone: "Asia/Jakarta" };
  if (tf === "1D") return d.toLocaleDateString("id-ID", { ...o, day: "2-digit", month: "short" });
  if (tf === "240") return d.toLocaleString("id-ID", { ...o, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  return d.toLocaleTimeString("id-ID", { ...o, hour: "2-digit", minute: "2-digit" });
}

/**
 * Gambar candlestick + EMA20/50 + volume di `main`, RSI(14) di `rsiCv`.
 * Mengembalikan fungsi pembersih event listener.
 */
export function drawCandles({ main, rsiCv, tip, candles, tf }) {
  const closes = candles.map((k) => k.c);
  const e20 = ema(closes, 20), e50 = ema(closes, 50), r14 = rsi(closes, 14);
  const n = candles.length;
  const PAD_R = 92, PAD_L = 8, PAD_T = 10, PAD_B = 24;

  const paint = (hover = -1) => {
    const { g, w, h } = setupCanvas(main);
    const plotW = w - PAD_L - PAD_R;
    const volH = Math.round((h - PAD_T - PAD_B) * 0.18);
    const priceB = h - PAD_B - volH - 6;
    const lows = candles.map((k) => k.l), highs = candles.map((k) => k.h);
    let lo = Math.min(...lows), hi = Math.max(...highs);
    const padP = (hi - lo) * 0.06 || hi * 0.01;
    lo -= padP; hi += padP;
    const X = (i) => PAD_L + ((i + 0.5) / n) * plotW;
    const Y = (p) => PAD_T + (1 - (p - lo) / (hi - lo)) * (priceB - PAD_T);
    const bw = Math.max(1, Math.min(12, (plotW / n) * 0.7));

    // grid + label harga
    g.font = "10px 'JetBrains Mono', monospace";
    g.fillStyle = C.text; g.strokeStyle = C.grid; g.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const p = lo + ((hi - lo) * i) / 5, y = Math.round(Y(p)) + 0.5;
      g.beginPath(); g.moveTo(PAD_L, y); g.lineTo(w - PAD_R, y); g.stroke();
      g.fillText(idr(p).replace("Rp", ""), w - PAD_R + 6, y + 3);
    }
    // label waktu
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
      const idx = Math.min(n - 1, Math.round((i / ticks) * (n - 1)));
      const s = fmtTime(candles[idx].t, tf);
      const x = Math.min(Math.max(X(idx) - g.measureText(s).width / 2, PAD_L), w - PAD_R - g.measureText(s).width);
      g.fillText(s, x, h - 7);
    }
    // volume
    const maxV = Math.max(...candles.map((k) => k.v)) || 1;
    candles.forEach((k, i) => {
      const vh = (k.v / maxV) * volH;
      g.fillStyle = k.c >= k.o ? "rgba(47,191,113,.28)" : "rgba(239,83,80,.28)";
      g.fillRect(X(i) - bw / 2, h - PAD_B - vh, bw, vh);
    });
    // candle
    candles.forEach((k, i) => {
      const col = k.c >= k.o ? C.up : C.down, x = Math.round(X(i)) + 0.5;
      g.strokeStyle = col; g.fillStyle = col;
      g.beginPath(); g.moveTo(x, Y(k.h)); g.lineTo(x, Y(k.l)); g.stroke();
      const y1 = Y(Math.max(k.o, k.c)), y2 = Y(Math.min(k.o, k.c));
      g.fillRect(X(i) - bw / 2, y1, bw, Math.max(1, y2 - y1));
    });
    // EMA
    const line = (arr, col) => {
      g.strokeStyle = col; g.lineWidth = 1.4; g.beginPath(); let started = false;
      arr.forEach((v, i) => { if (v == null) return; const x = X(i), y = Y(v); started ? g.lineTo(x, y) : g.moveTo(x, y); started = true; });
      g.stroke(); g.lineWidth = 1;
    };
    line(e50, C.ema50); line(e20, C.ema20);
    // harga terakhir
    const lastY = Math.round(Y(closes.at(-1))) + 0.5, lastCol = closes.at(-1) >= candles.at(-1).o ? C.up : C.down;
    g.setLineDash([3, 3]); g.strokeStyle = lastCol; g.beginPath(); g.moveTo(PAD_L, lastY); g.lineTo(w - PAD_R, lastY); g.stroke(); g.setLineDash([]);
    g.fillStyle = lastCol; g.fillRect(w - PAD_R + 2, lastY - 8, PAD_R - 4, 16);
    g.fillStyle = "#0b0b0b"; g.font = "bold 10px 'JetBrains Mono', monospace"; g.fillText(idr(closes.at(-1)).replace("Rp", ""), w - PAD_R + 6, lastY + 4);

    // crosshair
    if (hover >= 0) {
      const x = Math.round(X(hover)) + 0.5;
      g.strokeStyle = C.cross; g.setLineDash([2, 3]);
      g.beginPath(); g.moveTo(x, PAD_T); g.lineTo(x, h - PAD_B); g.stroke(); g.setLineDash([]);
    }
    paintRsi(hover, X);
    return { X, plotW };
  };

  const paintRsi = (hover, X) => {
    if (!rsiCv) return;
    const { g, w, h } = setupCanvas(rsiCv);
    const T = 8, B = h - 8, Y = (v) => T + (1 - v / 100) * (B - T);
    g.fillStyle = C.band; g.fillRect(PAD_L, Y(70), w - PAD_L - PAD_R, Y(30) - Y(70));
    g.strokeStyle = C.grid; g.font = "10px 'JetBrains Mono', monospace"; g.fillStyle = C.text;
    [30, 50, 70].forEach((v) => { const y = Math.round(Y(v)) + 0.5; g.beginPath(); g.moveTo(PAD_L, y); g.lineTo(w - PAD_R, y); g.stroke(); g.fillText(String(v), w - PAD_R + 6, y + 3); });
    g.fillText("RSI 14", PAD_L + 4, T + 10);
    g.strokeStyle = C.rsi; g.lineWidth = 1.4; g.beginPath(); let s = false;
    r14.forEach((v, i) => { if (v == null) return; const x = X(i), y = Y(v); s ? g.lineTo(x, y) : g.moveTo(x, y); s = true; });
    g.stroke(); g.lineWidth = 1;
    if (hover >= 0) { const x = Math.round(X(hover)) + 0.5; g.strokeStyle = C.cross; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(x, T); g.lineTo(x, B); g.stroke(); g.setLineDash([]); }
  };

  let geom = paint();
  const onMove = (ev) => {
    const rect = main.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const i = Math.max(0, Math.min(n - 1, Math.floor(((x - PAD_L) / geom.plotW) * n)));
    geom = paint(i);
    const k = candles[i];
    tip.innerHTML = `<b>${fmtTime(k.t, tf === "1D" ? "240" : tf)}</b><br>O ${idr(k.o)}<br>H ${idr(k.h)}<br>L ${idr(k.l)}<br>C ${idr(k.c)}<br>Vol ${k.v.toLocaleString("id-ID", { maximumFractionDigits: 4 })}` +
      (e20[i] != null ? `<br><span style="color:${C.ema20}">EMA20 ${idrCompact(e20[i])}</span>` : "") +
      (e50[i] != null ? `<br><span style="color:${C.ema50}">EMA50 ${idrCompact(e50[i])}</span>` : "") +
      (r14[i] != null ? `<br><span style="color:${C.rsi}">RSI ${r14[i].toLocaleString("id-ID", { maximumFractionDigits: 1 })}</span>` : "");
    tip.style.display = "block";
    const tx = geom.X(i) + 14, tw = tip.offsetWidth;
    tip.style.left = `${tx + tw > rect.width - 10 ? geom.X(i) - tw - 14 : tx}px`;
    tip.style.top = "12px";
  };
  const onLeave = () => { tip.style.display = "none"; geom = paint(); };
  const onResize = () => { geom = paint(); };
  main.addEventListener("pointermove", onMove);
  main.addEventListener("pointerleave", onLeave);
  window.addEventListener("resize", onResize);
  return () => {
    main.removeEventListener("pointermove", onMove);
    main.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("resize", onResize);
  };
}
