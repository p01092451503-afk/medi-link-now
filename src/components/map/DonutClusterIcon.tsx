import L from "leaflet";
import { Hospital } from "@/data/hospitals";

interface ClusterStats {
  available: number; // beds > 0 (여유)
  unavailable: number; // beds === 0 (혼잡)
  total: number;
  totalBeds: number;
}

export const calculateClusterStats = (hospitals: Hospital[]): ClusterStats => {
  let available = 0;
  let unavailable = 0;
  let totalBeds = 0;

  hospitals.forEach((h) => {
    const beds =
      Math.max(0, h.beds?.general || 0) +
      Math.max(0, h.beds?.pediatric || 0) +
      Math.max(0, h.beds?.fever || 0);
    totalBeds += beds;
    if (beds > 0) available++;
    else unavailable++;
  });

  return { available, unavailable, total: hospitals.length, totalBeds };
};

export const createDonutClusterIcon = (stats: ClusterStats, count: number) => {
  const { available, unavailable, total, totalBeds } = stats;

  const availablePercent = total > 0 ? (available / total) * 100 : 0;
  const unavailablePercent = total > 0 ? (unavailable / total) * 100 : 0;

  // Dynamic size based on hospital count
  const size = Math.min(72, Math.max(46, 46 + Math.sqrt(total) * 4));
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const availableDash = (availablePercent / 100) * circumference;
  const unavailableDash = (unavailablePercent / 100) * circumference;

  const greenColor = "#10B981";
  const redColor = "#EF4444";

  const dominantColor = available >= unavailable ? greenColor : redColor;

  const availableOffset = 0;
  const unavailableOffset = availableDash;

  return L.divIcon({
    className: "donut-cluster-marker",
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        cursor: pointer;
        transition: transform 0.2s;
      " class="donut-container">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
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
              stroke-linecap="round"
            />
          ` : ''}
          ${unavailable > 0 ? `
            <circle 
              cx="${size / 2}" 
              cy="${size / 2}" 
              r="${radius}"
              fill="none"
              stroke="${redColor}"
              stroke-width="${strokeWidth}"
              stroke-dasharray="${unavailableDash} ${circumference}"
              stroke-dashoffset="${-unavailableOffset}"
              stroke-linecap="round"
            />
          ` : ''}
        </svg>
        
        <!-- Center circle with total beds -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size - strokeWidth * 2 - 4}px;
          height: ${size - strokeWidth * 2 - 4}px;
          background: white;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        ">
          <span style="
            font-size: ${Math.max(11, size / 4.5)}px;
            font-weight: 800;
            color: ${dominantColor};
            line-height: 1;
          ">${totalBeds}</span>
          <span style="
            font-size: 8px;
            font-weight: 600;
            color: #6B7280;
            line-height: 1;
            margin-top: 1px;
          ">${total}곳</span>
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
