import { memo, useState } from "react";

interface MiniMapOverlayProps {
  center: [number, number];
  zoom: number;
  onRegionClick: (center: [number, number], zoom: number, name: string) => void;
}

// Korean provinces with accurate SVG paths based on actual geography
const REGIONS = [
  { 
    id: "seoul", 
    name: "서울", 
    center: [37.5665, 126.978] as [number, number], 
    zoom: 12,
    path: "M47.5,32.5 L50,31.5 L51.5,33 L50,35 L47,34 Z",
    color: "#6366F1"
  },
  { 
    id: "incheon", 
    name: "인천", 
    center: [37.4563, 126.7052] as [number, number], 
    zoom: 11,
    path: "M40,33 L44,31 L47,33 L46,37 L42,40 L38,38 L36,35 Z",
    color: "#8B5CF6"
  },
  { 
    id: "gyeonggi", 
    name: "경기", 
    center: [37.4138, 127.5183] as [number, number], 
    zoom: 9,
    path: "M44,24 L58,22 L64,28 L62,38 L56,42 L50,40 L46,37 L44,32 L48,30 L52,32 L54,36 L52,38 L48,36 L46,34 L50,32 L48,30 L44,32 Z M51,33 L53,32 L54,34 L52,35 Z",
    color: "#A78BFA"
  },
  { 
    id: "gangwon", 
    name: "강원", 
    center: [37.8228, 128.1555] as [number, number], 
    zoom: 9,
    path: "M58,18 L78,12 L88,18 L86,32 L80,42 L68,48 L60,44 L56,38 L58,28 L62,24 Z",
    color: "#34D399"
  },
  { 
    id: "chungbuk", 
    name: "충북", 
    center: [36.6357, 127.4912] as [number, number], 
    zoom: 10,
    path: "M52,42 L66,40 L72,48 L68,56 L58,60 L50,56 L48,48 Z",
    color: "#FBBF24"
  },
  { 
    id: "sejong", 
    name: "세종", 
    center: [36.4801, 127.2892] as [number, number], 
    zoom: 12,
    path: "M48,52 L52,51 L53,54 L50,56 Z",
    color: "#F472B6"
  },
  { 
    id: "daejeon", 
    name: "대전", 
    center: [36.3504, 127.3845] as [number, number], 
    zoom: 12,
    path: "M50,56 L55,55 L56,59 L52,61 Z",
    color: "#FB923C"
  },
  { 
    id: "chungnam", 
    name: "충남", 
    center: [36.5184, 126.8] as [number, number], 
    zoom: 10,
    path: "M28,42 L48,40 L50,48 L52,52 L50,58 L44,64 L32,66 L24,60 L22,50 Z",
    color: "#38BDF8"
  },
  { 
    id: "jeonbuk", 
    name: "전북", 
    center: [35.8203, 127.1088] as [number, number], 
    zoom: 10,
    path: "M28,64 L46,62 L54,66 L52,76 L44,82 L30,84 L22,76 L20,68 Z",
    color: "#4ADE80"
  },
  { 
    id: "gwangju", 
    name: "광주", 
    center: [35.1595, 126.8526] as [number, number], 
    zoom: 12,
    path: "M32,82 L38,80 L40,84 L36,87 Z",
    color: "#F87171"
  },
  { 
    id: "jeonnam", 
    name: "전남", 
    center: [34.8161, 126.4629] as [number, number], 
    zoom: 9,
    path: "M14,76 L30,72 L38,78 L44,84 L42,94 L32,100 L18,98 L8,90 L6,82 Z",
    color: "#2DD4BF"
  },
  { 
    id: "gyeongbuk", 
    name: "경북", 
    center: [36.4919, 128.8889] as [number, number], 
    zoom: 9,
    path: "M60,44 L78,40 L88,48 L86,64 L78,72 L68,76 L58,72 L54,62 L56,52 Z",
    color: "#A3E635"
  },
  { 
    id: "daegu", 
    name: "대구", 
    center: [35.8714, 128.6014] as [number, number], 
    zoom: 11,
    path: "M66,68 L74,66 L76,72 L72,76 L66,74 Z",
    color: "#E879F9"
  },
  { 
    id: "ulsan", 
    name: "울산", 
    center: [35.5384, 129.3114] as [number, number], 
    zoom: 11,
    path: "M80,70 L88,68 L90,76 L84,80 Z",
    color: "#FB7185"
  },
  { 
    id: "gyeongnam", 
    name: "경남", 
    center: [35.4606, 128.2132] as [number, number], 
    zoom: 9,
    path: "M44,76 L66,72 L78,78 L82,82 L78,92 L64,98 L48,96 L40,88 Z",
    color: "#60A5FA"
  },
  { 
    id: "busan", 
    name: "부산", 
    center: [35.1796, 129.0756] as [number, number], 
    zoom: 11,
    path: "M78,86 L86,82 L90,88 L86,94 L80,92 Z",
    color: "#C084FC"
  },
  { 
    id: "jeju", 
    name: "제주", 
    center: [33.4996, 126.5312] as [number, number], 
    zoom: 10,
    path: "M24,108 L42,106 L46,112 L40,116 L22,116 L18,112 Z",
    color: "#FBBF24"
  },
];

// Korea bounds for coordinate conversion
const KOREA_BOUNDS = {
  minLat: 32.5,
  maxLat: 39.0,
  minLng: 124.0,
  maxLng: 132.0,
};

