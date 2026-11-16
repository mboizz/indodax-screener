import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Clock,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMarketSummaries } from "../hooks/useMarketData";
import { usePairData } from "../hooks/usePairData";
import type { OrderBookEntry, Ticker, Trade } from "../types";
import {
  formatChange,
  formatIDR,
  formatIDRCompact,
  formatTimestamp,
} from "../utils/format";

// ─── Pair header info ─────────────────────────────────────────────────────────
function PairHeader({ ticker }: { ticker: Ticker }) {
  const isUp = ticker.change24h >= 0;
  return (
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-secondary border border-border flex items-center justify-center shrink-0">
            <span className="text-xs font-display font-bold text-primary">
              {ticker.pairId.replace("idr", "").toUpperCase().slice(0, 3)}
            </span>
          </div>
          <div>
            <h1 className="text-base font-display font-bold text-foreground tracking-wider">
              {ticker.name}
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono">
              {ticker.pairId.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-right">
            <p className="text-xl font-display font-bold text-foreground">
              {formatIDR(ticker.last)}
            </p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              {isUp ? (
                <TrendingUp className="h-3 w-3 text-chart-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-chart-2" />
              )}
              <span
                className={cn(
                  "text-sm font-mono font-bold",
                  isUp ? "text-price-up" : "text-price-down",
                )}
              >
                {formatChange(ticker.change24h)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-right">
            <div>
              <p className="text-[10px] text-muted-foreground font-display tracking-wider">
                TERTINGGI 24J
              </p>
              <p className="text-xs font-mono text-foreground">
                {formatIDR(ticker.high)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-display tracking-wider">
                TERENDAH 24J
              </p>
              <p className="text-xs font-mono text-foreground">
                {formatIDR(ticker.low)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-display tracking-wider">
                HARGA BELI
              </p>
              <p className="text-xs font-mono text-price-up">
                {formatIDR(ticker.buy)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-display tracking-wider">
                HARGA JUAL
              </p>
              <p className="text-xs font-mono text-price-down">
                {formatIDR(ticker.sell)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-display tracking-wider">
              VOLUME (IDR)
            </p>
            <p className="text-sm font-mono font-semibold text-foreground">
              {formatIDRCompact(ticker.volBase)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Price chart from trades ──────────────────────────────────────────────────
function PriceChart({ trades }: { trades: Trade[] }) {
  const chartData = [...trades]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-30)
    .map((t) => ({
      time: formatTimestamp(t.timestamp),
      price: t.price,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-xs">
        Tidak ada data grafik
      </div>
    );
  }

  const prices = chartData.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const isUp = chartData[chartData.length - 1].price >= chartData[0].price;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart
        data={chartData}
        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={isUp ? "var(--color-chart-1)" : "var(--color-chart-2)"}
              stopOpacity={0.25}
            />
            <stop
              offset="95%"
              stopColor={isUp ? "var(--color-chart-1)" : "var(--color-chart-2)"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis
          dataKey="time"
          tick={{
            fontSize: 9,
            fontFamily: "JetBrains Mono",
            fill: "var(--color-muted-foreground)",
          }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[minPrice * 0.999, maxPrice * 1.001]}
          tick={{
            fontSize: 9,
            fontFamily: "JetBrains Mono",
            fill: "var(--color-muted-foreground)",
          }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatIDRCompact(v)}
          width={72}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "2px",
            fontSize: "10px",
            fontFamily: "JetBrains Mono",
            color: "var(--color-foreground)",
          }}
          formatter={(value: number) => [formatIDR(value), "Harga"]}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke={isUp ? "var(--color-chart-1)" : "var(--color-chart-2)"}
          strokeWidth={1.5}
          fill="url(#priceGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Order book ───────────────────────────────────────────────────────────────
function OrderBookTable({
  entries,
  type,
}: {
  entries: OrderBookEntry[];
  type: "buy" | "sell";
}) {
  const maxTotal = entries.length > 0 ? entries[entries.length - 1].total : 1;
  const isUp = type === "buy";

  return (
    <div className="overflow-hidden">
      <table className="w-full text-right">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-1.5 px-2 text-[10px] font-display text-muted-foreground tracking-wider">
              HARGA (IDR)
            </th>
            <th className="py-1.5 px-2 text-[10px] font-display text-muted-foreground tracking-wider">
              JUMLAH
            </th>
            <th className="py-1.5 px-2 text-[10px] font-display text-muted-foreground tracking-wider">
              TOTAL (IDR)
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.slice(0, 12).map((entry) => {
            const pct = maxTotal > 0 ? (entry.total / maxTotal) * 100 : 0;
            return (
              <tr
                key={`${entry.price}-${entry.amount}`}
                className="relative border-b border-border/40 hover:bg-secondary/30 transition-colors"
              >
                <td
                  className="py-1 px-2 text-left text-[11px] font-mono"
                  style={{
                    background: `linear-gradient(to right, ${isUp ? "color-mix(in oklch, var(--color-chart-1) 12%, transparent)" : "color-mix(in oklch, var(--color-chart-2) 12%, transparent)"} ${pct}%, transparent ${pct}%)`,
                  }}
                >
                  <span className={isUp ? "text-price-up" : "text-price-down"}>
                    {formatIDR(entry.price)}
                  </span>
                </td>
                <td className="py-1 px-2 text-[11px] font-mono text-foreground">
                  {entry.amount.toFixed(4)}
                </td>
                <td className="py-1 px-2 text-[11px] font-mono text-muted-foreground">
                  {formatIDRCompact(entry.total)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Recent trades table ──────────────────────────────────────────────────────
function TradesTable({ trades }: { trades: Trade[] }) {
  return (
    <div className="overflow-auto max-h-80">
      <table className="w-full">
        <thead className="sticky top-0 bg-card">
          <tr className="border-b border-border">
            <th className="text-left py-1.5 px-3 text-[10px] font-display text-muted-foreground tracking-wider">
              WAKTU
            </th>
            <th className="text-center py-1.5 px-3 text-[10px] font-display text-muted-foreground tracking-wider">
              TIPE
            </th>
            <th className="text-right py-1.5 px-3 text-[10px] font-display text-muted-foreground tracking-wider">
              HARGA
            </th>
            <th className="text-right py-1.5 px-3 text-[10px] font-display text-muted-foreground tracking-wider">
              JUMLAH
            </th>
            <th className="text-right py-1.5 px-3 text-[10px] font-display text-muted-foreground tracking-wider">
              TOTAL
            </th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr
              key={trade.tradeId}
              className="border-b border-border/40 hover:bg-secondary/30 transition-colors"
              data-ocid={`trade-row-${trade.tradeId}`}
            >
              <td className="py-1.5 px-3 text-[11px] font-mono text-muted-foreground">
                {formatTimestamp(trade.timestamp)}
              </td>
              <td className="py-1.5 px-3 text-center">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 rounded-sm font-display tracking-wider",
                    trade.type === "buy"
                      ? "border-chart-1/40 text-chart-1"
                      : "border-chart-2/40 text-chart-2",
                  )}
                >
                  {trade.type === "buy" ? "BELI" : "JUAL"}
                </Badge>
              </td>
              <td className="py-1.5 px-3 text-right">
                <span
                  className={cn(
                    "text-[11px] font-mono",
                    trade.type === "buy" ? "text-price-up" : "text-price-down",
                  )}
                >
                  {formatIDR(trade.price)}
                </span>
              </td>
              <td className="py-1.5 px-3 text-right text-[11px] font-mono text-foreground">
                {trade.amount.toFixed(4)}
              </td>
              <td className="py-1.5 px-3 text-right text-[11px] font-mono text-muted-foreground">
                {formatIDRCompact(trade.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── PairDetail Page ──────────────────────────────────────────────────────────
export default function PairDetail() {
  const { pairId } = useParams({ from: "/pair/$pairId" });
  const { trades, depth, isLoading, isError, error, refetch } =
    usePairData(pairId);
  const { data: tickers = [] } = useMarketSummaries();
  const ticker = tickers.find((t) => t.pairId === pairId);

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Back navigation */}
      <div className="px-4 py-2 border-b border-border bg-card flex items-center gap-2">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-display tracking-wider"
          data-ocid="back-link"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          KEMBALI KE PASAR
        </Link>
        <span className="text-border">|</span>
        <span className="text-xs font-display text-foreground tracking-wider">
          {pairId.toUpperCase()}
        </span>
      </div>

      {/* Ticker header */}
      {ticker ? (
        <PairHeader ticker={ticker} />
      ) : (
        <div className="bg-card border-b border-border px-4 py-3">
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div
          className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border-b border-destructive/30"
          data-ocid="pair-error-banner"
        >
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-destructive">
              Gagal memuat data perdagangan
            </p>
            <p className="text-[11px] text-destructive/80 mt-0.5 truncate">
              {error instanceof Error
                ? error.message
                : "Coba refresh halaman atau periksa koneksi internet Anda."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            data-ocid="pair-retry-btn"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-destructive/20 border border-destructive/40 rounded-sm text-xs font-display text-destructive hover:bg-destructive/30 transition-smooth"
          >
            <RefreshCw className="h-3 w-3" />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Main content grid */}
      <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Price chart + Trades */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Price chart */}
          <div className="bg-card border border-border p-3 rounded-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <h2 className="text-xs font-display font-bold text-foreground tracking-wider uppercase">
                Grafik Harga (30 Transaksi Terakhir)
              </h2>
            </div>
            {isLoading ? (
              <Skeleton className="h-44 w-full" />
            ) : (
              <PriceChart trades={trades.data ?? []} />
            )}
          </div>

          {/* Recent trades */}
          <div className="bg-card border border-border rounded-sm overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <h2 className="text-xs font-display font-bold text-foreground tracking-wider uppercase">
                Transaksi Terbaru
              </h2>
              {!isLoading && (
                <Badge
                  variant="outline"
                  className="ml-auto text-[10px] rounded-sm"
                >
                  {trades.data?.length ?? 0} transaksi
                </Badge>
              )}
            </div>
            {isLoading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (trades.data?.length ?? 0) === 0 ? (
              <div className="py-10 text-center" data-ocid="trades-empty">
                <p className="text-sm text-muted-foreground font-display">
                  Belum ada data transaksi
                </p>
              </div>
            ) : (
              <TradesTable trades={trades.data ?? []} />
            )}
          </div>
        </div>

        {/* Right: Order book */}
        <div className="flex flex-col gap-4">
          <div
            className="bg-card border border-border rounded-sm overflow-hidden"
            data-ocid="order-book"
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <h2 className="text-xs font-display font-bold text-foreground tracking-wider uppercase">
                Order Book
              </h2>
            </div>

            {isLoading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 16 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : (
              <div>
                {/* Sell orders */}
                <div className="border-b border-border">
                  <div className="px-3 py-1.5 flex items-center gap-1.5">
                    <TrendingDown className="h-3 w-3 text-chart-2" />
                    <span className="text-[10px] font-display text-chart-2 tracking-wider">
                      JUAL (ASK)
                    </span>
                  </div>
                  <OrderBookTable
                    entries={[...(depth.data?.sell ?? [])].reverse()}
                    type="sell"
                  />
                </div>

                {/* Spread indicator */}
                {ticker && (
                  <div className="px-3 py-2 border-b border-border bg-secondary/30 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-display tracking-wider">
                      HARGA TENGAH
                    </span>
                    <span className="text-xs font-mono font-bold text-primary">
                      {formatIDR(ticker.last)}
                    </span>
                  </div>
                )}

                {/* Buy orders */}
                <div>
                  <div className="px-3 py-1.5 flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-chart-1" />
                    <span className="text-[10px] font-display text-chart-1 tracking-wider">
                      BELI (BID)
                    </span>
                  </div>
                  <OrderBookTable entries={depth.data?.buy ?? []} type="buy" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
