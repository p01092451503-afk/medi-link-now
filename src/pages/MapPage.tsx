import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Crosshair, Loader2, MapPin, Plus, Minus, Heart, Siren, Truck, Map as MapIcon } from "lucide-react";
import TrustBadge from "@/components/TrustBadge";
import SplashScreen from "@/components/SplashScreen";
import { useMapProvider } from "@/hooks/useMapProvider";
import KakaoMapView from "@/components/map/KakaoMapView";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import L from "leaflet";
import {
  Hospital,
  FilterType,
  filterOptions,
  filterHospitals,
  calculateDistance,
  RegionType,
  MajorRegionType,
  regionOptions,
  filterHospitalsByRegion,
  findNearestMajorRegion,
  findNearestSubRegion,
} from "@/data/hospitals";
import { toast } from "@/hooks/use-toast";
import { cleanHospitalName } from "@/lib/utils";
import ClusteredMapView from "@/components/map/ClusteredMapView";
import RadiusChips from "@/components/map/RadiusChips";
import ModeToggle from "@/components/ModeToggle";
import TransferFilterChips from "@/components/TransferFilterChips";
import MyRequestsPanel from "@/components/MyRequestsPanel";
import { useTransferMode, TransferFilterType } from "@/contexts/TransferModeContext";
import { getTransferBeds, getTotalICU } from "@/data/transferBedsMock";
import { useRealtimeHospitals } from "@/hooks/useRealtimeHospitals";
import { useRealtimeReports } from "@/hooks/useRealtimeReports";
import { useDriverPresence, DriverPresence } from "@/hooks/useDriverPresence";
import { useHolidayPharmacies } from "@/hooks/useHolidayPharmacies";
import { NearbyPharmacy } from "@/hooks/useNearbyPharmacies";
import { useAmbulanceTrips } from "@/hooks/useAmbulanceTrips";
import { useSharedRejectionLogs } from "@/hooks/useSharedRejectionLogs";
import { useNursingHospitals } from "@/hooks/useNursingHospitals";
import { useHospitalDetails } from "@/hooks/useHospitalDetails";
import AmbulanceCallModal from "@/components/AmbulanceCallModal";
import LocationCoachmark, { useLocationCoachmark } from "@/components/LocationCoachmark";
import DispatchRequestModal from "@/components/DispatchRequestModal";
import MapLegendPopup from "@/components/map/MapLegendPopup";
import OfflineBanner from "@/components/OfflineBanner";
import PharmacyBottomSheet from "@/components/PharmacyBottomSheet";
import HospitalBottomSheet from "@/components/HospitalBottomSheet";
import NursingHospitalBottomSheet from "@/components/NursingHospitalBottomSheet";
import type { NursingHospital } from "@/hooks/useNursingHospitals";
import DemandForecastTicker from "@/components/map/DemandForecastTicker";
import PediatricSOSToggle from "@/components/PediatricSOSToggle";
import FirstAidFAB from "@/components/FirstAidFAB";


// Map default center (Seoul)
const DEFAULT_CENTER: [number, number] = [37.5, 127.0];

// Calculate zoom level to fit radius
const getZoomForRadius = (radiusKm: number): number => {
  if (radiusKm <= 5) return 13;
  if (radiusKm <= 10) return 12;
  if (radiusKm <= 20) return 11;
  return 10;
};

// Reverse: get closest radius from zoom level
const getRadiusForZoom = (zoom: number): number => {
  if (zoom >= 13) return 5;
  if (zoom >= 12) return 10;
  if (zoom >= 11) return 20;
  return 30;
};

