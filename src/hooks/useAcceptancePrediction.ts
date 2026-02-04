import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AcceptancePrediction {
  hospital_id: number;
  total_entries: number;
  accepted_count: number;
  rejected_count: number;
  acceptance_rate: number;
  recent_analysis: {
    total_vehicles: number;
    rejected_vehicles: number;
    analysis_period_hours: number;
  };
}

export type AcceptanceStatus = 'smooth' | 'delayed' | 'warning' | 'no_data';

export function getAcceptanceStatus(rate: number | null, totalEntries: number): AcceptanceStatus {
  if (totalEntries === 0 || rate === null) return 'no_data';
  if (rate >= 80) return 'smooth';
  if (rate >= 50) return 'delayed';
  return 'warning';
}

export function getAcceptanceLabel(status: AcceptanceStatus): string {
  switch (status) {
    case 'smooth': return '원활';
    case 'delayed': return '지연 가능';
    case 'warning': return '거절 주의';
    case 'no_data': return '데이터 수집 중';
  }
}

export function getAcceptanceColor(status: AcceptanceStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'smooth':
      return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
    case 'delayed':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case 'warning':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'no_data':
      return { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
  }
}

export function useAcceptancePrediction(hospitalId: number | undefined) {
  return useQuery({
    queryKey: ['acceptance-prediction', hospitalId],
    queryFn: async (): Promise<AcceptancePrediction | null> => {
      if (!hospitalId) return null;

      // First try to get from cache
      const { data: cached, error: cacheError } = await supabase
        .from('hospital_acceptance_stats')
        .select('*')
        .eq('hospital_id', hospitalId)
        .maybeSingle();

      // If cached and recent (< 5 min old), use it
      if (cached && !cacheError) {
        const lastCalc = new Date(cached.last_calculated_at);
        const isRecent = (Date.now() - lastCalc.getTime()) < 5 * 60 * 1000;
        
        if (isRecent) {
          return {
            hospital_id: cached.hospital_id,
            total_entries: cached.total_entries,
            accepted_count: cached.accepted_count,
            rejected_count: cached.rejected_count,
            acceptance_rate: cached.acceptance_rate,
            recent_analysis: {
              total_vehicles: cached.total_entries,
              rejected_vehicles: cached.rejected_count,
              analysis_period_hours: 3
            }
          };
        }
      }

      // Otherwise fetch fresh calculation from edge function
      try {
        const { data, error } = await supabase.functions.invoke('calculate-acceptance-rate', {
          body: { hospital_id: hospitalId }
        });

        if (error) {
          console.error('Edge function error:', error);
          // Return cached data if available, even if stale
          if (cached) {
            return {
              hospital_id: cached.hospital_id,
              total_entries: cached.total_entries,
              accepted_count: cached.accepted_count,
              rejected_count: cached.rejected_count,
              acceptance_rate: cached.acceptance_rate,
              recent_analysis: {
                total_vehicles: cached.total_entries,
                rejected_vehicles: cached.rejected_count,
                analysis_period_hours: 3
              }
            };
          }
          return null;
        }

        return data as AcceptancePrediction;
      } catch (err) {
        console.error('Failed to fetch acceptance prediction:', err);
        return null;
      }
    },
    enabled: !!hospitalId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}
