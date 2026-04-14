import type {
  MarketSummary,
  OrderBook,
  OrderBookEntry,
  PairInfo,
  Ticker,
  Trade,
} from "../types";

// ─── IDR Formatter ────────────────────────────────────────────────────────────
export function formatIDR(price: number | string): string {
  const num = typeof price === "string" ? Number.parseFloat(price) : price;
  if (Number.isNaN(num)) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// ─── Compact IDR (1.2M, 842B, etc.) ──────────────────────────────────────────
export function formatIDRCompact(price: number | string): string {
  const num = typeof price === "string" ? Number.parseFloat(price) : price;
  if (Number.isNaN(num)) return "Rp0";
  if (num >= 1_000_000_000_000)
    return `Rp${(num / 1_000_000_000_000).toFixed(2)}T`;
  if (num >= 1_000_000_000) return `Rp${(num / 1_000_000_000).toFixed(2)}M`;
  if (num >= 1_000_000) return `Rp${(num / 1_000_000).toFixed(2)}Jt`;
  return formatIDR(num);
}

// ─── Change % formatter ───────────────────────────────────────────────────────
export function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

// ─── Volume with unit ─────────────────────────────────────────────────────────
export function formatVolume(vol: number, symbol?: string): string {
  const suffix = symbol ? ` ${symbol}` : "";
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}Jt${suffix}`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(2)}Rb${suffix}`;
  return `${vol.toFixed(2)}${suffix}`;
}

// ─── Parse getMarketSummaries() response ──────────────────────────────────────
export function parseIndodaxSummaries(json: string): Ticker[] {
  // Let parse errors propagate so React Query can set isError=true
  const data = JSON.parse(json) as Record<string, unknown>;
  const tickers: Ticker[] = [];

  // Indodax summaries format: { "tickers": { "btcidr": { ... }, "ethidr": { ... } } }
  // Also handles flat format: { "btcidr": { ... }, "ethidr": { ... } }
  const tickerData =
    (data.tickers as Record<string, unknown> | undefined) ?? data;

  if (typeof tickerData !== "object" || tickerData === null) {
    return tickers;
  }

  for (const [key, raw] of Object.entries(tickerData)) {
    if (typeof raw !== "object" || raw === null) continue;
    const r = raw as Record<string, string | number>;
    // skip non-IDR pairs
    if (!key.endsWith("idr")) continue;

    const last = Number.parseFloat(String(r.last ?? r.last_price ?? 0));
    const buy = Number.parseFloat(String(r.buy ?? r.highest_bid ?? 0));
    const sell = Number.parseFloat(String(r.sell ?? r.lowest_ask ?? 0));
    const high = Number.parseFloat(String(r.high ?? r.high24hr ?? 0));
    const low = Number.parseFloat(String(r.low ?? r.low24hr ?? 0));
    const volBase = Number.parseFloat(
      String(r.vol_idr ?? r.base_volume ?? r.quote_volume ?? 0),
    );
    const baseCurrKey = `vol_${key.replace("idr", "")}`;
    const volCoin = Number.parseFloat(
      String(r[baseCurrKey] ?? r.traded_volume ?? 0),
    );
    const change24h = Number.parseFloat(
      String(r.percent_change ?? r.change ?? 0),
    );

    const baseCurrency = key.replace("idr", "").toUpperCase();

    tickers.push({
      pairId: key,
      name: `${baseCurrency}/IDR`,
      last,
      buy,
      sell,
      high,
      low,
      vol: volCoin,
      volBase,
      change24h,
    });
  }

  return tickers.sort((a, b) => b.volBase - a.volBase);
}

// ─── Parse getPairs() response ────────────────────────────────────────────────
export function parsePairs(json: string): PairInfo[] {
  // Let parse errors propagate
  const data = JSON.parse(json) as Record<string, unknown>;
  const pairs: PairInfo[] = [];

  const pairList = Array.isArray(data.pairs) ? data.pairs : [];
  for (const p of pairList as Record<string, unknown>[]) {
    pairs.push({
      id: String(p.id ?? p.symbol ?? ""),
      symbol: String(p.symbol ?? p.id ?? ""),
      baseCurrency: String(p.base_currency ?? "").toUpperCase(),
      tradedCurrency: String(p.traded_currency ?? "IDR").toUpperCase(),
      description: String(p.description ?? ""),
      tickerId: String(p.ticker_id ?? p.id ?? ""),
      volumeScale: Number.parseInt(
        String(p.volume_precision ?? p.trade_volume_scale ?? 0),
      ),
      priceScale: Number.parseInt(
        String(p.price_precision ?? p.trade_price_scale ?? 0),
      ),
      minPrice: Number.parseFloat(String(p.trade_min_trade_price ?? 0)),
      maxPrice: Number.parseFloat(String(p.trade_max_trade_price ?? 0)),
      minVol: Number.parseFloat(String(p.trade_min_base_currency ?? 0)),
      maxVol: Number.parseFloat(String(p.trade_max_base_currency ?? 0)),
      isActive: p.is_active !== false,
    });
  }

  return pairs;
}

