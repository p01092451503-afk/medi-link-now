import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Map as MapIcon } from "lucide-react";

import SplashScreen from "@/components/SplashScreen";
import KakaoMapView from "@/components/map/KakaoMapView";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Hospital,
  FilterType,
  filterOptions,
  calculateDistance,
  regionOptions,
  filterHospitalsByRegion,
} from "@/data/hospitals";
import { toast } from "@/hooks/use-toast";
import { cleanHospitalName } from "@/lib/utils";

import ModeToggle from "@/components/ModeToggle";
import TransferFilterChips from "@/components/TransferFilterChips";
import MyRequestsPanel from "@/components/MyRequestsPanel";
import { useTransferMode } from "@/contexts/TransferModeContext";
import { useRealtimeHospitals } from "@/hooks/useRealtimeHospitals";
import { useRealtimeReports } from "@/hooks/useRealtimeReports";
import { useDriverPresence, DriverPresence } from "@/hooks/useDriverPresence";
import { useHolidayPharmacies } from "@/hooks/useHolidayPharmacies";
import { NearbyPharmacy } from "@/hooks/useNearbyPharmacies";
import { useAmbulanceTrips } from "@/hooks/useAmbulanceTrips";
import { useSharedRejectionLogs } from "@/hooks/useSharedRejectionLogs";
import { useNursingHospitals } from "@/hooks/useNursingHospitals";
import AmbulanceCallModal from "@/components/AmbulanceCallModal";
import DispatchRequestModal from "@/components/DispatchRequestModal";
import OfflineBanner from "@/components/OfflineBanner";
import PharmacyBottomSheet from "@/components/PharmacyBottomSheet";
import HospitalBottomSheet from "@/components/HospitalBottomSheet";
import NursingHospitalBottomSheet from "@/components/NursingHospitalBottomSheet";
import type { NursingHospital } from "@/hooks/useNursingHospitals";
import DemandForecastTicker from "@/components/map/DemandForecastTicker";
import PediatricSOSToggle from "@/components/PediatricSOSToggle";
import FirstAidFAB from "@/components/FirstAidFAB";
import DataSourceBadge from "@/components/DataSourceBadge";

