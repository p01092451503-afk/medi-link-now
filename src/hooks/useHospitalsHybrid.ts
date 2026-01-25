import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Hospital } from '@/data/hospitals';
import { hospitals as mockHospitals } from '@/data/hospitals';
import { getHospitalsFromDb, getHospitalCount, subscribeToHospitalUpdates, syncMockHospitalsToDb } from '@/services/hospitalDbService';
import { getRealTimeBeds } from '@/services/emergencyApi';
import { toast } from 'sonner';

interface UseHospitalsHybridResult {
  hospitals: Hospital[];
  isLoading: boolean;
  isRealtime: boolean;
  isDbConnected: boolean;
  error?: string;
  refreshBeds: () => void;
  syncToDb: () => Promise<void>;
}

/**
 * Hybrid hook that combines database hospitals with realtime bed data from API
 */
export function useHospitalsHybrid(regionId: string = 'seoul'): UseHospitalsHybridResult {
  const queryClient = useQueryClient();
  const [isDbConnected, setIsDbConnected] = useState(false);

  // Check if DB has hospitals
  const { data: hospitalCount } = useQuery({
    queryKey: ['hospital-count'],
    queryFn: getHospitalCount,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  // Fetch realtime bed data from API
  const { 
    data: realtimeResult, 
    isLoading: isRealtimeLoading,
    refetch: refetchRealtime,
  } = useQuery({
    queryKey: ['hospitals-realtime', regionId],
    queryFn: () => getRealTimeBeds(regionId),
    staleTime: 60 * 1000, // 1 minute for realtime data
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });

  // Merge DB hospitals with realtime bed data
  const mergedHospitals = useCallback((): Hospital[] => {
    const dbHospitals = dbResult?.hospitals || [];
    const realtimeHospitals = realtimeResult?.hospitals || [];
    
    // If DB is empty, use realtime or mock data
    if (dbHospitals.length === 0) {
      if (realtimeHospitals.length > 0) {
        return realtimeHospitals;
      }
      // Filter mock hospitals by region if needed
      if (regionId && regionId !== 'all') {
        return mockHospitals.filter(h => {
          const hospitalRegion = h.region.toLowerCase();
          if (regionId === 'seoul') return hospitalRegion.includes('서울');
          if (regionId === 'incheon') return hospitalRegion.includes('인천');
          if (regionId === 'gyeonggi') return hospitalRegion.includes('경기');
          if (regionId === 'busan') return hospitalRegion.includes('부산');
          if (regionId === 'daegu') return hospitalRegion.includes('대구');
          if (regionId === 'daejeon') return hospitalRegion.includes('대전');
          if (regionId === 'gwangju') return hospitalRegion.includes('광주');
          if (regionId === 'ulsan') return hospitalRegion.includes('울산');
          return true;
        });
      }
      return mockHospitals;
    }

    // Merge realtime data into DB hospitals
    const realtimeMap = new Map<string, Hospital>();
    realtimeHospitals.forEach(h => {
      // Use name as key for matching
      realtimeMap.set(h.nameKr, h);
    });

    return dbHospitals.map(dbHospital => {
      const realtimeData = realtimeMap.get(dbHospital.nameKr);
      
      // 음수 병상 값을 0으로 정규화하는 헬퍼 함수
      const normalizeBeds = (beds: { general: number; pediatric: number; fever: number }) => ({
        general: Math.max(0, beds.general),
        pediatric: Math.max(0, beds.pediatric),
        fever: Math.max(0, beds.fever),
      });
      
      if (realtimeData) {
        return {
          ...dbHospital,
          beds: normalizeBeds(realtimeData.beds),
          acceptance: realtimeData.acceptance,
          alertMessage: realtimeData.alertMessage,
          isTraumaCenter: realtimeData.isTraumaCenter || dbHospital.isTraumaCenter,
        };
      }
      return {
        ...dbHospital,
        beds: normalizeBeds(dbHospital.beds),
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

  // Update DB connection status
  useEffect(() => {
    setIsDbConnected((hospitalCount || 0) > 0);
  }, [hospitalCount]);

  // Sync mock data to DB
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
    if (isDbConnected) {
      refetchDb();
    }
  };

  return {
    hospitals: mergedHospitals(),
    isLoading: isDbLoading || isRealtimeLoading,
    isRealtime: realtimeResult?.isRealtime || false,
    isDbConnected,
    error: dbResult?.error || realtimeResult?.error,
    refreshBeds,
    syncToDb,
  };
}
