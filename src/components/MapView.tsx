import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, useMap, Circle, CircleMarker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { Hospital, FilterType, getHospitalStatus } from "@/data/hospitals";
import HospitalMarker from "./HospitalMarker";
import ReportMarker from "./ReportMarker";
import DriverMarker from "./DriverMarker";
import NursingHospitalMarker from "./NursingHospitalMarker";
import type { LiveReport } from "./LiveReportFAB";
import type { DriverPresence } from "@/hooks/useDriverPresence";
import type { NursingHospital } from "@/hooks/useNursingHospitals";

interface MapViewProps {
  hospitals: Hospital[];
  onHospitalClick: (hospital: Hospital) => void;
  userLocation: [number, number] | null;
  center: [number, number];
  zoom: number;
  activeFilter: FilterType;
  liveReports?: LiveReport[];
  nearbyDrivers?: DriverPresence[];
  onCallDriver?: (driver: DriverPresence) => void;
  nursingHospitals?: NursingHospital[];
}

// Component to handle map center changes
const MapCenterHandler = ({ center, zoom }: { center: [number, number]; zoom?: number }) => {
  const map = useMap();

  useEffect(() => {
    const minZoom = map.getMinZoom?.() ?? 0;
    const targetZoom = Math.max(zoom ?? map.getZoom(), minZoom);
    map.flyTo(center, targetZoom, { duration: 1 });
  }, [center, zoom, map]);

  return null;
};

// Hook to get map instance for zooming
const ZoomToHospital = ({ hospital, onZoomComplete }: { hospital: Hospital | null; onZoomComplete: () => void }) => {
  const map = useMap();

  useEffect(() => {
    if (hospital) {
      map.flyTo([hospital.lat, hospital.lng], 16, { duration: 1.2 });
      onZoomComplete();
    }
  }, [hospital, map, onZoomComplete]);

  return null;
};

// User location marker with pulse animation
const UserLocationMarker = ({ position }: { position: [number, number] }) => {
  return (
    <>
      {/* Animated pulse ring - uses CSS animation */}
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

type KoreaBoundsLiteral = [L.LatLngTuple, L.LatLngTuple];

// South Korea bounds
const KOREA_BOUNDS: KoreaBoundsLiteral = [
  // Roughly South Korea (+ Jeju, Ulleung); intentionally avoids far-neighbor regions
  [33.0, 124.0], // Southwest corner
  [38.8, 131.0], // Northeast corner
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

// Enforce that the visible map never extends beyond Korea bounds
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

      // Keep viewport inside bounds after any interaction
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

const MapView = ({ 
  hospitals, 
  onHospitalClick, 
  userLocation, 
  center, 
  zoom, 
  activeFilter, 
  liveReports = [],
  nearbyDrivers = [],
  onCallDriver,
  nursingHospitals = []
}: MapViewProps) => {
  // Create a stable key for the cluster group based on hospital IDs
  // This prevents the cluster from trying to remove markers that don't exist
  const clusterKey = useMemo(() => {
    return hospitals.map(h => h.id).sort().join('-').slice(0, 100) || 'empty';
  }, [hospitals]);

  return (
    <div className="absolute inset-0" style={{ height: '100vh', width: '100vw' }}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        maxBounds={KOREA_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={0}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <KoreaBoundsEnforcer bounds={KOREA_BOUNDS} />
        <MapCenterHandler center={center} zoom={zoom} />
        
        {/* User location marker */}
        {userLocation && <UserLocationMarker position={userLocation} />}
        
        {/* Hospital markers with clustering */}
        {hospitals.length > 0 && (
          <MarkerClusterGroup
            key={clusterKey}
            chunkedLoading
            maxClusterRadius={60}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            removeOutsideVisibleBounds={false}
            iconCreateFunction={(cluster) => {
              const count = cluster.getChildCount();
              
              // Get markers in this cluster and count available hospitals
              const childMarkers = cluster.getAllChildMarkers();
              let availableCount = 0;
              
              childMarkers.forEach((marker: any) => {
                const latLng = marker.getLatLng();
                // Find matching hospital by coordinates
                const hospital = hospitals.find(
                  (h) => Math.abs(h.lat - latLng.lat) < 0.0001 && Math.abs(h.lng - latLng.lng) < 0.0001
                );
                if (hospital && getHospitalStatus(hospital) === "available") {
                  availableCount++;
                }
              });
              
              let size = "small";
              // Color based on availability ratio
              let bgColor = availableCount > 0 ? "#10B981" : "#6B7280"; // green if available, gray if none
              
              if (count >= 20) {
                size = "large";
              } else if (count >= 10) {
                size = "medium";
              }
              
              const sizeMap = {
                small: { width: 44, height: 44, fontSize: 11 },
                medium: { width: 52, height: 52, fontSize: 12 },
                large: { width: 60, height: 60, fontSize: 13 },
              };
              
              const s = sizeMap[size as keyof typeof sizeMap];
              
              return L.divIcon({
                html: `<div style="
                  background: ${bgColor};
                  width: ${s.width}px;
                  height: ${s.height}px;
                  border-radius: 50%;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: 700;
                  border: 3px solid white;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                  line-height: 1.1;
                ">
                  <span style="font-size: ${s.fontSize + 3}px;">${count}</span>
                  <span style="font-size: ${s.fontSize - 2}px; opacity: 0.9;">🏥${availableCount}</span>
                </div>`,
                className: "custom-cluster-icon",
                iconSize: L.point(s.width, s.height, true),
              });
            }}
          >
            {hospitals.map((hospital) => (
              <HospitalMarker
                key={`hospital-${hospital.id}`}
                hospital={hospital}
                onClick={onHospitalClick}
                activeFilter={activeFilter}
              />
            ))}
          </MarkerClusterGroup>
        )}

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

        {/* Nursing Hospital Markers */}
        {nursingHospitals.map((hospital) => (
          <NursingHospitalMarker
            key={`nursing-${hospital.id}`}
            hospital={hospital}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
