import L from "leaflet";
import { Hospital, getHospitalStatus } from "@/data/hospitals";

interface ClusterStats {
  available: number;
  limited: number;
  unavailable: number;
  total: number;
  totalAvailableBeds: number; // 총 가용 병상 수 추가
}

// 상태 기반 색상
const greenColor = "#22C55E";
const yellowColor = "#EAB308";
const grayColor = "#9CA3AF";

// 다이내믹 그린 색상 (가용 병상 수 기반)
const getGreenShade = (availableBeds: number): string => {
  if (availableBeds >= 50) return "#15803D"; // 진한 에메랄드
  if (availableBeds >= 20) return "#22C55E"; // 표준 초록
  return "#86EFAC"; // 연한 연두
};

export const calculateClusterStats = (hospitals: Hospital[]): ClusterStats => {
  let available = 0;
  let limited = 0;
  let unavailable = 0;
  let totalAvailableBeds = 0;

  hospitals.forEach((h) => {
    const status = getHospitalStatus(h);
    const beds = Math.max(0, h.beds.general) + Math.max(0, h.beds.pediatric) + Math.max(0, h.beds.fever);
    
    if (status === "available") {
      available++;
      totalAvailableBeds += beds;
    } else if (status === "limited") {
      limited++;
      totalAvailableBeds += beds;
    } else {
      unavailable++;
    }
  });

  return { available, limited, unavailable, total: hospitals.length, totalAvailableBeds };
};

export const createDonutClusterIcon = (stats: ClusterStats, _count: number) => {
  const { available, limited, unavailable, total, totalAvailableBeds } = stats;

  // 클러스터 크기 계산 (수용 가능 병원 수에 비례)
  const size = Math.min(76, Math.max(52, 52 + available * 3));
  
  // 가용 병상에 따른 테두리 두께 (정보 밀도 강화)
  const strokeWidth = Math.min(10, Math.max(6, 6 + Math.floor(totalAvailableBeds / 20)));
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // 각 상태별 비율 계산
  const availablePercent = (available / total) * 100;
  const limitedPercent = (limited / total) * 100;
  const unavailablePercent = (unavailable / total) * 100;

  // stroke-dasharray 계산
  const availableDash = (availablePercent / 100) * circumference;
  const limitedDash = (limitedPercent / 100) * circumference;
  const unavailableDash = (unavailablePercent / 100) * circumference;

  // 각 세그먼트 오프셋
  const availableOffset = 0;
  const limitedOffset = availableDash;
  const unavailableOffset = availableDash + limitedDash;

  // 다이내믹 그린 색상 적용
  const dynamicGreen = getGreenShade(totalAvailableBeds);
  
  // 중앙 숫자 색상 (수용 가능 여부에 따라)
  const centerColor = available > 0 ? dynamicGreen : (limited > 0 ? yellowColor : grayColor);
  const centerNumber = available; // 수용 가능 병원 수만 표시

  // Glow 효과 강도 (가용 병상에 비례)
  const glowIntensity = Math.min(0.6, totalAvailableBeds / 100);
  const glowSize = Math.min(20, 8 + Math.floor(totalAvailableBeds / 10));

  return L.divIcon({
    className: "donut-cluster-marker",
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        cursor: pointer;
        transition: transform 0.15s ease-out;
        filter: drop-shadow(0 0 ${glowSize}px rgba(34, 197, 94, ${glowIntensity}));
      " class="donut-container">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
          <!-- Available (Green) segment -->
          ${available > 0 ? `
            <circle 
              cx="${size / 2}" 
              cy="${size / 2}" 
              r="${radius}"
              fill="none"
              stroke="${dynamicGreen}"
              stroke-width="${strokeWidth}"
              stroke-dasharray="${availableDash} ${circumference}"
              stroke-dashoffset="${-availableOffset}"
              stroke-linecap="round"
            />
          ` : ""}
          
          <!-- Limited (Yellow) segment -->
          ${limited > 0 ? `
            <circle 
              cx="${size / 2}" 
              cy="${size / 2}" 
              r="${radius}"
              fill="none"
              stroke="${yellowColor}"
              stroke-width="${strokeWidth}"
              stroke-dasharray="${limitedDash} ${circumference}"
              stroke-dashoffset="${-limitedOffset}"
              stroke-linecap="round"
            />
          ` : ""}
          
          <!-- Unavailable (Gray) segment -->
          ${unavailable > 0 ? `
            <circle 
              cx="${size / 2}" 
              cy="${size / 2}" 
              r="${radius}"
              fill="none"
              stroke="${grayColor}"
              stroke-width="${strokeWidth}"
              stroke-dasharray="${unavailableDash} ${circumference}"
              stroke-dashoffset="${-unavailableOffset}"
              stroke-linecap="round"
            />
          ` : ""}
        </svg>
        
        <!-- Center circle with available count - Light green tint background -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size - strokeWidth * 2 - 6}px;
          height: ${size - strokeWidth * 2 - 6}px;
          background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.12);
        ">
          <span style="
            font-size: ${Math.max(16, size / 3)}px;
            font-weight: 800;
            color: ${centerColor};
            line-height: 1;
          ">${centerNumber}</span>
          <span style="
            font-size: 7px;
            font-weight: 600;
            color: ${centerColor};
            opacity: 0.7;
            letter-spacing: 0.3px;
            margin-top: 1px;
          ">AVAIL</span>
        </div>
      </div>
      
      <style>
        .donut-container:hover {
          transform: scale(1.1);
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};
