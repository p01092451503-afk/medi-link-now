import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface DispatchRequest {
  id: string;
  requester_id: string | null;
  driver_id: string | null;
  status: "pending" | "accepted" | "en_route" | "arrived" | "completed" | "cancelled" | "scheduled";
  patient_name: string | null;
  patient_condition: string | null;
  pickup_location: string;
  pickup_lat: number;
  pickup_lng: number;
  destination: string | null;
  destination_lat: number | null;
  destination_lng: number | null;
  estimated_distance_km: number | null;
  estimated_fee: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useDispatchRequests = () => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<DispatchRequest[]>([]);
  const [myRequests, setMyRequests] = useState<DispatchRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch pending requests (for drivers)
  const fetchPendingRequests = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("ambulance_dispatch_requests")
      .select("*")
      .in("status", ["pending", "scheduled"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending requests:", error);
      return;
    }

    setPendingRequests((data || []) as DispatchRequest[]);
  }, [user?.id]);

  // Fetch my requests (for requesters)
  const fetchMyRequests = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("ambulance_dispatch_requests")
      .select("*")
      .or(`requester_id.eq.${user.id},driver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching my requests:", error);
      return;
    }

    setMyRequests((data || []) as DispatchRequest[]);
  }, [user?.id]);

  // Create a dispatch request
  const createRequest = useCallback(async (request: {
    pickup_location: string;
    pickup_lat: number;
    pickup_lng: number;
    destination?: string;
    destination_lat?: number;
    destination_lng?: number;
    patient_name?: string;
    patient_condition?: string;
    estimated_distance_km?: number;
    estimated_fee?: number;
    notes?: string;
  }) => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("ambulance_dispatch_requests")
      .insert({
        ...request,
        requester_id: user?.id || null,
        status: "pending",
      })
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      console.error("Error creating dispatch request:", error);
      toast({
        title: "호출 요청 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "🚑 구급대원 호출 요청 완료",
      description: "가까운 구급대원에게 알림을 보냈습니다.",
    });

    return data as DispatchRequest;
  }, [user?.id]);

  // Accept a request (for drivers)
  const acceptRequest = useCallback(async (requestId: string) => {
    if (!user?.id) {
      toast({
        title: "로그인이 필요합니다",
        variant: "destructive",
      });
      return false;
    }

    const { error } = await supabase
      .from("ambulance_dispatch_requests")
      .update({
        driver_id: user.id,
        status: "accepted",
      })
      .eq("id", requestId)
      .eq("status", "pending");

    if (error) {
      console.error("Error accepting request:", error);
      toast({
        title: "수락 실패",
        description: "이미 다른 구급대원이 수락했을 수 있습니다.",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "✅ 호출을 수락했습니다",
      description: "환자에게 이동 중임을 알립니다.",
    });

    await fetchPendingRequests();
    return true;
  }, [user?.id, fetchPendingRequests]);

  // Start transport (driver starts moving)
  const startTransport = useCallback(async (requestId: string) => {
    if (!user?.id) return false;

    const { error } = await supabase
      .from("ambulance_dispatch_requests")
      .update({ status: "en_route" })
      .eq("id", requestId)
      .eq("driver_id", user.id);

    if (error) {
      console.error("Error starting transport:", error);
      toast({ title: "이송 시작 실패", variant: "destructive" });
      return false;
    }

    // Broadcast notification to guardian/patient
    await supabase.channel("dispatch_broadcast").send({
      type: "broadcast",
      event: "transport_started",
      payload: { request_id: requestId, driver_id: user.id },
    });

    toast({ title: "🚑 이송을 시작합니다", description: "환자/보호자에게 알림을 보냈습니다." });
    await fetchMyRequests();
    return true;
  }, [user?.id, fetchMyRequests]);

  // Update request status
  const updateStatus = useCallback(async (
    requestId: string, 
    status: DispatchRequest["status"]
  ) => {
    const { error } = await supabase
      .from("ambulance_dispatch_requests")
      .update({ status })
      .eq("id", requestId);

    if (error) {
      console.error("Error updating status:", error);
      return false;
    }

    const statusMessages: Record<DispatchRequest["status"], string> = {
      pending: "대기 중",
      accepted: "수락됨",
      en_route: "이동 중",
      arrived: "도착",
      completed: "완료",
      cancelled: "취소됨",
      scheduled: "예약됨",
    };

    toast({
      title: `상태 업데이트: ${statusMessages[status]}`,
    });

    return true;
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel("dispatch_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ambulance_dispatch_requests",
        },
        (payload) => {
          console.log("Dispatch change:", payload);
          fetchPendingRequests();
          fetchMyRequests();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchPendingRequests, fetchMyRequests]);

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchPendingRequests();
      fetchMyRequests();
    }
  }, [user?.id, fetchPendingRequests, fetchMyRequests]);

  return {
    pendingRequests,
    myRequests,
    isLoading,
    createRequest,
    acceptRequest,
    startTransport,
    updateStatus,
    refetch: () => {
      fetchPendingRequests();
      fetchMyRequests();
    },
  };
};
