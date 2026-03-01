import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Hospital } from '@/data/hospitals';
import { hospitals as mockHospitals } from '@/data/hospitals';
import { getHospitalsFromDb, getHospitalCount, subscribeToHospitalUpdates, syncMockHospitalsToDb } from '@/services/hospitalDbService';
import { getRealTimeBeds } from '@/services/emergencyApi';
import { toast } from 'sonner';

export type DataSource = 'api' | 'db' | 'cache' | 'mock';

export interface HospitalWithMeta extends Hospital {
  dataSource?: DataSource;
  reliability?: number; // 0-100
  isSaturated?: boolean;
  estimatedWaitMinutes?: number;
}

interface UseHospitalsHybridResult {
  hospitals: HospitalWithMeta[];
  isLoading: boolean;
  isRealtime: boolean;
  isDbConnected: boolean;
  error?: string;
  dataSource: DataSource;
  lastUpdated: Date | null;
  refreshBeds: () => void;
  syncToDb: () => Promise<void>;
}

/**
 * Hybrid hook that combines database hospitals with realtime bed data from API
 * Auto-refreshes every 10 seconds for emergency-critical freshness
 */
export function useHospitalsHybrid(regionId: string = 'seoul'): UseHospitalsHybridResult {
  const queryClient = useQueryClient();
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Check if DB has hospitals
  const { data: hospitalCount } = useQuery({
    queryKey: ['hospital-count'],
    queryFn: getHospitalCount,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch hospitals from DB
  const { 
    data: dbResult, 
    isLoading: isDbLoading,
    refetch: refetchDb,
  } = useQuery({
    queryKey: ['hospitals-db', regionId],
    queryFn: () => getHospitalsFromDb(regionId),
    enabled: (hospitalCount || 0) > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch realtime bed data from API — 10-second auto refresh
  const { 
    data: realtimeResult, 
    isLoading: isRealtimeLoading,
    refetch: refetchRealtime,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['hospitals-realtime', regionId],
    queryFn: () => getRealTimeBeds(regionId),
    staleTime: 10 * 1000,        // 10 seconds
    refetchInterval: 10 * 1000,  // Auto-refresh every 10 seconds
  });

  // Track last update time
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdated(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  // Determine primary data source
  const dataSource: DataSource = realtimeResult?.isRealtime
    ? 'api'
    : (dbResult?.hospitals?.length ?? 0) > 0
      ? 'db'
      : 'mock';

  // Estimate wait time for saturated hospitals
  const estimateWaitMinutes = (beds: { general: number; pediatric: number; fever: number }): number => {
    const total = beds.general + beds.pediatric + beds.fever;
    if (total > 0) return 0;
    // Negative beds = overflow patients
    const overflow = Math.abs(Math.min(0, beds.general));
    return Math.max(30, 20 + overflow * 15); // Base 30min + 15min per overflow patient
  };

  // Merge DB hospitals with realtime bed data
  const mergedHospitals = useCallback((): HospitalWithMeta[] => {
    const dbHospitals = dbResult?.hospitals || [];
    const realtimeHospitals = realtimeResult?.hospitals || [];
    
    if (dbHospitals.length === 0) {
      const base = realtimeHospitals.length > 0 ? realtimeHospitals : (() => {
        if (regionId && regionId !== 'all') {
          return mockHospitals.filter(h => {
            const r = h.region.toLowerCase();
            if (regionId === 'seoul') return r.includes('서울');
            if (regionId === 'incheon') return r.includes('인천');
            if (regionId === 'gyeonggi') return r.includes('경기');
            if (regionId === 'busan') return r.includes('부산');
            if (regionId === 'daegu') return r.includes('대구');
            if (regionId === 'daejeon') return r.includes('대전');
            if (regionId === 'gwangju') return r.includes('광주');
            if (regionId === 'ulsan') return r.includes('울산');
            return true;
          });
        }
        return mockHospitals;
      })();

      return base.map(h => {
        const totalBeds = h.beds.general + h.beds.pediatric + h.beds.fever;
        const isSaturated = totalBeds <= 0;
        return {
          ...h,
          dataSource: realtimeHospitals.length > 0 ? 'api' as DataSource : 'mock' as DataSource,
          reliability: realtimeHospitals.length > 0 ? 90 : 20,
          isSaturated,
          estimatedWaitMinutes: isSaturated ? estimateWaitMinutes(h.beds) : 0,
        };
      });
    }

    // Merge realtime data into DB hospitals
    const realtimeMap = new Map<string, Hospital>();
    realtimeHospitals.forEach(h => realtimeMap.set(h.nameKr, h));

    return dbHospitals.map(dbHospital => {
      const realtimeData = realtimeMap.get(dbHospital.nameKr);
      
      const beds = realtimeData ? realtimeData.beds : dbHospital.beds;
      const totalBeds = beds.general + beds.pediatric + beds.fever;
      const isSaturated = totalBeds <= 0;
      const source: DataSource = realtimeData ? 'api' : 'db';
      const reliability = realtimeData ? 95 : 70;

      if (realtimeData) {
        return {
          ...dbHospital,
          beds,
          acceptance: realtimeData.acceptance,
          alertMessage: realtimeData.alertMessage,
          isTraumaCenter: realtimeData.isTraumaCenter || dbHospital.isTraumaCenter,
          dataSource: source,
          reliability,
          isSaturated,
          estimatedWaitMinutes: isSaturated ? estimateWaitMinutes(beds) : 0,
        };
      }
      return {
        ...dbHospital,
        dataSource: source,
        reliability,
        isSaturated,
        estimatedWaitMinutes: isSaturated ? estimateWaitMinutes(beds) : 0,
      };
    });
  }, [dbResult, realtimeResult, regionId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = subscribeToHospitalUpdates((payload) => {
      console.log('Hospital update:', payload.eventType);
      queryClient.invalidateQueries({ queryKey: ['hospitals-db'] });
    });
    return unsubscribe;
  }, [queryClient]);

  useEffect(() => {
    setIsDbConnected((hospitalCount || 0) > 0);
  }, [hospitalCount]);

  const syncToDb = async () => {
    toast.loading('병원 데이터를 동기화 중...', { id: 'sync-hospitals' });
    const result = await syncMockHospitalsToDb(mockHospitals);
    if (result.success) {
      toast.success(`${result.results?.inserted || 0}개 병원 동기화 완료`, { id: 'sync-hospitals' });
      queryClient.invalidateQueries({ queryKey: ['hospital-count'] });
      queryClient.invalidateQueries({ queryKey: ['hospitals-db'] });
    } else {
      toast.error(`동기화 실패: ${result.error}`, { id: 'sync-hospitals' });
    }
  };

  const refreshBeds = () => {
    refetchRealtime();
    if (isDbConnected) refetchDb();
  };

  return {
    hospitals: mergedHospitals(),
    isLoading: isDbLoading || isRealtimeLoading,
    isRealtime: realtimeResult?.isRealtime || false,
    isDbConnected,
    error: dbResult?.error || realtimeResult?.error,
    dataSource,
    lastUpdated,
    refreshBeds,
    syncToDb,
  };
}
