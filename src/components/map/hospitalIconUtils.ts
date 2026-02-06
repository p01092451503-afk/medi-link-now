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

// Pediatric SOS mode marker colors - baby blue theme
const getPediatricSOSColors = () => ({
  available: { bg: "#BAE6FD", border: "#0EA5E9", text: "#0C4A6E" },
  limited: { bg: "#BAE6FD", border: "#0EA5E9", text: "#0C4A6E" },
  unavailable: { bg: "#E0F2FE", border: "#38BDF8", text: "#075985" },
});

export const createHospitalIcon = (
  status: "available" | "limited" | "unavailable",
  beds: number,
  hasPediatric: boolean,
  isTraumaCenter?: boolean,
  isPediatricFilter?: boolean,
  emergencyGrade?: string | null,
  isMoonlightMode?: boolean,
  rejectionAlert?: RejectionAlertInfo,
  incomingCount?: number,
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
  const color = colors[status];
  const gradeLabel = getGradeLabel(emergencyGrade);
  const hasIncoming = incomingCount && incomingCount > 0;

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

  // High traffic warning badge (private ambulances > 2)
  const highTrafficBadge = isHighTraffic && !isCritical && !isWarning
    ? `<div style="
        position: absolute;
        top: -18px;
        right: ${hasIncoming ? '-35px' : '-12px'};
        background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        border: 2px solid white;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 2px 6px;
        font-size: 9px;
        font-weight: 700;
        color: white;
        box-shadow: 0 2px 6px rgba(245, 158, 11, 0.5);
        z-index: 16;
      ">
        <span>⚠️</span>
        <span>${privateTrafficCount || 0}</span>
      </div>`
    : '';

  // Floating traffic animation when 3+ people are heading to this hospital
  const floatAnimationId = `float-${Math.random().toString(36).substr(2, 9)}`;
  const showFloatingTraffic = incomingCount && incomingCount >= 3;
  
  const floatingTrafficBadge = showFloatingTraffic
    ? `<div style="
        position: absolute;
        top: -32px;
        left: 50%;
        transform: translateX(-50%);
        animation: ${floatAnimationId} 2s ease-in-out infinite;
        z-index: 25;
        pointer-events: none;
      ">
        <div style="
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 12px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.5);
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span style="font-size: 12px;">🏃</span>
          <span>${incomingCount}명 이동 중</span>
        </div>
      </div>`
    : '';

  // Incoming ambulance badge (small truck icon with count) - only show if not showing floating traffic
  const incomingBadge = hasIncoming && !isCritical && !showFloatingTraffic
    ? `<div style="
        position: absolute;
        top: -18px;
        right: ${isWarning ? '-30px' : '-10px'};
        background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
        border: 2px solid white;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 2px 6px;
        font-size: 9px;
        font-weight: 700;
        color: white;
        box-shadow: 0 2px 6px rgba(249, 115, 22, 0.5);
        z-index: 15;
      ">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 8H17V4H3C1.9 4 1 4.9 1 6V17H3C3 18.66 4.34 20 6 20S9 18.66 9 17H15C15 18.66 16.34 20 18 20S21 18.66 21 17H23V12L20 8Z"/>
        </svg>
        ${incomingCount}
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

  // Pediatric SOS badge
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

  // Status indicator badge (green = available, red = full)
  const statusColor = beds > 0 ? '#10B981' : '#EF4444';
  const statusLabel = beds > 0 ? '입원가능' : '만석';
  const statusBadge = `<div style="
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 3px;
      background: rgba(0,0,0,0.8);
      padding: 2px 7px;
      border-radius: 6px;
      white-space: nowrap;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    ">
      <span style="width: 7px; height: 7px; background: ${statusColor}; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 4px ${statusColor};"></span>
      <span style="font-size: 9px; font-weight: 700; color: white;">${statusLabel}</span>
    </div>`;

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
        @keyframes ${floatAnimationId} {
          0%, 100% { 
            transform: translateX(-50%) translateY(0);
          }
          50% { 
            transform: translateX(-50%) translateY(-6px);
          }
        }
        .marker-container:hover .marker-circle-inner {
          transform: scale(1.15);
          box-shadow: 0 6px 16px rgba(0,0,0,0.35), 0 3px 6px rgba(0,0,0,0.2) !important;
        }
      </style>
      <div class="marker-container" style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
      ">
        ${floatingTrafficBadge}
        ${rejectionBadge}
        <div class="marker-circle-inner" style="
          position: relative;
          width: 42px;
          height: 42px;
          background: ${color.bg};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: ${color.text};
          box-shadow: 0 4px 12px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.15);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          ${rejectionBorderStyle}
        ">
          <span style="font-weight: 800; font-size: 18px; line-height: 1;">${beds}</span>
          ${isPediatricSOS ? pediatricSOSBadge : isMoonlightMode ? moonlightBadge : traumaBadge}
          ${warningCountBadge}
          ${highTrafficBadge}
          ${incomingBadge}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 8px solid ${hasRejectionAlert ? (isCritical ? '#DC2626' : '#F97316') : 'white'};
          margin-top: -2px;
        "></div>
        ${statusBadge}
      </div>
    `,
    iconSize: [42, 70],
    iconAnchor: [21, 62],
    popupAnchor: [0, -62],
  });
};
