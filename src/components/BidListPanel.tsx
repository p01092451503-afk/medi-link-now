import { Star, Check, DollarSign, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bid } from "@/hooks/useBids";

interface BidListPanelProps {
  bids: Bid[];
  onAcceptBid: (bidId: string, driverId: string) => Promise<boolean>;
  isRequester: boolean;
}

const BidListPanel = ({ bids, onAcceptBid, isRequester }: BidListPanelProps) => {
  if (bids.length === 0) {
    return (
      <div className="text-center py-6">
        <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
        <p className="text-sm text-muted-foreground">아직 입찰이 없습니다</p>
        <p className="text-xs text-muted-foreground mt-1">기사들의 제안을 기다려주세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <DollarSign className="w-4 h-4" />
        입찰 목록 ({bids.length})
      </h4>
      {bids.map((bid) => (
        <div
          key={bid.id}
          className={`rounded-2xl p-4 border transition-colors ${
            bid.status === "accepted"
              ? "bg-foreground/5 border-foreground/20"
              : "bg-card border-border"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl font-bold text-foreground">
              ₩{bid.bid_amount.toLocaleString()}
            </span>
            {bid.status === "accepted" && (
              <span className="flex items-center gap-1 text-xs font-medium text-foreground bg-foreground/10 px-2 py-1 rounded-full">
                <Check className="w-3 h-3" /> 선택됨
              </span>
            )}
            {bid.status === "pending" && (
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                대기 중
              </span>
            )}
          </div>

          {bid.message && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
              <MessageSquare className="w-3.5 h-3.5 mt-0.5" />
              <span>{bid.message}</span>
            </div>
          )}

          {isRequester && bid.status === "pending" && (
            <Button
              onClick={() => onAcceptBid(bid.id, bid.driver_id)}
              size="sm"
              className="w-full rounded-xl bg-foreground text-background hover:opacity-90"
            >
              <Star className="w-4 h-4 mr-1" />
              이 기사 선택
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default BidListPanel;
