import OutCall "mo:caffeineai-http-outcalls/outcall";
import MarketLib "../lib/market";
import MarketTypes "../types/market";

mixin (transform : OutCall.Transform) {
  /// Returns 24h market summaries for all trading pairs.
  /// Raw JSON response from GET https://indodax.com/api/summaries
  public func getMarketSummaries() : async MarketTypes.MarketSummariesResult {
    await MarketLib.getMarketSummaries(transform)
  };

  /// Returns current ticker prices for all trading pairs.
  /// Raw JSON response from GET https://indodax.com/api/ticker_all
  public func getTickerAll() : async MarketTypes.TickerAllResult {
    await MarketLib.getTickerAll(transform)
  };

  /// Returns metadata for all available trading pairs.
  /// Raw JSON response from GET https://indodax.com/api/pairs
  public func getPairs() : async MarketTypes.PairsResult {
    await MarketLib.getPairs(transform)
  };
};
