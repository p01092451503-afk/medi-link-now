import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface PaymentRecord {
  id: string;
  request_id: string | null;
  user_id: string;
  driver_id: string | null;
  amount: number;
  platform_fee: number;
  driver_settlement: number;
  payment_status: string;
  payment_method: string | null;
  payment_key: string | null;
  order_id: string;
  receipt_url: string | null;
  is_deferred: boolean;
  deferred_reason: string | null;
  driver_consent: boolean | null;
  settled: boolean;
  settled_at: string | null;
  settlement_week: string | null;
  origin: string | null;
  destination: string | null;
  distance_km: number | null;
  vehicle_type: string | null;
  created_at: string;
  updated_at: string;
}

const PLATFORM_FEE_RATE = 0.1; // 10%

export const usePayments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's payment records
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_records")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PaymentRecord[];
    },
    enabled: !!user,
  });

  // Check for unpaid records
  const { data: unpaidCount = 0 } = useQuery({
    queryKey: ["unpaid-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("payment_records")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("payment_status", "pending")
        .eq("is_deferred", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // Create payment record
  const createPayment = useMutation({
    mutationFn: async (params: {
      amount: number;
      origin: string;
      destination: string;
      distanceKm: number;
      vehicleType: "general" | "special";
      requestId?: string;
      isDeferred?: boolean;
      deferredReason?: string;
      driverConsent?: boolean;
    }) => {
      if (!user) throw new Error("로그인이 필요합니다");

      const platformFee = Math.round(params.amount * PLATFORM_FEE_RATE);
      const driverSettlement = params.amount - platformFee;
      const orderId = `AMB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const { data, error } = await supabase
        .from("payment_records")
        .insert({
          user_id: user.id,
          amount: params.amount,
          platform_fee: platformFee,
          driver_settlement: driverSettlement,
          order_id: orderId,
          origin: params.origin,
          destination: params.destination,
          distance_km: params.distanceKm,
          vehicle_type: params.vehicleType,
          request_id: params.requestId || null,
          is_deferred: params.isDeferred || false,
          deferred_reason: params.deferredReason || null,
          driver_consent: params.driverConsent || false,
          payment_status: params.isDeferred ? "deferred" : "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data as PaymentRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-count"] });
    },
  });

  // Update payment status (after Toss callback)
  const updatePaymentStatus = useMutation({
    mutationFn: async (params: {
      paymentId: string;
      status: string;
      paymentKey?: string;
      paymentMethod?: string;
      receiptUrl?: string;
    }) => {
      const { data, error } = await supabase
        .from("payment_records")
        .update({
          payment_status: params.status,
          payment_key: params.paymentKey || null,
          payment_method: params.paymentMethod || null,
          receipt_url: params.receiptUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.paymentId)
        .select()
        .single();

      if (error) throw error;
      return data as PaymentRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-count"] });
    },
  });

  // Driver settlement stats
  const { data: settlementStats } = useQuery({
    queryKey: ["settlement-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_records")
        .select("*")
        .eq("driver_id", user!.id)
        .eq("payment_status", "paid");

      if (error) throw error;

      const records = data as PaymentRecord[];
      const totalEarnings = records.reduce((sum, r) => sum + r.driver_settlement, 0);
      const settledAmount = records
        .filter((r) => r.settled)
        .reduce((sum, r) => sum + r.driver_settlement, 0);
      const pendingSettlement = totalEarnings - settledAmount;

      return {
        totalEarnings,
        settledAmount,
        pendingSettlement,
        totalTrips: records.length,
      };
    },
    enabled: !!user,
  });

  return {
    payments,
    isLoading,
    unpaidCount,
    hasUnpaid: unpaidCount > 0,
    createPayment,
    updatePaymentStatus,
    settlementStats,
  };
};
