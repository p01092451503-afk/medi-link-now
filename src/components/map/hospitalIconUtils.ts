import L from "leaflet";
import { Hospital, FilterType, getHospitalStatus } from "@/data/hospitals";

// Rejection alert severity types
export type RejectionSeverity = 'none' | 'warning' | 'critical';

export interface RejectionAlertInfo {
  severity: RejectionSeverity;
  count: number;
  reasons?: string[];
}

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

export const getGradeKoreanName = (grade?: string | null): string => {
  switch (grade) {
    case 'regional_center': return '권역응급의료센터';
    case 'local_center': return '지역응급의료센터';
    case 'local_institution': return '지역응급의료기관';
    default: return '';
  }
};

// Moonlight (야간 소아진료) marker colors - pastel yellow theme
const getMoonlightColors = () => ({
  available: { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },
  limited: { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },
  unavailable: { bg: "#FDE68A", border: "#D97706", text: "#78350F" },
});

export const createHospitalIcon = (
  status: "available" | "limited" | "unavailable",
  beds: number,
  hasPediatric: boolean,
  isTraumaCenter?: boolean,
  isPediatricFilter?: boolean,
  emergencyGrade?: string | null,
  isMoonlightMode?: boolean,
  rejectionAlert?: RejectionAlertInfo
) => {
  // Use moonlight colors if in moonlight mode, otherwise use grade colors
  const colors = isMoonlightMode ? getMoonlightColors() : getGradeColors(emergencyGrade);
  const color = colors[status];
  const gradeLabel = getGradeLabel(emergencyGrade);

  // Rejection alert styles
  const hasRejectionAlert = rejectionAlert && rejectionAlert.severity !== 'none';
  const isWarning = rejectionAlert?.severity === 'warning';
  const isCritical = rejectionAlert?.severity === 'critical';

  // Generate unique animation name for this instance
  const animationId = `blink-${Math.random().toString(36).substr(2, 9)}`;

  const rejectionBorderStyle = hasRejectionAlert
    ? `
      border-color: ${isCritical ? '#DC2626' : '#F97316'} !important;
      animation: ${animationId} ${isCritical ? '0.5s' : '1s'} ease-in-out infinite;
      box-shadow: 0 0 ${isCritical ? '15px' : '10px'} ${isCritical ? 'rgba(220, 38, 38, 0.6)' : 'rgba(249, 115, 22, 0.5)'}, 0 4px 12px rgba(0,0,0,0.3);
    `
    : '';

  // Critical rejection tooltip badge
  const rejectionBadge = isCritical
    ? `<div style="
        position: absolute;
        top: -24px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
        color: white;
        font-size: 9px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 6px;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(220, 38, 38, 0.5);
        z-index: 20;
        display: flex;
        align-items: center;
        gap: 3px;
      ">
        <span>⛔</span>
        <span>수용 불가 유력</span>
      </div>`
    : '';

  // Warning count badge (for 1-2 rejections)
  const warningCountBadge = isWarning
    ? `<div style="
        position: absolute;
        top: -16px;
        right: -10px;
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        color: white;
        box-shadow: 0 2px 6px rgba(249, 115, 22, 0.5);
        z-index: 15;
      ">
        ${rejectionAlert?.count || 0}
      </div>`
    : '';

  const traumaBadge = isTraumaCenter
    ? `<div class="trauma-badge" style="
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
        z-index: 10;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="4" width="4" height="16" rx="1" fill="white"/>
          <rect x="4" y="10" width="16" height="4" rx="1" fill="white"/>
        </svg>
      </div>`
    : "";

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

  const gradeBadge = (gradeLabel && !isMoonlightMode)
    ? `<div style="
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.85);
        color: white;
        font-size: 9px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      ">${gradeLabel}</div>`
    : "";

  return L.divIcon({
    className: "custom-marker",
    html: `
      <style>
        @keyframes ${animationId} {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
      </style>
      <div class="marker-container" style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
      ">
        ${rejectionBadge}
        <div style="
          position: relative;
          min-width: 40px;
          height: 36px;
          padding: 0 8px;
          background: ${color.bg};
          border: 3px solid ${color.border};
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1px;
          color: ${color.text};
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          cursor: pointer;
          ${rejectionBorderStyle}
        ">
          <span style="font-weight: 800; font-size: 15px;">${beds}</span>
          <span style="font-size: 9px; font-weight: 500; opacity: 0.9;">석</span>
          ${isMoonlightMode ? moonlightBadge : traumaBadge}
          ${warningCountBadge}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid ${hasRejectionAlert ? (isCritical ? '#DC2626' : '#F97316') : color.border};
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
