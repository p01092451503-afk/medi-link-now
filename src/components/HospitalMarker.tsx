import { Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import { Hospital, getHospitalStatus, FilterType } from "@/data/hospitals";

interface HospitalMarkerProps {
  hospital: Hospital & { distance?: number };
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
  isTraumaCenter?: boolean,
  isPediatricFilter?: boolean
) => {
  const colors = {
    available: { bg: "#10B981", border: "#059669", text: "#FFFFFF" },
    limited: { bg: "#F59E0B", border: "#D97706", text: "#FFFFFF" },
    unavailable: { bg: "#EF4444", border: "#DC2626", text: "#FFFFFF" },
  };

  const color = colors[status];
  const pulseAnimation = isPediatricFilter ? "animation: pediatric-pulse 1.5s ease-in-out infinite;" : "";
  const childBadge = hasPediatric
    ? `<div style="
        position: absolute; 
        top: -12px; 
        right: -12px; 
        width: 26px; 
        height: 26px; 
        background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(251, 191, 36, 0.5);
        ${pulseAnimation}
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Baby face -->
          <circle cx="12" cy="12" r="10" fill="#FFE4C9"/>
          <!-- Hair tuft -->
          <path d="M12 2C12 2 14 4 14 6C14 6 13 5 12 5C11 5 10 6 10 6C10 4 12 2 12 2Z" fill="#8B5A2B"/>
          <!-- Left eye -->
          <circle cx="8.5" cy="11" r="1.5" fill="#1a1a1a"/>
          <circle cx="8" cy="10.5" r="0.5" fill="white"/>
          <!-- Right eye -->
          <circle cx="15.5" cy="11" r="1.5" fill="#1a1a1a"/>
          <circle cx="15" cy="10.5" r="0.5" fill="white"/>
          <!-- Cheeks -->
          <circle cx="6" cy="14" r="1.5" fill="#FECACA" opacity="0.7"/>
          <circle cx="18" cy="14" r="1.5" fill="#FECACA" opacity="0.7"/>
          <!-- Smile -->
          <path d="M9 15.5C9 15.5 10.5 17 12 17C13.5 17 15 15.5 15 15.5" stroke="#1a1a1a" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </div>`
    : "";
  const traumaBadge = isTraumaCenter
    ? `<div style="
        position: absolute; 
        top: -12px; 
        left: -12px; 
        width: 26px; 
        height: 26px; 
        background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%);
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(124, 58, 237, 0.5);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Cross/Plus symbol for trauma -->
          <rect x="10" y="4" width="4" height="16" rx="1" fill="white"/>
          <rect x="4" y="10" width="16" height="4" rx="1" fill="white"/>
        </svg>
      </div>`
    : "";

  return L.divIcon({
    className: "custom-marker",
    html: `
      <style>
        @keyframes pediatric-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.8; }
        }
        .marker-container {
          transition: transform 0.2s ease-out;
        }
        .marker-container:hover {
          transform: scale(1.15);
        }
      </style>
      <div class="marker-container" style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
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
  const isPediatricFilter = activeFilter === "pediatric";
  const icon = createMarkerIcon(status, displayBeds, hasPediatric, hospital.isTraumaCenter, isPediatricFilter);

  return (
    <Marker
      position={[hospital.lat, hospital.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(hospital),
      }}
    >
      <Tooltip 
        direction="top" 
        offset={[0, -55]} 
        opacity={1}
        className="!bg-white !border-gray-200 !shadow-lg !rounded-lg !px-3 !py-2 !text-sm !text-gray-800"
      >
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-semibold">{hospital.nameKr}</span>
          {hospital.distance !== undefined && (
            <span className="text-xs text-primary font-medium">{hospital.distance.toFixed(1)}km</span>
          )}
        </div>
      </Tooltip>
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
