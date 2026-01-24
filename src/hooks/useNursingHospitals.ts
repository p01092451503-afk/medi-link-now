import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NursingHospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  type: string;
  beds?: number;
}

export const useNursingHospitals = (enabled: boolean = false) => {
  const [hospitals, setHospitals] = useState<NursingHospital[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setHospitals([]);
      return;
    }

    const fetchHospitals = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch multiple pages to get more data
        const allHospitals: NursingHospital[] = [];
        
        for (let page = 1; page <= 3; page++) {
          const { data, error } = await supabase.functions.invoke('fetch-nursing-hospitals', {
            body: {},
            method: 'GET',
          });

          // Use query params approach
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-nursing-hospitals?pageNo=${page}&numOfRows=100`,
            {
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
          }

          const result = await response.json();

          if (result.success && result.data) {
            allHospitals.push(...result.data);
          }

          // If we got less than requested, no more pages
          if (result.data?.length < 100) break;
        }

        // Remove duplicates by ID
        const uniqueHospitals = allHospitals.filter(
          (h, i, arr) => arr.findIndex(x => x.id === h.id) === i
        );

        console.log(`Loaded ${uniqueHospitals.length} nursing hospitals`);
        setHospitals(uniqueHospitals);
      } catch (err) {
        console.error('Error fetching nursing hospitals:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch nursing hospitals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHospitals();
  }, [enabled]);

  return { hospitals, isLoading, error };
};
