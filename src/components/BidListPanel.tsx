import { Star, Check, DollarSign, MessageSquare, Users, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bid } from "@/hooks/useBids";
import { motion } from "framer-motion";

interface BidListPanelProps {
  bids: Bid[];
  onAcceptBid: (bidId: string, driverId: string) => Promise<boolean>;
  isRequester: boolean;
}

const BidListPanel = ({ bids, onAcceptBid, isRequester }: BidListPanelProps) => {
  const pendingBids = bids.filter(b => b.status === "pending");
  const fastestBid = pendingBids.length > 0
    ? pendingBids.reduce((min, b) => b.bid_amount < min.bid_amount ? b : min, pendingBids[0])
    : null;

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
      {/* Real-time competition status */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          입찰 목록 ({bids.length})
        </h4>
        {pendingBids.length > 0 && (
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-1.5 text-xs font-medium text-foreground bg-foreground/10 px-3 py-1.5 rounded-full"
          >
            <Users className="w-3.5 h-3.5" />
            현재 {pendingBids.length}명 지원 중
          </motion.div>
        )}
      </div>

      {/* Fastest ETA highlight */}
      {fastestBid && (
        <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-2 text-xs text-foreground">
          <Zap className="w-3.5 h-3.5" />
          <span>최저 제안: <span className="font-bold">₩{fastestBid.bid_amount.toLocaleString()}</span></span>
        </div>
      )}

      {bids.map((bid) => {
        const isFastest = bid.id === fastestBid?.id;
        return (
          <motion.div
            key={bid.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-4 border transition-colors ${
              bid.status === "accepted"
                ? "bg-foreground/5 border-foreground/20"
                : isFastest
                ? "bg-foreground/5 border-foreground/30 ring-1 ring-foreground/20"
                : "bg-card border-border"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">
                  ₩{bid.bid_amount.toLocaleString()}
                </span>
                {isFastest && bid.status === "pending" && (
                  <span className="text-[10px] font-bold text-foreground bg-foreground/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" /> 최저가
                  </span>
                )}
              </div>
              {bid.status === "accepted" && (
                <span className="flex items-center gap-1 text-xs font-medium text-foreground bg-foreground/10 px-2 py-1 rounded-full">
                  <Check className="w-3 h-3" /> 선택됨
                </span>
              )}
              {bid.status === "pending" && !isFastest && (
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
                className="w-full min-h-[48px] rounded-xl bg-foreground text-background hover:opacity-90"
              >
                <Star className="w-4 h-4 mr-1" />
                이 기사 선택
              </Button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default BidListPanel;
