import L from "leaflet";
import { Hospital, getHospitalStatus } from "@/data/hospitals";

interface ClusterStats {
  available: number;
  limited: number;
  unavailable: number;
  total: number;
  totalBeds: number; // Total bed count across all hospitals
}

export const calculateClusterStats = (hospitals: Hospital[]): ClusterStats => {
  let available = 0;
  let limited = 0;
  let unavailable = 0;
  let totalBeds = 0;

  hospitals.forEach((h) => {
    const status = getHospitalStatus(h);
    if (status === "available") available++;
    else if (status === "limited") limited++;
    else unavailable++;
    
    // Sum up all beds
    const beds = (h.beds?.general || 0) + (h.beds?.pediatric || 0) + (h.beds?.fever || 0);
    totalBeds += Math.max(0, beds);
  });

  return { available, limited, unavailable, total: hospitals.length, totalBeds };
};

export const createDonutClusterIcon = (stats: ClusterStats, count: number) => {
  const { available, limited, unavailable, total, totalBeds } = stats;
  
  // Calculate percentages for the donut chart
  const availablePercent = (available / total) * 100;
  const limitedPercent = (limited / total) * 100;
  const unavailablePercent = (unavailable / total) * 100;
  
  // SVG donut chart with conic gradient effect using stroke-dasharray
  const size = Math.min(60, 40 + count * 2);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dasharray for each segment
  const availableDash = (availablePercent / 100) * circumference;
  const limitedDash = (limitedPercent / 100) * circumference;
  const unavailableDash = (unavailablePercent / 100) * circumference;
  
  // Colors
  const greenColor = "#10B981";
  const yellowColor = "#F59E0B";
  const redColor = "#EF4444";
  
  // Determine dominant color for center
  const dominantColor = available >= limited && available >= unavailable 
    ? greenColor 
    : limited >= unavailable 
      ? yellowColor 
      : redColor;
  
  // Offsets for each segment
  const availableOffset = 0;
  const limitedOffset = availableDash;
  const unavailableOffset = availableDash + limitedDash;

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
          <!-- Available (Green) segment -->
          ${available > 0 ? `
            <circle 
              cx="${size/2}" 
              cy="${size/2}" 
              r="${radius}"
              fill="none"
              stroke="${greenColor}"
              stroke-width="${strokeWidth}"
              stroke-dasharray="${availableDash} ${circumference}"
              stroke-dashoffset="${-availableOffset}"
              stroke-linecap="round"
            />
          ` : ''}
          
          <!-- Limited (Yellow) segment -->
          ${limited > 0 ? `
            <circle 
              cx="${size/2}" 
              cy="${size/2}" 
              r="${radius}"
              fill="none"
              stroke="${yellowColor}"
              stroke-width="${strokeWidth}"
              stroke-dasharray="${limitedDash} ${circumference}"
              stroke-dashoffset="${-limitedOffset}"
              stroke-linecap="round"
            />
          ` : ''}
          
          <!-- Unavailable (Red) segment -->
          ${unavailable > 0 ? `
            <circle 
              cx="${size/2}" 
              cy="${size/2}" 
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
        
        <!-- Center circle with count -->
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
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        ">
          <span style="
            font-size: ${Math.max(12, size / 4)}px;
            font-weight: 700;
            color: ${dominantColor};
          ">${totalBeds}</span>
        </div>
        
        <!-- Small status dots at bottom -->
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 3px;
          background: rgba(255,255,255,0.9);
          padding: 2px 6px;
          border-radius: 8px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        ">
          <div style="display: flex; align-items: center; gap: 2px;">
            <span style="width: 6px; height: 6px; background: ${greenColor}; border-radius: 50%;"></span>
            <span style="font-size: 9px; font-weight: 600; color: ${greenColor};">${available}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 2px;">
            <span style="width: 6px; height: 6px; background: ${yellowColor}; border-radius: 50%;"></span>
            <span style="font-size: 9px; font-weight: 600; color: ${yellowColor};">${limited}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 2px;">
            <span style="width: 6px; height: 6px; background: ${redColor}; border-radius: 50%;"></span>
            <span style="font-size: 9px; font-weight: 600; color: ${redColor};">${unavailable}</span>
          </div>
        </div>
      </div>
      
      <style>
        .donut-container:hover {
          transform: scale(1.1);
        }
      </style>
    `,
    iconSize: [size, size + 12],
    iconAnchor: [size / 2, size / 2],
  });
};
