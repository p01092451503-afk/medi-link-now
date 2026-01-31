import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface RejectionLog {
  id: string;
  driver_id: string;
  hospital_id: number;
  hospital_name: string;
  rejection_reason: string;
  recorded_at: string;
  notes: string | null;
  created_at: string;
}

export const REJECTION_REASONS = [
  { id: 'bed_shortage', label: '병상 부족', icon: '🛏️' },
  { id: 'no_specialist', label: '전문의 부재', icon: '👨‍⚕️' },
  { id: 'equipment_failure', label: '장비 고장', icon: '🔧' },
  { id: 'icu_full', label: '중환자실 만실', icon: '🏥' },
  { id: 'no_answer', label: '통화 연결 안 됨', icon: '📞' },
] as const;

export const useRejectionLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<RejectionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('hospital_rejection_logs')
        .select('*')
        .eq('driver_id', user.id)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      setLogs((data as RejectionLog[]) || []);
    } catch (err) {
      console.error('Error fetching rejection logs:', err);
      setError('거부 이력을 불러오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const addLog = async (
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
    
    setLogs(prev => [(data as RejectionLog), ...prev]);
    return data as RejectionLog;
  };

  const deleteLog = async (logId: string) => {
    if (!user) throw new Error('로그인이 필요합니다.');

    const { error } = await supabase
      .from('hospital_rejection_logs')
      .delete()
      .eq('id', logId)
      .eq('driver_id', user.id);

    if (error) throw error;
    
    setLogs(prev => prev.filter(log => log.id !== logId));
  };

  const getTodayLogs = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return logs.filter(log => new Date(log.recorded_at) >= today);
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('rejection-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_rejection_logs',
          filter: `driver_id=eq.${user.id}`,
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    logs,
    isLoading,
    error,
    addLog,
    deleteLog,
    getTodayLogs,
    refetch: fetchLogs,
  };
};
