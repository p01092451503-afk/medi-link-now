import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Hospital, FilterType } from "@/data/hospitals";
import { Loader2 } from "lucide-react";
import type { NursingHospital } from "@/hooks/useNursingHospitals";
import type { NearbyPharmacy } from "@/hooks/useNearbyPharmacies";
import type { AmbulanceTrip } from "@/hooks/useAmbulanceTrips";

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
  nearbyPharmacies?: NearbyPharmacy[];
  onPharmacyClick?: (pharmacy: NearbyPharmacy) => void;
  activeAmbulanceTrips?: AmbulanceTrip[];
  incomingByHospital?: Map<number, number>;
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

// Cluster style calculator based on count (green theme)
const getClusterStyle = (count: number): { bg: string; border: string; size: number } => {
  if (count < 10) {
    return { bg: "#4ade80", border: "#22c55e", size: 50 }; // green-400
  } else if (count < 100) {
    return { bg: "#22c55e", border: "#16a34a", size: 60 }; // green-500
  } else {
    return { bg: "#16a34a", border: "#15803d", size: 70 }; // green-600
  }
};

// Load Kakao Maps SDK dynamically with improved retry logic
const loadKakaoSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;
    if (!apiKey) {
      reject(new Error("VITE_KAKAO_MAP_API_KEY is not configured"));
      return;
    }

    // Helper to wait for maps to be ready
    const waitForMapsReady = (timeout: number = 15000): Promise<void> => {
      return new Promise((res, rej) => {
        const startTime = Date.now();
        
        const check = () => {
          // Fully loaded
          if (window.kakao?.maps?.Map && window.kakao?.maps?.MarkerClusterer) {
            res();
            return;
          }
          
          // maps object exists but needs load() call
          if (window.kakao?.maps?.load) {
            window.kakao.maps.load(() => {
              if (window.kakao?.maps?.Map && window.kakao?.maps?.MarkerClusterer) {
                res();
              } else {
                rej(new Error("Kakao Maps load() completed but Map/Clusterer not available"));
              }
            });
            return;
          }
          
          // Timeout check
          if (Date.now() - startTime > timeout) {
            rej(new Error("Kakao Maps SDK load timeout"));
            return;
          }
          
          // Keep checking
          setTimeout(check, 100);
        };
        
        check();
      });
    };

    // If already fully loaded
    if (window.kakao?.maps?.Map && window.kakao?.maps?.MarkerClusterer) {
      resolve();
      return;
    }

    // If kakao object exists, wait for it to be ready
    if (window.kakao?.maps) {
      waitForMapsReady()
        .then(resolve)
        .catch(reject);
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
    if (existingScript) {
      waitForMapsReady()
        .then(resolve)
        .catch(reject);
      return;
    }

    // Create and load new script
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer&autoload=false`;
    script.async = true;
    
    script.onload = () => {
      waitForMapsReady(10000)
        .then(resolve)
        .catch(reject);
    };
    
    script.onerror = (e) => {
      console.error("Kakao SDK script load error:", e);
      reject(new Error("Failed to load Kakao Maps SDK script"));
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
  nearbyPharmacies = [],
  onPharmacyClick,
  activeAmbulanceTrips = [],
  incomingByHospital,
}: KakaoMapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const nursingMarkersRef = useRef<any[]>([]);
  const pharmacyMarkersRef = useRef<any[]>([]);
  const ambulanceMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(leafletToKakaoZoom(zoom));

  // Compute incoming count per hospital
  const incomingCountMap = useMemo(() => {
    const countMap = new Map<number, number>();
    activeAmbulanceTrips.forEach((trip) => {
      if (trip.status === "en_route") {
        const count = countMap.get(trip.destination_hospital_id) || 0;
        countMap.set(trip.destination_hospital_id, count + 1);
      }
    });
    return incomingByHospital || countMap;
  }, [activeAmbulanceTrips, incomingByHospital]);

  // Create hospital marker element
  const createHospitalMarkerContent = useCallback((hospital: Hospital) => {
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
          return pediatric;
        default:
          return general + pediatric + fever;
      }
    };

    const displayBeds = getFilteredBeds();
    let bgColor: string;
    let borderColor: string;
    let textColor = "white";

    if (isMoonlightMode) {
      const moonlightColors = getMoonlightColors();
      bgColor = moonlightColors.bg;
      borderColor = moonlightColors.border;
      textColor = moonlightColors.text;
    } else {
      const gradeColors = getGradeColors(hospital.emergencyGrade);
      if (gradeColors) {
        bgColor = gradeColors.bg;
        borderColor = gradeColors.border;
      } else {
        if (displayBeds === 0) {
          bgColor = "#ef4444";
          borderColor = "#dc2626";
        } else if (displayBeds <= 3) {
          bgColor = "#eab308";
          borderColor = "#ca8a04";
        } else {
          bgColor = "#22c55e";
          borderColor = "#16a34a";
        }
      }
    }

    const gradeLabel = !isMoonlightMode ? getGradeLabel(hospital.emergencyGrade) : "";
    const gradeBadgeHtml = gradeLabel
      ? `<div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.85); color: white; font-size: 9px; font-weight: 600; padding: 2px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">${gradeLabel}</div>`
      : "";

    const traumaBadgeHtml = hospital.isTraumaCenter && !isMoonlightMode
      ? `<div style="position: absolute; top: -14px; left: -14px; width: 28px; height: 28px; background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%); border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(124, 58, 237, 0.6); z-index: 10;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="10" y="4" width="4" height="16" rx="1" fill="white"/><rect x="4" y="10" width="16" height="4" rx="1" fill="white"/></svg>
        </div>`
      : "";

    const moonlightBadgeHtml = isMoonlightMode
      ? `<div style="position: absolute; top: -12px; left: -12px; width: 24px; height: 24px; background: linear-gradient(135deg, #312E81 0%, #4338CA 100%); border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(79, 70, 229, 0.5); z-index: 10;"><span style="font-size: 12px;">🌙</span></div>`
      : "";

    const incomingCount = incomingCountMap.get(hospital.id) || 0;
    const congestionBadgeHtml = incomingCount >= 3
      ? `<div class="congestion-badge" style="position: absolute; top: -32px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); color: white; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 12px; white-space: nowrap; box-shadow: 0 2px 8px rgba(139, 92, 246, 0.5); animation: kakao-float 2s ease-in-out infinite; z-index: 20;">🏃 ${incomingCount}명 이동 중</div>`
      : "";

    // Hospital name tooltip
    const tooltipGradeText = gradeLabel ? `<span style="color: #6B7280; font-size: 10px;">${gradeLabel}</span>` : "";
    
    const content = document.createElement("div");
    content.className = "kakao-hospital-marker-wrapper";
    content.style.cssText = "cursor: pointer; position: relative;";
    content.innerHTML = `
      <div class="kakao-hospital-marker" style="position: relative; display: flex; flex-direction: column; align-items: center;">
        ${congestionBadgeHtml}
        <div class="marker-tooltip" style="
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
          background: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 6px 10px;
          border-radius: 6px;
          white-space: nowrap;
          font-size: 12px;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
          z-index: 100;
          pointer-events: none;
        ">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
            <span>${hospital.name}</span>
            ${tooltipGradeText}
          </div>
          <div style="
            position: absolute;
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid rgba(0, 0, 0, 0.85);
          "></div>
        </div>
        <div class="marker-circle" style="position: relative; width: 42px; height: 42px; background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: transform 0.2s;">
          <span style="color: ${textColor}; font-size: 18px; font-weight: 800; line-height: 1;">${displayBeds}</span>
          ${isMoonlightMode ? moonlightBadgeHtml : traumaBadgeHtml}
        </div>
        <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 8px solid ${borderColor}; margin-top: -2px;"></div>
        ${gradeBadgeHtml}
      </div>
    `;

    content.addEventListener("click", (e) => {
      e.stopPropagation();
      onHospitalClick(hospital);
    });
    content.addEventListener("mouseenter", () => {
      const markerDiv = content.querySelector(".marker-circle") as HTMLElement;
      const tooltip = content.querySelector(".marker-tooltip") as HTMLElement;
      if (markerDiv) markerDiv.style.transform = "scale(1.15)";
      if (tooltip) {
        tooltip.style.opacity = "1";
        tooltip.style.visibility = "visible";
      }
    });
    content.addEventListener("mouseleave", () => {
      const markerDiv = content.querySelector(".marker-circle") as HTMLElement;
      const tooltip = content.querySelector(".marker-tooltip") as HTMLElement;
      if (markerDiv) markerDiv.style.transform = "scale(1)";
      if (tooltip) {
        tooltip.style.opacity = "0";
        tooltip.style.visibility = "hidden";
      }
    });

    return content;
  }, [activeFilter, isMoonlightMode, incomingCountMap, onHospitalClick]);

  // Initialize Kakao Maps
  useEffect(() => {
    let mounted = true;

    loadKakaoSDK()
      .then(() => {
        if (!mounted || !mapContainerRef.current) return;

        const { offsetWidth, offsetHeight } = mapContainerRef.current;
        if (offsetWidth === 0 || offsetHeight === 0) return;

        const kakaoZoom = leafletToKakaoZoom(zoom);
        const options = {
          center: new window.kakao.maps.LatLng(center[0], center[1]),
          level: kakaoZoom,
        };

        const map = new window.kakao.maps.Map(mapContainerRef.current, options);
        mapRef.current = map;
        setCurrentZoom(kakaoZoom);

        // Track zoom level changes
        window.kakao.maps.event.addListener(map, "zoom_changed", () => {
          const level = map.getLevel();
          setCurrentZoom(level);
        });

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
      // Cleanup clusterer
      if (clustererRef.current) {
        clustererRef.current.clear();
        clustererRef.current = null;
      }
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
      // Cleanup pharmacy markers
      pharmacyMarkersRef.current.forEach((marker) => {
        if (marker.setMap) marker.setMap(null);
      });
      pharmacyMarkersRef.current = [];
      // Cleanup ambulance markers
      ambulanceMarkersRef.current.forEach((marker) => {
        if (marker.setMap) marker.setMap(null);
      });
      ambulanceMarkersRef.current = [];
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

  // Update hospital markers with clustering
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    // Clear existing clusterer
    if (clustererRef.current) {
      clustererRef.current.clear();
    }

    // Clear individual markers
    markersRef.current.forEach((marker) => {
      if (marker.setMap) marker.setMap(null);
    });
    markersRef.current = [];

    // Kakao level 4 = Leaflet zoom 14 (neighborhood level)
    // At zoom level 4 or less (more zoomed in), show individual markers
    const DISABLE_CLUSTER_LEVEL = 4;
    const shouldCluster = currentZoom > DISABLE_CLUSTER_LEVEL;

    if (!shouldCluster) {
      // Show individual markers when zoomed in
      hospitals.forEach((hospital) => {
        const content = createHospitalMarkerContent(hospital);
        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(hospital.lat, hospital.lng),
          content: content,
          yAnchor: 1.2,
          xAnchor: 0.5,
        });
        overlay.setMap(mapRef.current);
        markersRef.current.push(overlay);
      });
      return;
    }

    // Create markers for clustering
    const markers = hospitals.map((hospital) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(hospital.lat, hospital.lng),
      });
      
      // Store hospital data on marker for click handling
      (marker as any)._hospitalData = hospital;
      
      // Add click event for individual marker when unclustered
      window.kakao.maps.event.addListener(marker, "click", () => {
        onHospitalClick(hospital);
      });
      
      return marker;
    });

    // Create custom cluster renderer
    const createClusterContent = (count: number) => {
      const { bg, border, size } = getClusterStyle(count);
      const content = document.createElement("div");
      content.style.cssText = `
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
      `;
      content.innerHTML = `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${bg};
          border: 3px solid ${border};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
          transition: transform 0.2s;
        ">
          <span style="
            color: white;
            font-size: ${count >= 100 ? 16 : 18}px;
            font-weight: 800;
            line-height: 1;
          ">${count}</span>
        </div>
      `;
      return content;
    };

    // Create clusterer with optimized settings
    const clusterer = new window.kakao.maps.MarkerClusterer({
      map: mapRef.current,
      markers: markers,
      gridSize: 70, // Reduced from default 60 for tighter clusters
      minLevel: DISABLE_CLUSTER_LEVEL, // Disable clustering at level 4 or lower
      disableClickZoom: false, // Enable click to zoom
      averageCenter: true,
      minClusterSize: 2, // Minimum 2 markers to form cluster
      styles: [
        // Small cluster (< 10)
        {
          width: "50px",
          height: "50px",
          background: "#4ade80",
          borderRadius: "50%",
          border: "3px solid #22c55e",
          color: "white",
          textAlign: "center",
          lineHeight: "44px",
          fontSize: "18px",
          fontWeight: "800",
          boxShadow: "0 4px 12px rgba(34, 197, 94, 0.4)",
        },
        // Medium cluster (10-99)
        {
          width: "60px",
          height: "60px",
          background: "#22c55e",
          borderRadius: "50%",
          border: "3px solid #16a34a",
          color: "white",
          textAlign: "center",
          lineHeight: "54px",
          fontSize: "18px",
          fontWeight: "800",
          boxShadow: "0 4px 12px rgba(34, 197, 94, 0.5)",
        },
        // Large cluster (100+)
        {
          width: "70px",
          height: "70px",
          background: "#16a34a",
          borderRadius: "50%",
          border: "3px solid #15803d",
          color: "white",
          textAlign: "center",
          lineHeight: "64px",
          fontSize: "16px",
          fontWeight: "800",
          boxShadow: "0 4px 12px rgba(34, 197, 94, 0.6)",
        },
      ],
      calculator: [10, 100, 200], // Cluster size breakpoints
    });

    // Add cluster click event - zoom to fit all markers in cluster
    window.kakao.maps.event.addListener(clusterer, "clusterclick", (cluster: any) => {
      const bounds = cluster.getBounds();
      const map = mapRef.current;
      
      // Get current level and calculate target level
      const currentLevel = map.getLevel();
      const targetLevel = Math.max(1, currentLevel - 2);
      
      // If already at min level, show individual markers by fitting bounds
      if (currentLevel <= DISABLE_CLUSTER_LEVEL + 1) {
        // Zoom in more aggressively
        map.setLevel(DISABLE_CLUSTER_LEVEL - 1, { anchor: cluster.getCenter() });
      } else {
        // Smooth zoom to cluster bounds
        map.setBounds(bounds, 50); // 50px padding
      }
    });

    clustererRef.current = clusterer;
  }, [hospitals, isLoaded, createHospitalMarkerContent, onHospitalClick, currentZoom]);

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

  // Update pharmacy markers
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    // Clear existing pharmacy markers
    pharmacyMarkersRef.current.forEach((marker) => {
      if (marker.setMap) marker.setMap(null);
    });
    pharmacyMarkersRef.current = [];

    // Create new pharmacy markers
    nearbyPharmacies.forEach((pharmacy) => {
      const position = new window.kakao.maps.LatLng(pharmacy.lat, pharmacy.lng);

      // Check if night pharmacy (closes after 22:00)
      const closeTime = parseInt(pharmacy.todayCloseTime || "0", 10);
      const isNight = closeTime >= 2200 || closeTime < 400;
      const isHoliday = !!(pharmacy.dutyTime7s || pharmacy.dutyTime8s);

      const bgColor = isNight 
        ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
        : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)";
      const borderColor = isNight ? "#4338ca" : "#15803d";

      const badges = [];
      if (isNight) badges.push("🌙");
      if (isHoliday) badges.push("📅");
      const badgeHtml = badges.length > 0 
        ? `<span style="position: absolute; top: -6px; right: -6px; font-size: 10px; background: white; border-radius: 10px; padding: 1px 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">${badges.join("")}</span>` 
        : "";

      const content = document.createElement("div");
      content.className = "kakao-pharmacy-marker-wrapper";
      content.style.cssText = "cursor: pointer;";
      content.innerHTML = `
        <div class="kakao-pharmacy-marker" style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <div class="marker-circle" style="
            position: relative;
            min-width: 36px;
            height: 36px;
            padding: 0 8px;
            background: ${bgColor};
            border: 3px solid ${borderColor};
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px ${isNight ? "rgba(99, 102, 241, 0.4)" : "rgba(34, 197, 94, 0.4)"};
            transition: transform 0.2s;
          ">
            <span style="font-size: 16px;">💊</span>
            ${badgeHtml}
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 10px solid ${borderColor};
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

      content.addEventListener("click", () => {
        onPharmacyClick?.(pharmacy);
      });

      content.addEventListener("mouseenter", () => {
        const markerDiv = content.querySelector(".marker-circle") as HTMLElement;
        if (markerDiv) markerDiv.style.transform = "scale(1.15)";
      });
      content.addEventListener("mouseleave", () => {
        const markerDiv = content.querySelector(".marker-circle") as HTMLElement;
        if (markerDiv) markerDiv.style.transform = "scale(1)";
      });

      overlay.setMap(mapRef.current);
      pharmacyMarkersRef.current.push(overlay);
    });
  }, [nearbyPharmacies, isLoaded, onPharmacyClick]);

  // Update ambulance trip markers
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    // Clear existing ambulance markers
    ambulanceMarkersRef.current.forEach((marker) => {
      if (marker.setMap) marker.setMap(null);
    });
    ambulanceMarkersRef.current = [];

    // Create new ambulance markers for en_route trips
    activeAmbulanceTrips
      .filter((trip) => trip.status === "en_route" && trip.current_lat && trip.current_lng)
      .forEach((trip) => {
        const position = new window.kakao.maps.LatLng(trip.current_lat!, trip.current_lng!);

        const content = document.createElement("div");
        content.className = "kakao-ambulance-marker-wrapper";
        content.innerHTML = `
          <div class="kakao-ambulance-marker" style="
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
          ">
            <div style="
              width: 36px;
              height: 36px;
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
              animation: kakao-pulse 2s infinite;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <rect x="10" y="4" width="4" height="16" rx="1"/>
                <rect x="4" y="10" width="16" height="4" rx="1"/>
              </svg>
            </div>
            <div style="
              margin-top: 2px;
              background: rgba(0,0,0,0.75);
              color: white;
              font-size: 10px;
              font-weight: 600;
              padding: 2px 6px;
              border-radius: 4px;
              white-space: nowrap;
            ">${trip.estimated_arrival_minutes ? `${trip.estimated_arrival_minutes}분` : "이송 중"}</div>
          </div>
        `;

        const overlay = new window.kakao.maps.CustomOverlay({
          position: position,
          content: content,
          yAnchor: 1,
          xAnchor: 0.5,
        });

        overlay.setMap(mapRef.current);
        ambulanceMarkersRef.current.push(overlay);
      });
  }, [activeAmbulanceTrips, isLoaded]);

  return (
    <>
      <style>{`
        @keyframes kakao-pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes kakao-float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-4px); }
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
