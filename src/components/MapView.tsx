import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, Circle, CircleMarker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { Hospital, FilterType } from "@/data/hospitals";
import HospitalMarker from "./HospitalMarker";

interface MapViewProps {
  hospitals: Hospital[];
  onHospitalClick: (hospital: Hospital) => void;
  userLocation: [number, number] | null;
  center: [number, number];
  zoom: number;
  activeFilter: FilterType;
}

// Component to handle map center changes
const MapCenterHandler = ({ center, zoom }: { center: [number, number]; zoom?: number }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom ?? map.getZoom(), { duration: 1 });
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

// South Korea bounds
const KOREA_BOUNDS: L.LatLngBoundsExpression = [
  [32.5, 123.5], // Southwest corner
  [39.0, 132.5], // Northeast corner
];

const MapView = ({ hospitals, onHospitalClick, userLocation, center, zoom, activeFilter }: MapViewProps) => {
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
        minZoom={7}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenterHandler center={center} zoom={zoom} />
        
        {/* User location marker */}
        {userLocation && <UserLocationMarker position={userLocation} />}
        
        {/* Hospital markers with clustering */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            let size = "small";
            let bgColor = "hsl(220, 100%, 50%)"; // primary color
            
            if (count >= 20) {
              size = "large";
            } else if (count >= 10) {
              size = "medium";
            }
            
            const sizeMap = {
              small: { width: 36, height: 36, fontSize: 12 },
              medium: { width: 44, height: 44, fontSize: 14 },
              large: { width: 52, height: 52, fontSize: 16 },
            };
            
            const s = sizeMap[size as keyof typeof sizeMap];
            
            return L.divIcon({
              html: `<div style="
                background: ${bgColor};
                width: ${s.width}px;
                height: ${s.height}px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: ${s.fontSize}px;
                border: 3px solid white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              ">${count}</div>`,
              className: "custom-cluster-icon",
              iconSize: L.point(s.width, s.height, true),
            });
          }}
        >
          {hospitals.map((hospital) => (
            <HospitalMarker
              key={hospital.id}
              hospital={hospital}
              onClick={onHospitalClick}
              activeFilter={activeFilter}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default MapView;