// ─── Parse getTrades() response ───────────────────────────────────────────────
export function parseTrades(json: string, pairId: string): Trade[] {
  // Let parse errors propagate
  const data = JSON.parse(json) as Record<string, unknown>;
  // Indodax: { "trades": [ { trade_id, type, price, amount, submit_time, ... } ] }
  const rawTrades = data.trades ?? data[pairId] ?? data ?? [];
  const arr = Array.isArray(rawTrades) ? rawTrades : [];

  return arr.slice(0, 50).map((t: Record<string, string | number>) => {
    const price = Number.parseFloat(String(t.price ?? 0));
    const amount = Number.parseFloat(String(t.amount ?? t.base_volume ?? 0));
    const funds = Number.parseFloat(String(t.funds ?? t.quote_volume ?? 0));
    return {
      tradeId: String(t.trade_id ?? t.id ?? Math.random()),
      type: String(t.type ?? "buy").toLowerCase() === "sell" ? "sell" : "buy",
      price,
      amount,
      total: funds || price * amount,
      timestamp: Number.parseInt(
        String(t.submit_time ?? t.date ?? Math.floor(Date.now() / 1000)),
      ),
    } as Trade;
  });
}

// ─── Parse getDepth() response ────────────────────────────────────────────────
export function parseDepth(json: string): OrderBook {
  // Let parse errors propagate
  const data = JSON.parse(json) as Record<string, unknown>;
  // Indodax: { "buy": [[price, vol], ...], "sell": [[price, vol], ...] }
  const rawBuy = Array.isArray(data.buy)
    ? (data.buy as [string, string][])
    : [];
  const rawSell = Array.isArray(data.sell)
    ? (data.sell as [string, string][])
    : [];

  const mapEntry = (entries: [string, string][]): OrderBookEntry[] => {
    let cumulative = 0;
    return entries.slice(0, 20).map(([price, amount]) => {
      const p = Number.parseFloat(price);
      const a = Number.parseFloat(amount);
      cumulative += p * a;
      return { price: p, amount: a, total: cumulative };
    });
  };

  return {
    buy: mapEntry(rawBuy),
    sell: mapEntry(rawSell),
    timestamp: Date.now(),
  };
}

// ─── Market Summary to Ticker converter ───────────────────────────────────────
export function summaryToTicker(summary: MarketSummary): Ticker {
  return {
    pairId: summary.pairId,
    name: summary.name,
    last: summary.lastPrice,
    buy: summary.highestBid,
    sell: summary.lowestAsk,
    high: summary.high24hr,
    low: summary.low24hr,
    vol: summary.quoteVolume,
    volBase: summary.baseVolume,
    change24h: summary.percentChange,
  };
}

// ─── Signal Calculator ────────────────────────────────────────────────────────
export interface SignalResult {
  label: string;
  color: string;
  bgColor: string;
}

export function calculateSignal(ticker: Ticker): SignalResult {
  const { change24h, last, high, low } = ticker;
  const range = high - low;
  const pricePosition = range === 0 ? 0.5 : (last - low) / range;

  if (change24h > 5 && pricePosition > 0.7) {
    return {
      label: "Strong Buy",
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    };
  }
  if (change24h > 2 && pricePosition > 0.5) {
    return {
      label: "Buy",
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    };
  }
  if (change24h < -5 && pricePosition < 0.3) {
    return {
      label: "Strong Sell",
      color: "text-red-400",
      bgColor: "bg-red-400/10",
    };
  }
  if (change24h < -2 && pricePosition < 0.5) {
    return {
      label: "Sell",
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
    };
  }
  return {
    label: "Hold",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
  };
}

// ─── Time formatter ───────────────────────────────────────────────────────────
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function formatTimestamp(ts: number): string {
  const date = new Date(ts < 1e12 ? ts * 1000 : ts);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}
