import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type LiveStatusLevel = "available" | "busy" | "full";

export interface LiveReport {
  id: string;
  hospital_id: number;
  reporter_id: string;
  status_level: LiveStatusLevel;
  comment: string | null;
  created_at: string;
  valid_until: string;
}

export interface LiveHospitalStatus {
  isLive: boolean;
  status: LiveStatusLevel | null;
  report: LiveReport | null;
  minutesAgo: number | null;
}

/** Fetch the latest valid live report for a specific hospital */
export const useLiveHospitalStatus = (hospitalId?: number): LiveHospitalStatus & { refetch: () => void } => {
  const [report, setReport] = useState<LiveReport | null>(null);

  const fetchLatest = useCallback(async () => {
    if (!hospitalId) return;
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("hospital_live_reports")
      .select("*")
      .eq("hospital_id", hospitalId)
      .gt("valid_until", now)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setReport(data as LiveReport | null);
  }, [hospitalId]);

  useEffect(() => {
    fetchLatest();

    if (!hospitalId) return;

    const channel = supabase
      .channel(`live-report-${hospitalId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "hospital_live_reports",
          filter: `hospital_id=eq.${hospitalId}`,
        },
        () => fetchLatest()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hospitalId, fetchLatest]);

  const isLive = !!report && new Date(report.valid_until) > new Date();
  const minutesAgo = report ? Math.round((Date.now() - new Date(report.created_at).getTime()) / 60000) : null;

  return {
    isLive,
    status: isLive ? report!.status_level : null,
    report: isLive ? report : null,
    minutesAgo,
    refetch: fetchLatest,
  };
};

/** Fetch all valid live reports at once (for map overlay) */
export const useAllLiveReports = () => {
  const [reports, setReports] = useState<Map<number, LiveReport>>(new Map());

  const fetchAll = useCallback(async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("hospital_live_reports")
      .select("*")
      .gt("valid_until", now)
      .order("created_at", { ascending: false });

    if (data) {
      const map = new Map<number, LiveReport>();
      (data as LiveReport[]).forEach((r) => {
        if (!map.has(r.hospital_id)) {
          map.set(r.hospital_id, r);
        }
      });
      setReports(map);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("live-reports-all")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "hospital_live_reports" },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  return { liveReports: reports, refetch: fetchAll };
};

/** Submit a live report */
export const useSubmitLiveReport = () => {
  const { user } = useAuth();

  const submitReport = async (hospitalId: number, statusLevel: LiveStatusLevel, comment?: string) => {
    if (!user) throw new Error("로그인이 필요합니다");

    const { error } = await supabase.from("hospital_live_reports").insert({
      hospital_id: hospitalId,
      reporter_id: user.id,
      status_level: statusLevel,
      comment: comment || null,
    });

    if (error) throw error;
  };

  return { submitReport, canReport: !!user };
};
