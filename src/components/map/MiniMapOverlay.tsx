import { memo, useState } from "react";

interface MiniMapOverlayProps {
  center: [number, number];
  zoom: number;
  onRegionClick: (center: [number, number], zoom: number, name: string) => void;
}

// Korean provinces with accurate SVG paths matching the peninsula shape
const REGIONS = [
  { 
    id: "seoul", 
    name: "서울", 
    center: [37.5665, 126.978] as [number, number], 
    zoom: 12,
    path: "M38,28 L42,27 L44,29 L43,32 L39,32 L37,30 Z"
  },
  { 
    id: "incheon", 
    name: "인천", 
    center: [37.4563, 126.7052] as [number, number], 
    zoom: 11,
    path: "M30,26 L36,25 L38,28 L37,32 L33,35 L28,33 L27,29 Z"
  },
  { 
    id: "gyeonggi", 
    name: "경기", 
    center: [37.4138, 127.5183] as [number, number], 
    zoom: 9,
    path: "M36,18 L52,16 L58,22 L56,32 L52,38 L44,40 L40,38 L36,34 L33,35 L28,33 L30,26 L36,25 L38,28 L43,32 L44,29 L42,27 L38,28 L37,30 L39,32 L43,32 L44,29 L42,27 L38,28 Z"
  },
  { 
    id: "gangwon", 
    name: "강원", 
    center: [37.8228, 128.1555] as [number, number], 
    zoom: 9,
    path: "M52,10 L72,6 L80,12 L78,28 L72,38 L62,44 L54,42 L52,38 L56,32 L58,22 L52,16 Z"
  },
  { 
    id: "chungbuk", 
    name: "충북", 
    center: [36.6357, 127.4912] as [number, number], 
    zoom: 10,
    path: "M44,40 L58,38 L64,44 L62,52 L54,56 L46,54 L42,48 Z"
  },
  { 
    id: "sejong", 
    name: "세종", 
    center: [36.4801, 127.2892] as [number, number], 
    zoom: 12,
    path: "M40,50 L44,49 L45,52 L42,54 Z"
  },
  { 
    id: "daejeon", 
    name: "대전", 
    center: [36.3504, 127.3845] as [number, number], 
    zoom: 12,
    path: "M44,54 L49,53 L50,57 L46,59 Z"
  },
  { 
    id: "chungnam", 
    name: "충남", 
    center: [36.5184, 126.8] as [number, number], 
    zoom: 10,
    path: "M22,40 L40,38 L42,48 L40,50 L42,54 L44,54 L46,59 L40,64 L28,66 L18,60 L16,48 Z"
  },
  { 
    id: "jeonbuk", 
    name: "전북", 
    center: [35.8203, 127.1088] as [number, number], 
    zoom: 10,
    path: "M24,66 L42,62 L52,66 L50,76 L42,82 L28,84 L20,76 L18,68 Z"
  },
  { 
    id: "gwangju", 
    name: "광주", 
    center: [35.1595, 126.8526] as [number, number], 
    zoom: 12,
    path: "M30,82 L36,80 L38,84 L34,87 Z"
  },
  { 
    id: "jeonnam", 
    name: "전남", 
    center: [34.8161, 126.4629] as [number, number], 
    zoom: 9,
    path: "M12,76 L28,72 L36,78 L30,82 L34,87 L38,84 L42,90 L36,98 L22,100 L10,94 L6,84 Z"
  },
  { 
    id: "gyeongbuk", 
    name: "경북", 
    center: [36.4919, 128.8889] as [number, number], 
    zoom: 9,
    path: "M54,42 L72,38 L82,46 L80,62 L74,70 L64,74 L56,70 L52,60 L54,52 Z"
  },
  { 
    id: "daegu", 
    name: "대구", 
    center: [35.8714, 128.6014] as [number, number], 
    zoom: 11,
    path: "M60,68 L68,66 L70,72 L66,76 L60,74 Z"
  },
  { 
    id: "ulsan", 
    name: "울산", 
    center: [35.5384, 129.3114] as [number, number], 
    zoom: 11,
    path: "M74,68 L82,66 L84,74 L78,78 Z"
  },
  { 
    id: "gyeongnam", 
    name: "경남", 
    center: [35.4606, 128.2132] as [number, number], 
    zoom: 9,
    path: "M42,76 L60,72 L66,76 L70,72 L74,68 L78,78 L76,88 L64,96 L48,94 L38,86 Z"
  },
  { 
    id: "busan", 
    name: "부산", 
    center: [35.1796, 129.0756] as [number, number], 
    zoom: 11,
    path: "M72,84 L80,80 L84,86 L80,92 L74,90 Z"
  },
  { 
    id: "jeju", 
    name: "제주", 
    center: [33.4996, 126.5312] as [number, number], 
    zoom: 10,
    path: "M22,112 L40,110 L44,116 L38,120 L20,120 L16,116 Z"
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
                  fill={isCurrent ? "url(#current-glow)" : isHovered ? "rgba(203, 213, 225, 0.9)" : "rgba(226, 232, 240, 0.7)"}
                  stroke={isCurrent ? "#1E40AF" : "rgba(148, 163, 184, 0.8)"}
                  strokeWidth={isCurrent ? "1.5" : "0.5"}
                  className="cursor-pointer transition-all duration-200"
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
