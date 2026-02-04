import { useEffect, useRef, useState } from "react";
import { Hospital, FilterType } from "@/data/hospitals";

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
}

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

const KakaoMapView = ({
  hospitals,
  onHospitalClick,
  userLocation,
  center,
  zoom,
  activeFilter,
}: KakaoMapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize Kakao Maps
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.error("Kakao Maps SDK not loaded");
      return;
    }

    window.kakao.maps.load(() => {
      if (!mapContainerRef.current) return;

      const options = {
        center: new window.kakao.maps.LatLng(center[0], center[1]),
        level: leafletToKakaoZoom(zoom),
      };

      const map = new window.kakao.maps.Map(mapContainerRef.current, options);
      mapRef.current = map;

      // Set bounds restriction to Korea
      const bounds = new window.kakao.maps.LatLngBounds(
        new window.kakao.maps.LatLng(KOREA_BOUNDS.sw.lat, KOREA_BOUNDS.sw.lng),
        new window.kakao.maps.LatLng(KOREA_BOUNDS.ne.lat, KOREA_BOUNDS.ne.lng)
      );

      // Initialize clusterer
      clustererRef.current = new window.kakao.maps.MarkerClusterer({
        map: map,
        averageCenter: true,
        minLevel: 5,
        disableClickZoom: false,
        styles: [
          {
            width: "50px",
            height: "50px",
            background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
            borderRadius: "25px",
            color: "#fff",
            textAlign: "center",
            fontWeight: "bold",
            lineHeight: "50px",
            fontSize: "14px",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
          },
        ],
      });

      setIsLoaded(true);
    });

    return () => {
      // Cleanup
      if (clustererRef.current) {
        clustererRef.current.clear();
      }
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
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
      const content = `
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
            animation: pulse 2s infinite;
          "></div>
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
          }
        </style>
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
    if (!mapRef.current || !isLoaded || !clustererRef.current) return;

    // Clear existing markers
    clustererRef.current.clear();
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Create new markers
    const markers = hospitals.map((hospital) => {
      const position = new window.kakao.maps.LatLng(hospital.lat, hospital.lng);
      
      // Determine marker color based on bed availability
      const totalBeds = (hospital.beds?.general || 0) + (hospital.beds?.pediatric || 0);
      let bgColor = "#22c55e"; // green
      let borderColor = "#16a34a";
      
      if (totalBeds === 0) {
        bgColor = "#ef4444"; // red
        borderColor = "#dc2626";
      } else if (totalBeds <= 3) {
        bgColor = "#eab308"; // yellow
        borderColor = "#ca8a04";
      }

      // Create custom marker
      const content = document.createElement("div");
      content.innerHTML = `
        <div class="kakao-hospital-marker" style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        ">
          <div style="
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
              color: white;
              font-size: 14px;
              font-weight: 700;
            ">${totalBeds}</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 7px solid transparent;
            border-right: 7px solid transparent;
            border-top: 8px solid ${borderColor};
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
      content.onclick = () => {
        onHospitalClick(hospital);
      };

      // Add hover effect
      content.onmouseenter = () => {
        const markerDiv = content.querySelector(".kakao-hospital-marker > div:first-child") as HTMLElement;
        if (markerDiv) markerDiv.style.transform = "scale(1.15)";
      };
      content.onmouseleave = () => {
        const markerDiv = content.querySelector(".kakao-hospital-marker > div:first-child") as HTMLElement;
        if (markerDiv) markerDiv.style.transform = "scale(1)";
      };

      return overlay;
    });

    // Add markers to clusterer
    markersRef.current = markers;
    markers.forEach((marker) => marker.setMap(mapRef.current));

    // Note: Kakao clusterer with CustomOverlay requires different approach
    // For now, show markers directly
  }, [hospitals, isLoaded, onHospitalClick, activeFilter]);

  return (
    <div 
      ref={mapContainerRef} 
      className="absolute inset-0" 
      style={{ height: "100vh", width: "100vw" }}
    />
  );
};

export default KakaoMapView;
