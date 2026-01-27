import L from "leaflet";
import { Hospital, FilterType } from "@/data/hospitals";

// 상태 기반 색상 (수용 가능 여부만 반영)
const STATUS_COLORS = {
  available: { bg: "#22C55E", border: "#16A34A", text: "#FFFFFF" },   // 밝은 초록
  limited: { bg: "#EAB308", border: "#CA8A04", text: "#FFFFFF" },     // 노란색
  unavailable: { bg: "#9CA3AF", border: "#6B7280", text: "#FFFFFF" }, // 회색 (만실)
};

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

export const createHospitalIcon = (
  status: "available" | "limited" | "unavailable",
  beds: number,
  _hasPediatric?: boolean,
  _isTraumaCenter?: boolean,
  _isPediatricFilter?: boolean,
  _emergencyGrade?: string | null
) => {
  // 상태 기반 색상만 사용 (병원 종류 무시)
  const color = STATUS_COLORS[status];

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
          box-shadow: 0 3px 10px rgba(0,0,0,0.25);
          cursor: pointer;
        ">
          ${beds}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 9px solid ${color.border};
          margin-top: -2px;
        "></div>
      </div>
      <style>
        .marker-container:hover {
          transform: scale(1.15);
        }
      </style>
    `,
    iconSize: [44, 54],
    iconAnchor: [22, 48],
    popupAnchor: [0, -48],
  });
};
