import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface HospitalLocation {
  id: number;
  lat: number;
  lng: number;
}

// Calculate distance in meters
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useLocationLogger(hospitals: HospitalLocation[]) {
  const { user } = useAuth();
  const lastNearbyHospital = useRef<number | null>(null);
  const entryTime = useRef<Date | null>(null);

  const logLocation = useCallback(async (lat: number, lng: number) => {
    if (!user?.id) return;

    // Find nearest hospital within 100m
    let nearestHospital: HospitalLocation | null = null;
    let nearestDistance = Infinity;

    for (const hospital of hospitals) {
      const distance = calculateDistance(lat, lng, hospital.lat, hospital.lng);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestHospital = hospital;
      }
    }

    const isNearHospital = nearestHospital && nearestDistance <= 100;
    const previousNearby = lastNearbyHospital.current;

    // Determine event type
    let eventType: 'enter' | 'exit' | 'ping' | null = null;
    let logHospitalId: number | null = null;

    if (isNearHospital && nearestHospital) {
      if (previousNearby !== nearestHospital.id) {
        // Entered new hospital zone
        eventType = 'enter';
        logHospitalId = nearestHospital.id;
        lastNearbyHospital.current = nearestHospital.id;
        entryTime.current = new Date();
      }
    } else if (previousNearby !== null) {
      // Exited hospital zone (> 100m away)
      // Check if moved > 500m from previous hospital
      const prevHospital = hospitals.find(h => h.id === previousNearby);
      if (prevHospital) {
        const distFromPrev = calculateDistance(lat, lng, prevHospital.lat, prevHospital.lng);
        if (distFromPrev > 500) {
          eventType = 'exit';
          logHospitalId = previousNearby;
          lastNearbyHospital.current = null;
          entryTime.current = null;
        }
      }
    }

    // Log to database if there's an event
    if (eventType && logHospitalId) {
      try {
        const { error } = await supabase
          .from('location_logs')
          .insert({
            driver_id: user.id,
            lat,
            lng,
            hospital_id: logHospitalId,
            event_type: eventType,
            distance_from_hospital: nearestDistance,
            recorded_at: new Date().toISOString()
          });

        if (error) {
          console.error('Failed to log location:', error);
        } else {
          console.log(`Location logged: ${eventType} at hospital ${logHospitalId}`);
        }
      } catch (err) {
        console.error('Location logging error:', err);
      }
    }
  }, [user?.id, hospitals]);

  const forceLogEntry = useCallback(async (hospitalId: number, lat: number, lng: number) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('location_logs')
        .insert({
          driver_id: user.id,
          lat,
          lng,
          hospital_id: hospitalId,
          event_type: 'enter',
          distance_from_hospital: 0,
          recorded_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to force log entry:', error);
      }
    } catch (err) {
      console.error('Force log entry error:', err);
    }
  }, [user?.id]);

  const forceLogExit = useCallback(async (hospitalId: number, lat: number, lng: number, distanceFromHospital: number) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('location_logs')
        .insert({
          driver_id: user.id,
          lat,
          lng,
          hospital_id: hospitalId,
          event_type: 'exit',
          distance_from_hospital: distanceFromHospital,
          recorded_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to force log exit:', error);
      }
    } catch (err) {
      console.error('Force log exit error:', err);
    }
  }, [user?.id]);

  return {
    logLocation,
    forceLogEntry,
    forceLogExit
  };
}
