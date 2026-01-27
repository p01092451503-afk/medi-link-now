import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { MapContainer, TileLayer, useMap, Circle, CircleMarker, Popup, useMapEvents, Marker } from "react-leaflet";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { AnimatePresence } from "framer-motion";
import { Hospital, FilterType, getHospitalStatus, calculateDistance } from "@/data/hospitals";
import ReportMarker from "../ReportMarker";
import DriverMarker from "../DriverMarker";
import PharmacyMarker from "../PharmacyMarker";
import ClusterPopup from "./ClusterPopup";
import type { LiveReport } from "../LiveReportFAB";
import type { DriverPresence } from "@/hooks/useDriverPresence";
import type { HolidayPharmacy } from "@/hooks/useHolidayPharmacies";
import { createDonutClusterIcon, calculateClusterStats } from "./DonutClusterIcon";
import { createHospitalIcon, getDisplayBeds, getMarkerStatus } from "./hospitalIconUtils";

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

  // Handle center/zoom changes
  useEffect(() => {
    const minZoom = map.getMinZoom?.() ?? 0;
    const targetZoom = Math.max(zoom ?? map.getZoom(), minZoom);
    map.flyTo(center, targetZoom, { duration: 1 });
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

// South Korea bounds
const KOREA_BOUNDS: KoreaBoundsLiteral = [
  [33.0, 124.0],
  [38.8, 131.0],
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
  onBoundsChange,
}: ClusteredMapViewProps) => {
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

  // Generate a stable hash for cluster key to force remount on any data change
  const clusterKey = useMemo(() => {
    const ids = hospitals.map(h => h.id).sort().join(',');
    return `cluster-${ids.length > 0 ? ids.slice(0, 100) : 'empty'}-${activeFilter}`;
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

            return (
              <Marker
                key={`hospital-${hospital.id}`}
                position={[hospital.lat, hospital.lng]}
                icon={icon}
                opacity={opacity}
                eventHandlers={{
                  click: () => onHospitalClick(hospital),
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
      </MapContainer>

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
