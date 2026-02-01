import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SharedRejectionLog {
  id: string;
  driver_id: string;
  hospital_id: number;
  hospital_name: string;
  rejection_reason: string;
  recorded_at: string;
  notes: string | null;
  created_at: string;
}

export interface HospitalRejectionStatus {
  hospitalId: number;
  hospitalName: string;
  recentCount: number; // Count in last 30 minutes
  severity: 'none' | 'warning' | 'critical'; // none: 0, warning: 1-2, critical: 3+
  lastRejection: SharedRejectionLog | null;
  reasons: string[];
}

export const SHARED_REJECTION_REASONS = [
  { id: 'bed_shortage', label: '병상 부족', icon: '🛏️' },
  { id: 'no_specialist', label: '전문의 부재', icon: '👨‍⚕️' },
  { id: 'equipment_failure', label: '장비 고장', icon: '🔧' },
  { id: 'icu_full', label: '중환자 과밀', icon: '🏥' },
  { id: 'other', label: '기타', icon: '📝' },
] as const;

export const useSharedRejectionLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SharedRejectionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all rejection logs from the last 60 minutes (for display)
  const fetchLogs = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('hospital_rejection_logs')
        .select('*')
        .gte('recorded_at', sixtyMinutesAgo)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      setLogs((data as SharedRejectionLog[]) || []);
    } catch (err) {
      console.error('Error fetching shared rejection logs:', err);
      setError('실시간 거부 이력을 불러오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Get rejection status for a specific hospital
  const getHospitalRejectionStatus = useCallback((hospitalId: number): HospitalRejectionStatus => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const hospitalLogs = logs.filter(
      log => log.hospital_id === hospitalId && new Date(log.recorded_at) >= thirtyMinutesAgo
    );

    const recentCount = hospitalLogs.length;
    const severity = recentCount === 0 ? 'none' : recentCount < 3 ? 'warning' : 'critical';
    const reasons = [...new Set(hospitalLogs.map(log => log.rejection_reason))];

    return {
      hospitalId,
      hospitalName: hospitalLogs[0]?.hospital_name || '',
      recentCount,
      severity,
      lastRejection: hospitalLogs[0] || null,
      reasons,
    };
  }, [logs]);

  // Get all hospitals with active warnings (within 30 minutes)
  const getActiveWarnings = useCallback((): Map<number, HospitalRejectionStatus> => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const warningsMap = new Map<number, HospitalRejectionStatus>();

    const recentLogs = logs.filter(log => new Date(log.recorded_at) >= thirtyMinutesAgo);
    
    // Group by hospital
    const hospitalGroups = new Map<number, SharedRejectionLog[]>();
    recentLogs.forEach(log => {
      const existing = hospitalGroups.get(log.hospital_id) || [];
      hospitalGroups.set(log.hospital_id, [...existing, log]);
    });

    // Create status for each hospital
    hospitalGroups.forEach((hospitalLogs, hospitalId) => {
      const recentCount = hospitalLogs.length;
      const severity = recentCount < 3 ? 'warning' : 'critical';
      const reasons = [...new Set(hospitalLogs.map(log => log.rejection_reason))];

      warningsMap.set(hospitalId, {
        hospitalId,
        hospitalName: hospitalLogs[0].hospital_name,
        recentCount,
        severity,
        lastRejection: hospitalLogs[0],
        reasons,
      });
    });

    return warningsMap;
  }, [logs]);

  // Get recent logs for the ticker feed (last 60 minutes)
  const getRecentLogsForFeed = useCallback(() => {
    return logs.slice(0, 10); // Return top 10 most recent
  }, [logs]);

  // Add a new rejection report
  const addRejectionReport = async (
    hospitalId: number,
    hospitalName: string,
    rejectionReason: string,
    notes?: string
  ) => {
    if (!user) throw new Error('로그인이 필요합니다.');

    const { data, error } = await supabase
      .from('hospital_rejection_logs')
      .insert({
        driver_id: user.id,
        hospital_id: hospitalId,
        hospital_name: hospitalName,
        rejection_reason: rejectionReason,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;
    
    // Add to local state immediately
    setLogs(prev => [(data as SharedRejectionLog), ...prev]);
    return data as SharedRejectionLog;
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Subscribe to realtime changes from ALL drivers
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('shared-rejection-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hospital_rejection_logs',
        },
        (payload) => {
          // Add new log from any driver
          const newLog = payload.new as SharedRejectionLog;
          setLogs(prev => [newLog, ...prev.filter(log => log.id !== newLog.id)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Auto-cleanup: Remove logs older than 60 minutes from local state
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000);
      setLogs(prev => prev.filter(log => new Date(log.recorded_at) >= sixtyMinutesAgo));
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    logs,
    isLoading,
    error,
    getHospitalRejectionStatus,
    getActiveWarnings,
    getRecentLogsForFeed,
    addRejectionReport,
    refetch: fetchLogs,
  };
};
