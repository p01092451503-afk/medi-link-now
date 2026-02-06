import { Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import { Hospital, getHospitalStatus, FilterType } from "@/data/hospitals";
import { cleanHospitalName } from "@/lib/utils";

interface HospitalMarkerProps {
  hospital: Hospital & { distance?: number };
  onClick: (hospital: Hospital) => void;
  activeFilter: FilterType;
  opacity?: number;
  isMoonlightMode?: boolean;
  isHighTraffic?: boolean;
  privateTrafficCount?: number;
  isPediatricSOS?: boolean;
}

const getDisplayBeds = (hospital: Hospital, filter: FilterType): number => {
  // 음수 병상은 0으로 처리
  const general = Math.max(0, hospital.beds.general);
  const pediatric = Math.max(0, hospital.beds.pediatric);
  const fever = Math.max(0, hospital.beds.fever);
  
  switch (filter) {
    case "adult":
      return general;
    case "pediatric":
      return pediatric;
    case "fever":
      return fever;
    default:
      return general + pediatric + fever;
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

// 등급별 마커 색상 정의
const getGradeColors = (emergencyGrade?: string | null) => {
  switch (emergencyGrade) {
    case 'regional_center': // 권역응급의료센터 - 빨간색 계열
      return {
        available: { bg: "#DC2626", border: "#B91C1C", text: "#FFFFFF" },
        limited: { bg: "#DC2626", border: "#B91C1C", text: "#FFFFFF" },
        unavailable: { bg: "#991B1B", border: "#7F1D1D", text: "#FFFFFF" },
      };
    case 'local_center': // 지역응급의료센터 - 주황색 계열
      return {
        available: { bg: "#F97316", border: "#EA580C", text: "#FFFFFF" },
        limited: { bg: "#F97316", border: "#EA580C", text: "#FFFFFF" },
        unavailable: { bg: "#C2410C", border: "#9A3412", text: "#FFFFFF" },
      };
    case 'local_institution': // 지역응급의료기관 - 파란색 계열
      return {
        available: { bg: "#2563EB", border: "#1D4ED8", text: "#FFFFFF" },
        limited: { bg: "#2563EB", border: "#1D4ED8", text: "#FFFFFF" },
        unavailable: { bg: "#1E40AF", border: "#1E3A8A", text: "#FFFFFF" },
      };
    default: // 등급 없음 - 기존 상태 기반 색상
      return {
        available: { bg: "#10B981", border: "#059669", text: "#FFFFFF" },
        limited: { bg: "#F59E0B", border: "#D97706", text: "#FFFFFF" },
        unavailable: { bg: "#EF4444", border: "#DC2626", text: "#FFFFFF" },
      };
  }
};

// 등급 라벨 반환
const getGradeLabel = (emergencyGrade?: string | null): string => {
  switch (emergencyGrade) {
    case 'regional_center':
      return '권역';
    case 'local_center':
      return '지역센터';
    case 'local_institution':
      return '지역기관';
    default:
      return '';
  }
};

// Moonlight (야간 소아진료) marker colors - pastel yellow theme
const getMoonlightColors = () => ({
  available: { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },
  limited: { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },
  unavailable: { bg: "#FDE68A", border: "#D97706", text: "#78350F" },
});

// Pediatric SOS mode marker colors - baby blue theme
const getPediatricSOSColors = () => ({
  available: { bg: "#BAE6FD", border: "#0EA5E9", text: "#0C4A6E" },
  limited: { bg: "#BAE6FD", border: "#0EA5E9", text: "#0C4A6E" },
  unavailable: { bg: "#E0F2FE", border: "#38BDF8", text: "#075985" },
});

const createMarkerIcon = (
  status: "available" | "limited" | "unavailable",
  beds: number,
  hasPediatric: boolean,
  isTraumaCenter?: boolean,
  isPediatricFilter?: boolean,
  emergencyGrade?: string | null,
  isMoonlightMode?: boolean,
  isHighTraffic?: boolean,
  privateTrafficCount?: number,
  isPediatricSOS?: boolean
) => {
  // Use pediatric SOS colors first, then moonlight, then grade colors
  const colors = isPediatricSOS
    ? getPediatricSOSColors()
    : isMoonlightMode
      ? getMoonlightColors()
      : getGradeColors(emergencyGrade);
  
  // If high traffic and estimated full, override to gray
  const effectiveStatus = isHighTraffic && beds === 0 ? "unavailable" : status;
  const color = colors[effectiveStatus];
  const gradeLabel = getGradeLabel(emergencyGrade);
  
  // Child badge removed for cleaner marker design
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

  // High traffic warning badge (top-right)
  const highTrafficBadge = isHighTraffic
    ? `<div style="
        position: absolute;
        top: -10px;
        right: -14px;
        background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        border: 2px solid white;
        border-radius: 8px;
        padding: 2px 4px;
        display: flex;
        align-items: center;
        gap: 2px;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.5);
        z-index: 10;
      ">
        <span style="font-size: 10px;">⚠️</span>
        <span style="font-size: 9px; font-weight: bold; color: white;">${privateTrafficCount || 0}</span>
      </div>`
    : "";

  // Moonlight badge (displayed when in moonlight mode)
  const moonlightBadge = isMoonlightMode
    ? `<div style="
        position: absolute;
        top: -12px;
        left: -12px;
        width: 26px;
        height: 26px;
        background: linear-gradient(135deg, #312E81 0%, #4338CA 100%);
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(79, 70, 229, 0.5);
        z-index: 10;
      ">
        <span style="font-size: 14px;">🌙</span>
      </div>`
    : "";

  // Pediatric SOS badge (displayed when in pediatric SOS mode)
  const pediatricSOSBadge = isPediatricSOS
    ? `<div style="
        position: absolute;
        top: -12px;
        left: -12px;
        width: 26px;
        height: 26px;
        background: linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%);
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(14, 165, 233, 0.5);
        z-index: 10;
      ">
        <span style="font-size: 14px;">👶</span>
      </div>`
    : "";
  
  // 등급 표시 뱃지 (왼쪽 하단) - don't show in moonlight mode
  const gradeBadge = (gradeLabel && !isMoonlightMode)
    ? `<div style="
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.75);
        color: white;
        font-size: 9px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
      ">${gradeLabel}</div>`
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
          ${isPediatricSOS ? pediatricSOSBadge : isMoonlightMode ? moonlightBadge : traumaBadge}
          ${highTrafficBadge}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid ${color.border};
          margin-top: -2px;
        "></div>
        ${gradeBadge}
      </div>
    `,
    iconSize: [44, 62],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
  });
};

const HospitalMarker = ({ hospital, onClick, activeFilter, opacity = 1, isMoonlightMode = false, isHighTraffic = false, privateTrafficCount = 0, isPediatricSOS = false }: HospitalMarkerProps) => {
  const displayBeds = getDisplayBeds(hospital, activeFilter);
  const status = getMarkerStatus(displayBeds);
  
  // 음수 병상을 0으로 정규화
  const normalizedBeds = {
    general: Math.max(0, hospital.beds.general),
    pediatric: Math.max(0, hospital.beds.pediatric),
    fever: Math.max(0, hospital.beds.fever),
  };
  
  const hasPediatric = normalizedBeds.pediatric > 0;
  const isPediatricFilter = activeFilter === "pediatric" || activeFilter === "moonlight";
  const icon = createMarkerIcon(
    status, 
    displayBeds, 
    hasPediatric, 
    hospital.isTraumaCenter, 
    isPediatricFilter,
    hospital.emergencyGrade,
    isMoonlightMode,
    isHighTraffic,
    privateTrafficCount,
    isPediatricSOS
  );

  // 등급 한글명 표시
  const getGradeKoreanName = (grade?: string | null): string => {
    switch (grade) {
      case 'regional_center': return '권역응급의료센터';
      case 'local_center': return '지역응급의료센터';
      case 'local_institution': return '지역응급의료기관';
      default: return '';
    }
  };

  const gradeKoreanName = getGradeKoreanName(hospital.emergencyGrade);

  return (
    <Marker
      position={[hospital.lat, hospital.lng]}
      icon={icon}
      opacity={opacity}
      eventHandlers={{
        click: () => onClick(hospital),
      }}
    >
      <Tooltip 
        direction="top" 
        offset={[0, -55]} 
        opacity={1}
        sticky={true}
        className="!bg-white !border-gray-200 !shadow-lg !rounded-lg !px-3 !py-2 !text-sm !text-gray-800"
      >
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-semibold">{cleanHospitalName(hospital.nameKr)}</span>
          {gradeKoreanName && (
            <span className="text-xs text-blue-600 font-medium">{gradeKoreanName}</span>
          )}
        </div>
      </Tooltip>
      <Popup>
        <div className="text-sm min-w-[180px]">
          <div className="flex items-center gap-1 mb-1">
            <strong className="text-base">{cleanHospitalName(hospital.nameKr)}</strong>
            {hasPediatric && <span title="아이 진료 가능">👶</span>}
          </div>
          {gradeKoreanName && (
            <span className="text-xs text-blue-600 font-medium block mb-1">{gradeKoreanName}</span>
          )}
          <span className="text-xs text-gray-500 block mb-2">{hospital.category}</span>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className={`p-1.5 rounded ${activeFilter === "adult" || activeFilter === "all" || activeFilter === "ct" ? "bg-blue-50" : ""}`}>
              <div className={`font-bold ${normalizedBeds.general > 0 ? "text-green-600" : "text-gray-400"}`}>
                {normalizedBeds.general}
              </div>
              <div className="text-gray-400">성인</div>
            </div>
            <div className={`p-1.5 rounded ${activeFilter === "pediatric" ? "bg-blue-50" : ""}`}>
              <div className={`font-bold ${normalizedBeds.pediatric > 0 ? "text-green-600" : "text-gray-400"}`}>
                {normalizedBeds.pediatric}
              </div>
              <div className="text-gray-400">소아</div>
            </div>
            <div className={`p-1.5 rounded ${activeFilter === "fever" ? "bg-blue-50" : ""}`}>
              <div className={`font-bold ${normalizedBeds.fever > 0 ? "text-green-600" : "text-gray-400"}`}>
                {normalizedBeds.fever}
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
