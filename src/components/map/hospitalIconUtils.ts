import L from "leaflet";
import { Hospital, FilterType } from "@/data/hospitals";

// 다이내믹 컬러 그레이딩 (병상 수에 따른 3단계 초록색)
const AVAILABILITY_COLORS = {
  high: { bg: "#15803D", border: "#166534", text: "#FFFFFF" },      // 11+ beds: 진한 에메랄드
  medium: { bg: "#22C55E", border: "#16A34A", text: "#FFFFFF" },    // 6-10 beds: 표준 초록
  low: { bg: "#86EFAC", border: "#4ADE80", text: "#166534" },       // 1-5 beds: 연한 연두
  limited: { bg: "#EAB308", border: "#CA8A04", text: "#FFFFFF" },   // 혼잡 (1-2 beds)
  unavailable: { bg: "#9CA3AF", border: "#6B7280", text: "#FFFFFF" }, // 만실 (0 beds)
};

// 골드 테두리 색상 (권역응급센터, 대학병원용)
const GOLD_STROKE = "#D97706";

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

// 병상 수에 따른 색상 등급 반환
const getAvailabilityGrade = (beds: number): "high" | "medium" | "low" | "limited" | "unavailable" => {
  if (beds === 0) return "unavailable";
  if (beds <= 2) return "limited";
  if (beds <= 5) return "low";
  if (beds <= 10) return "medium";
  return "high";
};

export const createHospitalIcon = (
  status: "available" | "limited" | "unavailable",
  beds: number,
  category?: string,
  isTraumaCenter?: boolean
) => {
  // 다이내믹 컬러 그레이딩 적용
  const grade = getAvailabilityGrade(beds);
  const color = AVAILABILITY_COLORS[grade];
  
  // 권역응급센터/외상센터 여부 확인 (category 기반)
  const categoryStr = category || "";
  const isPremium = categoryStr.includes("Regional") || categoryStr.includes("권역") || isTraumaCenter;
  const borderColor = isPremium ? GOLD_STROKE : color.border;
  const borderWidth = isPremium ? 4 : 3;
  const glowEffect = isPremium ? "0 0 12px rgba(217, 119, 6, 0.5)" : "";

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="marker-container" style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transition: transform 0.15s ease-out;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
      ">
        <div style="
          position: relative;
          min-width: 44px;
          height: 48px;
          padding: 0 12px;
          background: ${color.bg};
          border: ${borderWidth}px solid ${borderColor};
          border-radius: 12px 12px 12px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: ${color.text};
          box-shadow: 0 4px 12px rgba(0,0,0,0.2)${glowEffect ? `, ${glowEffect}` : ""};
          cursor: pointer;
        ">
          <span style="
            font-weight: 800;
            font-size: 18px;
            line-height: 1.1;
          ">${beds}</span>
          <span style="
            font-size: 8px;
            font-weight: 600;
            letter-spacing: 0.5px;
            opacity: 0.85;
            margin-top: 1px;
          ">BEDS</span>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid ${borderColor};
          margin-top: -3px;
          margin-left: -16px;
        "></div>
      </div>
      <style>
        .marker-container:hover {
          transform: scale(1.12);
        }
      </style>
    `,
    iconSize: [52, 62],
    iconAnchor: [18, 58],
    popupAnchor: [0, -58],
  });
};
