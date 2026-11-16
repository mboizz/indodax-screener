import OutCall "mo:caffeineai-http-outcalls/outcall";
import PairLib "../lib/pair";
import PairTypes "../types/pair";

mixin (transform : OutCall.Transform) {
  /// Returns recent trade history for a specific pair.
  /// Raw JSON response from GET https://indodax.com/api/trades/{pairId}
  public func getTrades(pairId : Text) : async PairTypes.TradesResult {
    await PairLib.getTrades(pairId, transform)
  };

  /// Returns order book depth (bids and asks) for a specific pair.
  /// Raw JSON response from GET https://indodax.com/api/depth/{pairId}
  public func getDepth(pairId : Text) : async PairTypes.DepthResult {
    await PairLib.getDepth(pairId, transform)
  };
};
