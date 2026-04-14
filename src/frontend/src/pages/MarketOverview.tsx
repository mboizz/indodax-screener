import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  FlaskConical,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useMarketSummaries, useMockMode } from "../hooks/useMarketData";
import type { SortDirection, SortField, Ticker } from "../types";
import {
  calculateSignal,
  formatChange,
  formatIDR,
  formatIDRCompact,
} from "../utils/format";

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  return (
    <div
      className="bg-card border border-border p-3 rounded-sm"
      data-ocid="stat-card"
    >
      <p className="text-[10px] font-display text-muted-foreground tracking-wider uppercase mb-1">
        {label}
      </p>
      <p
        className={cn(
          "text-base font-display font-bold truncate",
          positive === true
            ? "text-price-up"
            : positive === false
              ? "text-price-down"
              : "text-foreground",
        )}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Sort header ──────────────────────────────────────────────────────────────
function SortHeader({
  label,
  field,
  current,
  direction,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  current: SortField;
  direction: SortDirection;
  onSort: (f: SortField) => void;
  className?: string;
}) {
  const isActive = current === field;
  const Icon = isActive
    ? direction === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 text-[10px] font-display tracking-wider uppercase transition-colors",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
      data-ocid={`sort-${field}`}
    >
      {label}
      <Icon className="h-3 w-3" />
    </button>
  );
}

// ─── Ticker Row ───────────────────────────────────────────────────────────────
function TickerRow({ ticker, rank }: { ticker: Ticker; rank: number }) {
  const navigate = useNavigate();
  const isUp = ticker.change24h >= 0;

  return (
    <tr
      className="border-b border-border hover:bg-secondary/50 cursor-pointer transition-colors group"
      onClick={() =>
        navigate({ to: "/pair/$pairId", params: { pairId: ticker.pairId } })
      }
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ")
          navigate({ to: "/pair/$pairId", params: { pairId: ticker.pairId } });
      }}
      tabIndex={0}
      data-ocid={`ticker-row-${ticker.pairId}`}
    >
      <td className="pl-4 pr-2 py-2.5">
        <span className="text-[10px] text-muted-foreground font-mono w-5 inline-block">
          {rank}
        </span>
      </td>
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-sm bg-secondary border border-border flex items-center justify-center shrink-0">
            <span className="text-[9px] font-display font-bold text-primary">
              {ticker.pairId.replace("idr", "").toUpperCase().slice(0, 3)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-display font-semibold text-foreground truncate">
              {ticker.name}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {ticker.pairId.toUpperCase()}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 text-right">
        <span className="text-xs font-mono font-semibold text-foreground">
          {formatIDR(ticker.last)}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right">
        <div className="flex items-center justify-end gap-1">
          {isUp ? (
            <TrendingUp className="h-3 w-3 text-chart-1 shrink-0" />
          ) : (
            <TrendingDown className="h-3 w-3 text-chart-2 shrink-0" />
          )}
          <span
            className={cn(
              "text-xs font-mono font-bold",
              isUp ? "text-price-up" : "text-price-down",
            )}
          >
            {formatChange(ticker.change24h)}
          </span>
        </div>
      </td>
      <td
        className="px-3 py-2.5 text-center"
        data-ocid={`signal-${ticker.pairId}`}
      >
        {(() => {
          const sig = calculateSignal(ticker);
          return (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold inline-flex items-center whitespace-nowrap",
                sig.bgColor,
                sig.color,
              )}
            >
              {sig.label}
            </span>
          );
        })()}
      </td>
      <td className="px-3 py-2.5 text-right hidden md:table-cell">
        <span className="text-xs font-mono text-muted-foreground">
          {formatIDRCompact(ticker.volBase)}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right hidden lg:table-cell">
        <span className="text-xs font-mono text-foreground">
          {formatIDR(ticker.high)}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right hidden lg:table-cell">
        <span className="text-xs font-mono text-foreground">
          {formatIDR(ticker.low)}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right hidden xl:table-cell">
        <span className="text-xs font-mono text-foreground">
          {formatIDR(ticker.buy)}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right hidden xl:table-cell">
        <span className="text-xs font-mono text-foreground">
          {formatIDR(ticker.sell)}
        </span>
      </td>
    </tr>
  );
}

