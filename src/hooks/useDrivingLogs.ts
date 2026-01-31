import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DrivingLog {
  id: string;
  driver_id: string;
  date: string;
  start_time: string;
  end_time: string;
  start_location: string;
  start_lat?: number;
  start_lng?: number;
  end_location: string;
  end_lat?: number;
  end_lng?: number;
  distance_km: number;
  duration_minutes?: number;
  patient_name?: string;
  hospital_name?: string;
  hospital_id?: number;
  notes?: string;
  created_at: string;
}

export interface CreateDrivingLogInput {
  startTime: Date;
  endTime: Date;
  startLocation: { lat: number; lng: number; address?: string };
  endLocation: { lat: number; lng: number; address?: string };
  distanceKm: number;
  patientName?: string;
  hospitalName?: string;
  hospitalId?: number;
  notes?: string;
}

export const useDrivingLogs = () => {
  const [logs, setLogs] = useState<DrivingLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchLogs = async (month?: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const targetMonth = month || currentMonth;
      const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from("driving_logs")
        .select("*")
        .eq("driver_id", user.id)
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .lte("date", endOfMonth.toISOString().split("T")[0])
        .order("start_time", { ascending: false });

      if (error) throw error;
      setLogs((data as DrivingLog[]) || []);
    } catch (error) {
      console.error("Error fetching driving logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentMonth]);

  const createLog = async (input: CreateDrivingLogInput): Promise<DrivingLog | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("로그인이 필요합니다");
        return null;
      }

      const durationMinutes = Math.round(
        (input.endTime.getTime() - input.startTime.getTime()) / 60000
      );

      const newLog = {
        driver_id: user.id,
        date: input.startTime.toISOString().split("T")[0],
        start_time: input.startTime.toISOString(),
        end_time: input.endTime.toISOString(),
        start_location: input.startLocation.address || 
          `${input.startLocation.lat.toFixed(4)}, ${input.startLocation.lng.toFixed(4)}`,
        start_lat: input.startLocation.lat,
        start_lng: input.startLocation.lng,
        end_location: input.endLocation.address ||
          `${input.endLocation.lat.toFixed(4)}, ${input.endLocation.lng.toFixed(4)}`,
        end_lat: input.endLocation.lat,
        end_lng: input.endLocation.lng,
        distance_km: Math.round(input.distanceKm * 10) / 10,
        duration_minutes: durationMinutes,
        patient_name: input.patientName,
        hospital_name: input.hospitalName,
        hospital_id: input.hospitalId,
        notes: input.notes,
      };

      const { data, error } = await supabase
        .from("driving_logs")
        .insert(newLog)
        .select()
        .single();

      if (error) throw error;

      setLogs((prev) => [data as DrivingLog, ...prev]);
      toast.success("운행 기록이 저장되었습니다");
      return data as DrivingLog;
    } catch (error) {
      console.error("Error creating driving log:", error);
      toast.error("운행 기록 저장에 실패했습니다");
      return null;
    }
  };

  const deleteLog = async (logId: string) => {
    try {
      const { error } = await supabase
        .from("driving_logs")
        .delete()
        .eq("id", logId);

      if (error) throw error;

      setLogs((prev) => prev.filter((log) => log.id !== logId));
      toast.success("기록이 삭제되었습니다");
    } catch (error) {
      console.error("Error deleting driving log:", error);
      toast.error("삭제에 실패했습니다");
    }
  };

  const updateLog = async (logId: string, updates: Partial<DrivingLog>) => {
    try {
      const { data, error } = await supabase
        .from("driving_logs")
        .update(updates)
        .eq("id", logId)
        .select()
        .single();

      if (error) throw error;

      setLogs((prev) =>
        prev.map((log) => (log.id === logId ? (data as DrivingLog) : log))
      );
      toast.success("기록이 수정되었습니다");
    } catch (error) {
      console.error("Error updating driving log:", error);
      toast.error("수정에 실패했습니다");
    }
  };

  // Statistics
  const stats = {
    totalTrips: logs.length,
    totalDistance: logs.reduce((sum, log) => sum + log.distance_km, 0),
    totalDuration: logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0),
  };

  return {
    logs,
    isLoading,
    createLog,
    deleteLog,
    updateLog,
    fetchLogs,
    currentMonth,
    setCurrentMonth,
    stats,
  };
};
