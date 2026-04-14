import OutCall "mo:caffeineai-http-outcalls/outcall";
import MarketMixin "mixins/market-api";
import PairMixin "mixins/pair-api";

actor {
  /// Transform callback required by the IC HTTP outcalls mechanism.
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  include MarketMixin(transform);
  include PairMixin(transform);
};
