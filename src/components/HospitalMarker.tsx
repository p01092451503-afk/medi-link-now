import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Hospital, getHospitalStatus, FilterType } from "@/data/hospitals";

interface HospitalMarkerProps {
  hospital: Hospital;
  onClick: (hospital: Hospital) => void;
  activeFilter: FilterType;
}

const getDisplayBeds = (hospital: Hospital, filter: FilterType): number => {
  switch (filter) {
    case "adult":
      return hospital.beds.general;
    case "pediatric":
      return hospital.beds.pediatric;
    case "fever":
      return hospital.beds.fever;
    default:
      return hospital.beds.general + hospital.beds.pediatric + hospital.beds.fever;
  }
};

const getFilterLabel = (filter: FilterType): string => {
  switch (filter) {
    case "adult":
      return "성인";
    case "pediatric":
      return "소아";
    case "fever":
      return "열/감염";
    default:
      return "전체";
  }
};

const getMarkerStatus = (beds: number): "available" | "limited" | "unavailable" => {
  if (beds === 0) return "unavailable";
  if (beds <= 2) return "limited";
  return "available";
};

const createMarkerIcon = (
  status: "available" | "limited" | "unavailable",
  beds: number,
  hasPediatric: boolean,
  isTraumaCenter?: boolean
) => {
  const colors = {
    available: { bg: "#10B981", border: "#059669", text: "#FFFFFF" },
    limited: { bg: "#F59E0B", border: "#D97706", text: "#FFFFFF" },
    unavailable: { bg: "#EF4444", border: "#DC2626", text: "#FFFFFF" },
  };

  const color = colors[status];
  const childBadge = hasPediatric ? `<span style="position: absolute; top: -10px; right: -10px; font-size: 18px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">👶</span>` : "";
  const traumaBadge = isTraumaCenter
    ? `<span style="position: absolute; top: -8px; left: -8px; font-size: 10px; background: #7C3AED; color: white; padding: 1px 4px; border-radius: 4px; font-weight: bold;">외상</span>`
    : "";

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
          position: relative;
          min-width: 36px;
          height: 36px;
          padding: 0 10px;
          background: ${color.bg};
          border: 3px solid ${color.border};
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${color.text};
          font-weight: 700;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s;
        ">
          ${beds}
          ${childBadge}
          ${traumaBadge}
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
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
  });
};

const HospitalMarker = ({ hospital, onClick, activeFilter }: HospitalMarkerProps) => {
  const displayBeds = getDisplayBeds(hospital, activeFilter);
  const status = getMarkerStatus(displayBeds);
  const hasPediatric = hospital.beds.pediatric > 0;
  const icon = createMarkerIcon(status, displayBeds, hasPediatric, hospital.isTraumaCenter);

  return (
    <Marker
      position={[hospital.lat, hospital.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(hospital),
      }}
    >
      <Popup>
        <div className="text-sm min-w-[180px]">
          <div className="flex items-center gap-1 mb-1">
            <strong className="text-base">{hospital.nameKr}</strong>
            {hasPediatric && <span title="아이 진료 가능">👶</span>}
          </div>
          <span className="text-xs text-gray-500 block mb-2">{hospital.category}</span>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className={`p-1.5 rounded ${activeFilter === "adult" || activeFilter === "all" || activeFilter === "ct" ? "bg-blue-50" : ""}`}>
              <div className={`font-bold ${hospital.beds.general > 0 ? "text-green-600" : "text-red-500"}`}>
                {hospital.beds.general}
              </div>
              <div className="text-gray-400">성인</div>
            </div>
            <div className={`p-1.5 rounded ${activeFilter === "pediatric" ? "bg-blue-50" : ""}`}>
              <div className={`font-bold ${hospital.beds.pediatric > 0 ? "text-green-600" : "text-red-500"}`}>
                {hospital.beds.pediatric}
              </div>
              <div className="text-gray-400">소아</div>
            </div>
            <div className={`p-1.5 rounded ${activeFilter === "fever" ? "bg-blue-50" : ""}`}>
              <div className={`font-bold ${hospital.beds.fever > 0 ? "text-green-600" : "text-red-500"}`}>
                {hospital.beds.fever}
              </div>
              <div className="text-gray-400">열/감염</div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default HospitalMarker;
