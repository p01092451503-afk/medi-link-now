import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { MapContainer, TileLayer, useMap, Circle, CircleMarker, Popup, useMapEvents, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { AnimatePresence } from "framer-motion";
import { Hospital, FilterType, getHospitalStatus, calculateDistance } from "@/data/hospitals";
import { cleanHospitalName } from "@/lib/utils";
import ReportMarker from "../ReportMarker";
import DriverMarker from "../DriverMarker";
import PharmacyMarker from "../PharmacyMarker";
import OpenPharmacyMarker from "./OpenPharmacyMarker";
import AmbulanceTripMarker from "./AmbulanceTripMarker";
import ClusterPopup from "./ClusterPopup";
import type { LiveReport } from "../LiveReportFAB";
import type { DriverPresence } from "@/hooks/useDriverPresence";
import type { HolidayPharmacy } from "@/hooks/useHolidayPharmacies";
import type { NearbyPharmacy } from "@/hooks/useNearbyPharmacies";
import type { AmbulanceTrip } from "@/hooks/useAmbulanceTrips";
import { createDonutClusterIcon, calculateClusterStats } from "./DonutClusterIcon";
import { createHospitalIcon, getDisplayBeds, getMarkerStatus, getGradeKoreanName, type RejectionAlertInfo } from "./hospitalIconUtils";
import { useIncomingAmbulances } from "@/hooks/useIncomingAmbulances";
import { usePrivateTraffic } from "@/contexts/PrivateTrafficContext";
import NursingHospitalMarker from "../NursingHospitalMarker";
import type { NursingHospital } from "@/hooks/useNursingHospitals";
import { useResolvedTheme } from "@/hooks/useResolvedTheme";

// Dark & light tile URLs
const TILE_LIGHT = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTR_LIGHT = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const ATTR_DARK = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

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
  nearbyPharmacies?: NearbyPharmacy[];
  onPharmacyClick?: (pharmacy: NearbyPharmacy) => void;
  activeAmbulanceTrips?: AmbulanceTrip[];
  onBoundsChange?: (bounds: L.LatLngBounds, visibleHospitals: Hospital[]) => void;
  isMoonlightMode?: boolean;
  rejectionAlerts?: Map<number, RejectionAlertInfo>;
  isDriverMode?: boolean;
  nursingHospitals?: NursingHospital[];
  onNursingHospitalClick?: (hospital: NursingHospital) => void;
  onZoomChange?: (zoom: number) => void;
}

// Component to handle map center changes and bounds
const MapController = ({ 
  center, 
  zoom, 
  hospitals,
  onBoundsChange,
  onClearTooltip,
  onZoomChange,
}: { 
  center: [number, number]; 
  zoom?: number;
  hospitals: Hospital[];
  onBoundsChange?: (bounds: L.LatLngBounds, visibleHospitals: Hospital[]) => void;
  onClearTooltip?: () => void;
  onZoomChange?: (zoom: number) => void;
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

  // Track bounds changes and clear tooltip on map interaction
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
      const currentZoom = map.getZoom();
      onZoomChange?.(currentZoom);
      if (onBoundsChange) {
        const bounds = map.getBounds();
        const visible = hospitals.filter((h) => 
          bounds.contains([h.lat, h.lng])
        );
        onBoundsChange(bounds, visible);
      }
    },
    // Clear tooltip when clicking on map (not on markers)
    click: () => {
      onClearTooltip?.();
    },
    // Clear tooltip when dragging map
    dragstart: () => {
      onClearTooltip?.();
    },
    // Clear tooltip when zooming
    zoomstart: () => {
      onClearTooltip?.();
    },
  });

  // Initial bounds calculation - use stable identifier to prevent infinite loops
  const hospitalIdsKey = useMemo(() => 
    hospitals.map(h => h.id).join(','), 
    [hospitals]
  );
  
  useEffect(() => {
    if (onBoundsChange) {
      const bounds = map.getBounds();
      const visible = hospitals.filter((h) => 
        bounds.contains([h.lat, h.lng])
      );
      onBoundsChange(bounds, visible);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalIdsKey, map]);

  return null;
};

