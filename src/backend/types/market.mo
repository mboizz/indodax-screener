module {
  /// Raw JSON text responses from Indodax API endpoints
  public type MarketSummariesResult = { #ok : Text; #err : Text };
  public type TickerAllResult      = { #ok : Text; #err : Text };
  public type PairsResult          = { #ok : Text; #err : Text };
};
