import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { MapContainer, TileLayer, useMap, Circle, CircleMarker, Popup, useMapEvents, Marker } from "react-leaflet";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { AnimatePresence } from "framer-motion";
import { Hospital, FilterType, getHospitalStatus, calculateDistance } from "@/data/hospitals";
import ReportMarker from "../ReportMarker";
import DriverMarker from "../DriverMarker";
import PharmacyMarker from "../PharmacyMarker";
import AmbulanceTripMarker from "./AmbulanceTripMarker";
import ClusterPopup from "./ClusterPopup";
import type { LiveReport } from "../LiveReportFAB";
import type { DriverPresence } from "@/hooks/useDriverPresence";
import type { HolidayPharmacy } from "@/hooks/useHolidayPharmacies";
import type { AmbulanceTrip } from "@/hooks/useAmbulanceTrips";
import { createDonutClusterIcon, calculateClusterStats } from "./DonutClusterIcon";
import { createHospitalIcon, getDisplayBeds, getMarkerStatus, getGradeKoreanName } from "./hospitalIconUtils";

interface ClusteredMapViewProps {
  hospitals: Hospital[];
  onHospitalClick: (hospital: Hospital) => void;
  userLocation: [number, number] | null;
  center: [number, number];
  zoom: number;
  activeFilter: FilterType;
  activeRadius: number | "all";
  liveReports?: LiveReport[];
  nearbyDrivers?: DriverPresence[];
  onCallDriver?: (driver: DriverPresence) => void;
  holidayPharmacies?: HolidayPharmacy[];
  activeAmbulanceTrips?: AmbulanceTrip[];
  onBoundsChange?: (bounds: L.LatLngBounds, visibleHospitals: Hospital[]) => void;
}

// Component to handle map center changes and bounds
const MapController = ({ 
  center, 
  zoom, 
  hospitals,
  onBoundsChange 
}: { 
  center: [number, number]; 
  zoom?: number;
  hospitals: Hospital[];
  onBoundsChange?: (bounds: L.LatLngBounds, visibleHospitals: Hospital[]) => void;
}) => {
  const map = useMap();
  const prevCenterRef = useRef<[number, number]>(center);
  const prevZoomRef = useRef<number | undefined>(zoom);

  // Handle center/zoom changes
  useEffect(() => {
    const minZoom = map.getMinZoom?.() ?? 0;
    const targetZoom = Math.max(zoom ?? map.getZoom(), minZoom);
    
    const centerChanged = 
      prevCenterRef.current[0] !== center[0] || 
      prevCenterRef.current[1] !== center[1];
    const zoomChanged = prevZoomRef.current !== zoom;

    if (centerChanged && zoomChanged) {
      // Both changed - use flyTo
      map.flyTo(center, targetZoom, { duration: 1 });
    } else if (centerChanged) {
      // Only center changed
      map.flyTo(center, targetZoom, { duration: 1 });
    } else if (zoomChanged) {
      // Only zoom changed - use setZoom for immediate response
      map.setZoom(targetZoom);
    }

    prevCenterRef.current = center;
    prevZoomRef.current = zoom;
  }, [center, zoom, map]);

  // Track bounds changes
  useMapEvents({
    moveend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        const visible = hospitals.filter((h) => 
          bounds.contains([h.lat, h.lng])
        );
        onBoundsChange(bounds, visible);
      }
    },
    zoomend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        const visible = hospitals.filter((h) => 
          bounds.contains([h.lat, h.lng])
        );
        onBoundsChange(bounds, visible);
      }
    },
  });

  // Initial bounds calculation
  useEffect(() => {
    if (onBoundsChange) {
      const bounds = map.getBounds();
      const visible = hospitals.filter((h) => 
        bounds.contains([h.lat, h.lng])
      );
      onBoundsChange(bounds, visible);
    }
  }, [hospitals, map, onBoundsChange]);

  return null;
};

