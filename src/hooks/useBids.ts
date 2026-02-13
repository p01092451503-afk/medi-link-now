import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface Bid {
  id: string;
  request_id: string;
  driver_id: string;
  bid_amount: number;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useBids = (requestId?: string) => {
  const { user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBids = useCallback(async () => {
    if (!requestId) return;
    const { data, error } = await supabase
      .from("bids")
      .select("*")
      .eq("request_id", requestId)
      .order("bid_amount", { ascending: true });

    if (!error) setBids((data || []) as Bid[]);
  }, [requestId]);

  // Fetch driver's own bids with request details
  const fetchDriverBids = useCallback(async () => {
    if (!user?.id) return [];
    const { data, error } = await supabase
      .from("bids")
      .select(`
        *,
        ambulance_dispatch_requests (
          id,
          pickup_location,
          destination,
          patient_name,
          estimated_fee,
          is_scheduled,
          scheduled_time,
          created_at
        )
      `)
      .eq("driver_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching driver bids:", error);
      return [];
    }
    return (data || []) as any[];
  }, [user?.id]);

  const createBid = useCallback(
    async (bidAmount: number, message?: string) => {
      if (!user?.id || !requestId) return null;
      setIsLoading(true);
      const { data, error } = await supabase
        .from("bids")
        .insert({
          request_id: requestId,
          driver_id: user.id,
          bid_amount: bidAmount,
          message: message || null,
        })
        .select()
        .single();
      setIsLoading(false);

      if (error) {
        toast({ title: "입찰 실패", description: error.message, variant: "destructive" });
        return null;
      }
      toast({ title: "입찰이 등록되었습니다" });
      return data as Bid;
    },
    [user?.id, requestId]
  );

  const acceptBid = useCallback(
    async (bidId: string, driverId: string) => {
      if (!requestId) return false;
      // Update bid status to accepted
      const { error: bidError } = await supabase
        .from("bids")
        .update({ status: "accepted" })
        .eq("id", bidId);

      if (bidError) return false;

      // Update dispatch request to matched
      const { error: reqError } = await supabase
        .from("ambulance_dispatch_requests")
        .update({ driver_id: driverId, status: "accepted" })
        .eq("id", requestId);

      if (reqError) return false;

      // Reject other bids
      await supabase
        .from("bids")
        .update({ status: "rejected" })
        .eq("request_id", requestId)
        .neq("id", bidId);

      toast({ title: "기사가 선택되었습니다!" });
      return true;
    },
    [requestId]
  );

  // Realtime subscription
  useEffect(() => {
    if (!requestId) return;
    fetchBids();

    const channel = supabase
      .channel(`bids_${requestId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bids", filter: `request_id=eq.${requestId}` }, () => {
        fetchBids();
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [requestId, fetchBids]);

  return { bids, isLoading, createBid, acceptBid, refetch: fetchBids, fetchDriverBids };
};
