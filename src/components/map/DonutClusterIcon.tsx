import L from "leaflet";
import { Hospital, getHospitalStatus } from "@/data/hospitals";

interface ClusterStats {
  available: number;
  limited: number;
  unavailable: number;
  total: number;
}

// 상태 기반 색상 (수용 가능 여부만 반영)
const greenColor = "#22C55E";
const yellowColor = "#EAB308";
const grayColor = "#9CA3AF";

export const calculateClusterStats = (hospitals: Hospital[]): ClusterStats => {
  let available = 0;
  let limited = 0;
  let unavailable = 0;

  hospitals.forEach((h) => {
    const status = getHospitalStatus(h);
    if (status === "available") available++;
    else if (status === "limited") limited++;
    else unavailable++;
  });

  return { available, limited, unavailable, total: hospitals.length };
};

export const createDonutClusterIcon = (stats: ClusterStats, _count: number) => {
  const { available, limited, unavailable, total } = stats;

  // 클러스터 크기 계산 (수용 가능 병원 수에 비례)
  const size = Math.min(72, Math.max(48, 48 + available * 3));
  const strokeWidth = 6;
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

  // 중앙 숫자 색상 (수용 가능 여부에 따라)
  const centerColor = available > 0 ? greenColor : (limited > 0 ? yellowColor : grayColor);
  const centerNumber = available; // 수용 가능 병원 수만 표시

  return L.divIcon({
    className: "donut-cluster-marker",
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        cursor: pointer;
        transition: transform 0.15s ease-out;
      " class="donut-container">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
          <!-- Available (Green) segment -->
          ${available > 0 ? `
            <circle 
              cx="${size / 2}" 
              cy="${size / 2}" 
              r="${radius}"
              fill="none"
              stroke="${greenColor}"
              stroke-width="${strokeWidth}"
              stroke-dasharray="${availableDash} ${circumference}"
              stroke-dashoffset="${-availableOffset}"
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
            />
          ` : ""}
        </svg>
        
        <!-- Center circle with available count only -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size - strokeWidth * 2 - 6}px;
          height: ${size - strokeWidth * 2 - 6}px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        ">
          <span style="
            font-size: ${Math.max(14, size / 3)}px;
            font-weight: 800;
            color: ${centerColor};
            line-height: 1;
          ">${centerNumber}</span>
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
