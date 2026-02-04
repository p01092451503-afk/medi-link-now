import { memo } from "react";

interface MiniMapOverlayProps {
  center: [number, number];
  zoom: number;
}

// Korea bounds for reference
const KOREA_BOUNDS = {
  minLat: 33.0,
  maxLat: 38.8,
  minLng: 124.0,
  maxLng: 132.0,
};

// Major cities/regions for reference points
const REGIONS = [
  { name: "서울", lat: 37.5665, lng: 126.978, abbr: "서울" },
  { name: "부산", lat: 35.1796, lng: 129.0756, abbr: "부산" },
  { name: "대구", lat: 35.8714, lng: 128.6014, abbr: "대구" },
  { name: "인천", lat: 37.4563, lng: 126.7052, abbr: "인천" },
  { name: "광주", lat: 35.1595, lng: 126.8526, abbr: "광주" },
  { name: "대전", lat: 36.3504, lng: 127.3845, abbr: "대전" },
  { name: "울산", lat: 35.5384, lng: 129.3114, abbr: "울산" },
  { name: "제주", lat: 33.4996, lng: 126.5312, abbr: "제주" },
];

const MiniMapOverlay = memo(({ center, zoom }: MiniMapOverlayProps) => {
  // Only show when zoomed in (zoom > 10)
  if (zoom <= 10) return null;

  // Convert lat/lng to percentage position on the mini map
  const latToY = (lat: number) => {
    const normalized = (lat - KOREA_BOUNDS.minLat) / (KOREA_BOUNDS.maxLat - KOREA_BOUNDS.minLat);
    return (1 - normalized) * 100; // Invert Y axis
  };

  const lngToX = (lng: number) => {
    const normalized = (lng - KOREA_BOUNDS.minLng) / (KOREA_BOUNDS.maxLng - KOREA_BOUNDS.minLng);
    return normalized * 100;
  };

  const viewX = lngToX(center[1]);
  const viewY = latToY(center[0]);

  // Calculate viewport size based on zoom level (higher zoom = smaller viewport indicator)
  const viewportSize = Math.max(4, 30 - zoom * 1.5);

  return (
    <div className="absolute left-4 bottom-52 z-[999] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-1.5 w-20 h-24 overflow-hidden">
      {/* Korea outline - simplified SVG */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
      >
        {/* Simplified Korea peninsula outline */}
        <path
          d="M45 8 L55 10 L60 15 L62 25 L58 35 L55 40 L60 45 L65 55 L70 65 L68 75 L60 82 L50 85 L42 80 L38 70 L35 60 L30 50 L28 40 L32 30 L35 20 L40 12 Z"
          fill="#E5E7EB"
          stroke="#9CA3AF"
          strokeWidth="1"
        />
        
        {/* Jeju Island */}
        <ellipse
          cx="35"
          cy="95"
          rx="8"
          ry="3"
          fill="#E5E7EB"
          stroke="#9CA3AF"
          strokeWidth="0.5"
        />

        {/* Region dots */}
        {REGIONS.map((region) => (
          <circle
            key={region.name}
            cx={lngToX(region.lng)}
            cy={latToY(region.lat)}
            r="1.5"
            fill="#9CA3AF"
            opacity="0.5"
          />
        ))}

        {/* Current view indicator - pulsing dot */}
        <circle
          cx={viewX}
          cy={viewY}
          r={viewportSize / 2}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3B82F6"
          strokeWidth="1"
        />
        <circle
          cx={viewX}
          cy={viewY}
          r="3"
          fill="#3B82F6"
          className="animate-pulse"
        />
      </svg>

      {/* Current region label */}
      <div className="absolute bottom-0.5 left-0 right-0 text-center">
        <span className="text-[8px] font-medium text-gray-500 bg-white/80 px-1 rounded">
          {getCurrentRegionName(center)}
        </span>
      </div>
    </div>
  );
});

// Get approximate region name based on coordinates
function getCurrentRegionName(center: [number, number]): string {
  const [lat, lng] = center;
  
  // Rough region detection
  if (lat > 37.4 && lng < 127.2 && lng > 126.7) return "서울";
  if (lat > 37.3 && lat < 37.6 && lng < 126.8) return "인천";
  if (lat > 37.2 && lat < 37.6 && lng > 127.0 && lng < 127.5) return "경기";
  if (lat > 37.5 && lng > 127.5) return "강원";
  if (lat > 36.2 && lat < 36.5 && lng > 127.2 && lng < 127.6) return "대전";
  if (lat > 35.7 && lat < 36.2 && lng > 128.3 && lng < 129.0) return "대구";
  if (lat > 35.0 && lat < 35.3 && lng > 128.8) return "부산";
  if (lat > 35.4 && lat < 35.7 && lng > 129.0) return "울산";
  if (lat > 34.9 && lat < 35.3 && lng < 127.0) return "광주";
  if (lat < 33.6) return "제주";
  if (lat > 36.5 && lng < 127.0) return "충남";
  if (lat > 36.5 && lng > 127.5) return "충북";
  if (lat > 35.5 && lat < 36.5 && lng < 127.5) return "전북";
  if (lat < 35.5 && lng < 127.5) return "전남";
  if (lat > 35.5 && lng > 128.5) return "경북";
  if (lat < 35.5 && lng > 127.5 && lng < 129.0) return "경남";
  
  return "대한민국";
}

MiniMapOverlay.displayName = "MiniMapOverlay";

export default MiniMapOverlay;
