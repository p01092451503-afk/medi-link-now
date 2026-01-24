import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
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