// User location marker with pulse animation (standard blue dot)
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

// Driver mode location marker (ambulance icon)
const createDriverLocationIcon = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <div style="
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 10H6"/>
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"/>
            <path d="M8 8v4"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid #B91C1C;
          margin-top: -2px;
        "></div>
      </div>
    `,
    iconSize: [44, 54],
    iconAnchor: [22, 54],
    popupAnchor: [0, -54],
  });
};

const DriverLocationMarker = ({ position }: { position: [number, number] }) => {
  return (
    <Marker position={position} icon={createDriverLocationIcon()}>
      <Popup>
        <div className="text-sm font-medium text-center">
          <p className="font-bold text-red-600">🚑 내 위치</p>
          <p className="text-xs text-gray-500">현재 대기 위치</p>
        </div>
      </Popup>
    </Marker>
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

// Minimum zoom level to ensure Korea stays in view (never show beyond Korea)
const KOREA_MIN_ZOOM = 5;

const computeMinZoomToContainViewportInBounds = (map: L.Map, bounds: L.LatLngBounds) => {
  const size = map.getSize();
  const center = bounds.getCenter();
  const maxZoom = map.getMaxZoom?.() ?? 18;

  for (let z = KOREA_MIN_ZOOM; z <= maxZoom; z += 1) {
    const centerPoint = map.project(center, z);
    const half = size.divideBy(2);
    const swPoint = centerPoint.subtract(half);
    const nePoint = centerPoint.add(half);
    const sw = map.unproject(swPoint, z);
    const ne = map.unproject(nePoint, z);
    const viewportBounds = L.latLngBounds(sw, ne);

    if (bounds.contains(viewportBounds)) return Math.max(z, KOREA_MIN_ZOOM);
  }

  return Math.max(maxZoom, KOREA_MIN_ZOOM);
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
  nearbyPharmacies = [],
  onPharmacyClick,
  activeAmbulanceTrips = [],
  onBoundsChange,
  isMoonlightMode = false,
  rejectionAlerts,
  isDriverMode = false,
  nursingHospitals = [],
  onNursingHospitalClick,
  onZoomChange,
}: ClusteredMapViewProps) => {
  const resolvedTheme = useResolvedTheme();
  const isDark = resolvedTheme === "dark";

  // 이송 중 구급차 데이터 가져오기 (실시간 구독 포함)
  const { getIncomingCount, getAdjustedBeds } = useIncomingAmbulances();
  // 민간 구급차 트래픽 데이터
  const { getTrafficCount, isHighTraffic } = usePrivateTraffic();

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
    <div 
      className="absolute inset-0" 
      style={{ height: "100%", width: "100%" }}
      onMouseLeave={() => setHoverTooltip(null)}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
        maxBounds={KOREA_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={KOREA_MIN_ZOOM}
      >
        <TileLayer
          attribution={isDark ? ATTR_DARK : ATTR_LIGHT}
          url={isDark ? TILE_DARK : TILE_LIGHT}
        />
        <KoreaBoundsEnforcer bounds={KOREA_BOUNDS} />
        <MapController 
          center={center} 
          zoom={zoom} 
          hospitals={hospitals}
          onBoundsChange={onBoundsChange}
          onClearTooltip={() => { setHoverTooltip(null); }}
          onZoomChange={onZoomChange}
        />

        {/* User location marker - blue dot for regular users, truck for drivers */}
        {userLocation && (
          isDriverMode 
            ? <DriverLocationMarker position={userLocation} />
            : <UserLocationMarker position={userLocation} />
        )}
        
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
            // 이송 중 차량 수를 반영한 실질 가용 병상 계산
            const incomingCount = getIncomingCount(hospital.id);
            const publicBeds = getDisplayBeds(hospital, activeFilter);
            const displayBeds = Math.max(0, publicBeds - incomingCount);
            const status = getMarkerStatus(displayBeds);
            const normalizedBeds = {
              general: Math.max(0, hospital.beds.general),
              pediatric: Math.max(0, hospital.beds.pediatric),
              fever: Math.max(0, hospital.beds.fever),
            };
            const hasPediatric = normalizedBeds.pediatric > 0;
            const isPediatricFilter = activeFilter === "pediatric" || activeFilter === "moonlight";
            // Get rejection alert for this hospital
            const rejectionAlert = rejectionAlerts?.get(hospital.id);
            // Get private traffic data
            const privateTrafficCount = getTrafficCount(hospital.id);
            const highTraffic = isHighTraffic(hospital.id);
            
            const icon = createHospitalIcon(
              status,
              displayBeds,
              hasPediatric,
              hospital.isTraumaCenter,
              isPediatricFilter,
              hospital.emergencyGrade,
              isMoonlightMode,
              rejectionAlert,
              incomingCount,
              highTraffic,
              privateTrafficCount
            );

            const gradeKoreanName = getGradeKoreanName(hospital.emergencyGrade);

            return (
              <Marker
                key={`hospital-${hospital.id}`}
                position={getStableHospitalPosition(hospital.id, hospital.lat, hospital.lng)}
                icon={icon}
                opacity={opacity}
                eventHandlers={{
                  click: () => {
                    setHoverTooltip(null);
                    setHoveredTarget(null);
                    onHospitalClick(hospital);
                  },
                  mouseover: (e) => {
                    const { clientX, clientY } = e.originalEvent as MouseEvent;
                    setHoverTooltip({
                      hospital: { ...hospital, gradeKoreanName } as any,
                      position: { x: clientX, y: clientY },
                    });
                    setHoveredTarget([hospital.lat, hospital.lng]);
                  },
                  mouseout: () => {
                    setHoverTooltip(null);
                    setHoveredTarget(null);
                  },
                  mousemove: (e) => {
                    const { clientX, clientY } = e.originalEvent as MouseEvent;
                    setHoverTooltip((prev) => prev ? {
                      ...prev,
                      position: { x: clientX, y: clientY },
                    } : null);
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

        {/* Nearby Open Pharmacy Markers */}
        {nearbyPharmacies.map((pharmacy) => (
          <OpenPharmacyMarker 
            key={`open-pharmacy-${pharmacy.id}`} 
            pharmacy={pharmacy}
            onClick={onPharmacyClick || (() => {})}
          />
        ))}

        {/* Nursing Hospital Markers (for transfer mode) */}
        {nursingHospitals.map((hospital) => (
          <NursingHospitalMarker
            key={`nursing-${hospital.id}`}
            hospital={hospital}
            onClick={onNursingHospitalClick}
            onMouseEnter={(lat, lng) => setHoveredTarget([lat, lng])}
            onMouseLeave={() => setHoveredTarget(null)}
          />
        ))}

        {/* Active Ambulance Trip Markers - Hidden for now */}
        {/* {activeAmbulanceTrips.map((trip) => (
          <AmbulanceTripMarker key={`trip-${trip.id}`} trip={trip} />
        ))} */}

        {/* Distance measurement line on hover */}
        {userLocation && hoveredTarget && (
          <DistanceLine from={userLocation} to={hoveredTarget} />
        )}
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
          <div className={`${isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'} border shadow-lg rounded-lg px-3 py-2 text-sm`}>
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-semibold">{cleanHospitalName(hoverTooltip.hospital.nameKr)}</span>
              {(hoverTooltip.hospital as any).gradeKoreanName && (
                <span className={`text-xs font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
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
              borderTop: isDark ? '6px solid #1f2937' : '6px solid white',
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
