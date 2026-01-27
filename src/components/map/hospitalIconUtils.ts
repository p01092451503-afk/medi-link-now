import L from "leaflet";
import { Hospital, FilterType, getHospitalStatus } from "@/data/hospitals";

export const getDisplayBeds = (hospital: Hospital, filter: FilterType): number => {
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

export const getMarkerStatus = (beds: number): "available" | "limited" | "unavailable" => {
  if (beds === 0) return "unavailable";
  if (beds <= 2) return "limited";
  return "available";
};

const getGradeColors = (emergencyGrade?: string | null) => {
  switch (emergencyGrade) {
    case "regional_center":
      return {
        available: { bg: "#DC2626", border: "#B91C1C", text: "#FFFFFF" },
        limited: { bg: "#DC2626", border: "#B91C1C", text: "#FFFFFF" },
        unavailable: { bg: "#991B1B", border: "#7F1D1D", text: "#FFFFFF" },
      };
    case "local_center":
      return {
        available: { bg: "#F97316", border: "#EA580C", text: "#FFFFFF" },
        limited: { bg: "#F97316", border: "#EA580C", text: "#FFFFFF" },
        unavailable: { bg: "#C2410C", border: "#9A3412", text: "#FFFFFF" },
      };
    case "local_institution":
      return {
        available: { bg: "#2563EB", border: "#1D4ED8", text: "#FFFFFF" },
        limited: { bg: "#2563EB", border: "#1D4ED8", text: "#FFFFFF" },
        unavailable: { bg: "#1E40AF", border: "#1E3A8A", text: "#FFFFFF" },
      };
    default:
      return {
        available: { bg: "#10B981", border: "#059669", text: "#FFFFFF" },
        limited: { bg: "#F59E0B", border: "#D97706", text: "#FFFFFF" },
        unavailable: { bg: "#EF4444", border: "#DC2626", text: "#FFFFFF" },
      };
  }
};

const getGradeLabel = (emergencyGrade?: string | null): string => {
  switch (emergencyGrade) {
    case "regional_center":
      return "권역";
    case "local_center":
      return "지역센터";
    case "local_institution":
      return "지역기관";
    default:
      return "";
  }
};

export const createHospitalIcon = (
  status: "available" | "limited" | "unavailable",
  beds: number,
  hasPediatric: boolean,
  isTraumaCenter?: boolean,
  isPediatricFilter?: boolean,
  emergencyGrade?: string | null
) => {
  const colors = getGradeColors(emergencyGrade);
  const color = colors[status];
  const gradeLabel = getGradeLabel(emergencyGrade);

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
          <circle cx="12" cy="12" r="10" fill="#FFE4C9"/>
          <path d="M12 2C12 2 14 4 14 6C14 6 13 5 12 5C11 5 10 6 10 6C10 4 12 2 12 2Z" fill="#8B5A2B"/>
          <circle cx="8.5" cy="11" r="1.5" fill="#1a1a1a"/>
          <circle cx="8" cy="10.5" r="0.5" fill="white"/>
          <circle cx="15.5" cy="11" r="1.5" fill="#1a1a1a"/>
          <circle cx="15" cy="10.5" r="0.5" fill="white"/>
          <circle cx="6" cy="14" r="1.5" fill="#FECACA" opacity="0.7"/>
          <circle cx="18" cy="14" r="1.5" fill="#FECACA" opacity="0.7"/>
          <path d="M9 15.5C9 15.5 10.5 17 12 17C13.5 17 15 15.5 15 15.5" stroke="#1a1a1a" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </div>`
    : "";
  const traumaBadge = isTraumaCenter
    ? `<div style="
        position: absolute; 
        top: -14px; 
        left: -14px; 
        width: 32px; 
        height: 32px; 
        background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%);
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 12px rgba(124, 58, 237, 0.6), 0 0 0 3px rgba(124, 58, 237, 0.3);
        animation: trauma-pulse 2s ease-in-out infinite;
        z-index: 10;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="4" width="4" height="16" rx="1" fill="white"/>
          <rect x="4" y="10" width="16" height="4" rx="1" fill="white"/>
        </svg>
      </div>`
    : "";

  const gradeBadge = gradeLabel
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
        @keyframes trauma-pulse {
          0%, 100% { box-shadow: 0 3px 12px rgba(124, 58, 237, 0.6), 0 0 0 3px rgba(124, 58, 237, 0.3); }
          50% { box-shadow: 0 3px 16px rgba(124, 58, 237, 0.8), 0 0 0 6px rgba(124, 58, 237, 0.2); }
        }
        .marker-container {
          transition: transform 0.2s ease-out;
        }
        .marker-container:hover {
          transform: scale(1.15);
        }
      </style>
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
        ${gradeBadge}
      </div>
    `,
    iconSize: [44, 62],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
  });
};