// Tooltip definitions for special filter chips
const getFilterTooltip = (filterId: string): string | null => {
  switch (filterId) {
    case "all":
      return "성인 및 소아 포함 모든 응급의료기관을 표시합니다";
    case "adult":
      return "성인 환자를 위한 일반 응급실 병상 보유 병원입니다";
    case "fever":
      return "발열·감염 환자 대응이 가능한 음압격리 병상 보유 병원입니다";
    case "moonlight":
      return "보건복지부 지정, 야간·휴일에 소아 진료를 제공하는 병원입니다";
    case "traumaCenter":
      return "중증 외상 환자를 위한 전문 치료 시설로, 권역별로 지정된 외상센터입니다";
    default:
      return null;
  }
};
const MapPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDriverMode = searchParams.get("mode") === "driver";
  const hideMode = searchParams.get("hideMode") === "true";
  const isParamedicMode = searchParams.get("role") === "paramedic";
  const { hospitals: hospitalData, isLoading: isLoadingHospitals, isError: isQueryError, lastUpdated, refetch } = useRealtimeHospitals();
  const { reports: liveReports } = useRealtimeReports();
  const { nearbyDrivers } = useDriverPresence();
  const { showCoachmark, dismissCoachmark } = useLocationCoachmark();
  const { trips: activeAmbulanceTrips } = useAmbulanceTrips();
  const { getActiveWarnings } = useSharedRejectionLogs();
  const { isTransferMode, transferFilter, setMode } = useTransferMode();
  const { hospitals: nursingHospitals, isLoading: isLoadingNursing } = useNursingHospitals(isTransferMode);
  const { provider: mapProvider, toggleProvider: toggleMapProvider, isKakao, setMapProvider } = useMapProvider();
  const [kakaoFailed, setKakaoFailed] = useState(false);
  const locationButtonRef = useRef<HTMLButtonElement>(null);

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeMajorRegion, setActiveMajorRegion] = useState<MajorRegionType>("seoul");
  const [activeRegion, setActiveRegion] = useState<RegionType>("seoul");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(10);
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverPresence | null>(null);
  const [excludeFullHospitals, setExcludeFullHospitals] = useState(false);
  const [activeRadius, setActiveRadius] = useState<number | "all">("all");
  const [selectedPharmacy, setSelectedPharmacy] = useState<NearbyPharmacy | null>(null);
  const [selectedNursingHospital, setSelectedNursingHospital] = useState<NursingHospital | null>(null);
  const [isPediatricSOS, setIsPediatricSOS] = useState(false);
  const [userDistrictName, setUserDistrictName] = useState<string | undefined>(undefined);

  const [showSplash, setShowSplash] = useState(false);

  // Reverse geocode user location to get district name
  useEffect(() => {
    if (!userLocation) {
      setUserDistrictName(undefined);
      return;
    }
    
    const [lat, lng] = userLocation;
    
    // Use Kakao geocoder if available
    if ((window as any).kakao?.maps?.services) {
      const kakaoApi = (window as any).kakao;
      const geocoder = new kakaoApi.maps.services.Geocoder();
      geocoder.coord2RegionCode(lng, lat, (result: any, status: any) => {
        if (status === kakaoApi.maps.services.Status.OK && result.length > 0) {
          // Find the H (행정동) type first, fall back to B (법정동)
          const region = result.find((r: any) => r.region_type === "H") || result[0];
          // region_2depth_name = 구/군 name (e.g. "강남구", "수원시 장안구")
          const districtName = region.region_2depth_name || region.region_1depth_name;
          setUserDistrictName(districtName);
        }
      });
    } else {
      // Fallback: use Nominatim reverse geocoding when Kakao SDK is not available
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=ko`)
        .then(res => res.json())
        .then(data => {
          const addr = data?.address;
          // Try city_district (구), city, county, town in order
          const districtName = addr?.city_district || addr?.borough || addr?.city || addr?.county || addr?.town || addr?.suburb;
          if (districtName) {
            setUserDistrictName(districtName);
          }
        })
        .catch(err => {
          console.error('Reverse geocoding fallback failed:', err);
        });
    }
  }, [userLocation]);

  // Auto-set mode based on URL params
  useEffect(() => {
    if (hideMode) {
      setMode("transfer");
    } else {
      // Reset to emergency mode when entering without hideMode (guardian/patient mode)
      setMode("emergency");
    }
  }, [hideMode, setMode]);

  // Get rejection alerts for hospitals - convert to RejectionAlertInfo format
  const rejectionAlerts = useMemo(() => {
    const warnings = getActiveWarnings();
    const alerts = new Map<number, { severity: 'none' | 'warning' | 'critical'; count: number; reasons?: string[] }>();
    
    warnings.forEach((status, hospitalId) => {
      alerts.set(hospitalId, {
        severity: status.severity,
        count: status.recentCount,
        reasons: status.reasons,
      });
    });
    
    return alerts;
  }, [getActiveWarnings]);

  // Fetch holiday pharmacies when filter is set to 'pharmacy' (legacy)
  const isPharmacyFilter = activeFilter === "pharmacy";
  const { pharmacies: holidayPharmacies, isLoading: isLoadingPharmacies } = useHolidayPharmacies(isPharmacyFilter);

  const handleCallDriver = useCallback((driver: DriverPresence) => {
    setSelectedDriver(driver);
    setShowDispatchModal(true);
  }, []);

  const { filteredHospitals } = useMemo(() => {
    let result = isTransferMode ? [...hospitalData] : filterHospitals(hospitalData, activeFilter);
    
    // Pediatric SOS mode: filter to only pediatric-capable hospitals
    if (isPediatricSOS && !isTransferMode) {
      result = result.filter((h) => h.beds.pediatric > 0);
    }
    result = filterHospitalsByRegion(result, activeRegion);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((h) => h.name.toLowerCase().includes(query) || h.nameKr.includes(query));
    }

    // Exclude full hospitals (total beds = 0)
    if (excludeFullHospitals && !isTransferMode) {
      result = result.filter((h) => {
        const totalBeds = (h.beds?.general || 0) + (h.beds?.pediatric || 0) + (h.beds?.fever || 0);
        return totalBeds > 0;
      });
    }

    // Transfer mode filtering based on transfer filter
    if (isTransferMode && transferFilter !== "all") {
      result = result.filter((h) => {
        const transferBeds = getTransferBeds(h.id);
        switch (transferFilter) {
          case "hospital":
            // Show hospitals with any available transfer beds
            return (transferBeds.icuGeneral + transferBeds.icuNeuro + transferBeds.icuCardio + transferBeds.ward + transferBeds.isolation) > 0;
          default:
            return true;
        }
      });
    }

    // Filter by radius if set and user location available
    if (userLocation && activeRadius !== "all") {
      result = result.filter((h) => {
        const distance = calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng);
        return distance <= activeRadius;
      });
    }

    // Add distance and sort
    if (userLocation) {
      result = result.map((h) => ({
        ...h,
        distance: calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng),
      }));
      
      // In transfer mode, sort by total ICU first, then distance
      if (isTransferMode) {
        result.sort((a, b) => {
          const icuA = getTotalICU(getTransferBeds(a.id));
          const icuB = getTotalICU(getTransferBeds(b.id));
          if (icuB !== icuA) return icuB - icuA; // Higher ICU first
          return (a.distance || 0) - (b.distance || 0);
        });
      } else {
        result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
    } else if (isTransferMode) {
      // Even without location, sort by ICU in transfer mode
      result.sort((a, b) => {
        const icuA = getTotalICU(getTransferBeds(a.id));
        const icuB = getTotalICU(getTransferBeds(b.id));
        return icuB - icuA;
      });
    }

    return { filteredHospitals: result };
  }, [activeFilter, activeRegion, searchQuery, excludeFullHospitals, userLocation, hospitalData, activeRadius, isTransferMode, transferFilter, isPediatricSOS]);

  // Filter holiday pharmacies by selected region
  const filteredPharmacies = useMemo(() => {
    if (!isPharmacyFilter || holidayPharmacies.length === 0) return [];
    if (activeRegion === "all") return holidayPharmacies;

    const selectedRegion = regionOptions.find((r) => r.id === activeRegion);
    if (!selectedRegion) return holidayPharmacies;

    // If it's a sub-region, filter by both parent and sub-region
    if (selectedRegion.parent) {
      const parentRegion = regionOptions.find((r) => r.id === selectedRegion.parent);
      const parentLabel = parentRegion?.labelKr || "";
      const simplifiedParent = parentLabel.replace("광역시", "").replace("특별시", "").replace("특별자치시", "").replace("특별자치도", "").replace("도", "");

      return holidayPharmacies.filter((p) => {
        const address = p.address || "";
        const hasParentRegion = simplifiedParent ? address.includes(simplifiedParent) : true;
        const hasSubRegion = address.includes(selectedRegion.labelKr);
        return hasParentRegion && hasSubRegion;
      });
    }

    // Major region filtering
    const majorLabel = selectedRegion.labelKr || "";
    const simplifiedMajorLabel = majorLabel.replace("광역시", "").replace("특별시", "").replace("특별자치시", "").replace("특별자치도", "").replace("도", "");

    return holidayPharmacies.filter((p) => {
      const address = p.address || "";
      return address.includes(simplifiedMajorLabel);
    });
  }, [isPharmacyFilter, holidayPharmacies, activeRegion]);

  // Filter nursing hospitals by region and distance
  const filteredNursingHospitals = useMemo(() => {
    if (!isTransferMode || nursingHospitals.length === 0) return [];
    
    // Hide nursing hospitals when hospital or any hospital sub-filter is selected
    if (transferFilter === "hospital") return [];
    
    let result = [...nursingHospitals];
    
    // Filter by region if not "all"
    if (activeRegion !== "all") {
      const selectedRegion = regionOptions.find((r) => r.id === activeRegion);
      if (selectedRegion) {
        if (selectedRegion.parent) {
          // Sub-region filtering
          const parentRegion = regionOptions.find((r) => r.id === selectedRegion.parent);
          const parentLabel = parentRegion?.labelKr || "";
          const simplifiedParent = parentLabel.replace("광역시", "").replace("특별시", "").replace("특별자치시", "").replace("특별자치도", "").replace("도", "");
          
          result = result.filter((h) => {
            const address = h.address || "";
            const hasParentRegion = simplifiedParent ? address.includes(simplifiedParent) : true;
            const hasSubRegion = address.includes(selectedRegion.labelKr);
            return hasParentRegion && hasSubRegion;
          });
        } else {
          // Major region filtering
          const majorLabel = selectedRegion.labelKr || "";
          const simplifiedMajorLabel = majorLabel.replace("광역시", "").replace("특별시", "").replace("특별자치시", "").replace("특별자치도", "").replace("도", "");
          
          result = result.filter((h) => {
            const address = h.address || "";
            return address.includes(simplifiedMajorLabel);
          });
        }
      }
    }
    
    // Filter by radius if set and user location available
    if (userLocation && activeRadius !== "all") {
      result = result.filter((h) => {
        const distance = calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng);
        return distance <= activeRadius;
      });
    }
    
    // Add distance and sort by proximity
    if (userLocation) {
      result = result.map((h) => ({
        ...h,
        distance: calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng),
      }));
      result.sort((a, b) => ((a as any).distance || 0) - ((b as any).distance || 0));
    }
    
    return result;
  }, [isTransferMode, nursingHospitals, activeRegion, userLocation, activeRadius, transferFilter]);

  // Show message when no trauma centers in selected region and recommend nearest one
  useEffect(() => {
    if (activeFilter === "traumaCenter" && filteredHospitals.length === 0 && activeRegion !== "all") {
      const selectedRegion = regionOptions.find((r) => r.id === activeRegion);
      const regionName = selectedRegion?.labelKr || activeRegion;
      
      // Use user location if available, otherwise fall back to region center
      const referencePoint = userLocation || selectedRegion?.center || mapCenter;
      const isUserLocationBased = !!userLocation;
      
      // Find nearest trauma center from all hospitals
      const allTraumaCenters = hospitalData.filter((h) => h.isTraumaCenter === true);
      
      if (allTraumaCenters.length > 0) {
        // Calculate distance from reference point to each trauma center
        const traumaCentersWithDistance = allTraumaCenters.map((tc) => ({
          ...tc,
          distanceFromRef: calculateDistance(referencePoint[0], referencePoint[1], tc.lat, tc.lng),
        }));
        
        // Sort by distance and get the nearest one
        traumaCentersWithDistance.sort((a, b) => a.distanceFromRef - b.distanceFromRef);
        const nearest = traumaCentersWithDistance[0];
        
        // Calculate estimated arrival time (average city speed: 35 km/h)
        const estimatedMinutes = Math.round((nearest.distanceFromRef / 35) * 60);
        const timeDisplay = estimatedMinutes < 60 
          ? `약 ${estimatedMinutes}분` 
          : `약 ${Math.floor(estimatedMinutes / 60)}시간 ${estimatedMinutes % 60}분`;
        
        const locationLabel = isUserLocationBased ? "내 위치에서" : `${regionName}에서`;
        
        const { dismiss } = toast({
          title: `${regionName}에는 외상센터가 없습니다`,
          description: `${locationLabel} 가장 가까운 외상센터: ${cleanHospitalName(nearest.nameKr)} (${nearest.distanceFromRef.toFixed(1)}km, ${timeDisplay})`,
          duration: 8000,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // 토스트 즉시 닫기
                dismiss();
                // 지역 필터를 전체로 변경하여 외상센터가 표시되도록 함
                setActiveMajorRegion("all");
                setActiveRegion("all");
                // 바텀시트가 화면 하단 약 40%를 차지하므로, 마커가 가려지지 않도록
                // 지도 중심을 마커 위치보다 약간 아래로 이동 (위도 감소)
                const offsetLat = nearest.lat - 0.015; // 마커를 화면 상단 쪽으로 배치
                setMapCenter([offsetLat, nearest.lng]);
                setMapZoom(14);
                setSelectedHospital(nearest);
              }}
            >
              바로가기
            </Button>
          ),
        });
      } else {
        toast({
          title: "외상센터 없음",
          description: `${regionName}에는 권역외상센터가 없습니다.`,
          variant: "destructive",
        });
      }
    }
  }, [activeFilter, filteredHospitals.length, activeRegion, hospitalData, mapCenter, userLocation]);


  const handleMajorRegionChange = useCallback((region: MajorRegionType) => {
    setActiveMajorRegion(region);
    setActiveRegion(region);
    
    // Clear user location and radius when manually selecting a region
    setUserLocation(null);
    setActiveRadius("all");
    
    const regionData = regionOptions.find((r) => r.id === region);
    if (regionData) {
      setMapCenter(regionData.center);
      setMapZoom(regionData.zoom || 11);
    }
  }, []);

  const handleSubRegionChange = useCallback((region: RegionType) => {
    setActiveRegion(region);
    
    // Clear user location and radius when manually selecting a sub-region
    setUserLocation(null);
    setActiveRadius("all");
    
    const regionData = regionOptions.find((r) => r.id === region);
    if (regionData) {
      setMapCenter(regionData.center);
      setMapZoom(regionData.zoom || 13);
    }
  }, []);

  // Auto-focus: Get user location on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLocation: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(newLocation);
        setMapCenter(newLocation);
        setActiveRadius(10); // Default 10km radius
        setMapZoom(getZoomForRadius(10));
        
        // When location is active, use "all" region to show nearby hospitals
        // across administrative boundaries (radius filter handles distance)
        setActiveMajorRegion("all");
        setActiveRegion("all");
      },
      () => {
        // Silently fail on initial auto-location
        console.log("Auto-location failed, using default center");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ title: "위치 서비스를 사용할 수 없습니다" });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLocation: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(newLocation);
        setMapCenter(newLocation);
        
        // Always set radius to 10km as default when clicking "My Location"
        setActiveRadius(10);
        setMapZoom(getZoomForRadius(10));
        
        setActiveMajorRegion("all");
        setActiveRegion("all");
        
        setIsLocating(false);
        toast({
          title: "현재 위치를 찾았습니다!",
          description: "반경 10km 내 병원을 표시합니다.",
        });
      },
      () => {
        setIsLocating(false);
        toast({ title: "위치를 찾을 수 없습니다" });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const handleRadiusChange = useCallback((radius: number | "all") => {
    setActiveRadius(radius);
    if (userLocation && radius !== "all") {
      setMapZoom(getZoomForRadius(radius));
      setMapCenter(userLocation);
    }
  }, [userLocation]);

  // Sync radius chip when map zoom changes (via pinch/scroll/slider)
  const handleZoomChange = useCallback((zoom: number) => {
    setMapZoom(zoom);
    if (userLocation) {
      const newRadius = getRadiusForZoom(zoom);
      setActiveRadius(newRadius);
    }
  }, [userLocation]);

  // When user drags/pans the map, remove radius filter so all hospitals in view appear
  const handleMapDragEnd = useCallback((newCenter: [number, number]) => {
    setActiveRadius("all");
    setActiveMajorRegion("all");
    setActiveRegion("all");
  }, []);

  const handleHospitalClick = useCallback((hospital: Hospital) => {
    setSelectedHospital(hospital);
    setMapCenter([hospital.lat, hospital.lng]);
  }, []);


  const selectedDistance = selectedHospital && userLocation
    ? calculateDistance(userLocation[0], userLocation[1], selectedHospital.lat, selectedHospital.lng)
    : undefined;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden flex flex-col">
      {/* Splash Screen */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}


      {/* Location Coachmark */}
      <LocationCoachmark show={showCoachmark} onDismiss={dismissCoachmark} targetRef={locationButtonRef} />

      {/* Map Container - Full height */}
      <div className="relative flex-1 h-full">
        {/* Trust Badge */}
        <TrustBadge />

        {/* Offline/Error Banner */}
        <OfflineBanner isQueryError={isQueryError} onRetry={refetch} />

        {/* Map View - Kakao or Leaflet (auto-fallback on Kakao failure) */}
        {isKakao && !kakaoFailed ? (
          <KakaoMapView
            hospitals={isPharmacyFilter ? [] : (isTransferMode && transferFilter === "nursing" ? [] : filteredHospitals)}
            onHospitalClick={handleHospitalClick}
            userLocation={userLocation}
            center={mapCenter}
            zoom={mapZoom}
            activeFilter={activeFilter}
            nursingHospitals={filteredNursingHospitals}
            onNursingHospitalClick={(hospital) => setSelectedNursingHospital(hospital)}
            isMoonlightMode={false}
            isPediatricSOS={isPediatricSOS}
            nearbyPharmacies={[]}
            onPharmacyClick={(pharmacy) => setSelectedPharmacy(pharmacy)}
            activeAmbulanceTrips={activeAmbulanceTrips}
            onZoomChange={handleZoomChange}
            onDragEnd={handleMapDragEnd}
            onLoadError={(error) => {
              console.warn("[MapPage] 카카오맵 로드 실패, Leaflet으로 전환:", error);
              setKakaoFailed(true);
              toast({
                title: "카카오맵 로드 실패",
                description: "기본 지도(Leaflet)로 자동 전환되었습니다.",
                duration: 3000,
              });
            }}
          />
        ) : (
          <ClusteredMapView
            hospitals={isPharmacyFilter ? [] : (isTransferMode && transferFilter === "nursing" ? [] : filteredHospitals)}
            onHospitalClick={handleHospitalClick}
            userLocation={userLocation}
            center={mapCenter}
            zoom={mapZoom}
            activeFilter={activeFilter}
            activeRadius={activeRadius}
            liveReports={liveReports}
            nearbyDrivers={nearbyDrivers}
            onCallDriver={handleCallDriver}
            holidayPharmacies={[]}
            nearbyPharmacies={[]}
            onPharmacyClick={(pharmacy) => setSelectedPharmacy(pharmacy)}
            activeAmbulanceTrips={activeAmbulanceTrips}
            isMoonlightMode={false}
            isPediatricSOS={isPediatricSOS}
            rejectionAlerts={isDriverMode ? rejectionAlerts : undefined}
            isDriverMode={isDriverMode}
            nursingHospitals={filteredNursingHospitals}
            onNursingHospitalClick={(hospital) => setSelectedNursingHospital(hospital)}
            onZoomChange={handleZoomChange}
          />
        )}

        {/* Zoom Controls - Slim Vertical Slider */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[1000]">
          <div className="bg-card/10 dark:bg-card/8 backdrop-blur-sm rounded-full shadow-none border border-border/10 px-1.5 py-3 flex flex-col items-center gap-1.5">
            {/* Zoom In */}
            <button
              onClick={() => setMapZoom(Math.min(18, mapZoom + 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors text-sm font-medium"
              aria-label="확대"
            >
              +
            </button>
            
            {/* Vertical Slider */}
            <div className="h-24 flex items-center justify-center">
              <input
                type="range"
                min={5}
                max={18}
                value={mapZoom}
                onChange={(e) => setMapZoom(Number(e.target.value))}
                className="h-20 w-1 appearance-none bg-muted-foreground/20 rounded-full cursor-pointer
                  [writing-mode:vertical-lr] [direction:rtl]
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3.5
                  [&::-webkit-slider-thumb]:h-3.5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-primary
                  [&::-webkit-slider-thumb]:shadow-sm
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-moz-range-thumb]:w-3.5
                  [&::-moz-range-thumb]:h-3.5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-primary
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:shadow-sm
                  [&::-moz-range-thumb]:cursor-pointer"
                aria-label="줌 레벨 조절"
              />
            </div>
            
            {/* Zoom Out */}
            <button
              onClick={() => setMapZoom(Math.max(5, mapZoom - 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors text-sm font-medium"
              aria-label="축소"
            >
              −
            </button>
          </div>
        </div>

        {/* Utility Buttons (Legend + Map Toggle + Location) */}
        <div className="absolute right-4 bottom-32 z-[1000] flex flex-col gap-3">
          {/* My Location Button - Apple Maps style */}
          <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild>
              <motion.button
                ref={locationButtonRef}
                onClick={handleMyLocation}
                disabled={isLocating}
                className={`relative w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300 disabled:opacity-70 overflow-hidden ${
                  userLocation
                    ? "bg-emerald-500 shadow-emerald-500/40"
                    : "bg-primary shadow-primary/20"
                }`}
                aria-label="내 위치에서 가까운 병원 찾기"
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {/* Soft glow background animation when inactive */}
                {!userLocation && !isLocating && (
                  <motion.div
                    className="absolute inset-0 bg-white/20 rounded-2xl"
                    animate={{ 
                      scale: [1, 1.15, 1],
                      opacity: [0.3, 0.1, 0.3]
                    }}
                    transition={{ 
                      duration: 2.5, 
                      repeat: Infinity, 
                      ease: "easeInOut"
                    }}
                  />
                )}
                
                {/* Active state indicator */}
                {userLocation && !isLocating && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                
                {/* Icon */}
                {isLocating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-6 h-6 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    animate={userLocation ? { scale: [1, 0.9, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Crosshair className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </motion.div>
                )}
              </motion.button>
            </HoverCardTrigger>
            <HoverCardContent
              side="left"
              sideOffset={16}
              className="w-auto max-w-[200px] p-3.5 bg-card shadow-2xl border border-border rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">
                    {userLocation ? "위치 확인됨" : "내 주변 병원 찾기"}
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {userLocation
                      ? "탭하여 해제하면\n전국 병원을 표시합니다"
                      : "탭하면 가까운 응급실을\n거리순으로 안내합니다"}
                  </p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

        {/* Data Source removed - update time moved to RadiusChips */}

        {/* Header */}
        <header className="absolute top-5 left-0 right-0 z-[1001] p-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-3 min-w-max">
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center w-8 h-8 bg-card rounded-full shadow-lg border border-border text-foreground hover:bg-secondary transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>


            {/* Mode Toggle (hidden when hideMode is true) */}
            {!hideMode && <ModeToggle />}



           {/* 119 Stats Button */}
           {!selectedHospital && !selectedNursingHospital && !selectedPharmacy && (
              <DemandForecastTicker 
                regionId={activeRegion !== "all" ? activeRegion : undefined}
                userDistrictName={userDistrictName}
              />
           )}
          </div>
        </header>

        {/* Filter Chips - Single row horizontal scroll */}
        {!isTransferMode ? (
          <div className="absolute top-[5.5rem] left-0 right-0 z-[999] px-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
              {filterOptions
                .filter((f) => (f.category === "bed" || f.category === "special") && !f.parent)
                .filter((f) => f.id !== "pharmacy")
                .map((f) => {
                  const isActive = activeFilter === f.id;
                  const isTraumaCenter = f.id === "traumaCenter";

                  const handleFilterClick = () => {
                    setActiveFilter(f.id);
                    setIsPediatricSOS(false); // Auto-disable pediatric SOS when switching filters
                    setSelectedHospital(null);
                    setSelectedPharmacy(null);
                  };

                    const tooltipText = getFilterTooltip(f.id);
                    const chipButton = (
                    <motion.button
                      key={f.id}
                      onClick={handleFilterClick}
                      whileTap={{ scale: 0.95 }}
                      animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 ${
                        isActive
                          ? isTraumaCenter
                            ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md shadow-purple-500/30"
                            : "bg-primary text-white shadow-md"
                          : "bg-white/70 backdrop-blur-sm text-gray-600 border border-gray-200/60 hover:bg-white/90"
                      }`}
                    >
                      {isTraumaCenter && (
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isActive ? "bg-white/20" : "bg-purple-100"
                        }`}>+</span>
                      )}
                      {f.labelKr}
                    </motion.button>
                    );

                    if (tooltipText) {
                      return (
                        <Tooltip key={f.id}>
                          <TooltipTrigger asChild>
                            {chipButton}
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[200px] text-center text-xs">
                            {tooltipText}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return chipButton;
                })}

              {/* Pediatric SOS Toggle - placed after filter chips */}
              {!isDriverMode && !isParamedicMode && (
                <PediatricSOSToggle
                  isActive={isPediatricSOS}
                  onToggle={() => {
                    setIsPediatricSOS(prev => {
                      const next = !prev;
                      if (next) {
                        // Entering pediatric SOS: reset filter to "all" for full coverage
                        setActiveFilter("all");
                      }
                      return next;
                    });
                    setSelectedHospital(null);
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <TransferFilterChips />
        )}

        {/* Radius Chips - Capsule style, hidden when hospital selected */}
        {!selectedHospital && !selectedNursingHospital && (
          <div className="absolute bottom-[40px] left-4 z-[999]">
            <RadiusChips
              activeRadius={activeRadius}
              onRadiusChange={handleRadiusChange}
              userLocation={userLocation}
              lastUpdated={lastUpdated}
            />
          </div>
        )}
      </div>


      {/* Bottom Sheet for Selected Hospital */}
      <HospitalBottomSheet
        hospital={selectedHospital}
        onClose={() => setSelectedHospital(null)}
        distance={selectedDistance}
        userLocation={userLocation}
        onCallAmbulance={() => setShowAmbulanceModal(true)}
      />

      {/* Ambulance Call Modal */}
      <AmbulanceCallModal
        isOpen={showAmbulanceModal}
        onClose={() => setShowAmbulanceModal(false)}
        hospital={selectedHospital}
        distance={selectedDistance}
        userLocation={userLocation}
      />

      {/* Dispatch Request Modal */}
      <DispatchRequestModal
        isOpen={showDispatchModal}
        onClose={() => {
          setShowDispatchModal(false);
          setSelectedDriver(null);
        }}
        selectedDriver={selectedDriver}
        userLocation={userLocation}
      />

      {/* Pharmacy Bottom Sheet */}
      <PharmacyBottomSheet
        pharmacy={selectedPharmacy}
        isOpen={!!selectedPharmacy}
        onClose={() => setSelectedPharmacy(null)}
      />

      {/* Nursing Hospital Bottom Sheet */}
      <NursingHospitalBottomSheet
        hospital={selectedNursingHospital}
        isOpen={!!selectedNursingHospital}
        onClose={() => setSelectedNursingHospital(null)}
      />

      {/* My Requests Panel - Floating */}
      <MyRequestsPanel />

      {/* First Aid Guide FAB - for guardians/patients */}
      {!isParamedicMode && !isDriverMode && <FirstAidFAB />}
    </div>
  );
};

export default MapPage;
