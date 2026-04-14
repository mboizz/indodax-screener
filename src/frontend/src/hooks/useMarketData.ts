import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { createActor } from "../backend";
import { mockBackend } from "../mocks/backend";
import type { PairInfo, Ticker } from "../types";
import { parseIndodaxSummaries, parsePairs } from "../utils/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyActor = any;

async function callGetMarketSummaries(actor: AnyActor): Promise<string> {
  const result = await actor.getMarketSummaries();
  if (result.__kind__ === "err") {
    throw new Error(`API error: ${result.err}`);
  }
  return result.ok;
}

async function callGetTickerAll(actor: AnyActor): Promise<string> {
  const result = await actor.getTickerAll();
  if (result.__kind__ === "err") {
    throw new Error(`API error: ${result.err}`);
  }
  return result.ok;
}

async function callGetPairs(actor: AnyActor): Promise<string> {
  const result = await actor.getPairs();
  if (result.__kind__ === "err") {
    throw new Error(`API error: ${result.err}`);
  }
  return result.ok;
}

export function useMarketSummaries() {
  const { actor, isFetching } = useActor(
    createActor as Parameters<typeof useActor>[0],
  );

  return useQuery<Ticker[]>({
    queryKey: ["market-summaries"],
    queryFn: async () => {
      // Determine which actor to use — real canister or mock
      const effectiveActor: AnyActor = actor ?? mockBackend;

      const json = await callGetMarketSummaries(effectiveActor);
      const tickers = parseIndodaxSummaries(json);

      if (tickers.length === 0) {
        throw new Error(
          "Data pasar kosong — kemungkinan format respons API berubah.",
        );
      }

      return tickers;
    },
    enabled: !isFetching,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}

export function usePairs() {
  const { actor, isFetching } = useActor(
    createActor as Parameters<typeof useActor>[0],
  );

  return useQuery<PairInfo[]>({
    queryKey: ["pairs"],
    queryFn: async () => {
      const effectiveActor: AnyActor = actor ?? mockBackend;

      const json = await callGetPairs(effectiveActor);
      return parsePairs(json);
    },
    enabled: !isFetching,
    retry: 2,
    refetchInterval: 300_000,
    staleTime: 290_000,
  });
}

export function useTickerAll() {
  const { actor, isFetching } = useActor(
    createActor as Parameters<typeof useActor>[0],
  );

  return useQuery<Ticker[]>({
    queryKey: ["ticker-all"],
    queryFn: async () => {
      const effectiveActor: AnyActor = actor ?? mockBackend;

      const json = await callGetTickerAll(effectiveActor);
      const tickers = parseIndodaxSummaries(json);

      if (tickers.length === 0) {
        throw new Error(
          "Data ticker kosong — kemungkinan format respons API berubah.",
        );
      }

      return tickers;
    },
    enabled: !isFetching,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}

export function useLastSyncTime(): Date | null {
  const { data: summaries } = useMarketSummaries();
  if (!summaries || summaries.length === 0) return null;
  return new Date();
}

/** True when the app is running against mock data (no deployed canister) */
export function useMockMode(): boolean {
  const { actor } = useActor(createActor as Parameters<typeof useActor>[0]);
  return !actor;
}