// ─── Loading skeleton rows ─────────────────────────────────────────────────────
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 12 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
        <tr key={i} className="border-b border-border">
          <td className="pl-4 pr-2 py-2.5">
            <Skeleton className="h-3 w-4" />
          </td>
          <td className="px-2 py-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-sm" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-2 w-12" />
              </div>
            </div>
          </td>
          <td className="px-3 py-2.5">
            <Skeleton className="h-3 w-24 ml-auto" />
          </td>
          <td className="px-3 py-2.5">
            <Skeleton className="h-3 w-14 ml-auto" />
          </td>
          <td className="px-3 py-2.5">
            <Skeleton className="h-5 w-16 rounded-full mx-auto" />
          </td>
          <td className="px-3 py-2.5 hidden md:table-cell">
            <Skeleton className="h-3 w-20 ml-auto" />
          </td>
          <td className="px-3 py-2.5 hidden lg:table-cell">
            <Skeleton className="h-3 w-24 ml-auto" />
          </td>
          <td className="px-3 py-2.5 hidden lg:table-cell">
            <Skeleton className="h-3 w-24 ml-auto" />
          </td>
          <td className="px-3 py-2.5 hidden xl:table-cell">
            <Skeleton className="h-3 w-24 ml-auto" />
          </td>
          <td className="px-3 py-2.5 hidden xl:table-cell">
            <Skeleton className="h-3 w-24 ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}

