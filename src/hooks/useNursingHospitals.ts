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
        // Fetch all nursing hospitals (request up to 1000)
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-nursing-hospitals?numOfRows=1000`,
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
        const allHospitals: NursingHospital[] = result.success && result.data ? result.data : [];

        console.log(`Loaded ${allHospitals.length} nursing hospitals (source: ${result.source || 'unknown'})`);
        setHospitals(allHospitals);
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
