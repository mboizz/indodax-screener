import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type TickerAllResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type DepthResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export type MarketSummariesResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export type PairsResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export interface http_header {
    value: string;
    name: string;
}
export type TradesResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export interface backendInterface {
    getDepth(pairId: string): Promise<DepthResult>;
    getMarketSummaries(): Promise<MarketSummariesResult>;
    getPairs(): Promise<PairsResult>;
    getTickerAll(): Promise<TickerAllResult>;
    getTrades(pairId: string): Promise<TradesResult>;
    /**
     * / Transform callback required by the IC HTTP outcalls mechanism.
     */
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
