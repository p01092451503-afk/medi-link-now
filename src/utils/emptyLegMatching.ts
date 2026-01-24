import { 
  findCityCoordinates, 
  calculateDistance, 
  distanceToLineSegment,
  type CityCoordinate 
} from "@/data/koreanCities";
import type { ReturnTripRequest } from "@/hooks/useRealtimeReturnTrips";

export interface DriverRoute {
  currentLocation: string;
  destination: string;
  isReturningEmpty: boolean;
}

export interface MatchedTrip extends ReturnTripRequest {
  matchScore: number;
  detourDistance: number;
  detourTimeMinutes: number;
  isOnRoute: boolean;
  pickupCoords: CityCoordinate | null;
  dropoffCoords: CityCoordinate | null;
}

// Configuration for matching algorithm
const MATCHING_CONFIG = {
  maxPickupDistanceFromRoute: 30, // km - how far pickup can be from driver's route
  maxDropoffDistanceFromDestination: 40, // km - how close dropoff should be to driver's destination
  averageSpeedKmh: 80, // average speed for detour time calculation
  routeBufferKm: 25, // buffer zone around route for "on your way" detection
};

/**
 * Core matching algorithm: Find return trips that match a driver's route
 * Uses "distance to line segment" to detect if pickup is along the route
 */
export const findEmptyLegMatches = (
  driverRoute: DriverRoute,
  tripRequests: ReturnTripRequest[]
): MatchedTrip[] => {
  if (!driverRoute.isReturningEmpty) return [];
  
  // Get driver's route coordinates
  const startCoords = findCityCoordinates(driverRoute.currentLocation);
  const endCoords = findCityCoordinates(driverRoute.destination);
  
  if (!startCoords || !endCoords) {
    console.warn("Could not find coordinates for driver route:", driverRoute);
    return [];
  }
  
  const matchedTrips: MatchedTrip[] = [];
  
  for (const trip of tripRequests) {
    const pickupCoords = findCityCoordinates(trip.pickup_city);
    const dropoffCoords = findCityCoordinates(trip.destination_city);
    
    if (!pickupCoords || !dropoffCoords) continue;
    
    // Calculate distance from pickup to driver's route line
    const distanceToRoute = distanceToLineSegment(
      pickupCoords.lat, pickupCoords.lng,
      startCoords.lat, startCoords.lng,
      endCoords.lat, endCoords.lng
    );
    
    // Calculate how close dropoff is to driver's destination
    const distanceToDestination = calculateDistance(
      dropoffCoords.lat, dropoffCoords.lng,
      endCoords.lat, endCoords.lng
    );
    
    // Check if pickup is on the route (within buffer zone)
    const isOnRoute = distanceToRoute <= MATCHING_CONFIG.routeBufferKm;
    
    // Check if this trip matches the driver's route
    const isValidMatch = 
      distanceToRoute <= MATCHING_CONFIG.maxPickupDistanceFromRoute &&
      distanceToDestination <= MATCHING_CONFIG.maxDropoffDistanceFromDestination;
    
    if (!isValidMatch) continue;
    
    // Calculate detour distance (rough estimate)
    const directRouteDistance = calculateDistance(
      startCoords.lat, startCoords.lng,
      endCoords.lat, endCoords.lng
    );
    
    const routeWithPickup = 
      calculateDistance(startCoords.lat, startCoords.lng, pickupCoords.lat, pickupCoords.lng) +
      calculateDistance(pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng) +
      calculateDistance(dropoffCoords.lat, dropoffCoords.lng, endCoords.lat, endCoords.lng);
    
    const detourDistance = Math.max(0, routeWithPickup - directRouteDistance);
    const detourTimeMinutes = Math.round((detourDistance / MATCHING_CONFIG.averageSpeedKmh) * 60);
    
    // Calculate match score (higher = better match)
    // Factors: proximity to route, revenue per detour minute, on-route bonus
    const revenuePerDetourMinute = detourTimeMinutes > 0 
      ? trip.estimated_fee / detourTimeMinutes 
      : trip.estimated_fee;
    
    const matchScore = 
      (100 - distanceToRoute) * 2 + // Proximity score
      (isOnRoute ? 50 : 0) + // Bonus for being directly on route
      (revenuePerDetourMinute / 1000); // Revenue efficiency
    
    matchedTrips.push({
      ...trip,
      matchScore,
      detourDistance: Math.round(detourDistance),
      detourTimeMinutes,
      isOnRoute,
      pickupCoords,
      dropoffCoords,
    });
  }
  
  // Sort by match score (highest first), then by revenue
  return matchedTrips.sort((a, b) => {
    if (b.isOnRoute !== a.isOnRoute) return b.isOnRoute ? 1 : -1;
    if (Math.abs(b.matchScore - a.matchScore) > 10) return b.matchScore - a.matchScore;
    return b.estimated_fee - a.estimated_fee;
  });
};

/**
 * Check if a specific point is roughly "on the way" between two cities
 */
export const isPointOnRoute = (
  pointCity: string,
  startCity: string,
  endCity: string,
  bufferKm: number = MATCHING_CONFIG.routeBufferKm
): boolean => {
  const pointCoords = findCityCoordinates(pointCity);
  const startCoords = findCityCoordinates(startCity);
  const endCoords = findCityCoordinates(endCity);
  
  if (!pointCoords || !startCoords || !endCoords) return false;
  
  const distance = distanceToLineSegment(
    pointCoords.lat, pointCoords.lng,
    startCoords.lat, startCoords.lng,
    endCoords.lat, endCoords.lng
  );
  
  return distance <= bufferKm;
};

/**
 * Get estimated detour info for a specific trip
 */
export const getDetourInfo = (
  pickup: string,
  dropoff: string,
  driverStart: string,
  driverEnd: string
): { detourKm: number; detourMinutes: number } | null => {
  const pickupCoords = findCityCoordinates(pickup);
  const dropoffCoords = findCityCoordinates(dropoff);
  const startCoords = findCityCoordinates(driverStart);
  const endCoords = findCityCoordinates(driverEnd);
  
  if (!pickupCoords || !dropoffCoords || !startCoords || !endCoords) {
    return null;
  }
  
  const directDistance = calculateDistance(
    startCoords.lat, startCoords.lng,
    endCoords.lat, endCoords.lng
  );
  
  const routeWithPickup = 
    calculateDistance(startCoords.lat, startCoords.lng, pickupCoords.lat, pickupCoords.lng) +
    calculateDistance(pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng) +
    calculateDistance(dropoffCoords.lat, dropoffCoords.lng, endCoords.lat, endCoords.lng);
  
  const detourKm = Math.round(Math.max(0, routeWithPickup - directDistance));
  const detourMinutes = Math.round((detourKm / MATCHING_CONFIG.averageSpeedKmh) * 60);
  
  return { detourKm, detourMinutes };
};
