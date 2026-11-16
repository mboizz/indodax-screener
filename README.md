# Indodax Screener

Screener pasar Indodax (pasangan IDR): harga, perubahan 24 jam & 7 hari, likuiditas, spread, sinyal momentum, sparkline 7 hari, candlestick dengan EMA20/50 dan RSI14, order book, transaksi terakhir, watchlist, dan peringatan harga.

**Live:** https://indodax-screener.netlify.app

> Bukan rekomendasi investasi. Sinyal hanya mengukur momentum 24 jam.

## Arsitektur

```
Browser ──► Netlify CDN (cache 10 dtk–15 mnt) ──► Netlify Functions ──► API publik Indodax
            public/ (HTML/CSS/JS statis, tanpa CDN pihak ketiga)
```

| Endpoint | Sumber Indodax | Cache CDN |
| --- | --- | --- |
| `GET /api/market` | `/api/summaries` (ternormalisasi) | 20 dtk + 40 dtk SWR |
| `GET /api/pair/:pair` | `/api/depth/:pair` + `/api/trades/:pair` | 10 dtk + 20 dtk SWR |
| `GET /api/ohlc/:pair?tf=15\|60\|240\|1D` | `/tradingview/history_v2` (200 candle) | 1–10 mnt |
| `GET /api/spark?pairs=a,b,…` (maks 30) | `/tradingview/history_v2` harian, 8 hari | 15 mnt |

`:pair` berformat `btcidr` (huruf kecil, tanpa garis bawah) dan divalidasi sebelum dipakai. Pasang yang tidak dikenal dibalas 404, bukan tabel kosong. Endpoint per pasang dibatasi per IP.

## Struktur

```
lib/indodax.mjs            parser & helper (dipakai fungsi + tes)
netlify/functions/*.mts    market, pair, ohlc, spark
public/                    index.html, css/app.css, js/app.mjs, js/analytics.mjs, js/charts.mjs, fonts/
test/                      tes node:test + fixture respons ASLI Indodax + dev-server lokal
legacy/                    kode Caffeine/ICP lama (tidak dipakai lagi)
```

## Pengembangan

```bash
npm test                                                      # 15+ tes parser & analitik, tanpa dependensi
node --experimental-strip-types test/dev-server.mjs 8888      # server lokal dengan fixture (tanpa internet)
```

Deploy: `netlify deploy --prod` (tanpa langkah build).

## Perubahan dari versi Caffeine/ICP

- Perubahan 24 jam dihitung dari `prices_24h` (dulu selalu 0% → semua sinyal "Hold").
- Detail pasang memakai `btcidr` (dulu `btc_idr` → Indodax membalas `invalid_pair`, halaman kosong).
- Respons error Indodax (HTTP 200 berisi `error`) kini dilempar dan ditampilkan.
- Nama dari kolom `name`, volume koin dari `vol_<koin>`, ID transaksi dari `tid`.
- Backend ICP tanpa cache (HTTP outcall per pengguna tiap 30 dtk) diganti proxy ber-cache di Netlify.
- Filter likuiditas, kolom spread, kategori (Kripto, Saham/xStocks, Emas, Stablecoin), sinyal deskriptif yang tidak menilai pasang sepi, paginasi, filter di URL.
- Candlestick + EMA/RSI, sparkline 7 hari, watchlist, dan peringatan harga (disimpan di browser).
- Bundle: dari ±2,2 MB JS (React, Recharts, three.js, dll.) menjadi beberapa puluh KB tanpa dependensi.
