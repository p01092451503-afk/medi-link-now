import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Hospital, getHospitalStatus } from "@/data/hospitals";

interface HospitalMarkerProps {
  hospital: Hospital;
  onClick: (hospital: Hospital) => void;
}

const createMarkerIcon = (status: "available" | "limited" | "unavailable", beds: number) => {
  const color = status === "unavailable" ? "#EF4444" : status === "limited" ? "#F59E0B" : "#10B981";
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        cursor: pointer;
        transition: transform 0.2s;
      ">
        ${beds}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const HospitalMarker = ({ hospital, onClick }: HospitalMarkerProps) => {
  const status = getHospitalStatus(hospital);
  const totalBeds = hospital.beds.general + hospital.beds.pediatric + hospital.beds.isolation;
  const icon = createMarkerIcon(status, totalBeds);

  return (
    <Marker
      position={[hospital.lat, hospital.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(hospital),
      }}
    >
      <Popup>
        <div className="text-sm">
          <strong>{hospital.name}</strong>
          <br />
          <span className="text-muted-foreground">{hospital.category}</span>
        </div>
      </Popup>
    </Marker>
  );
};

export default HospitalMarker;