const latToY = (lat: number) => {
  const normalized = (lat - KOREA_BOUNDS.minLat) / (KOREA_BOUNDS.maxLat - KOREA_BOUNDS.minLat);
  return (1 - normalized) * 120;
};

const lngToX = (lng: number) => {
  const normalized = (lng - KOREA_BOUNDS.minLng) / (KOREA_BOUNDS.maxLng - KOREA_BOUNDS.minLng);
  return normalized * 100;
};

// Get current region based on center coordinates
function getCurrentRegionId(center: [number, number]): string {
  const [lat, lng] = center;
  
  let closestRegion = "";
  let closestDist = Infinity;
  
  for (const region of REGIONS) {
    const [rLat, rLng] = region.center;
    const dist = Math.sqrt(Math.pow(lat - rLat, 2) + Math.pow(lng - rLng, 2));
    
    if (dist < closestDist) {
      closestDist = dist;
      closestRegion = region.id;
    }
  }
  
  return closestDist < 1 ? closestRegion : "";
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
    <div 
      className="absolute left-4 bottom-52 z-[999] rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.7) 100%)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
        border: "1px solid rgba(255,255,255,0.6)",
      }}
    >
      {/* Header */}
      <div 
        className="px-3 py-1.5 border-b"
        style={{ 
          borderColor: "rgba(0,0,0,0.06)",
          background: "rgba(255,255,255,0.5)"
        }}
      >
        <span className="text-[10px] font-semibold text-gray-600 tracking-wide">대한민국</span>
      </div>
      
      <div className="p-2">
        <svg
          viewBox="0 0 100 120"
          className="w-36 h-44"
        >
          {/* Subtle grid background */}
          <defs>
            <pattern id="minimap-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="0.5"/>
            </pattern>
            <filter id="region-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.15"/>
            </filter>
            <linearGradient id="current-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.9"/>
            </linearGradient>
          </defs>
          
          <rect x="0" y="0" width="100" height="120" fill="url(#minimap-grid)" />
          
          {/* Ocean hint */}
          <rect x="0" y="0" width="100" height="120" fill="rgba(147, 197, 253, 0.1)" />
          
          {/* Regions */}
          {REGIONS.map((region) => {
            const isHovered = hoveredRegion === region.id;
            const isCurrent = currentRegionId === region.id;
            
            return (
              <g key={region.id} filter={isHovered || isCurrent ? "url(#region-shadow)" : undefined}>
                <path
                  d={region.path}
                  fill={isCurrent ? "url(#current-glow)" : isHovered ? `${region.color}90` : "rgba(226, 232, 240, 0.8)"}
                  stroke={isCurrent ? "#1E40AF" : isHovered ? region.color : "rgba(148, 163, 184, 0.6)"}
                  strokeWidth={isCurrent ? "1.5" : isHovered ? "1" : "0.5"}
                  className="cursor-pointer transition-all duration-200"
                  style={{ 
                    transform: isHovered && !isCurrent ? "scale(1.02)" : "scale(1)",
                    transformOrigin: "center",
                  }}
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => handleRegionClick(region)}
                />
              </g>
            );
          })}

          {/* Current view indicator - pulsing red dot */}
          <g className="pointer-events-none">
            <circle
              cx={viewX}
              cy={viewY}
              r="6"
              fill="rgba(239, 68, 68, 0.2)"
              className="animate-ping"
            />
            <circle
              cx={viewX}
              cy={viewY}
              r="4"
              fill="#EF4444"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              style={{ filter: "drop-shadow(0 2px 4px rgba(239, 68, 68, 0.4))" }}
            />
          </g>
          
          {/* Region labels for hovered/current */}
          {REGIONS.map((region) => {
            const isHovered = hoveredRegion === region.id;
            const isCurrent = currentRegionId === region.id;
            
            if (!isHovered && !isCurrent) return null;
            
            // Calculate label position from path center
            const pathMatch = region.path.match(/M([\d.]+),([\d.]+)/);
            if (!pathMatch) return null;
            
            const labelX = parseFloat(pathMatch[1]) + 8;
            const labelY = parseFloat(pathMatch[2]) + 8;
            
            return (
              <g key={`label-${region.id}`} className="pointer-events-none">
                <rect
                  x={labelX - 10}
                  y={labelY - 5}
                  width="20"
                  height="10"
                  rx="3"
                  fill={isCurrent ? "#1E40AF" : "rgba(255,255,255,0.95)"}
                  stroke={isCurrent ? "transparent" : "rgba(0,0,0,0.1)"}
                  strokeWidth="0.5"
                />
                <text
                  x={labelX}
                  y={labelY + 3}
                  textAnchor="middle"
                  fontSize="6"
                  fontWeight="600"
                  fill={isCurrent ? "#FFFFFF" : "#374151"}
                >
                  {region.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Footer hint */}
      <div 
        className="px-3 py-1.5 border-t text-center"
        style={{ 
          borderColor: "rgba(0,0,0,0.06)",
          background: "rgba(0,0,0,0.02)"
        }}
      >
        <span className="text-[9px] text-gray-400">클릭하여 이동</span>
      </div>
    </div>
  );
});

MiniMapOverlay.displayName = "MiniMapOverlay";

export default MiniMapOverlay;
