import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, CircleMarker, Popup } from "react-leaflet";
import { Hospital } from "@/data/hospitals";
import HospitalMarker from "./HospitalMarker";

interface MapViewProps {
  hospitals: Hospital[];
  onHospitalClick: (hospital: Hospital) => void;
  userLocation: [number, number] | null;
  center: [number, number];
}

// Component to handle map center changes
const MapCenterHandler = ({ center }: { center: [number, number] }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 1 });
  }, [center, map]);

  return null;
};

// User location marker component
const UserLocationMarker = ({ position }: { position: [number, number] }) => {
  return (
    <>
      {/* Outer pulse ring */}
      <CircleMarker
        center={position}
        radius={20}
        pathOptions={{
          color: "#3B82F6",
          fillColor: "#3B82F6",
          fillOpacity: 0.15,
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

const MapView = ({ hospitals, onHospitalClick, userLocation, center }: MapViewProps) => {
  return (
    <div className="absolute inset-0" style={{ height: '100vh', width: '100vw' }}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenterHandler center={center} />
        
        {/* User location marker */}
        {userLocation && <UserLocationMarker position={userLocation} />}
        
        {/* Hospital markers */}
        {hospitals.map((hospital) => (
          <HospitalMarker
            key={hospital.id}
            hospital={hospital}
            onClick={onHospitalClick}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
