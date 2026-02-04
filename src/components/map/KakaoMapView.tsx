import { useEffect, useRef, useState } from "react";
import { Hospital, FilterType } from "@/data/hospitals";
import { Loader2 } from "lucide-react";
import type { NursingHospital } from "@/hooks/useNursingHospitals";

declare global {
  interface Window {
    kakao: any;
  }
}

interface KakaoMapViewProps {
  hospitals: Hospital[];
  onHospitalClick: (hospital: Hospital) => void;
  userLocation: [number, number] | null;
  center: [number, number];
  zoom: number;
  activeFilter: FilterType;
  nursingHospitals?: NursingHospital[];
  onNursingHospitalClick?: (hospital: NursingHospital) => void;
  isMoonlightMode?: boolean;
}

// Get marker colors based on emergency grade
const getGradeColors = (emergencyGrade?: string | null) => {
  switch (emergencyGrade) {
    case "regional_center":
      return { bg: "#DC2626", border: "#B91C1C" }; // red
    case "local_center":
      return { bg: "#F97316", border: "#EA580C" }; // orange
    case "local_institution":
      return { bg: "#2563EB", border: "#1D4ED8" }; // blue
    default:
      return null; // use status-based colors
  }
};

// Moonlight colors - pastel yellow
const getMoonlightColors = () => ({
  bg: "#FEF3C7",
  border: "#F59E0B",
  text: "#92400E",
});

// Get grade label for badge
const getGradeLabel = (emergencyGrade?: string | null): string => {
  switch (emergencyGrade) {
    case "regional_center":
      return "권역";
    case "local_center":
      return "지역센터";
    case "local_institution":
      return "지역기관";
    default:
      return "";
  }
};

// Convert Leaflet zoom (0-18) to Kakao zoom (1-14, inverted)
const leafletToKakaoZoom = (leafletZoom: number): number => {
  // Leaflet zoom 13 ≈ Kakao zoom 5
  // Leaflet zoom 10 ≈ Kakao zoom 8
  const kakaoZoom = Math.max(1, Math.min(14, 18 - leafletZoom));
  return kakaoZoom;
};

// South Korea bounds
const KOREA_BOUNDS = {
  sw: { lat: 33.0, lng: 124.0 },
  ne: { lat: 38.8, lng: 132.0 },
};

