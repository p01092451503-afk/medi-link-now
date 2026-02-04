import { memo, useState } from "react";

interface MiniMapOverlayProps {
  center: [number, number];
  zoom: number;
  onRegionClick: (center: [number, number], zoom: number, name: string) => void;
}

// Korean provinces/metropolitan cities with approximate SVG paths and centers
const REGIONS = [
  { 
    id: "seoul", 
    name: "서울", 
    center: [37.5665, 126.978] as [number, number], 
    zoom: 12,
    path: "M38 28 L42 27 L43 30 L40 32 L37 30 Z",
    labelPos: { x: 40, y: 29 }
  },
  { 
    id: "incheon", 
    name: "인천", 
    center: [37.4563, 126.7052] as [number, number], 
    zoom: 11,
    path: "M32 28 L37 27 L38 32 L35 35 L30 32 Z",
    labelPos: { x: 34, y: 31 }
  },
  { 
    id: "gyeonggi", 
    name: "경기", 
    center: [37.4138, 127.5183] as [number, number], 
    zoom: 9,
    path: "M30 20 L50 18 L55 25 L52 35 L43 38 L35 36 L28 30 Z",
    labelPos: { x: 48, y: 28 }
  },
  { 
    id: "gangwon", 
    name: "강원", 
    center: [37.8228, 128.1555] as [number, number], 
    zoom: 9,
    path: "M50 8 L72 5 L78 20 L70 35 L55 38 L50 30 L52 18 Z",
    labelPos: { x: 62, y: 22 }
  },
  { 
    id: "chungbuk", 
    name: "충북", 
    center: [36.6357, 127.4912] as [number, number], 
    zoom: 10,
    path: "M45 38 L60 36 L65 45 L55 52 L42 48 Z",
    labelPos: { x: 52, y: 44 }
  },
  { 
    id: "chungnam", 
    name: "충남", 
    center: [36.5184, 126.8] as [number, number], 
    zoom: 10,
    path: "M22 38 L42 36 L45 48 L38 55 L20 52 L18 45 Z",
    labelPos: { x: 30, y: 46 }
  },
  { 
    id: "sejong", 
    name: "세종", 
    center: [36.4801, 127.2892] as [number, number], 
    zoom: 12,
    path: "M40 42 L45 41 L46 45 L42 47 Z",
    labelPos: { x: 43, y: 44 }
  },
  { 
    id: "daejeon", 
    name: "대전", 
    center: [36.3504, 127.3845] as [number, number], 
    zoom: 12,
    path: "M42 48 L48 47 L49 52 L44 53 Z",
    labelPos: { x: 45, y: 50 }
  },
  { 
    id: "jeonbuk", 
    name: "전북", 
    center: [35.8203, 127.1088] as [number, number], 
    zoom: 10,
    path: "M18 52 L42 50 L48 58 L42 68 L22 70 L15 60 Z",
    labelPos: { x: 30, y: 60 }
  },
  { 
    id: "gwangju", 
    name: "광주", 
    center: [35.1595, 126.8526] as [number, number], 
    zoom: 12,
    path: "M25 72 L32 71 L33 76 L27 77 Z",
    labelPos: { x: 29, y: 74 }
  },
  { 
    id: "jeonnam", 
    name: "전남", 
    center: [34.8161, 126.4629] as [number, number], 
    zoom: 9,
    path: "M8 65 L25 62 L35 68 L40 78 L35 88 L15 92 L5 82 Z",
    labelPos: { x: 20, y: 78 }
  },
  { 
    id: "gyeongbuk", 
    name: "경북", 
    center: [36.4919, 128.8889] as [number, number], 
    zoom: 9,
    path: "M55 35 L75 32 L82 45 L78 60 L60 65 L50 55 L52 42 Z",
    labelPos: { x: 65, y: 50 }
  },
  { 
    id: "daegu", 
    name: "대구", 
    center: [35.8714, 128.6014] as [number, number], 
    zoom: 11,
    path: "M62 58 L70 56 L72 62 L66 65 Z",
    labelPos: { x: 66, y: 61 }
  },
  { 
    id: "ulsan", 
    name: "울산", 
    center: [35.5384, 129.3114] as [number, number], 
    zoom: 11,
    path: "M75 62 L82 60 L85 68 L78 72 Z",
    labelPos: { x: 79, y: 66 }
  },
  { 
    id: "gyeongnam", 
    name: "경남", 
    center: [35.4606, 128.2132] as [number, number], 
    zoom: 9,
    path: "M40 68 L62 65 L75 72 L72 82 L55 88 L38 85 L35 75 Z",
    labelPos: { x: 52, y: 76 }
  },
  { 
    id: "busan", 
    name: "부산", 
    center: [35.1796, 129.0756] as [number, number], 
    zoom: 11,
    path: "M72 78 L80 75 L83 82 L76 86 Z",
    labelPos: { x: 76, y: 80 }
  },
  { 
    id: "jeju", 
    name: "제주", 
    center: [33.4996, 126.5312] as [number, number], 
    zoom: 10,
    path: "M20 95 L38 94 L40 98 L22 99 Z",
    labelPos: { x: 30, y: 97 }
  },
];

