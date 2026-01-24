import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Hospital, getHospitalStatus } from "@/data/hospitals";

interface HospitalMarkerProps {
  hospital: Hospital;
  onClick: (hospital: Hospital) => void;
}

const createMarkerIcon = (status: "available" | "limited" | "unavailable", beds: number) => {
  const colors = {
    available: { bg: "#10B981", border: "#059669", text: "#FFFFFF" },
    limited: { bg: "#F59E0B", border: "#D97706", text: "#FFFFFF" },
    unavailable: { bg: "#EF4444", border: "#DC2626", text: "#FFFFFF" },
  };

  const color = colors[status];

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
          min-width: 32px;
          height: 32px;
          padding: 0 8px;
          background: ${color.bg};
          border: 3px solid ${color.border};
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${color.text};
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s;
        ">
          ${beds}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid ${color.border};
          margin-top: -2px;
        "></div>
      </div>
    `,
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48],
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
        <div className="text-sm min-w-[150px]">
          <strong className="block text-base">{hospital.nameKr}</strong>
          <span className="text-xs text-gray-500 block mb-2">{hospital.category}</span>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className={`font-bold ${hospital.beds.general > 0 ? "text-green-600" : "text-red-500"}`}>
                {hospital.beds.general}
              </div>
              <div className="text-gray-400">성인</div>
            </div>
            <div>
              <div className={`font-bold ${hospital.beds.pediatric > 0 ? "text-green-600" : "text-red-500"}`}>
                {hospital.beds.pediatric}
              </div>
              <div className="text-gray-400">소아</div>
            </div>
            <div>
              <div className={`font-bold ${hospital.beds.isolation > 0 ? "text-green-600" : "text-red-500"}`}>
                {hospital.beds.isolation}
              </div>
              <div className="text-gray-400">격리</div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default HospitalMarker;
