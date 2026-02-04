import { Hospital, getHospitalStatus } from "@/data/hospitals";

export interface ClusterStats {
  available: number;
  limited: number;
  unavailable: number;
  total: number;
  totalBeds: number;
}

export interface HospitalCluster {
  hospitals: Hospital[];
  center: { lat: number; lng: number };
  stats: ClusterStats;
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

    const beds = (h.beds?.general || 0) + (h.beds?.pediatric || 0) + (h.beds?.fever || 0);
    totalBeds += Math.max(0, beds);
  });

  return { available, limited, unavailable, total: hospitals.length, totalBeds };
};

// Grid-based clustering
// Note: Kakao Maps zoom levels are inverted (1 = zoomed in, 14 = zoomed out)
export const clusterHospitals = (
  hospitals: Hospital[],
  mapBounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } },
  zoomLevel: number
): HospitalCluster[] => {
  // Skip clustering until zoomed out to regional/province level
  // Kakao zoom: 1 = most zoomed in, 14 = most zoomed out
  // Level 1-9: individual markers (city-wide and closer)
  // Level 10+: clustering (province/regional view - beyond city boundaries)
  if (zoomLevel <= 9) {
    // Return individual hospitals as single-item clusters
    return hospitals.map((h) => ({
      hospitals: [h],
      center: { lat: h.lat, lng: h.lng },
      stats: calculateClusterStats([h]),
    }));
  }

  // Grid size based on zoom level
  // Higher Kakao zoom level = more zoomed out = larger grid = more clustering
  // Use a smaller growth factor and cap max size to ensure ~10-15 regional clusters at max zoom
  const clusteringStrength = Math.max(1, zoomLevel - 5);
  // Cap grid size: min ~0.07 degrees (city district), max ~1.0 degrees (province)
  const latGridSize = Math.min(1.0, 0.07 * Math.pow(1.4, clusteringStrength));
  const lngGridSize = Math.min(1.2, 0.08 * Math.pow(1.4, clusteringStrength));

  const grid = new Map<string, Hospital[]>();

  hospitals.forEach((hospital) => {
    const gridLat = Math.floor(hospital.lat / latGridSize);
    const gridLng = Math.floor(hospital.lng / lngGridSize);
    const key = `${gridLat},${gridLng}`;

    if (!grid.has(key)) {
      grid.set(key, []);
    }
    grid.get(key)!.push(hospital);
  });

  const clusters: HospitalCluster[] = [];

  grid.forEach((hospitalsInCell) => {
    // Calculate center of cluster
    const totalLat = hospitalsInCell.reduce((sum, h) => sum + h.lat, 0);
    const totalLng = hospitalsInCell.reduce((sum, h) => sum + h.lng, 0);
    const centerLat = totalLat / hospitalsInCell.length;
    const centerLng = totalLng / hospitalsInCell.length;

    clusters.push({
      hospitals: hospitalsInCell,
      center: { lat: centerLat, lng: centerLng },
      stats: calculateClusterStats(hospitalsInCell),
    });
  });

  return clusters;
};

// Create donut chart HTML for cluster marker
export const createDonutClusterHtml = (stats: ClusterStats): string => {
  const { available, limited, unavailable, total, totalBeds } = stats;

  // Dynamic size based on total beds
  const size = Math.min(72, Math.max(48, 48 + Math.sqrt(totalBeds) * 1.5));
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate percentages
  const availablePercent = (available / total) * 100;
  const limitedPercent = (limited / total) * 100;
  const unavailablePercent = (unavailable / total) * 100;

  // Calculate stroke dasharray for each segment
  const availableDash = (availablePercent / 100) * circumference;
  const limitedDash = (limitedPercent / 100) * circumference;
  const unavailableDash = (unavailablePercent / 100) * circumference;

  // Colors
  const greenColor = "#10B981";
  const yellowColor = "#F59E0B";
  const redColor = "#EF4444";

  // Dominant color for center
  const dominantColor =
    available >= limited && available >= unavailable
      ? greenColor
      : limited >= unavailable
      ? yellowColor
      : redColor;

  // Offsets for each segment
  const availableOffset = 0;
  const limitedOffset = availableDash;
  const unavailableOffset = availableDash + limitedDash;

  return `
    <div class="kakao-donut-cluster" style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      cursor: pointer;
      transition: transform 0.2s ease;
    ">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
        ${
          available > 0
            ? `<circle 
            cx="${size / 2}" 
            cy="${size / 2}" 
            r="${radius}"
            fill="none"
            stroke="${greenColor}"
            stroke-width="${strokeWidth}"
            stroke-dasharray="${availableDash} ${circumference}"
            stroke-dashoffset="${-availableOffset}"
            stroke-linecap="round"
          />`
            : ""
        }
        ${
          limited > 0
            ? `<circle 
            cx="${size / 2}" 
            cy="${size / 2}" 
            r="${radius}"
            fill="none"
            stroke="${yellowColor}"
            stroke-width="${strokeWidth}"
            stroke-dasharray="${limitedDash} ${circumference}"
            stroke-dashoffset="${-limitedOffset}"
            stroke-linecap="round"
          />`
            : ""
        }
        ${
          unavailable > 0
            ? `<circle 
            cx="${size / 2}" 
            cy="${size / 2}" 
            r="${radius}"
            fill="none"
            stroke="${redColor}"
            stroke-width="${strokeWidth}"
            stroke-dasharray="${unavailableDash} ${circumference}"
            stroke-dashoffset="${-unavailableOffset}"
            stroke-linecap="round"
          />`
            : ""
        }
      </svg>
      
      <!-- Center circle with total beds -->
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
          font-size: ${Math.max(13, size / 3.5)}px;
          font-weight: 700;
          color: ${dominantColor};
        ">${totalBeds}</span>
      </div>
      
      <!-- Status dots badge -->
      <div style="
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 4px;
        background: rgba(255,255,255,0.95);
        padding: 2px 6px;
        border-radius: 10px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        white-space: nowrap;
      ">
        <div style="display: flex; align-items: center; gap: 2px;">
          <span style="width: 6px; height: 6px; background: ${greenColor}; border-radius: 50%; display: inline-block;"></span>
          <span style="font-size: 9px; font-weight: 600; color: ${greenColor};">${available}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 2px;">
          <span style="width: 6px; height: 6px; background: ${yellowColor}; border-radius: 50%; display: inline-block;"></span>
          <span style="font-size: 9px; font-weight: 600; color: ${yellowColor};">${limited}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 2px;">
          <span style="width: 6px; height: 6px; background: ${redColor}; border-radius: 50%; display: inline-block;"></span>
          <span style="font-size: 9px; font-weight: 600; color: ${redColor};">${unavailable}</span>
        </div>
      </div>
    </div>
  `;
};