// Convert lat/lng to percentage position on the mini map
const KOREA_BOUNDS = {
  minLat: 33.0,
  maxLat: 38.8,
  minLng: 124.0,
  maxLng: 132.0,
};

const latToY = (lat: number) => {
  const normalized = (lat - KOREA_BOUNDS.minLat) / (KOREA_BOUNDS.maxLat - KOREA_BOUNDS.minLat);
  return (1 - normalized) * 100;
};

const lngToX = (lng: number) => {
  const normalized = (lng - KOREA_BOUNDS.minLng) / (KOREA_BOUNDS.maxLng - KOREA_BOUNDS.minLng);
  return normalized * 100;
};

// Get current region based on center coordinates
function getCurrentRegionId(center: [number, number]): string {
  const [lat, lng] = center;
  
  // Check each region's approximate bounds
  for (const region of REGIONS) {
    const [rLat, rLng] = region.center;
    const tolerance = region.zoom >= 11 ? 0.15 : 0.5;
    
    if (Math.abs(lat - rLat) < tolerance && Math.abs(lng - rLng) < tolerance * 1.5) {
      return region.id;
    }
  }
  
  return "";
}

const MiniMapOverlay = memo(({ center, zoom, onRegionClick }: MiniMapOverlayProps) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  
  // Only show when zoomed in (zoom > 8)
  if (zoom <= 8) return null;

  const viewX = lngToX(center[1]);
  const viewY = latToY(center[0]);
  const currentRegionId = getCurrentRegionId(center);

  const handleRegionClick = (region: typeof REGIONS[0]) => {
    onRegionClick(region.center, region.zoom, region.name);
  };

  return (
    <div className="absolute left-4 bottom-52 z-[999] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <svg
        viewBox="0 0 100 105"
        className="w-24 h-28"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
      >
        {/* Background */}
        <rect x="0" y="0" width="100" height="105" fill="#F8FAFC" />
        
        {/* Regions */}
        {REGIONS.map((region) => {
          const isHovered = hoveredRegion === region.id;
          const isCurrent = currentRegionId === region.id;
          
          return (
            <g key={region.id}>
              <path
                d={region.path}
                fill={isCurrent ? "#3B82F6" : isHovered ? "#93C5FD" : "#E2E8F0"}
                stroke={isCurrent ? "#1D4ED8" : "#94A3B8"}
                strokeWidth={isCurrent ? "1.5" : "0.5"}
                className="cursor-pointer transition-colors duration-150"
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => handleRegionClick(region)}
              />
              {/* Region label - show on hover or if it's a major city */}
              {(isHovered || isCurrent) && (
                <text
                  x={region.labelPos.x}
                  y={region.labelPos.y}
                  textAnchor="middle"
                  fontSize="5"
                  fontWeight="600"
                  fill={isCurrent ? "#FFFFFF" : "#1E40AF"}
                  className="pointer-events-none select-none"
                  style={{ textShadow: isCurrent ? "none" : "0 0 2px white" }}
                >
                  {region.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Current view indicator */}
        <circle
          cx={viewX}
          cy={viewY}
          r="2.5"
          fill="#EF4444"
          stroke="#FFFFFF"
          strokeWidth="1"
          className="pointer-events-none"
        />
      </svg>
      
      {/* Hovered region name tooltip */}
      {hoveredRegion && (
        <div className="absolute bottom-1 left-0 right-0 text-center">
          <span className="text-[9px] font-semibold text-primary bg-white/90 px-1.5 py-0.5 rounded shadow-sm">
            {REGIONS.find(r => r.id === hoveredRegion)?.name}
          </span>
        </div>
      )}
    </div>
  );
});

MiniMapOverlay.displayName = "MiniMapOverlay";

export default MiniMapOverlay;
