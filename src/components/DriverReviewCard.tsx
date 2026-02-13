import { Star, TrendingUp } from "lucide-react";
import { DriverStats } from "@/hooks/useReviews";

interface DriverReviewCardProps {
  stats: DriverStats;
}

const DriverReviewCard = ({ stats }: DriverReviewCardProps) => {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Star className="w-4 h-4" />
        기사 평가
      </h4>
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="flex items-center gap-1 mb-1">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span className="text-2xl font-bold text-foreground">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "-"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">평균 별점</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{stats.totalReviews}</p>
          <p className="text-xs text-muted-foreground">리뷰 수</p>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-1 mb-1 justify-center">
            <TrendingUp className="w-4 h-4 text-foreground" />
            <span className="text-2xl font-bold text-foreground">{stats.totalTrips}</span>
          </div>
          <p className="text-xs text-muted-foreground">총 운행</p>
        </div>
      </div>
    </div>
  );
};

export default DriverReviewCard;
