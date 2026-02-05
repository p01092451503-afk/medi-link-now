import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Crosshair, Loader2, MapPin, Plus, Minus, Heart, Siren, Truck, Map as MapIcon } from "lucide-react";
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
import type { HospitalDetailData } from "@/hooks/useHospitalDetails";
import NightCareHospitalBottomSheet from "@/components/NightCareHospitalBottomSheet";


// Map default center (Seoul)
const DEFAULT_CENTER: [number, number] = [37.5, 127.0];

// Calculate zoom level to fit radius
const getZoomForRadius = (radiusKm: number): number => {
  if (radiusKm <= 5) return 13;
  if (radiusKm <= 10) return 12;
  if (radiusKm <= 20) return 11;
  return 10;
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
  const [selectedNightCareHospital, setSelectedNightCareHospital] = useState<HospitalDetailData | null>(null);

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

  // Fetch night care hospital data when filter is set to 'nightCare' or 'nonEmergency'
  const isNightCareFilter = activeFilter === "nightCare" || activeFilter === "nonEmergency";
  const { data: hospitalDetailsData, isLoading: isLoadingNightCare } = useHospitalDetails({
    enabled: isNightCareFilter,
  });

  // Filter night care hospitals (non-emergency only, with valid coordinates)
  const nightCareHospitals = useMemo(() => {
    if (!hospitalDetailsData) return [];
    return hospitalDetailsData.filter((h) => 
      h.hasNightCare && 
      !h.emergencyRoomType && 
      h.lat && 
      h.lng
    );
  }, [hospitalDetailsData]);

  // Create a Set of night care hospital names for efficient lookup (kept for backward compat)
  const nightCareHospitalNames = useMemo(() => {
    return new Set(nightCareHospitals.map((h) => h.hospitalName));
  }, [nightCareHospitals]);

  const handleCallDriver = useCallback((driver: DriverPresence) => {
    setSelectedDriver(driver);
    setShowDispatchModal(true);
  }, []);

  const { filteredHospitals } = useMemo(() => {
    let result = isTransferMode ? [...hospitalData] : filterHospitals(hospitalData, activeFilter);
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

    // Night care filter - hide emergency hospitals, show separate night care markers
    if (activeFilter === "nightCare" || activeFilter === "nonEmergency") {
      result = []; // Hide all emergency hospitals, show night care markers separately
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
  }, [activeFilter, activeRegion, searchQuery, excludeFullHospitals, userLocation, hospitalData, activeRadius, isTransferMode, transferFilter, nightCareHospitalNames]);

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
    // Toggle off: if location is already set, clear it and show all hospitals
    if (userLocation) {
      setUserLocation(null);
      setActiveRadius("all");
      setActiveMajorRegion("all");
      setActiveRegion("all");
      setMapCenter([36.5, 127.5]); // Center of Korea
      setMapZoom(7); // Zoom out to see whole country
      
      // Show appropriate message based on active filter
      if (activeFilter === "traumaCenter") {
        toast({
          title: "전국 외상센터 표시",
          description: "전국의 모든 권역외상센터를 표시합니다.",
        });
      } else {
        toast({
          title: "전국 병원 표시",
          description: "전국의 모든 병원 마커를 표시합니다.",
        });
      }
      return;
    }

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
        
        // Use "all" region to show nearby hospitals across boundaries
        // (radius filter handles distance-based filtering)
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
  }, [activeRadius, userLocation]);

  const handleRadiusChange = useCallback((radius: number | "all") => {
    setActiveRadius(radius);
    if (userLocation && radius !== "all") {
      setMapZoom(getZoomForRadius(radius));
      setMapCenter(userLocation);
    }
  }, [userLocation]);

  const handleHospitalClick = useCallback((hospital: Hospital) => {
    setSelectedHospital(hospital);
    setMapCenter([hospital.lat, hospital.lng]);
  }, []);


  const selectedDistance = selectedHospital && userLocation
    ? calculateDistance(userLocation[0], userLocation[1], selectedHospital.lat, selectedHospital.lng)
    : undefined;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden flex flex-col">
      {/* Location Coachmark */}
      <LocationCoachmark show={showCoachmark} onDismiss={dismissCoachmark} targetRef={locationButtonRef} />

      {/* Map Container - Full height */}
      <div className="relative flex-1 h-full">
        {/* Offline/Error Banner */}
        <OfflineBanner isQueryError={isQueryError} onRetry={refetch} />

        {/* Map View - Kakao or Leaflet */}
        {isKakao ? (
          <KakaoMapView
            hospitals={isPharmacyFilter ? [] : (isTransferMode && transferFilter === "nursing" ? [] : filteredHospitals)}
            onHospitalClick={handleHospitalClick}
            userLocation={userLocation}
            center={mapCenter}
            zoom={mapZoom}
            activeFilter={activeFilter}
            nursingHospitals={filteredNursingHospitals}
            onNursingHospitalClick={(hospital) => setSelectedNursingHospital(hospital)}
            isMoonlightMode={activeFilter === "moonlight"}
            nearbyPharmacies={[]}
            onPharmacyClick={(pharmacy) => setSelectedPharmacy(pharmacy)}
            activeAmbulanceTrips={activeAmbulanceTrips}
            onZoomChange={setMapZoom}
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
            isMoonlightMode={activeFilter === "moonlight"}
            rejectionAlerts={isDriverMode ? rejectionAlerts : undefined}
            isDriverMode={isDriverMode}
            nursingHospitals={filteredNursingHospitals}
            onNursingHospitalClick={(hospital) => setSelectedNursingHospital(hospital)}
            onZoomChange={setMapZoom}
            nightCareHospitals={isNightCareFilter ? nightCareHospitals : []}
            onNightCareHospitalClick={(hospital) => setSelectedNightCareHospital(hospital)}
          />
        )}

        {/* Zoom Controls - Vertical Slider */}
        <div className="absolute right-4 top-1/3 -translate-y-1/2 z-[1000]">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 flex flex-col items-center gap-2">
            {/* Zoom Level Display */}
            <span className="text-xs font-bold text-gray-600 tabular-nums">{mapZoom}</span>
            
            {/* Vertical Slider */}
            <div className="h-32 flex items-center justify-center">
              <input
                type="range"
                min={5}
                max={18}
                value={mapZoom}
                onChange={(e) => setMapZoom(Number(e.target.value))}
                className="h-28 w-2 appearance-none bg-gray-200 rounded-full cursor-pointer
                  [writing-mode:vertical-lr] [direction:rtl]
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-primary
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-primary
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:shadow-md
                  [&::-moz-range-thumb]:cursor-pointer"
                aria-label="줌 레벨 조절"
              />
            </div>
            
            {/* Min/Max Labels */}
            <div className="flex flex-col items-center text-[10px] text-gray-400 font-medium">
              <span>−</span>
            </div>
          </div>
        </div>

        {/* Utility Buttons (Legend + Map Toggle + Location) */}
        <div className="absolute right-4 bottom-48 z-[1000] flex flex-col gap-3">
          {/* Map Legend Help Button */}
          <MapLegendPopup size="large" />

          {/* Map Provider Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleMapProvider}
                className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300 ${
                  isKakao 
                    ? "bg-yellow-400 shadow-yellow-400/40 hover:bg-yellow-300" 
                    : "bg-white shadow-md hover:bg-gray-50 border border-gray-100"
                }`}
                aria-label="지도 전환"
              >
                <MapIcon className={`w-6 h-6 ${isKakao ? "text-yellow-800" : "text-gray-700"}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              {isKakao ? "Leaflet으로 전환" : "카카오맵으로 전환"}
            </TooltipContent>
          </Tooltip>

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
              className="w-auto max-w-[200px] p-3.5 bg-white shadow-2xl border-0 rounded-xl"
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
        <header className="absolute top-0 left-0 right-0 z-[1001] p-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-3 min-w-max">
            <button
              onClick={() => navigate("/")}
              className={`backdrop-blur-sm rounded-xl p-2.5 shadow-lg border hover:bg-white/60 transition-colors flex items-center gap-2 flex-shrink-0 ${
                isTransferMode 
                  ? "bg-violet-100/70 border-violet-200/50" 
                  : "bg-white/50 border-white/30"
              }`}
            >
              <ArrowLeft className="w-5 h-5 flex-shrink-0" />
              <span className="font-logo font-extrabold text-foreground text-sm whitespace-nowrap">Find-ER</span>
            </button>


            {/* Mode Toggle (hidden when hideMode is true) */}
            {!hideMode && <ModeToggle />}
          </div>
        </header>

        {/* Filter Chips - Single row horizontal scroll */}
        {!isTransferMode ? (
          <div className="absolute top-20 left-0 right-0 z-[999] px-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
              {filterOptions
                .filter((f) => (f.category === "bed" || f.category === "special" || f.category === "nonEmergency") && !f.parent)
                .filter((f) => f.id !== "pharmacy")
                .map((f) => {
                  const isActive = activeFilter === f.id || 
                    (f.id === "nonEmergency" && (activeFilter === "nightCare" || activeFilter === "nonEmergency"));
                  const isTraumaCenter = f.id === "traumaCenter";
                  const isMoonlight = f.id === "moonlight";
                  const isNonEmergency = f.id === "nonEmergency";

                  const handleFilterClick = () => {
                    // For nonEmergency parent, toggle to nightCare directly
                    if (f.id === "nonEmergency") {
                      setActiveFilter("nightCare");
                    } else {
                      setActiveFilter(f.id);
                    }
                    setSelectedHospital(null);
                    setSelectedPharmacy(null);
                    setSelectedNightCareHospital(null);
                  };

                  return (
                    <button
                      key={f.id}
                      onClick={handleFilterClick}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 ${
                        isActive
                          ? isTraumaCenter
                            ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md shadow-purple-500/30"
                            : isMoonlight
                              ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 shadow-md shadow-amber-500/30"
                              : isNonEmergency
                                ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/30"
                                : "bg-primary text-white shadow-md"
                          : "bg-white/70 backdrop-blur-sm text-gray-600 border border-gray-200/60 hover:bg-white/90"
                      }`}
                    >
                      {isMoonlight && <span className="text-xs">🌙</span>}
                      {isNonEmergency && <span className="text-xs">🌃</span>}
                      {isTraumaCenter && (
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isActive ? "bg-white/20" : "bg-purple-100"
                        }`}>+</span>
                      )}
                      {isNonEmergency ? "야간진료 (비응급)" : f.labelKr}
                    </button>
                  );
                })}
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
      />

      {/* Ambulance Call Modal */}
      <AmbulanceCallModal
        isOpen={showAmbulanceModal}
        onClose={() => setShowAmbulanceModal(false)}
        hospital={selectedHospital}
        distance={selectedDistance}
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

      {/* Night Care Hospital Bottom Sheet */}
      <NightCareHospitalBottomSheet
        hospital={selectedNightCareHospital}
        isOpen={!!selectedNightCareHospital}
        onClose={() => setSelectedNightCareHospital(null)}
      />

      {/* My Requests Panel - Floating */}
      <MyRequestsPanel />
    </div>
  );
};

export default MapPage;