import { useUserGeolocation } from "@/hooks/useUserGeolocation";
import { useMapFilters, getZoomForRadius, getRadiusForZoom } from "@/hooks/useMapFilters";

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

  // Data hooks
  const { hospitals: hospitalData, isLoading: isLoadingHospitals, isError: isQueryError, isRealtime, source: dataSource, lastUpdated, lastApiRefresh, refetch } = useRealtimeHospitals();
  const { reports: liveReports } = useRealtimeReports();
  const { nearbyDrivers } = useDriverPresence();
  const { trips: activeAmbulanceTrips } = useAmbulanceTrips();
  const { getActiveWarnings } = useSharedRejectionLogs();
  const { isTransferMode, transferFilter, setMode } = useTransferMode();
  const { hospitals: nursingHospitals, isLoading: isLoadingNursing } = useNursingHospitals(isTransferMode);
  const { provider: mapProvider, toggleProvider: toggleMapProvider, isKakao, setMapProvider } = useMapProvider();

  // Geolocation
  const { userLocation, setUserLocation, userDistrictName } = useUserGeolocation();

  // Filters & map state
  const mapFilters = useMapFilters(hospitalData, userLocation);
  const {
    activeFilter, setActiveFilter,
    activeMajorRegion, setActiveMajorRegion,
    activeRegion, setActiveRegion,
    searchQuery, setSearchQuery,
    activeRadius, setActiveRadius,
    isPediatricSOS, setIsPediatricSOS,
    mapCenter, setMapCenter,
    mapZoom, setMapZoom,
    filteredHospitals,
    handleMajorRegionChange: baseHandleMajorRegionChange,
    handleSubRegionChange: baseHandleSubRegionChange,
  } = mapFilters;

  // UI state
  const [kakaoFailed, setKakaoFailed] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverPresence | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<NearbyPharmacy | null>(null);
  const [selectedNursingHospital, setSelectedNursingHospital] = useState<NursingHospital | null>(null);
  const [showSplash, setShowSplash] = useState(false);

  // Region change with location reset
  const handleMajorRegionChange = useCallback((region: any) => {
    setUserLocation(null);
    setActiveRadius("all");
    baseHandleMajorRegionChange(region);
  }, [baseHandleMajorRegionChange, setUserLocation, setActiveRadius]);

  const handleSubRegionChange = useCallback((region: any) => {
    setUserLocation(null);
    setActiveRadius("all");
    baseHandleSubRegionChange(region);
  }, [baseHandleSubRegionChange, setUserLocation, setActiveRadius]);

  // Auto-set mode based on URL params
  useEffect(() => {
    if (hideMode) {
      setMode("transfer");
    } else {
      setMode("emergency");
    }
  }, [hideMode, setMode]);

  // Auto-focus on user location
  useEffect(() => {
    if (userLocation) {
      setMapCenter(userLocation);
      setActiveRadius(10);
      setMapZoom(getZoomForRadius(10));
      setActiveMajorRegion("all" as any);
      setActiveRegion("all" as any);
    }
  }, [userLocation]);

  // Rejection alerts
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

  // Pharmacy filter
  const isPharmacyFilter = activeFilter === "pharmacy";
  const { pharmacies: holidayPharmacies, isLoading: isLoadingPharmacies } = useHolidayPharmacies(isPharmacyFilter);

  const handleCallDriver = useCallback((driver: DriverPresence) => {
    setSelectedDriver(driver);
    setShowDispatchModal(true);
  }, []);

  // Filter pharmacies by region
  const filteredPharmacies = useMemo(() => {
    if (!isPharmacyFilter || holidayPharmacies.length === 0) return [];
    if (activeRegion === "all") return holidayPharmacies;
    const selectedRegion = regionOptions.find((r) => r.id === activeRegion);
    if (!selectedRegion) return holidayPharmacies;

    if (selectedRegion.parent) {
      const parentRegion = regionOptions.find((r) => r.id === selectedRegion.parent);
      const parentLabel = parentRegion?.labelKr || "";
      const simplifiedParent = parentLabel.replace("광역시", "").replace("특별시", "").replace("특별자치시", "").replace("특별자치도", "").replace("도", "");
      return holidayPharmacies.filter((p) => {
        const address = p.address || "";
        return (simplifiedParent ? address.includes(simplifiedParent) : true) && address.includes(selectedRegion.labelKr);
      });
    }

    const majorLabel = selectedRegion.labelKr || "";
    const simplifiedMajorLabel = majorLabel.replace("광역시", "").replace("특별시", "").replace("특별자치시", "").replace("특별자치도", "").replace("도", "");
    return holidayPharmacies.filter((p) => (p.address || "").includes(simplifiedMajorLabel));
  }, [isPharmacyFilter, holidayPharmacies, activeRegion]);

  // Filter nursing hospitals
  const filteredNursingHospitals = useMemo(() => {
    if (!isTransferMode || nursingHospitals.length === 0) return [];
    if (transferFilter === "hospital") return [];
    let result = [...nursingHospitals];

    if (activeRegion !== "all") {
      const selectedRegion = regionOptions.find((r) => r.id === activeRegion);
      if (selectedRegion) {
        if (selectedRegion.parent) {
          const parentRegion = regionOptions.find((r) => r.id === selectedRegion.parent);
          const parentLabel = parentRegion?.labelKr || "";
          const simplifiedParent = parentLabel.replace("광역시", "").replace("특별시", "").replace("특별자치시", "").replace("특별자치도", "").replace("도", "");
          result = result.filter((h) => {
            const address = h.address || "";
            return (simplifiedParent ? address.includes(simplifiedParent) : true) && address.includes(selectedRegion.labelKr);
          });
        } else {
          const majorLabel = selectedRegion.labelKr || "";
          const simplifiedMajorLabel = majorLabel.replace("광역시", "").replace("특별시", "").replace("특별자치시", "").replace("특별자치도", "").replace("도", "");
          result = result.filter((h) => (h.address || "").includes(simplifiedMajorLabel));
        }
      }
    }

    if (userLocation && activeRadius !== "all") {
      result = result.filter((h) => calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng) <= activeRadius);
    }

    if (userLocation) {
      result = result.map((h) => ({ ...h, distance: calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng) }));
      result.sort((a, b) => ((a as any).distance || 0) - ((b as any).distance || 0));
    }

    return result;
  }, [isTransferMode, nursingHospitals, activeRegion, userLocation, activeRadius, transferFilter]);

  // Trauma center toast
  useEffect(() => {
    if (activeFilter === "traumaCenter" && filteredHospitals.length === 0 && activeRegion !== "all") {
      const selectedRegion = regionOptions.find((r) => r.id === activeRegion);
      const regionName = selectedRegion?.labelKr || activeRegion;
      const referencePoint = userLocation || selectedRegion?.center || mapCenter;
      const isUserLocationBased = !!userLocation;
      const allTraumaCenters = hospitalData.filter((h) => h.isTraumaCenter === true);

      if (allTraumaCenters.length > 0) {
        const traumaCentersWithDistance = allTraumaCenters.map((tc) => ({
          ...tc,
          distanceFromRef: calculateDistance(referencePoint[0], referencePoint[1], tc.lat, tc.lng),
        }));
        traumaCentersWithDistance.sort((a, b) => a.distanceFromRef - b.distanceFromRef);
        const nearest = traumaCentersWithDistance[0];
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
                dismiss();
                setActiveMajorRegion("all" as any);
                setActiveRegion("all" as any);
                const offsetLat = nearest.lat - 0.015;
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

  const handleZoomChange = useCallback((zoom: number) => {
    setMapZoom(zoom);
    if (userLocation) {
      setActiveRadius(getRadiusForZoom(zoom));
    }
  }, [userLocation, setMapZoom, setActiveRadius]);

  const handleMapDragEnd = useCallback(() => {
    setActiveRadius("all");
    setActiveMajorRegion("all" as any);
    setActiveRegion("all" as any);
  }, [setActiveRadius, setActiveMajorRegion, setActiveRegion]);

  const handleHospitalClick = useCallback((hospital: Hospital) => {
    setSelectedHospital(hospital);
    setMapCenter([hospital.lat, hospital.lng]);
  }, [setMapCenter]);

  const selectedDistance = selectedHospital && userLocation
    ? calculateDistance(userLocation[0], userLocation[1], selectedHospital.lat, selectedHospital.lng)
    : undefined;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden flex flex-col !pb-0">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Map Container */}
      <div className="relative flex-1 h-full">
        {/* Data Source Badge */}
        <div className="absolute bottom-safe-1 right-2 z-[1000]">
          <DataSourceBadge
            isRealtime={isRealtime}
            source={dataSource}
            lastUpdated={lastApiRefresh || lastUpdated}
          />
        </div>

        <OfflineBanner isQueryError={isQueryError} onRetry={refetch} />

        {kakaoFailed ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="flex flex-col items-center gap-4 p-8 max-w-sm text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <MapIcon className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-foreground">카카오맵 로딩 실패</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                지도를 불러올 수 없습니다.<br />
                네트워크 연결을 확인하거나,<br />
                카카오 개발자 콘솔에서 현재 도메인이<br />
                등록되어 있는지 확인해 주세요.
              </p>
              <p className="text-xs text-muted-foreground/60 font-mono">{window.location.origin}</p>
              <Button variant="outline" size="sm" onClick={() => setKakaoFailed(false)} className="mt-2">
                다시 시도
              </Button>
            </div>
          </div>
        ) : (
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
              console.warn("[MapPage] 카카오맵 로드 실패:", error);
              setKakaoFailed(true);
            }}
          />
        )}

        {/* Zoom Controls */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[1000]">
          <div className="bg-card/10 dark:bg-card/8 backdrop-blur-sm rounded-full shadow-none border border-border/10 px-1.5 py-3 flex flex-col items-center gap-1.5">
            <button
              onClick={() => setMapZoom(Math.min(18, mapZoom + 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors text-sm font-medium"
              aria-label="확대"
            >
              +
            </button>
            <div className="h-24 flex items-center justify-center">
              <input
                type="range"
                min={5}
                max={18}
                value={mapZoom}
                onChange={(e) => setMapZoom(Number(e.target.value))}
                className="h-20 w-1 appearance-none bg-muted-foreground/20 rounded-full cursor-pointer
                  [writing-mode:vertical-lr] [direction:rtl]
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:cursor-pointer"
                aria-label="줌 레벨 조절"
              />
            </div>
            <button
              onClick={() => setMapZoom(Math.max(5, mapZoom - 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors text-sm font-medium"
              aria-label="축소"
            >
              −
            </button>
          </div>
        </div>

        {/* Header */}
        <header className="absolute top-2 left-0 right-0 z-[1001] p-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-3 min-w-max">
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center w-8 h-8 bg-card rounded-full shadow-lg border border-border text-foreground hover:bg-secondary transition-colors flex-shrink-0"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {!hideMode && <ModeToggle />}

            {!selectedHospital && !selectedNursingHospital && !selectedPharmacy && (
              <DemandForecastTicker
                regionId={activeRegion !== "all" ? activeRegion : undefined}
                userDistrictName={userDistrictName}
              />
            )}
          </div>
        </header>

        {/* Filter Chips */}
        {!isTransferMode ? (
          <div className="absolute top-[4.5rem] left-0 right-0 z-[999] px-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
              {filterOptions
                .filter((f) => (f.category === "bed" || f.category === "special") && !f.parent)
                .filter((f) => f.id !== "pharmacy")
                .map((f) => {
                  const isActive = activeFilter === f.id;
                  const isTraumaCenter = f.id === "traumaCenter";

                  const handleFilterClick = () => {
                    setActiveFilter(f.id);
                    setIsPediatricSOS(false);
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
                          : "bg-card/70 backdrop-blur-sm text-muted-foreground border border-border/60 hover:bg-card/90"
                      }`}
                      aria-label={`${f.labelKr} 필터`}
                      aria-pressed={isActive}
                    >
                      {isTraumaCenter && (
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isActive ? "bg-white/20" : "bg-purple-100 dark:bg-purple-900/50"
                        }`}>+</span>
                      )}
                      {f.labelKr}
                    </motion.button>
                  );

                  if (tooltipText) {
                    return (
                      <Tooltip key={f.id}>
                        <TooltipTrigger asChild>{chipButton}</TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[200px] text-center text-xs">
                          {tooltipText}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return chipButton;
                })}

              {!isDriverMode && !isParamedicMode && (
                <PediatricSOSToggle
                  isActive={isPediatricSOS}
                  onToggle={() => {
                    setIsPediatricSOS((prev: boolean) => {
                      const next = !prev;
                      if (next) setActiveFilter("all");
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
      </div>

      {/* Bottom Sheets & Modals */}
      <HospitalBottomSheet
        hospital={selectedHospital}
        onClose={() => setSelectedHospital(null)}
        distance={selectedDistance}
        userLocation={userLocation}
        onCallAmbulance={() => setShowAmbulanceModal(true)}
      />

      <AmbulanceCallModal
        isOpen={showAmbulanceModal}
        onClose={() => setShowAmbulanceModal(false)}
        hospital={selectedHospital}
        distance={selectedDistance}
        userLocation={userLocation}
      />

      <DispatchRequestModal
        isOpen={showDispatchModal}
        onClose={() => {
          setShowDispatchModal(false);
          setSelectedDriver(null);
        }}
        selectedDriver={selectedDriver}
        userLocation={userLocation}
      />

      <PharmacyBottomSheet
        pharmacy={selectedPharmacy}
        isOpen={!!selectedPharmacy}
        onClose={() => setSelectedPharmacy(null)}
      />

      <NursingHospitalBottomSheet
        hospital={selectedNursingHospital}
        isOpen={!!selectedNursingHospital}
        onClose={() => setSelectedNursingHospital(null)}
      />

      <MyRequestsPanel />

      {!isParamedicMode && !isDriverMode && <FirstAidFAB />}
    </div>
  );
};

export default MapPage;
