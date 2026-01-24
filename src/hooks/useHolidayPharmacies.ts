import { useState, useEffect } from "react";

export interface HolidayPharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  mondayOpen?: string;
  mondayClose?: string;
  holidayOpen?: string;
  holidayClose?: string;
}

export const useHolidayPharmacies = (enabled: boolean = false) => {
  const [pharmacies, setPharmacies] = useState<HolidayPharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPharmacies([]);
      return;
    }

    const fetchPharmacies = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-holiday-pharmacies?numOfRows=500`,
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
        const allPharmacies: HolidayPharmacy[] = result.success && result.data ? result.data : [];

        console.log(`Loaded ${allPharmacies.length} holiday pharmacies (source: ${result.source || 'unknown'})`);
        setPharmacies(allPharmacies);
      } catch (err) {
        console.error('Error fetching holiday pharmacies:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch holiday pharmacies');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPharmacies();
  }, [enabled]);

  return { pharmacies, isLoading, error };
};