// ─── Market Overview Page ──────────────────────────────────────────────────────
export default function MarketOverview() {
  const {
    data: tickers = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useMarketSummaries();
  const isMock = useMockMode();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("vol");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  // Stats
  const stats = useMemo(() => {
    if (tickers.length === 0) return null;
    const gainers = tickers.filter((t) => t.change24h > 0).length;
    const losers = tickers.filter((t) => t.change24h < 0).length;
    const totalVol = tickers.reduce((s, t) => s + t.volBase, 0);
    const topGainer = [...tickers].sort((a, b) => b.change24h - a.change24h)[0];
    const topLoser = [...tickers].sort((a, b) => a.change24h - b.change24h)[0];
    return { gainers, losers, totalVol, topGainer, topLoser };
  }, [tickers]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...tickers];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) => t.pairId.includes(q) || t.name.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      let av = 0;
      let bv = 0;
      switch (sortField) {
        case "name":
          return sortDir === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
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

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-4 pt-4 pb-3 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-sm font-display font-bold text-foreground tracking-widest uppercase">
              Pasar Kripto
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {tickers.length} pasang aset tercatat di Indodax
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh data"
            data-ocid="refresh-btn"
            className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-sm text-xs font-display text-muted-foreground hover:text-foreground hover:border-primary transition-smooth disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                "h-3 w-3",
                isFetching && "animate-spin text-primary",
              )}
            />
            <span className="hidden sm:inline">REFRESH</span>
          </button>
        </div>

        {/* Stat cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <StatCard
              label="Total Volume (24j)"
              value={formatIDRCompact(stats.totalVol)}
              sub="Volume IDR"
            />
            <StatCard
              label="Naik / Turun"
              value={`${stats.gainers} / ${stats.losers}`}
              sub={`dari ${tickers.length} pasang`}
              positive={stats.gainers > stats.losers}
            />
            <StatCard
              label="Kenaikan Tertinggi"
              value={stats.topGainer?.name ?? "-"}
              sub={formatChange(stats.topGainer?.change24h ?? 0)}
              positive={true}
            />
            <StatCard
              label="Penurunan Terbesar"
              value={stats.topLoser?.name ?? "-"}
              sub={formatChange(stats.topLoser?.change24h ?? 0)}
              positive={false}
            />
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari pasang (BTC, ETH, ...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs font-mono bg-secondary border-border rounded-sm"
            data-ocid="search-input"
          />
        </div>
      </div>

      {/* Mock mode banner */}
      {isMock && (
        <div className="flex items-center gap-2 px-4 py-2 bg-accent/20 border-b border-accent/40">
          <FlaskConical className="h-3.5 w-3.5 text-accent-foreground shrink-0" />
          <p className="text-xs text-accent-foreground font-display">
            Mode Demo — menampilkan data contoh. Canister belum terdeploy.
          </p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div
          className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border-b border-destructive/30"
          data-ocid="error-banner"
        >
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-destructive">
              Gagal memuat data pasar dari Indodax
            </p>
            <p className="text-[11px] text-destructive/80 mt-0.5 truncate">
              {error instanceof Error
                ? error.message
                : "Terjadi kesalahan saat mengambil data. Periksa koneksi dan coba lagi."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            data-ocid="error-retry-btn"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-destructive/20 border border-destructive/40 rounded-sm text-xs font-display text-destructive hover:bg-destructive/30 transition-smooth disabled:opacity-50"
          >
            <RefreshCw
              className={cn("h-3 w-3", isFetching && "animate-spin")}
            />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-card border-b border-border z-10">
            <tr>
              <th className="pl-4 pr-2 py-2.5 w-8">
                <span className="text-[10px] text-muted-foreground font-display">
                  #
                </span>
              </th>
              <th className="px-2 py-2.5">
                <SortHeader
                  label="Pasang"
                  field="name"
                  current={sortField}
                  direction={sortDir}
                  onSort={handleSort}
                />
              </th>
              <th className="px-3 py-2.5 text-right">
                <SortHeader
                  label="Harga (IDR)"
                  field="last"
                  current={sortField}
                  direction={sortDir}
                  onSort={handleSort}
                  className="justify-end"
                />
              </th>
              <th className="px-3 py-2.5 text-right">
                <SortHeader
                  label="Perubahan 24j"
                  field="change24h"
                  current={sortField}
                  direction={sortDir}
                  onSort={handleSort}
                  className="justify-end"
                />
              </th>
              <th className="px-3 py-2.5 text-center">
                <span className="text-[10px] font-display tracking-wider text-muted-foreground uppercase">
                  Sinyal
                </span>
              </th>
              <th className="px-3 py-2.5 text-right hidden md:table-cell">
                <SortHeader
                  label="Volume (IDR)"
                  field="vol"
                  current={sortField}
                  direction={sortDir}
                  onSort={handleSort}
                  className="justify-end"
                />
              </th>
              <th className="px-3 py-2.5 text-right hidden lg:table-cell">
                <SortHeader
                  label="Tertinggi 24j"
                  field="high"
                  current={sortField}
                  direction={sortDir}
                  onSort={handleSort}
                  className="justify-end"
                />
              </th>
              <th className="px-3 py-2.5 text-right hidden lg:table-cell">
                <SortHeader
                  label="Terendah 24j"
                  field="low"
                  current={sortField}
                  direction={sortDir}
                  onSort={handleSort}
                  className="justify-end"
                />
              </th>
              <th className="px-3 py-2.5 text-right hidden xl:table-cell">
                <span className="text-[10px] font-display tracking-wider text-muted-foreground uppercase">
                  Beli
                </span>
              </th>
              <th className="px-3 py-2.5 text-right hidden xl:table-cell">
                <span className="text-[10px] font-display tracking-wider text-muted-foreground uppercase">
                  Jual
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 text-center">
                  <div
                    className="flex flex-col items-center gap-3"
                    data-ocid="empty-state"
                  >
                    {isError ? (
                      <AlertCircle className="h-8 w-8 text-destructive/40" />
                    ) : (
                      <Search className="h-8 w-8 text-muted-foreground/40" />
                    )}
                    <p className="text-sm text-muted-foreground font-display">
                      {search
                        ? `Tidak ada hasil untuk "${search}"`
                        : isError
                          ? "Data gagal dimuat — klik Coba Lagi di atas"
                          : "Tidak ada data pasar"}
                    </p>
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="text-xs text-primary hover:underline"
                      >
                        Hapus pencarian
                      </button>
                    )}
                    {!search && isError && (
                      <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        data-ocid="empty-retry-btn"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-sm text-xs font-display text-primary hover:bg-primary/20 transition-smooth disabled:opacity-50"
                      >
                        <RefreshCw
                          className={cn(
                            "h-3 w-3",
                            isFetching && "animate-spin",
                          )}
                        />
                        Muat Ulang Data
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((ticker, i) => (
                <TickerRow key={ticker.pairId} ticker={ticker} rank={i + 1} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer meta */}
      {!isLoading && filtered.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-card flex items-center gap-3">
          <Badge variant="outline" className="text-[10px] font-mono rounded-sm">
            {filtered.length} pasang
          </Badge>
          {search && (
            <Badge
              variant="outline"
              className="text-[10px] font-mono rounded-sm text-primary border-primary/40"
            >
              Filter: {search}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
