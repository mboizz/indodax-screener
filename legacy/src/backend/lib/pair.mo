import OutCall "mo:caffeineai-http-outcalls/outcall";
import Types "../types/pair";

module {
  /// Fetches recent trade history for a specific trading pair from Indodax.
  public func getTrades(pairId : Text, transform : OutCall.Transform) : async Types.TradesResult {
    try {
      let body = await OutCall.httpGetRequest("https://indodax.com/api/trades/" # pairId, [], transform);
      #ok(body)
    } catch (e) {
      #err("Failed to fetch trades for " # pairId # ": " # e.message())
    };
  };

  /// Fetches order book depth (bids and asks) for a specific trading pair from Indodax.
  public func getDepth(pairId : Text, transform : OutCall.Transform) : async Types.DepthResult {
    try {
      let body = await OutCall.httpGetRequest("https://indodax.com/api/depth/" # pairId, [], transform);
      #ok(body)
    } catch (e) {
      #err("Failed to fetch depth for " # pairId # ": " # e.message())
    };
  };
};
