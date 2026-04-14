import { c as createLucideIcon, j as jsxRuntimeExports, a as cn, u as useMarketSummaries, b as useMockMode, r as reactExports, R as RefreshCw, f as formatIDRCompact, d as formatChange, S as Skeleton, e as useNavigate, g as formatIDR, h as calculateSignal } from "./index-DSyK_yUB.js";
import { C as CircleAlert, B as Badge, T as TrendingUp, a as TrendingDown } from "./badge-Cz0tn0g5.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$4 = [
  ["path", { d: "M12 5v14", key: "s699le" }],
  ["path", { d: "m19 12-7 7-7-7", key: "1idqje" }]
];
const ArrowDown = createLucideIcon("arrow-down", __iconNode$4);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$3 = [
  ["path", { d: "m21 16-4 4-4-4", key: "f6ql7i" }],
  ["path", { d: "M17 20V4", key: "1ejh1v" }],
  ["path", { d: "m3 8 4-4 4 4", key: "11wl7u" }],
  ["path", { d: "M7 4v16", key: "1glfcx" }]
];
const ArrowUpDown = createLucideIcon("arrow-up-down", __iconNode$3);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["path", { d: "m5 12 7-7 7 7", key: "hav0vg" }],
  ["path", { d: "M12 19V5", key: "x0mq9r" }]
];
const ArrowUp = createLucideIcon("arrow-up", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  [
    "path",
    {
      d: "M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2",
      key: "18mbvz"
    }
  ],
  ["path", { d: "M6.453 15h11.094", key: "3shlmq" }],
  ["path", { d: "M8.5 2h7", key: "csnxdl" }]
];
const FlaskConical = createLucideIcon("flask-conical", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }]
];
const Search = createLucideIcon("search", __iconNode);
function Input({ className, type, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "input",
    {
      type,
      "data-slot": "input",
      className: cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      ),
      ...props
    }
  );
}
function StatCard({
  label,
  value,
  sub,
  positive
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "bg-card border border-border p-3 rounded-sm",
      "data-ocid": "stat-card",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-display text-muted-foreground tracking-wider uppercase mb-1", children: label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            className: cn(
              "text-base font-display font-bold truncate",
              positive === true ? "text-price-up" : positive === false ? "text-price-down" : "text-foreground"
            ),
            children: value
          }
        ),
        sub && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground mt-0.5 truncate", children: sub })
      ]
    }
  );
}
function SortHeader({
  label,
  field,
  current,
  direction,
  onSort,
  className
}) {
  const isActive = current === field;
  const Icon = isActive ? direction === "asc" ? ArrowUp : ArrowDown : ArrowUpDown;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick: () => onSort(field),
      className: cn(
        "flex items-center gap-1 text-[10px] font-display tracking-wider uppercase transition-colors",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
        className
      ),
      "data-ocid": `sort-${field}`,
      children: [
        label,
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3 w-3" })
      ]
    }
  );
}
function TickerRow({ ticker, rank }) {
  const navigate = useNavigate();
  const isUp = ticker.change24h >= 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "tr",
    {
      className: "border-b border-border hover:bg-secondary/50 cursor-pointer transition-colors group",
      onClick: () => navigate({ to: "/pair/$pairId", params: { pairId: ticker.pairId } }),
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ")
          navigate({ to: "/pair/$pairId", params: { pairId: ticker.pairId } });
      },
      tabIndex: 0,
      "data-ocid": `ticker-row-${ticker.pairId}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pl-4 pr-2 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground font-mono w-5 inline-block", children: rank }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-2 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-7 h-7 rounded-sm bg-secondary border border-border flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-display font-bold text-primary", children: ticker.pairId.replace("idr", "").toUpperCase().slice(0, 3) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-display font-semibold text-foreground truncate", children: ticker.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground truncate", children: ticker.pairId.toUpperCase() })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2.5 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono font-semibold text-foreground", children: formatIDR(ticker.last) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2.5 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-1", children: [
          isUp ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-3 w-3 text-chart-1 shrink-0" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { className: "h-3 w-3 text-chart-2 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: cn(
                "text-xs font-mono font-bold",
                isUp ? "text-price-up" : "text-price-down"
              ),
              children: formatChange(ticker.change24h)
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "td",
          {
            className: "px-3 py-2.5 text-center",
            "data-ocid": `signal-${ticker.pairId}`,
            children: (() => {
              const sig = calculateSignal(ticker);
              return /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold inline-flex items-center whitespace-nowrap",
                    sig.bgColor,
                    sig.color
                  ),
                  children: sig.label
                }
              );
            })()
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2.5 text-right hidden md:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono text-muted-foreground", children: formatIDRCompact(ticker.volBase) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2.5 text-right hidden lg:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono text-foreground", children: formatIDR(ticker.high) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2.5 text-right hidden lg:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono text-foreground", children: formatIDR(ticker.low) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2.5 text-right hidden xl:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono text-foreground", children: formatIDR(ticker.buy) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2.5 text-right hidden xl:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono text-foreground", children: formatIDR(ticker.sell) }) })
      ]
    }
  );
}
function SkeletonRows() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: Array.from({ length: 12 }).map((_, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
    /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "pl-4 pr-2 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-2 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-7 w-7 rounded-sm" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-16" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-2 w-12" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24 ml-auto" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-14 ml-auto" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-16 rounded-full mx-auto" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2.5 hidden md:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-20 ml-auto" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2.5 hidden lg:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24 ml-auto" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2.5 hidden lg:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24 ml-auto" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2.5 hidden xl:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24 ml-auto" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2.5 hidden xl:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24 ml-auto" }) })
    ] }, i)
  )) });
}
function MarketOverview() {
  var _a, _b, _c, _d;
  const {
    data: tickers = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch
  } = useMarketSummaries();
  const isMock = useMockMode();
  const [search, setSearch] = reactExports.useState("");
  const [sortField, setSortField] = reactExports.useState("vol");
  const [sortDir, setSortDir] = reactExports.useState("desc");
  const stats = reactExports.useMemo(() => {
    if (tickers.length === 0) return null;
    const gainers = tickers.filter((t) => t.change24h > 0).length;
    const losers = tickers.filter((t) => t.change24h < 0).length;
    const totalVol = tickers.reduce((s, t) => s + t.volBase, 0);
    const topGainer = [...tickers].sort((a, b) => b.change24h - a.change24h)[0];
    const topLoser = [...tickers].sort((a, b) => a.change24h - b.change24h)[0];
    return { gainers, losers, totalVol, topGainer, topLoser };
  }, [tickers]);
  const filtered = reactExports.useMemo(() => {
    let list = [...tickers];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) => t.pairId.includes(q) || t.name.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let av = 0;
      let bv = 0;
      switch (sortField) {
        case "name":
          return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        case "last":
          av = a.last;
          bv = b.last;
          break;
        case "change24h":
          av = a.change24h;
          bv = b.change24h;
          break;
        case "vol":
          av = a.volBase;
          bv = b.volBase;
          break;
        case "high":
          av = a.high;
          bv = b.high;
          break;
        case "low":
          av = a.low;
          bv = b.low;
          break;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return list;
  }, [tickers, search, sortField, sortDir]);
  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pt-4 pb-3 border-b border-border bg-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-sm font-display font-bold text-foreground tracking-widest uppercase", children: "Pasar Kripto" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: [
            tickers.length,
            " pasang aset tercatat di Indodax"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => refetch(),
            disabled: isFetching,
            "aria-label": "Refresh data",
            "data-ocid": "refresh-btn",
            className: "flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-sm text-xs font-display text-muted-foreground hover:text-foreground hover:border-primary transition-smooth disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                RefreshCw,
                {
                  className: cn(
                    "h-3 w-3",
                    isFetching && "animate-spin text-primary"
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "REFRESH" })
            ]
          }
        )
      ] }),
      stats && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            label: "Total Volume (24j)",
            value: formatIDRCompact(stats.totalVol),
            sub: "Volume IDR"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            label: "Naik / Turun",
            value: `${stats.gainers} / ${stats.losers}`,
            sub: `dari ${tickers.length} pasang`,
            positive: stats.gainers > stats.losers
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            label: "Kenaikan Tertinggi",
            value: ((_a = stats.topGainer) == null ? void 0 : _a.name) ?? "-",
            sub: formatChange(((_b = stats.topGainer) == null ? void 0 : _b.change24h) ?? 0),
            positive: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            label: "Penurunan Terbesar",
            value: ((_c = stats.topLoser) == null ? void 0 : _c.name) ?? "-",
            sub: formatChange(((_d = stats.topLoser) == null ? void 0 : _d.change24h) ?? 0),
            positive: false
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            placeholder: "Cari pasang (BTC, ETH, ...)",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: "pl-8 h-8 text-xs font-mono bg-secondary border-border rounded-sm",
            "data-ocid": "search-input"
          }
        )
      ] })
    ] }),
    isMock && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-4 py-2 bg-accent/20 border-b border-accent/40", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(FlaskConical, { className: "h-3.5 w-3.5 text-accent-foreground shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-accent-foreground font-display", children: "Mode Demo — menampilkan data contoh. Canister belum terdeploy." })
    ] }),
    isError && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-3 px-4 py-3 bg-destructive/10 border-b border-destructive/30",
        "data-ocid": "error-banner",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-destructive shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-destructive", children: "Gagal memuat data pasar dari Indodax" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-destructive/80 mt-0.5 truncate", children: error instanceof Error ? error.message : "Terjadi kesalahan saat mengambil data. Periksa koneksi dan coba lagi." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => refetch(),
              disabled: isFetching,
              "data-ocid": "error-retry-btn",
              className: "shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-destructive/20 border border-destructive/40 rounded-sm text-xs font-display text-destructive hover:bg-destructive/30 transition-smooth disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  RefreshCw,
                  {
                    className: cn("h-3 w-3", isFetching && "animate-spin")
                  }
                ),
                "Coba Lagi"
              ]
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 bg-card border-b border-border z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pl-4 pr-2 py-2.5 w-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground font-display", children: "#" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-2 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SortHeader,
          {
            label: "Pasang",
            field: "name",
            current: sortField,
            direction: sortDir,
            onSort: handleSort
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2.5 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SortHeader,
          {
            label: "Harga (IDR)",
            field: "last",
            current: sortField,
            direction: sortDir,
            onSort: handleSort,
            className: "justify-end"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2.5 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SortHeader,
          {
            label: "Perubahan 24j",
            field: "change24h",
            current: sortField,
            direction: sortDir,
            onSort: handleSort,
            className: "justify-end"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2.5 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-display tracking-wider text-muted-foreground uppercase", children: "Sinyal" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2.5 text-right hidden md:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SortHeader,
          {
            label: "Volume (IDR)",
            field: "vol",
            current: sortField,
            direction: sortDir,
            onSort: handleSort,
            className: "justify-end"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2.5 text-right hidden lg:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SortHeader,
          {
            label: "Tertinggi 24j",
            field: "high",
            current: sortField,
            direction: sortDir,
            onSort: handleSort,
            className: "justify-end"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2.5 text-right hidden lg:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SortHeader,
          {
            label: "Terendah 24j",
            field: "low",
            current: sortField,
            direction: sortDir,
            onSort: handleSort,
            className: "justify-end"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2.5 text-right hidden xl:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-display tracking-wider text-muted-foreground uppercase", children: "Beli" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2.5 text-right hidden xl:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-display tracking-wider text-muted-foreground uppercase", children: "Jual" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonRows, {}) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 10, className: "py-16 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex flex-col items-center gap-3",
          "data-ocid": "empty-state",
          children: [
            isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-8 w-8 text-destructive/40" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-8 w-8 text-muted-foreground/40" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-display", children: search ? `Tidak ada hasil untuk "${search}"` : isError ? "Data gagal dimuat — klik Coba Lagi di atas" : "Tidak ada data pasar" }),
            search && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setSearch(""),
                className: "text-xs text-primary hover:underline",
                children: "Hapus pencarian"
              }
            ),
            !search && isError && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => refetch(),
                disabled: isFetching,
                "data-ocid": "empty-retry-btn",
                className: "flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-sm text-xs font-display text-primary hover:bg-primary/20 transition-smooth disabled:opacity-50",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    RefreshCw,
                    {
                      className: cn(
                        "h-3 w-3",
                        isFetching && "animate-spin"
                      )
                    }
                  ),
                  "Muat Ulang Data"
                ]
              }
            )
          ]
        }
      ) }) }) : filtered.map((ticker, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(TickerRow, { ticker, rank: i + 1 }, ticker.pairId)) })
    ] }) }),
    !isLoading && filtered.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-2 border-t border-border bg-card flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "text-[10px] font-mono rounded-sm", children: [
        filtered.length,
        " pasang"
      ] }),
      search && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Badge,
        {
          variant: "outline",
          className: "text-[10px] font-mono rounded-sm text-primary border-primary/40",
          children: [
            "Filter: ",
            search
          ]
        }
      )
    ] })
  ] });
}
export {
  MarketOverview as default
};
