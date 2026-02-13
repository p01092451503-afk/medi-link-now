import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useBids, type Bid } from "@/hooks/useBids";

interface BidWithRequest extends Bid {
  ambulance_dispatch_requests: {
    id: string;
    pickup_location: string;
    destination: string | null;
    patient_name: string | null;
    estimated_fee: number | null;
    is_scheduled: boolean;
    scheduled_time: string | null;
    created_at: string;
  } | null;
}

const DriverBidHistoryPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [driverBids, setDriverBids] = useState<BidWithRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchDriverBids } = useBids();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const loadBids = async () => {
      setIsLoading(true);
      const bids = await fetchDriverBids();
      setDriverBids(bids);
      setIsLoading(false);
    };

    if (user?.id) {
      loadBids();
    }
  }, [user?.id, fetchDriverBids]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "accepted":
        return "수락됨";
      case "rejected":
        return "거절됨";
      case "pending":
        return "대기 중";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const acceptedBids = driverBids.filter((b) => b.status === "accepted");
  const pendingBids = driverBids.filter((b) => b.status === "pending");
  const rejectedBids = driverBids.filter((b) => b.status === "rejected");

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/driver")}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">입찰 이력</h1>
            <p className="text-xs text-muted-foreground">제출한 입찰 현황 및 수락 기록</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
            <p className="text-muted-foreground text-sm mt-2">불러오는 중...</p>
          </div>
        ) : driverBids.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 border border-border text-center">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-foreground font-medium">입찰 이력이 없습니다</p>
            <p className="text-xs text-muted-foreground mt-1">
              예약된 호출에 참여해서 기사를 선택받아보세요
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Accepted Bids */}
            {acceptedBids.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <h2 className="text-sm font-bold text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  매칭됨 ({acceptedBids.length})
                </h2>
                <div className="space-y-3">
                  {acceptedBids.map((bid) => (
                    <BidCard key={bid.id} bid={bid} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Pending Bids */}
            {pendingBids.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <h2 className="text-sm font-bold text-yellow-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  대기 중 ({pendingBids.length})
                </h2>
                <div className="space-y-3">
                  {pendingBids.map((bid) => (
                    <BidCard key={bid.id} bid={bid} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Rejected Bids */}
            {rejectedBids.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <h2 className="text-sm font-bold text-red-600 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  거절됨 ({rejectedBids.length})
                </h2>
                <div className="space-y-3">
                  {rejectedBids.map((bid) => (
                    <BidCard key={bid.id} bid={bid} />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const BidCard = ({ bid }: { bid: BidWithRequest }) => {
  const request = bid.ambulance_dispatch_requests;
  if (!request) return null;

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-primary/10 border-primary/20 text-primary";
      case "pending":
        return "bg-secondary/20 border-secondary text-foreground";
      default:
        return "bg-destructive/10 border-destructive/20 text-destructive";
    }
  };

  const statusColor = getStatusStyles(bid.status);

  const statusIcon = bid.status === "accepted"
    ? <CheckCircle2 className="w-4 h-4" />
    : bid.status === "pending"
    ? <AlertCircle className="w-4 h-4" />
    : <XCircle className="w-4 h-4" />;

  const statusLabel = bid.status === "accepted"
    ? "수락됨"
    : bid.status === "pending"
    ? "대기 중"
    : "거절됨";

  return (
    <div className={`rounded-2xl p-4 border transition-all ${statusColor}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-bold text-xl text-foreground">
            ₩{bid.bid_amount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {request.patient_name || "환자"}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border ${statusColor}`}>
          {statusIcon}
          {statusLabel}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-3">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-muted-foreground">{request.pickup_location}</p>
            {request.destination && (
              <p className="text-foreground font-medium truncate">→ {request.destination}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{new Date(bid.created_at).toLocaleDateString("ko-KR")}</span>
        </div>

        {request.is_scheduled && request.scheduled_time && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>예약: {new Date(request.scheduled_time).toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
          </div>
        )}

        {request.estimated_fee && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
            <span>제시 요금: ₩{request.estimated_fee.toLocaleString()}</span>
          </div>
        )}
      </div>

      {bid.status === "accepted" && (
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-xs text-primary font-medium">✓ 이 요청에서 기사가 선택되었습니다</p>
        </div>
      )}

      {bid.status === "rejected" && (
        <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive font-medium">✕ 다른 기사가 선택되었습니다</p>
        </div>
      )}
    </div>
  );
};

export default DriverBidHistoryPage;
