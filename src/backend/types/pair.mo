module {
  /// Raw JSON text responses for pair-specific Indodax API endpoints
  public type TradesResult = { #ok : Text; #err : Text };
  public type DepthResult  = { #ok : Text; #err : Text };
};
