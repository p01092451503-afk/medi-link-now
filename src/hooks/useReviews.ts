import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface Review {
  id: string;
  request_id: string | null;
  driver_id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface DriverStats {
  averageRating: number;
  totalReviews: number;
  totalTrips: number;
}

export const useReviews = (driverId?: string) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [driverStats, setDriverStats] = useState<DriverStats>({ averageRating: 0, totalReviews: 0, totalTrips: 0 });

  const fetchReviews = useCallback(async () => {
    if (!driverId) return;
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const typedData = data as Review[];
      setReviews(typedData);
      const avg = typedData.length > 0 ? typedData.reduce((s, r) => s + r.rating, 0) / typedData.length : 0;
      
      // Count completed trips
      const { count } = await supabase
        .from("ambulance_dispatch_requests")
        .select("*", { count: "exact", head: true })
        .eq("driver_id", driverId)
        .eq("status", "completed");

      setDriverStats({
        averageRating: Math.round(avg * 10) / 10,
        totalReviews: typedData.length,
        totalTrips: count || 0,
      });
    }
  }, [driverId]);

  const createReview = useCallback(
    async (targetDriverId: string, rating: number, comment?: string, requestId?: string) => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          driver_id: targetDriverId,
          reviewer_id: user.id,
          rating,
          comment: comment || null,
          request_id: requestId || null,
        })
        .select()
        .single();

      if (error) {
        toast({ title: "리뷰 등록 실패", variant: "destructive" });
        return null;
      }
      toast({ title: "리뷰가 등록되었습니다" });
      return data as Review;
    },
    [user?.id]
  );

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, driverStats, createReview, refetch: fetchReviews };
};
