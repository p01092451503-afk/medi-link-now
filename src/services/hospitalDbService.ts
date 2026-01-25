import { supabase } from "@/integrations/supabase/client";
import { Hospital, HospitalAcceptance } from "@/data/hospitals";

export interface DbHospital {
  id: number;
  hpid: string | null;
  name: string;
  name_en: string | null;
  address: string;
  phone: string | null;
  lat: number;
  lng: number;
  entrance_lat: number | null;
  entrance_lng: number | null;
  category: string | null;
  region: string;
  sub_region: string | null;
  is_trauma_center: boolean | null;
  has_pediatric: boolean | null;
  equipment: string[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert database hospital to app Hospital format
 */
function dbToHospital(dbHospital: DbHospital, realtimeData?: {
  generalBeds?: number;
  pediatricBeds?: number;
  feverBeds?: number;
  acceptance?: HospitalAcceptance;
  alertMessage?: string;
}): Hospital {
  return {
    id: dbHospital.id,
    name: dbHospital.name_en || dbHospital.name,
    nameKr: dbHospital.name,
    category: dbHospital.category || '응급의료기관',
    lat: dbHospital.lat,
    lng: dbHospital.lng,
    entrance_lat: dbHospital.entrance_lat || undefined,
    entrance_lng: dbHospital.entrance_lng || undefined,
    phone: dbHospital.phone || '',
    address: dbHospital.address,
    beds: {
      general: realtimeData?.generalBeds ?? 0,
      pediatric: realtimeData?.pediatricBeds ?? 0,
      fever: realtimeData?.feverBeds ?? 0,
    },
    equipment: dbHospital.equipment || [],
    region: dbHospital.region,
    isTraumaCenter: dbHospital.is_trauma_center || false,
    acceptance: realtimeData?.acceptance,
    alertMessage: realtimeData?.alertMessage,
  };
}

/**
 * Fetch hospitals from database by region
 */
export async function getHospitalsFromDb(regionId?: string): Promise<{
  hospitals: Hospital[];
  error?: string;
}> {
  try {
    let query = supabase.from('hospitals').select('*');

    if (regionId && regionId !== 'all') {
      // Check if it's a sub-region (contains hyphen like 'seoul-gangnam')
      if (regionId.includes('-')) {
        query = query.eq('sub_region', regionId);
      } else {
        query = query.eq('region', regionId);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching hospitals from DB:', error);
      return { hospitals: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { hospitals: [], error: 'No hospitals found in database' };
    }

    // Convert to Hospital format (without realtime data for now)
    const hospitals = data.map((h: DbHospital) => dbToHospital(h));

    return { hospitals };
  } catch (err) {
    console.error('Error in getHospitalsFromDb:', err);
    return { hospitals: [], error: 'Database error' };
  }
}

/**
 * Sync mock hospitals to database
 */
export async function syncMockHospitalsToDb(hospitals: Hospital[]): Promise<{
  success: boolean;
  results?: { inserted: number; errors: string[] };
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('sync-hospitals', {
      body: { action: 'sync', hospitals },
    });

    if (error) {
      console.error('Error syncing hospitals:', error);
      return { success: false, error: error.message };
    }

    return { success: true, results: data.results };
  } catch (err) {
    console.error('Error in syncMockHospitalsToDb:', err);
    return { success: false, error: 'Sync failed' };
  }
}

/**
 * Fetch and sync hospitals from public API
 */
export async function fetchAndSyncFromApi(city?: string): Promise<{
  success: boolean;
  results?: { fetched: number; synced: number; errors: string[] };
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('sync-hospitals', {
      body: { action: 'fetch' },
      headers: city ? { 'x-city': city } : undefined,
    });

    if (error) {
      console.error('Error fetching from API:', error);
      return { success: false, error: error.message };
    }

    return { success: true, results: data.results };
  } catch (err) {
    console.error('Error in fetchAndSyncFromApi:', err);
    return { success: false, error: 'API sync failed' };
  }
}

/**
 * Sync hospitals nationwide from public API (all regions)
 */
export async function syncNationwideHospitals(regions?: string[]): Promise<{
  success: boolean;
  stats?: {
    regionsProcessed: number;
    hospitalsFound: number;
    hospitalsInserted: number;
    traumaCenters: number;
    durationMs: number;
  };
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('sync-hospitals-nationwide', {
      body: regions ? { regions } : {},
    });

    if (error) {
      console.error('Error syncing nationwide:', error);
      return { success: false, error: error.message };
    }

    return { success: true, stats: data.stats };
  } catch (err) {
    console.error('Error in syncNationwideHospitals:', err);
    return { success: false, error: 'Nationwide sync failed' };
  }
}

/**
 * Get hospital count from database
 */
export async function getHospitalCount(): Promise<number> {
  const { count, error } = await supabase
    .from('hospitals')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error getting hospital count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Subscribe to realtime hospital updates
 */
export function subscribeToHospitalUpdates(
  callback: (payload: { eventType: string; new: DbHospital; old: DbHospital }) => void
) {
  const channel = supabase
    .channel('hospitals-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'hospitals',
      },
      (payload) => callback(payload as any)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
