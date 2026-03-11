import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReviews } from "@/hooks/useReviews";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  driverId: string;
  driverName?: string;
}

const ReviewModal = ({ isOpen, onClose, requestId, driverId, driverName }: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createReview } = useReviews(driverId);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);

    const result = await createReview(driverId, rating, comment || undefined, requestId);

    setIsSubmitting(false);
    if (result) {
      setRating(0);
      setComment("");
      onClose();
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center">서비스는 어떠셨나요?</DialogTitle>
          <DialogDescription className="text-center">
            {driverName ? `${driverName} 기사님에 대한 리뷰를 남겨주세요` : "기사님에 대한 리뷰를 남겨주세요"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                type="button"
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.15 }}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 focus:outline-none"
                aria-label={`${star}점`}
              >
                <Star
                  className={`w-9 h-9 transition-colors ${
                    star <= displayRating
                      ? "text-amber-500 fill-amber-500"
                      : "text-muted-foreground/30"
                  }`}
                />
              </motion.button>
            ))}
          </div>

          {rating > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-muted-foreground"
            >
              {rating === 5 && "최고예요! 🎉"}
              {rating === 4 && "좋았어요 😊"}
              {rating === 3 && "보통이에요"}
              {rating === 2 && "아쉬웠어요"}
              {rating === 1 && "별로예요 😞"}
            </motion.p>
          )}

          {/* Comment */}
          <div>
            <Textarea
              placeholder="리뷰를 남겨주세요 (선택, 최대 200자)"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 200))}
              rows={3}
              className="rounded-xl resize-none"
            />
            <p className="text-right text-xs text-muted-foreground mt-1">
              {comment.length}/200
            </p>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full py-5 rounded-2xl text-base font-bold"
          >
            {isSubmitting ? "등록 중..." : "리뷰 등록"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
