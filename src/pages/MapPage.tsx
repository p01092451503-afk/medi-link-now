import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crosshair, Loader2, X, Phone, Navigation, Stethoscope, Baby, Thermometer, RefreshCw, Info, Ambulance, MapPin, Plus, Minus, Database } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import L from "leaflet";
import {
  Hospital,
  FilterType,
  filterOptions,
  filterHospitals,
  calculateDistance,
  getHospitalStatus,
  RegionType,
  MajorRegionType,
  regionOptions,
  filterHospitalsByRegion,
  findNearestMajorRegion,
  findNearestSubRegion,
} from "@/data/hospitals";
import { toast } from "@/hooks/use-toast";
import ClusteredMapView from "@/components/map/ClusteredMapView";
import RadiusChips from "@/components/map/RadiusChips";
import HospitalListPanel from "@/components/map/HospitalListPanel";
import { useRealtimeHospitals } from "@/hooks/useRealtimeHospitals";
import { useRealtimeReports } from "@/hooks/useRealtimeReports";
import { useDriverPresence, DriverPresence } from "@/hooks/useDriverPresence";
import { useHolidayPharmacies } from "@/hooks/useHolidayPharmacies";
import AmbulanceCallModal from "@/components/AmbulanceCallModal";
import RegionSelector from "@/components/RegionSelector";
import LocationCoachmark, { useLocationCoachmark } from "@/components/LocationCoachmark";
import DispatchRequestModal from "@/components/DispatchRequestModal";
import MapLegendPopup from "@/components/map/MapLegendPopup";
import RegionSummaryCard from "@/components/map/RegionSummaryCard";

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
  const { hospitals: hospitalData, isLoading: isLoadingHospitals, lastUpdated, refetch } = useRealtimeHospitals();
  const { reports: liveReports } = useRealtimeReports();
  const { nearbyDrivers } = useDriverPresence();
  const { showCoachmark, dismissCoachmark } = useLocationCoachmark();

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
  const [visibleHospitals, setVisibleHospitals] = useState<Hospital[]>([]);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [showDataSource, setShowDataSource] = useState(true);

  // Fetch holiday pharmacies when filter is set to 'pharmacy'
  const isPharmacyFilter = activeFilter === "pharmacy";
  const { pharmacies: holidayPharmacies, isLoading: isLoadingPharmacies } = useHolidayPharmacies(isPharmacyFilter);

  const handleCallDriver = useCallback((driver: DriverPresence) => {
    setSelectedDriver(driver);
    setShowDispatchModal(true);
  }, []);

  const { filteredHospitals } = useMemo(() => {
    let result = filterHospitals(hospitalData, activeFilter);
    result = filterHospitalsByRegion(result, activeRegion);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((h) => h.name.toLowerCase().includes(query) || h.nameKr.includes(query));
    }

    // Exclude full hospitals (total beds = 0)
    if (excludeFullHospitals) {
      result = result.filter((h) => {
        const totalBeds = (h.beds?.general || 0) + (h.beds?.pediatric || 0) + (h.beds?.fever || 0);
        return totalBeds > 0;
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
      result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return { filteredHospitals: result };
  }, [activeFilter, activeRegion, searchQuery, excludeFullHospitals, userLocation, hospitalData, activeRadius]);

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

  // Show message when no trauma centers in selected region and recommend nearest one
  useEffect(() => {
    if (activeFilter === "traumaCenter" && filteredHospitals.length === 0 && activeRegion !== "all") {
      const selectedRegion = regionOptions.find((r) => r.id === activeRegion);
      const regionName = selectedRegion?.labelKr || activeRegion;
      const regionCenter = selectedRegion?.center || mapCenter;
      
      // Find nearest trauma center from all hospitals
      const allTraumaCenters = hospitalData.filter((h) => h.isTraumaCenter === true);
      
      if (allTraumaCenters.length > 0) {
        // Calculate distance from region center to each trauma center
        const traumaCentersWithDistance = allTraumaCenters.map((tc) => ({
          ...tc,
          distanceFromRegion: calculateDistance(regionCenter[0], regionCenter[1], tc.lat, tc.lng),
        }));
        
        // Sort by distance and get the nearest one
        traumaCentersWithDistance.sort((a, b) => a.distanceFromRegion - b.distanceFromRegion);
        const nearest = traumaCentersWithDistance[0];
        
        // Calculate estimated arrival time (average city speed: 35 km/h)
        const estimatedMinutes = Math.round((nearest.distanceFromRegion / 35) * 60);
        const timeDisplay = estimatedMinutes < 60 
          ? `약 ${estimatedMinutes}분` 
          : `약 ${Math.floor(estimatedMinutes / 60)}시간 ${estimatedMinutes % 60}분`;
        
        toast({
          title: `${regionName}에는 외상센터가 없습니다`,
          description: `가장 가까운 외상센터: ${nearest.nameKr} (${nearest.distanceFromRegion.toFixed(1)}km, ${timeDisplay})`,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMapCenter([nearest.lat, nearest.lng]);
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
  }, [activeFilter, filteredHospitals.length, activeRegion, hospitalData, mapCenter]);


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
        
        // Detect nearest major region and sub-region from coordinates
        const nearestMajor = findNearestMajorRegion(pos.coords.latitude, pos.coords.longitude);
        const nearestSub = findNearestSubRegion(pos.coords.latitude, pos.coords.longitude, nearestMajor);
        setActiveMajorRegion(nearestMajor);
        setActiveRegion(nearestSub);
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
      toast({
        title: "전국 병원 표시",
        description: "전국의 모든 병원 마커를 표시합니다.",
      });
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
        
        // Set radius to 10km if not already set
        if (activeRadius === "all") {
          setActiveRadius(10);
          setMapZoom(getZoomForRadius(10));
        } else {
          setMapZoom(getZoomForRadius(activeRadius as number));
        }
        
        // Detect nearest major region and sub-region from coordinates
        const nearestMajor = findNearestMajorRegion(pos.coords.latitude, pos.coords.longitude);
        const nearestSub = findNearestSubRegion(pos.coords.latitude, pos.coords.longitude, nearestMajor);
        setActiveMajorRegion(nearestMajor);
        setActiveRegion(nearestSub);
        
        setIsLocating(false);
        toast({
          title: "현재 위치를 찾았습니다!",
          description: `반경 ${activeRadius === "all" ? "10" : activeRadius}km 내 병원을 표시합니다.`,
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
    setMapZoom(16);
    setIsListExpanded(false);
  }, []);

  const handleBoundsChange = useCallback((bounds: L.LatLngBounds, visible: Hospital[]) => {
    setVisibleHospitals(visible);
  }, []);

  const selectedDistance = selectedHospital && userLocation
    ? calculateDistance(userLocation[0], userLocation[1], selectedHospital.lat, selectedHospital.lng)
    : undefined;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden flex flex-col">
      {/* Location Coachmark */}
      <LocationCoachmark show={showCoachmark} onDismiss={dismissCoachmark} />

      {/* Map Container - 60% height when list expanded, 100% otherwise */}
      <div
        className="relative flex-1 transition-all duration-300"
        style={{ height: isListExpanded ? "60%" : "100%" }}
      >
        {/* Leaflet Map with Clustering */}
        <ClusteredMapView
          hospitals={isPharmacyFilter ? [] : filteredHospitals}
          onHospitalClick={handleHospitalClick}
          userLocation={userLocation}
          center={mapCenter}
          zoom={mapZoom}
          activeFilter={activeFilter}
          activeRadius={activeRadius}
          liveReports={liveReports}
          nearbyDrivers={nearbyDrivers}
          onCallDriver={handleCallDriver}
          holidayPharmacies={[]} // 휴일 약국 기능 준비중
          onBoundsChange={handleBoundsChange}
        />

        {/* Map Controls (Zoom + Legend + Location) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-2">
          {/* Zoom Controls */}
          <button
            onClick={() => setMapZoom((prev) => Math.min(prev + 1, 18))}
            className="bg-white w-10 h-10 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors border border-gray-100"
            aria-label="확대"
          >
            <Plus className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => setMapZoom((prev) => Math.max(prev - 1, 5))}
            className="bg-white w-10 h-10 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors border border-gray-100"
            aria-label="축소"
          >
            <Minus className="w-5 h-5 text-gray-700" />
          </button>

          {/* Map Legend Help Button */}
          <MapLegendPopup />

          {/* Spacer for separation */}
          <div className="h-4" />

          {/* My Location Button */}
          <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild>
              <motion.button
                onClick={handleMyLocation}
                disabled={isLocating}
                className={`relative w-12 h-12 rounded-xl shadow-xl flex items-center justify-center hover:shadow-2xl active:scale-95 transition-all border-2 border-white disabled:opacity-70 group ${
                  userLocation
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                    : "bg-gradient-to-br from-primary to-primary/80"
                }`}
                aria-label="내 위치에서 가까운 병원 찾기"
                whileTap={{ scale: 0.9 }}
                animate={!userLocation && !isLocating ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {!userLocation && !isLocating && (
                  <>
                    <motion.span
                      className="absolute inset-0 rounded-xl bg-primary"
                      animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                    />
                    <motion.span
                      className="absolute inset-0 rounded-xl bg-primary"
                      animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                    />
                  </>
                )}
                {userLocation && !isLocating && (
                  <motion.span
                    className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  </motion.span>
                )}
                {isLocating ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Crosshair className="w-6 h-6 text-white" />
                )}
              </motion.button>
            </HoverCardTrigger>
            <HoverCardContent
              side="left"
              sideOffset={16}
              className="w-auto max-w-[200px] p-3.5 bg-white shadow-2xl border-0 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                    userLocation
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                      : "bg-gradient-to-br from-primary to-primary/70"
                  }`}
                >
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

        {/* Data Source Attribution */}
        <div className="absolute top-4 right-16 z-[1002]">
          <AnimatePresence mode="wait">
            {showDataSource ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, scale: 0.9, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 10 }}
                className="flex items-center gap-2 bg-white backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg"
              >
                <Database className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="text-[11px] text-muted-foreground leading-tight">
                  <a
                    href="https://www.data.go.kr/data/15000563/openapi.do"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    공공데이터포털
                  </a>
                  <div>전국 응급의료기관 실시간 가용병상정보</div>
                  {lastUpdated && (
                    <div className="text-[10px] text-primary mt-0.5">
                      업데이트: {lastUpdated.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowDataSource(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="collapsed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setShowDataSource(true)}
                className="flex items-center justify-center w-9 h-9 bg-white backdrop-blur-sm rounded-full shadow-lg hover:bg-gray-50 active:scale-95 transition-all border border-gray-100"
                aria-label="데이터 출처 보기"
              >
                <Database className="w-4 h-4 text-primary" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-[1001] p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="bg-white rounded-xl p-2.5 shadow-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Filter Section */}
        <div className="absolute top-20 left-0 right-0 z-[999] px-4 space-y-2">
          {/* Region Filter */}
          <RegionSelector
            majorRegion={activeMajorRegion}
            subRegion={activeRegion}
            onMajorRegionChange={handleMajorRegionChange}
            onSubRegionChange={handleSubRegionChange}
            hospitalCount={filteredHospitals.length}
          />

          {/* Region Summary Card */}
          <RegionSummaryCard
            hospitals={filteredHospitals}
            regionName={activeMajorRegion === "all" ? "전국" : activeMajorRegion}
          />

          {/* Bed Type Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide items-center">
            {filterOptions
              .filter((f) => f.category === "bed" || f.category === "special")
              .map((f) => {
                const isActive = activeFilter === f.id;
                const isPharmacy = f.id === "pharmacy";
                const isTraumaCenter = f.id === "traumaCenter";

                const handleFilterClick = () => {
                  setActiveFilter(f.id);
                  // 외상센터 필터 선택 시 현재 지역 유지 (전국 뷰로 전환하지 않음)
                };

                return (
                  <button
                    key={f.id}
                    onClick={handleFilterClick}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                      isActive
                        ? isPharmacy
                          ? "bg-green-500 text-white border-green-500"
                          : isTraumaCenter
                            ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white border-purple-600 shadow-lg shadow-purple-500/30"
                            : "bg-primary text-white border-primary"
                        : isPharmacy
                          ? "bg-white/90 text-green-600 border-green-200 hover:bg-green-50"
                          : isTraumaCenter
                            ? "bg-white/90 text-purple-600 border-purple-200 hover:bg-purple-50"
                            : "bg-white/90 text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {isTraumaCenter && (
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isActive ? "bg-white/20" : "bg-purple-100"
                      }`}>
                        +
                      </span>
                    )}
                    {f.labelKr}
                    {isPharmacy && (
                      <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded">
                        준비중
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Radius Chips - Bottom left */}
        <div className="absolute bottom-4 left-4 z-[999]">
          <RadiusChips
            activeRadius={activeRadius}
            onRadiusChange={handleRadiusChange}
            userLocation={userLocation}
          />
        </div>
      </div>

      {/* Hospital List Panel - Sync with map viewport */}
      <HospitalListPanel
        hospitals={visibleHospitals.length > 0 ? visibleHospitals : filteredHospitals}
        userLocation={userLocation}
        onHospitalClick={handleHospitalClick}
        selectedHospitalId={selectedHospital?.id}
        isExpanded={isListExpanded}
        onToggleExpand={() => setIsListExpanded(!isListExpanded)}
      />

      {/* Bottom Sheet for Selected Hospital */}
      <AnimatePresence>
        {selectedHospital && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHospital(null)}
              className="fixed inset-0 bg-black/40 z-[1001]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[1002] max-h-[85dvh] overflow-y-auto"
            >
              <div className="flex justify-center py-3">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>
              <div className="px-5 pb-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    {(() => {
                      const selectedStatus = getHospitalStatus(selectedHospital);
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-2 ${
                            selectedStatus === "unavailable"
                              ? "bg-danger-light text-danger"
                              : selectedStatus === "limited"
                                ? "bg-warning/15 text-warning"
                                : "bg-success-light text-success"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full animate-pulse ${
                              selectedStatus === "unavailable"
                                ? "bg-danger"
                                : selectedStatus === "limited"
                                  ? "bg-warning"
                                  : "bg-success"
                            }`}
                          />
                          {selectedStatus === "unavailable" ? "만실" : selectedStatus === "limited" ? "혼잡" : "여유"}
                        </span>
                      );
                    })()}
                    <h2 className="text-xl font-bold text-foreground">{selectedHospital.nameKr}</h2>
                    <p className="text-sm text-muted-foreground">{selectedHospital.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedHospital.category}</p>
                    {selectedDistance && (
                      <p className="text-sm font-medium text-primary mt-1">{selectedDistance.toFixed(1)}km 거리</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedHospital(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {(() => {
                  const selectedStatus = getHospitalStatus(selectedHospital);
                  const isHospitalFull = selectedStatus === "unavailable";

                  const getBedTileStyles = (rawCount: number) => {
                    const displayCount = Math.max(0, rawCount);
                    if (displayCount > 0) {
                      return { displayCount, bg: "bg-success-light", text: "text-success" };
                    }
                    if (isHospitalFull) {
                      return { displayCount, bg: "bg-danger-light", text: "text-danger" };
                    }
                    return { displayCount, bg: "bg-muted", text: "text-muted-foreground" };
                  };

                  const bedItems = [
                    { label: "성인", count: selectedHospital.beds.general, Icon: Stethoscope, showInfo: false },
                    { label: "소아", count: selectedHospital.beds.pediatric, Icon: Baby, showInfo: false },
                    { label: "열/감염", count: selectedHospital.beds.fever, Icon: Thermometer, showInfo: true },
                  ];

                  return (
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {bedItems.map(({ label, count, Icon, showInfo }) => {
                        const { displayCount, bg, text } = getBedTileStyles(count);
                        return (
                          <div key={label} className={`flex flex-col items-center p-3 rounded-xl ${bg}`}>
                            <Icon className={`w-5 h-5 mb-1 ${text}`} />
                            <span className={`text-xl font-bold ${text}`}>{displayCount}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">{label}</span>
                              {showInfo && (
                                <span title="고열(38℃+) 및 감염 환자 전용">
                                  <Info className="w-3 h-3 text-muted-foreground" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedHospital.equipment.map((eq) => (
                    <span key={eq} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                      {eq}
                    </span>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-5">
                  <div className="flex items-center gap-3 mb-1">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="font-medium">{selectedHospital.phone}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-7">{selectedHospital.address}</p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Button onClick={() => (window.location.href = `tel:${selectedHospital.phone}`)} className="py-6 rounded-xl">
                    <Phone className="w-4 h-4 mr-2" />
                    응급실 전화
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.lat},${selectedHospital.lng}`,
                        "_blank"
                      )
                    }
                    className="py-6 rounded-xl border-primary text-primary hover:bg-primary/5"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    길안내
                  </Button>
                </div>

                {/* Call Ambulance Button */}
                <Button
                  onClick={() => setShowAmbulanceModal(true)}
                  variant="destructive"
                  className="w-full py-6 rounded-xl text-base font-semibold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                >
                  <Ambulance className="w-5 h-5 mr-2" />
                  사설 구급차 호출하기
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
    </div>
  );
};

export default MapPage;