// User location marker with pulse animation
const UserLocationMarker = ({ position }: { position: [number, number] }) => {
  return (
    <>
      {/* Animated pulse ring */}
      <Circle
        center={position}
        radius={100}
        pathOptions={{
          color: "#3B82F6",
          fillColor: "#3B82F6",
          fillOpacity: 0.1,
          weight: 1,
          className: "user-location-pulse",
        }}
      />
      {/* Static outer glow */}
      <CircleMarker
        center={position}
        radius={16}
        pathOptions={{
          color: "#3B82F6",
          fillColor: "#3B82F6",
          fillOpacity: 0.2,
          weight: 0,
        }}
      />
      {/* Inner solid dot */}
      <CircleMarker
        center={position}
        radius={8}
        pathOptions={{
          color: "#FFFFFF",
          fillColor: "#3B82F6",
          fillOpacity: 1,
          weight: 3,
        }}
      >
        <Popup>
          <div className="text-sm font-medium">현재 위치</div>
        </Popup>
      </CircleMarker>
    </>
  );
};

// Radius visualization circle
const RadiusCircle = ({ center, radius }: { center: [number, number]; radius: number }) => {
  return (
    <Circle
      center={center}
      radius={radius * 1000} // Convert km to meters
      pathOptions={{
        color: "#3B82F6",
        fillColor: "#3B82F6",
        fillOpacity: 0.05,
        weight: 2,
        dashArray: "8, 8",
      }}
    />
  );
};

type KoreaBoundsLiteral = [L.LatLngTuple, L.LatLngTuple];

// South Korea bounds (includes Dokdo at ~131.87° E)
const KOREA_BOUNDS: KoreaBoundsLiteral = [
  [33.0, 124.0], // Southwest corner
  [38.8, 132.0], // Northeast corner (extended for Dokdo)
];

const computeMinZoomToContainViewportInBounds = (map: L.Map, bounds: L.LatLngBounds) => {
  const size = map.getSize();
  const center = bounds.getCenter();
  const maxZoom = map.getMaxZoom?.() ?? 18;

  for (let z = 0; z <= maxZoom; z += 1) {
    const centerPoint = map.project(center, z);
    const half = size.divideBy(2);
    const swPoint = centerPoint.subtract(half);
    const nePoint = centerPoint.add(half);
    const sw = map.unproject(swPoint, z);
    const ne = map.unproject(nePoint, z);
    const viewportBounds = L.latLngBounds(sw, ne);

    if (bounds.contains(viewportBounds)) return z;
  }

  return maxZoom;
};

// Enforce Korea bounds
const KoreaBoundsEnforcer = ({ bounds }: { bounds: KoreaBoundsLiteral }) => {
  const map = useMap();

  useEffect(() => {
    const koreaBounds = L.latLngBounds(bounds);

    const applyConstraints = () => {
      const minZoom = computeMinZoomToContainViewportInBounds(map, koreaBounds);
      map.setMaxBounds(koreaBounds);
      map.setMinZoom(minZoom);

      if (map.getZoom() < minZoom) {
        map.setZoom(minZoom, { animate: false });
      }

      map.panInsideBounds(koreaBounds, { animate: false });
    };

    const onZoomOrMoveEnd = () => {
      const minZoom = map.getMinZoom?.() ?? 0;
      if (map.getZoom() < minZoom) {
        map.setZoom(minZoom, { animate: false });
        return;
      }
      map.panInsideBounds(koreaBounds, { animate: false });
    };

    applyConstraints();

    map.on("zoomend", onZoomOrMoveEnd);
    map.on("moveend", onZoomOrMoveEnd);
    map.on("resize", applyConstraints);

    return () => {
      map.off("zoomend", onZoomOrMoveEnd);
      map.off("moveend", onZoomOrMoveEnd);
      map.off("resize", applyConstraints);
    };
  }, [map, bounds]);

  return null;
};

