import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to get incoming ambulances count for hospitals
 * Subscribes to realtime updates for immediate reflection
 */
export function useIncomingAmbulances() {
  const [incomingByHospital, setIncomingByHospital] = useState<Map<number, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const fetchIncomingAmbulances = useCallback(async () => {
    try {
      // Query active trips that are en_route
      const { data, error } = await supabase
        .from('active_ambulance_trips')
        .select('destination_hospital_id')
        .eq('status', 'en_route');
      
      if (error) {
        console.error('Error fetching incoming ambulances:', error);
        return;
      }

      // Count by hospital
      const countMap = new Map<number, number>();
      (data || []).forEach((trip) => {
        const hospitalId = trip.destination_hospital_id;
        countMap.set(hospitalId, (countMap.get(hospitalId) || 0) + 1);
      });
      setIncomingByHospital(countMap);
    } catch (err) {
      console.error('Error in fetchIncomingAmbulances:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncomingAmbulances();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('incoming-ambulances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_ambulance_trips',
        },
        () => {
          // Refetch on any change
          fetchIncomingAmbulances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchIncomingAmbulances]);

  const getIncomingCount = useCallback((hospitalId: number): number => {
    return incomingByHospital.get(hospitalId) || 0;
  }, [incomingByHospital]);

  /**
   * Calculate adjusted bed count
   * @param hospitalId - Hospital ID
   * @param publicBeds - Bed count from public data
   * @returns Adjusted bed count (never negative)
   */
  const getAdjustedBeds = useCallback((hospitalId: number, publicBeds: number): number => {
    const incoming = getIncomingCount(hospitalId);
    return Math.max(0, publicBeds - incoming);
  }, [getIncomingCount]);

  return {
    incomingByHospital,
    isLoading,
    getIncomingCount,
    getAdjustedBeds,
    refetch: fetchIncomingAmbulances,
  };
}

/**
 * Hook to get incoming ambulances for a single hospital
 */
export function useIncomingAmbulancesForHospital(hospitalId: number | undefined) {
  const [incomingCount, setIncomingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!hospitalId) {
      setIsLoading(false);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('active_ambulance_trips')
        .select('*', { count: 'exact', head: true })
        .eq('destination_hospital_id', hospitalId)
        .eq('status', 'en_route');
      
      if (error) {
        console.error('Error fetching incoming ambulances:', error);
        return;
      }

      setIncomingCount(count || 0);
    } catch (err) {
      console.error('Error in fetchCount:', err);
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    fetchCount();

    if (!hospitalId) return;

    // Subscribe to realtime changes for this hospital
    const channel = supabase
      .channel(`incoming-ambulances-${hospitalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_ambulance_trips',
          filter: `destination_hospital_id=eq.${hospitalId}`,
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hospitalId, fetchCount]);

  return {
    incomingCount,
    isLoading,
    refetch: fetchCount,
  };
}
