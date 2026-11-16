import OutCall "mo:caffeineai-http-outcalls/outcall";
import Types "../types/market";

module {
  /// Fetches 24h market summaries for all trading pairs from Indodax.
  /// Returns raw JSON text for frontend parsing.
  public func getMarketSummaries(transform : OutCall.Transform) : async Types.MarketSummariesResult {
    try {
      let body = await OutCall.httpGetRequest("https://indodax.com/api/summaries", [], transform);
      #ok(body)
    } catch (e) {
      #err("Failed to fetch market summaries: " # e.message())
    };
  };

  /// Fetches current ticker prices for all trading pairs from Indodax.
  public func getTickerAll(transform : OutCall.Transform) : async Types.TickerAllResult {
    try {
      let body = await OutCall.httpGetRequest("https://indodax.com/api/ticker_all", [], transform);
      #ok(body)
    } catch (e) {
      #err("Failed to fetch ticker data: " # e.message())
    };
  };

  /// Fetches metadata for all available trading pairs from Indodax.
  public func getPairs(transform : OutCall.Transform) : async Types.PairsResult {
    try {
      let body = await OutCall.httpGetRequest("https://indodax.com/api/pairs", [], transform);
      #ok(body)
    } catch (e) {
      #err("Failed to fetch pairs: " # e.message())
    };
  };
};
