export interface Ticker {
  pairId: string;
  name: string;
  last: number;
  buy: number;
  sell: number;
  high: number;
  low: number;
  vol: number;
  volBase: number;
  change24h: number;
}

export interface PairInfo {
  id: string;
  symbol: string;
  baseCurrency: string;
  tradedCurrency: string;
  description: string;
  tickerId: string;
  volumeScale: number;
  priceScale: number;
  minPrice: number;
  maxPrice: number;
  minVol: number;
  maxVol: number;
  isActive: boolean;
}

export interface Trade {
  tradeId: string;
  type: "buy" | "sell";
  price: number;
  amount: number;
  total: number;
  timestamp: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  buy: OrderBookEntry[];
  sell: OrderBookEntry[];
  timestamp: number;
}

export interface MarketSummary {
  pairId: string;
  name: string;
  highestBid: number;
  percentChange: number;
  baseVolume: number;
  quoteVolume: number;
  isFrozen: boolean;
  high24hr: number;
  low24hr: number;
  lastPrice: number;
  lowestAsk: number;
}

export type SortField = "name" | "last" | "change24h" | "vol" | "high" | "low";
export type SortDirection = "asc" | "desc";