const ClusteredMapView = ({
  hospitals,
  onHospitalClick,
  userLocation,
  center,
  zoom,
  activeFilter,
  activeRadius,
  liveReports = [],
  nearbyDrivers = [],
  onCallDriver,
  holidayPharmacies = [],
  activeAmbulanceTrips = [],
  onBoundsChange,
}: ClusteredMapViewProps) => {
  // react-leaflet's Marker update logic compares position by reference.
  // If we pass a new `[lat, lng]` array on every render, it calls `setLatLng()` each time,
  // which triggers marker move events that can crash leaflet.markercluster (removeObject undefined).
  // Cache tuples by hospital id so the reference stays stable unless the coordinates actually change.
  const hospitalPositionCacheRef = useRef(
    new Map<number, { lat: number; lng: number; pos: [number, number] }>(),
  );

  const getStableHospitalPosition = useCallback((id: number, lat: number, lng: number) => {
    const cached = hospitalPositionCacheRef.current.get(id);
    if (cached && cached.lat === lat && cached.lng === lng) return cached.pos;
    const pos: [number, number] = [lat, lng];
    hospitalPositionCacheRef.current.set(id, { lat, lng, pos });
    return pos;
  }, []);

  // Calculate opacity based on distance from user
  const getMarkerOpacity = useCallback((hospital: Hospital): number => {
    if (!userLocation || activeRadius === "all") return 1;
    
    const distance = calculateDistance(
      userLocation[0], userLocation[1],
      hospital.lat, hospital.lng
    );
    
    if (distance <= activeRadius) return 1;
    
    // Fade out markers beyond radius
    const fadeDistance = activeRadius * 0.5;
    if (distance <= activeRadius + fadeDistance) {
      return 0.3 + 0.7 * ((activeRadius + fadeDistance - distance) / fadeDistance);
    }
    
    return 0.2;
  }, [userLocation, activeRadius]);

  // Sort hospitals by status for z-index priority (available first)
  const sortedHospitals = useMemo(() => {
    return [...hospitals].sort((a, b) => {
      const statusA = getHospitalStatus(a);
      const statusB = getHospitalStatus(b);
      
      // Available (green) should have highest z-index (rendered last)
      if (statusA === "available" && statusB !== "available") return 1;
      if (statusB === "available" && statusA !== "available") return -1;
      if (statusA === "limited" && statusB === "unavailable") return 1;
      if (statusB === "limited" && statusA === "unavailable") return -1;
      
      return 0;
    });
  }, [hospitals]);

  // Generate a stable hash for cluster key to force complete remount on data changes
  // This prevents the "removeObject" error by ensuring clean cluster state
  const clusterKey = useMemo(() => {
    if (hospitals.length === 0) return `cluster-empty-${activeFilter}`;
    
    const firstId = hospitals[0]?.id || 0;
    const lastId = hospitals[hospitals.length - 1]?.id || 0;
    const idSum = hospitals.reduce((acc, h) => acc + h.id, 0);
    
    return `cluster-${hospitals.length}-${firstId}-${lastId}-${idSum}-${activeFilter}`;
  }, [hospitals, activeFilter]);

  // Create hospital lookup by coordinates for cluster matching
  const hospitalByCoords = useMemo(() => {
    const map = new Map<string, Hospital>();
    hospitals.forEach((h) => {
      const key = `${h.lat.toFixed(6)},${h.lng.toFixed(6)}`;
      map.set(key, h);
    });
    return map;
  }, [hospitals]);

  // State for cluster popup
  const [clusterPopup, setClusterPopup] = useState<{
    hospitals: Hospital[];
    position: { x: number; y: number };
  } | null>(null);

  // State for hospital hover tooltip
  const [hoverTooltip, setHoverTooltip] = useState<{
    hospital: Hospital;
    position: { x: number; y: number };
  } | null>(null);

  // Get hospitals from cluster markers
  const getHospitalsFromCluster = useCallback((cluster: any): Hospital[] => {
    const markers = cluster.getAllChildMarkers();
    const clusterHospitals: Hospital[] = [];
    markers.forEach((m: any) => {
      const latlng = m.getLatLng();
      const key = `${latlng.lat.toFixed(6)},${latlng.lng.toFixed(6)}`;
      const hospital = hospitalByCoords.get(key);
      if (hospital) {
        clusterHospitals.push(hospital);
      }
    });
    return clusterHospitals;
  }, [hospitalByCoords]);

  // Create custom cluster icon
  const createClusterCustomIcon = useCallback((cluster: any) => {
    const clusterHospitals = getHospitalsFromCluster(cluster);
    const stats = calculateClusterStats(clusterHospitals);
    return createDonutClusterIcon(stats, clusterHospitals.length);
  }, [getHospitalsFromCluster]);

  // Handle cluster click
  const handleClusterClick = useCallback((cluster: any, event: L.LeafletMouseEvent) => {
    const clusterHospitals = getHospitalsFromCluster(cluster);
    if (clusterHospitals.length > 0) {
      setClusterPopup({
        hospitals: clusterHospitals,
        position: {
          x: event.originalEvent.clientX,
          y: event.originalEvent.clientY,
        },
      });
    }
  }, [getHospitalsFromCluster]);

  return (
    <div className="absolute inset-0" style={{ height: "100%", width: "100%" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
        maxBounds={KOREA_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={0}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <KoreaBoundsEnforcer bounds={KOREA_BOUNDS} />
        <MapController 
          center={center} 
          zoom={zoom} 
          hospitals={hospitals}
          onBoundsChange={onBoundsChange}
        />

        {/* User location marker */}
        {userLocation && <UserLocationMarker position={userLocation} />}
        
        {/* Radius visualization */}
        {userLocation && activeRadius !== "all" && (
          <RadiusCircle center={userLocation} radius={activeRadius} />
        )}

        {/* Clustered Hospital markers with donut charts */}
        <MarkerClusterGroup
          key={clusterKey}
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={false}
          disableClusteringAtZoom={14}
          removeOutsideVisibleBounds={false}
          animate={false}
          eventHandlers={{
            clusterclick: (e: any) => {
              handleClusterClick(e.layer, e);
            },
          }}
        >
          {sortedHospitals.map((hospital) => {
            const opacity = getMarkerOpacity(hospital);
            const displayBeds = getDisplayBeds(hospital, activeFilter);
            const status = getMarkerStatus(displayBeds);
            const normalizedBeds = {
              general: Math.max(0, hospital.beds.general),
              pediatric: Math.max(0, hospital.beds.pediatric),
              fever: Math.max(0, hospital.beds.fever),
            };
            const hasPediatric = normalizedBeds.pediatric > 0;
            const isPediatricFilter = activeFilter === "pediatric";
            const icon = createHospitalIcon(
              status,
              displayBeds,
              hasPediatric,
              hospital.isTraumaCenter,
              isPediatricFilter,
              hospital.emergencyGrade
            );

            const gradeKoreanName = getGradeKoreanName(hospital.emergencyGrade);

            return (
              <Marker
                key={`hospital-${hospital.id}`}
                position={getStableHospitalPosition(hospital.id, hospital.lat, hospital.lng)}
                icon={icon}
                opacity={opacity}
                eventHandlers={{
                  click: () => onHospitalClick(hospital),
                  mouseover: (e) => {
                    const { clientX, clientY } = e.originalEvent as MouseEvent;
                    setHoverTooltip({
                      hospital: { ...hospital, gradeKoreanName } as any,
                      position: { x: clientX, y: clientY },
                    });
                  },
                  mouseout: () => {
                    setHoverTooltip(null);
                  },
                }}
              />
            );
          })}
        </MarkerClusterGroup>

        {/* Live Report Markers */}
        {liveReports.map((report) => (
          <ReportMarker key={report.id} report={report} />
        ))}

        {/* Driver Markers */}
        {nearbyDrivers.map((driver) => (
          <DriverMarker
            key={`driver-${driver.id}`}
            driver={driver}
            onCallDriver={onCallDriver}
          />
        ))}

        {/* Holiday Pharmacy Markers */}
        {holidayPharmacies.map((pharmacy) => (
          <PharmacyMarker key={`pharmacy-${pharmacy.id}`} pharmacy={pharmacy} />
        ))}

        {/* Active Ambulance Trip Markers */}
        {activeAmbulanceTrips.map((trip) => (
          <AmbulanceTripMarker key={`trip-${trip.id}`} trip={trip} />
        ))}
      </MapContainer>

      {/* Hospital Hover Tooltip */}
      {hoverTooltip && (
        <div
          className="fixed z-[1000] pointer-events-none"
          style={{
            left: hoverTooltip.position.x,
            top: hoverTooltip.position.y - 70,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-sm text-gray-800">
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-semibold">{hoverTooltip.hospital.nameKr}</span>
              {(hoverTooltip.hospital as any).gradeKoreanName && (
                <span className="text-xs text-blue-600 font-medium">
                  {(hoverTooltip.hospital as any).gradeKoreanName}
                </span>
              )}
            </div>
          </div>
          <div 
            className="w-0 h-0 mx-auto"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid white',
            }}
          />
        </div>
      )}

      {/* Cluster Popup */}
      <AnimatePresence>
        {clusterPopup && (
          <ClusterPopup
            hospitals={clusterPopup.hospitals}
            userLocation={userLocation}
            onHospitalClick={onHospitalClick}
            onClose={() => setClusterPopup(null)}
            position={clusterPopup.position}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClusteredMapView;
