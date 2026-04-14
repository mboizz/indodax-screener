import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { createActor } from "../backend";
import { mockBackend } from "../mocks/backend";
import type { OrderBook, Trade } from "../types";
import { parseDepth, parseTrades } from "../utils/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyActor = any;

export function useTrades(pairId: string) {
  const { actor, isFetching } = useActor(
    createActor as Parameters<typeof useActor>[0],
  );

  return useQuery<Trade[]>({
    queryKey: ["trades", pairId],
    queryFn: async () => {
      if (!pairId) return [];
      const effectiveActor: AnyActor = actor ?? mockBackend;

      const result = await effectiveActor.getTrades(pairId);
      if (result.__kind__ === "err") {
        throw new Error(`Gagal memuat transaksi: ${result.err}`);
      }
      return parseTrades(result.ok, pairId);
    },
    enabled: !isFetching && !!pairId,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}

export function useDepth(pairId: string) {
  const { actor, isFetching } = useActor(
    createActor as Parameters<typeof useActor>[0],
  );

  return useQuery<OrderBook>({
    queryKey: ["depth", pairId],
    queryFn: async () => {
      if (!pairId) return { buy: [], sell: [], timestamp: Date.now() };
      const effectiveActor: AnyActor = actor ?? mockBackend;

      const result = await effectiveActor.getDepth(pairId);
      if (result.__kind__ === "err") {
        throw new Error(`Gagal memuat order book: ${result.err}`);
      }
      return parseDepth(result.ok);
    },
    enabled: !isFetching && !!pairId,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}

export function usePairData(pairId: string) {
  const trades = useTrades(pairId);
  const depth = useDepth(pairId);

  return {
    trades,
    depth,
    isLoading: trades.isLoading || depth.isLoading,
    isError: trades.isError || depth.isError,
    error: trades.error ?? depth.error,
    lastUpdated: trades.dataUpdatedAt ? new Date(trades.dataUpdatedAt) : null,
    refetch: () => {
      trades.refetch();
      depth.refetch();
    },
  };
}