// Load Kakao Maps SDK dynamically
const loadKakaoSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;
    if (!apiKey) {
      reject(new Error("VITE_KAKAO_MAP_API_KEY is not configured"));
      return;
    }

    // If SDK is already fully loaded and initialized
    if (window.kakao && window.kakao.maps && window.kakao.maps.Map) {
      resolve();
      return;
    }

    // If kakao object exists but maps not fully initialized
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => resolve());
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkLoaded);
          window.kakao.maps.load(() => resolve());
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkLoaded);
        reject(new Error("Kakao Maps SDK load timeout"));
      }, 10000);
      return;
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer&autoload=false`;
    script.async = true;
    
    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => resolve());
      } else {
        reject(new Error("Kakao Maps SDK failed to initialize"));
      }
    };
    
    script.onerror = () => {
      reject(new Error("Failed to load Kakao Maps SDK"));
    };

    document.head.appendChild(script);
  });
};

const KakaoMapView = ({
  hospitals,
  onHospitalClick,
  userLocation,
  center,
  zoom,
  activeFilter,
  nursingHospitals = [],
  onNursingHospitalClick,
  isMoonlightMode = false,
}: KakaoMapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const nursingMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize Kakao Maps
  useEffect(() => {
    let mounted = true;

    loadKakaoSDK()
      .then(() => {
        if (!mounted || !mapContainerRef.current) return;

        const { offsetWidth, offsetHeight } = mapContainerRef.current;
        if (offsetWidth === 0 || offsetHeight === 0) return;

        const options = {
          center: new window.kakao.maps.LatLng(center[0], center[1]),
          level: leafletToKakaoZoom(zoom),
        };

        const map = new window.kakao.maps.Map(mapContainerRef.current, options);
        mapRef.current = map;

        // Add zoom control
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        setIsLoaded(true);
      })
      .catch((error) => {
        console.error("Kakao Maps error:", error);
        if (mounted) {
          setLoadError(error.message);
        }
      });

    return () => {
      mounted = false;
      // Cleanup markers
      markersRef.current.forEach((marker) => {
        if (marker.setMap) marker.setMap(null);
      });
      markersRef.current = [];
      // Cleanup nursing markers
      nursingMarkersRef.current.forEach((marker) => {
        if (marker.setMap) marker.setMap(null);
      });
      nursingMarkersRef.current = [];
    };
  }, []);

  // Update center and zoom when props change
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    const newCenter = new window.kakao.maps.LatLng(center[0], center[1]);
    mapRef.current.setCenter(newCenter);
    mapRef.current.setLevel(leafletToKakaoZoom(zoom));
  }, [center, zoom, isLoaded]);

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const position = new window.kakao.maps.LatLng(userLocation[0], userLocation[1]);
      
      // Create user location marker with custom overlay
      const content = document.createElement("div");
      content.innerHTML = `
        <div style="
          position: relative;
          width: 24px;
          height: 24px;
        ">
          <div style="
            position: absolute;
            width: 24px;
            height: 24px;
            background: #3B82F6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
          "></div>
          <div style="
            position: absolute;
            width: 40px;
            height: 40px;
            left: -8px;
            top: -8px;
            background: rgba(59, 130, 246, 0.2);
            border-radius: 50%;
            animation: kakao-pulse 2s infinite;
          "></div>
        </div>
      `;

      const overlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 0.5,
        xAnchor: 0.5,
      });

      overlay.setMap(mapRef.current);
      userMarkerRef.current = overlay;
    }
  }, [userLocation, isLoaded]);

  // Update hospital markers
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      if (marker.setMap) marker.setMap(null);
    });
    markersRef.current = [];

    // Create new markers
    hospitals.forEach((hospital) => {
      const position = new window.kakao.maps.LatLng(hospital.lat, hospital.lng);
      
      // Calculate display beds based on active filter
      const getFilteredBeds = (): number => {
        const general = Math.max(0, hospital.beds?.general || 0);
        const pediatric = Math.max(0, hospital.beds?.pediatric || 0);
        const fever = Math.max(0, hospital.beds?.fever || 0);

        switch (activeFilter) {
          case "adult":
            return general;
          case "pediatric":
            return pediatric;
          case "fever":
            return fever;
          case "moonlight":
            return pediatric; // moonlight shows pediatric beds
          default:
            return general + pediatric + fever;
        }
      };

      const displayBeds = getFilteredBeds();
      let bgColor: string;
      let borderColor: string;
      let textColor = "white";

      if (isMoonlightMode) {
        // Moonlight mode - pastel yellow
        const moonlightColors = getMoonlightColors();
        bgColor = moonlightColors.bg;
        borderColor = moonlightColors.border;
        textColor = moonlightColors.text;
      } else {
        // Check emergency grade colors first
        const gradeColors = getGradeColors(hospital.emergencyGrade);
        if (gradeColors) {
          bgColor = gradeColors.bg;
          borderColor = gradeColors.border;
        } else {
          // Default status-based colors
          if (displayBeds === 0) {
            bgColor = "#ef4444"; // red
            borderColor = "#dc2626";
          } else if (displayBeds <= 3) {
            bgColor = "#eab308"; // yellow
            borderColor = "#ca8a04";
          } else {
            bgColor = "#22c55e"; // green
            borderColor = "#16a34a";
          }
        }
      }

      // Grade label badge (only for non-moonlight mode)
      const gradeLabel = !isMoonlightMode ? getGradeLabel(hospital.emergencyGrade) : "";
      const gradeBadgeHtml = gradeLabel
        ? `<div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.85);
            color: white;
            font-size: 9px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          ">${gradeLabel}</div>`
        : "";

      // Trauma center badge (purple + icon)
      const traumaBadgeHtml = hospital.isTraumaCenter && !isMoonlightMode
        ? `<div style="
            position: absolute;
            top: -14px;
            left: -14px;
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%);
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 10px rgba(124, 58, 237, 0.6);
            z-index: 10;
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="10" y="4" width="4" height="16" rx="1" fill="white"/>
              <rect x="4" y="10" width="16" height="4" rx="1" fill="white"/>
            </svg>
          </div>`
        : "";

      // Moonlight badge (moon icon)
      const moonlightBadgeHtml = isMoonlightMode
        ? `<div style="
            position: absolute;
            top: -12px;
            left: -12px;
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #312E81 0%, #4338CA 100%);
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(79, 70, 229, 0.5);
            z-index: 10;
          ">
            <span style="font-size: 12px;">🌙</span>
          </div>`
        : "";

      // Create custom marker element
      const content = document.createElement("div");
      content.className = "kakao-hospital-marker-wrapper";
      content.style.cssText = "cursor: pointer;";
      content.innerHTML = `
        <div class="kakao-hospital-marker" style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <div class="marker-circle" style="
            position: relative;
            width: 42px;
            height: 42px;
            background: ${bgColor};
            border: 2px solid ${borderColor};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: transform 0.2s;
          ">
            <span style="
              color: ${textColor};
              font-size: 18px;
              font-weight: 800;
              line-height: 1;
            ">${displayBeds}</span>
            ${isMoonlightMode ? moonlightBadgeHtml : traumaBadgeHtml}
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 7px solid transparent;
            border-right: 7px solid transparent;
            border-top: 8px solid ${borderColor};
            margin-top: -2px;
          "></div>
          ${gradeBadgeHtml}
        </div>
      `;

      const overlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1.2,
        xAnchor: 0.5,
      });

      // Add click event
      content.addEventListener("click", () => {
        onHospitalClick(hospital);
      });

      // Add hover effect
      content.addEventListener("mouseenter", () => {
        const markerDiv = content.querySelector(".marker-circle") as HTMLElement;
        if (markerDiv) markerDiv.style.transform = "scale(1.15)";
      });
      content.addEventListener("mouseleave", () => {
        const markerDiv = content.querySelector(".marker-circle") as HTMLElement;
        if (markerDiv) markerDiv.style.transform = "scale(1)";
      });

      overlay.setMap(mapRef.current);
      markersRef.current.push(overlay);
    });
  }, [hospitals, isLoaded, onHospitalClick, isMoonlightMode, activeFilter]);

  // Update nursing hospital markers
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    // Clear existing nursing markers
    nursingMarkersRef.current.forEach((marker) => {
      if (marker.setMap) marker.setMap(null);
    });
    nursingMarkersRef.current = [];

    // Create new nursing hospital markers
    nursingHospitals.forEach((hospital) => {
      const position = new window.kakao.maps.LatLng(hospital.lat, hospital.lng);

      // Create custom marker element (purple with "요양" text)
      const content = document.createElement("div");
      content.className = "kakao-nursing-marker-wrapper";
      content.style.cssText = "cursor: pointer;";
      content.innerHTML = `
        <div class="kakao-nursing-marker" style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <div class="marker-circle" style="
            width: 42px;
            height: 42px;
            background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
            border: 2px solid #7C3AED;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
            transition: transform 0.2s;
          ">
            <span style="
              color: white;
              font-size: 14px;
              font-weight: 700;
              line-height: 1;
            ">요양</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 7px solid transparent;
            border-right: 7px solid transparent;
            border-top: 8px solid #7C3AED;
            margin-top: -2px;
          "></div>
        </div>
      `;

      const overlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1.2,
        xAnchor: 0.5,
      });

      // Add click event
      content.addEventListener("click", () => {
        onNursingHospitalClick?.(hospital);
      });

      // Add hover effect
      content.addEventListener("mouseenter", () => {
        const markerDiv = content.querySelector(".marker-circle") as HTMLElement;
        if (markerDiv) markerDiv.style.transform = "scale(1.15)";
      });
      content.addEventListener("mouseleave", () => {
        const markerDiv = content.querySelector(".marker-circle") as HTMLElement;
        if (markerDiv) markerDiv.style.transform = "scale(1)";
      });

      overlay.setMap(mapRef.current);
      nursingMarkersRef.current.push(overlay);
    });
  }, [nursingHospitals, isLoaded, onNursingHospitalClick]);

  return (
    <>
      <style>{`
        @keyframes kakao-pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
      {/* Always render container so ref is available */}
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0" 
        style={{ height: "100vh", width: "100vw" }}
      />
      {/* Loading overlay */}
      {!isLoaded && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            <p className="text-sm text-gray-600">카카오맵 로딩 중...</p>
          </div>
        </div>
      )}
      {/* Error overlay */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center p-6">
            <p className="text-red-500 font-semibold mb-2">카카오맵 로드 실패</p>
            <p className="text-sm text-gray-500">{loadError}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default KakaoMapView;
