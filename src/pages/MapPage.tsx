import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft, Crosshair, Loader2, X, Phone, Navigation, Stethoscope, Baby, Thermometer, RefreshCw, Info, MapPin, Ambulance } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Hospital,
  FilterType,
  filterOptions,
  filterHospitals,
  calculateDistance,
  getHospitalStatus,
  RegionType,
  regionOptions,
  filterHospitalsByRegion,
} from "@/data/hospitals";
import { toast } from "@/hooks/use-toast";
import MapView from "@/components/MapView";
import { useRealtimeHospitals } from "@/hooks/useRealtimeHospitals";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AmbulanceCallModal from "@/components/AmbulanceCallModal";

const DEFAULT_CENTER: [number, number] = [37.5, 127.0];

const MapPage = () => {
  const navigate = useNavigate();
  const { hospitals: hospitalData, isLoading: isLoadingHospitals, lastUpdated, refetch } = useRealtimeHospitals();
  
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeRegion, setActiveRegion] = useState<RegionType>("all");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(10);
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);

  const filteredHospitals = useMemo(() => {
    let result = filterHospitals(hospitalData, activeFilter);
    result = filterHospitalsByRegion(result, activeRegion);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((h) => h.name.toLowerCase().includes(query) || h.nameKr.includes(query));
    }
    if (userLocation) {
      result = result.map((h) => ({ ...h, distance: calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng) }));
      result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return result;
  }, [activeFilter, activeRegion, searchQuery, userLocation, hospitalData]);

  const handleRegionChange = useCallback((region: RegionType) => {
    setActiveRegion(region);
    const regionData = regionOptions.find((r) => r.id === region);
    if (regionData) {
      setMapCenter(regionData.center);
      setMapZoom(regionData.zoom || (region === "all" ? 7 : 11));
    }
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
        setIsLocating(false);
        toast({ title: "현재 위치를 찾았습니다!" });
      },
      () => {
        setIsLocating(false);
        toast({ title: "서울 기본 위치를 사용합니다" });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const handleHospitalClick = useCallback((hospital: Hospital) => {
    setSelectedHospital(hospital);
    setMapCenter([hospital.lat, hospital.lng]);
    setMapZoom(16);
  }, []);

  const selectedDistance = selectedHospital && userLocation 
    ? calculateDistance(userLocation[0], userLocation[1], selectedHospital.lat, selectedHospital.lng) 
    : undefined;

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Leaflet Map */}
      <MapView
        hospitals={filteredHospitals}
        onHospitalClick={handleHospitalClick}
        userLocation={userLocation}
        center={mapCenter}
        zoom={mapZoom}
        activeFilter={activeFilter}
      />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[1000] p-4">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="bg-white rounded-xl p-2.5 shadow-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-lg">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-foreground hidden sm:block">Medi-Link</span>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="병원 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm shadow-lg outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </header>

      {/* Filter Section */}
      <div className="absolute top-20 left-0 right-0 z-[1000] px-4 space-y-2">
        {/* Region Filter */}
        <div className="flex items-center gap-2">
          <Select value={activeRegion} onValueChange={(value) => handleRegionChange(value as RegionType)}>
            <SelectTrigger className="w-[160px] bg-white shadow-md border-0 rounded-xl">
              <MapPin className="w-4 h-4 mr-1 text-primary" />
              <SelectValue placeholder="지역 선택" />
            </SelectTrigger>
            <SelectContent className="bg-white z-[1001] max-h-[400px]">
              {/* Major regions first */}
              {regionOptions
                .filter((r) => !r.parent)
                .map((r) => (
                  <SelectItem key={r.id} value={r.id} className="font-semibold">
                    {r.labelKr}
                  </SelectItem>
                ))}
              
              {/* Sub-regions grouped by parent */}
              {regionOptions
                .filter((r) => !r.parent && r.id !== "all" && r.id !== "sejong")
                .map((parent) => {
                  const children = regionOptions.filter((r) => r.parent === parent.id);
                  if (children.length === 0) return null;
                  return (
                    <div key={`group-${parent.id}`}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-gray-50 sticky top-0">
                        {parent.labelKr} 시/군/구
                      </div>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id} className="pl-6 text-sm">
                          {child.labelKr}
                        </SelectItem>
                      ))}
                    </div>
                  );
                })}
            </SelectContent>
          </Select>
          <span className="text-xs text-white bg-primary/80 px-2 py-1 rounded-full">
            {filteredHospitals.length}개 병원
          </span>
        </div>

        {/* Bed Type Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filterOptions
            .filter((f) => f.category === "bed")
            .map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-md transition-all ${
                  activeFilter === f.id
                    ? "bg-primary text-white shadow-primary/30"
                    : "bg-white text-muted-foreground hover:bg-gray-50"
                }`}
              >
                {f.labelKr}
              </button>
            ))}
        </div>

        {/* Procedure Availability Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <span className="px-2 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">시술:</span>
          {filterOptions
            .filter((f) => f.category === "procedure")
            .map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shadow-md transition-all ${
                  activeFilter === f.id
                    ? "bg-purple-600 text-white shadow-purple-600/30"
                    : "bg-white text-muted-foreground hover:bg-gray-50 border border-purple-200"
                }`}
              >
                {f.labelKr}
              </button>
            ))}
        </div>
      </div>

      {/* Empty State Message */}
      {filteredHospitals.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl text-center max-w-xs">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">조건에 맞는 병원이 없습니다</h3>
          <p className="text-sm text-muted-foreground mb-4">
            다른 필터를 선택하거나 검색어를 변경해 보세요.
          </p>
          <Button
            onClick={() => {
              setActiveFilter("all");
              setActiveRegion("all");
              setSearchQuery("");
            }}
            variant="outline"
            className="w-full"
          >
            필터 초기화
          </Button>
        </div>
      )}

      {/* Legend with realtime status */}
      <div className="absolute bottom-24 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-foreground">병상 현황</h4>
          <button
            onClick={() => {
              refetch();
              toast({ title: "데이터를 새로고침했습니다" });
            }}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <RefreshCw className={`w-3 h-3 text-muted-foreground ${isLoadingHospitals ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">여유</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs text-muted-foreground">혼잡</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">만실</span>
          </div>
        </div>
        {lastUpdated && (
          <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t">
            업데이트: {lastUpdated.toLocaleTimeString("ko-KR")}
          </p>
        )}
      </div>

      {/* Location FAB */}
      <button
        onClick={handleMyLocation}
        disabled={isLocating}
        className="fixed bottom-6 right-4 z-[1000] rounded-full shadow-lg p-4 bg-white border border-gray-100 hover:bg-gray-50 transition-colors disabled:opacity-70"
      >
        {isLocating ? (
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        ) : (
          <Crosshair className="w-6 h-6 text-primary" />
        )}
      </button>

      {/* Bottom Sheet */}
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
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[1002] max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-center py-3">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>
              <div className="px-5 pb-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-2 ${
                        getHospitalStatus(selectedHospital) === "unavailable"
                          ? "bg-red-100 text-red-600"
                          : getHospitalStatus(selectedHospital) === "limited"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full animate-pulse ${
                          getHospitalStatus(selectedHospital) === "unavailable"
                            ? "bg-red-500"
                            : getHospitalStatus(selectedHospital) === "limited"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      />
                      {getHospitalStatus(selectedHospital) === "unavailable"
                        ? "만실"
                        : getHospitalStatus(selectedHospital) === "limited"
                        ? "혼잡"
                        : "여유"}
                    </span>
                    <h2 className="text-xl font-bold text-foreground">{selectedHospital.nameKr}</h2>
                    <p className="text-sm text-muted-foreground">{selectedHospital.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedHospital.category}</p>
                    {selectedDistance && (
                      <p className="text-sm font-medium text-primary mt-1">
                        {selectedDistance.toFixed(1)}km 거리
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedHospital(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "성인", count: selectedHospital.beds.general, Icon: Stethoscope, showInfo: false },
                    { label: "소아", count: selectedHospital.beds.pediatric, Icon: Baby, showInfo: false },
                    { label: "열/감염", count: selectedHospital.beds.fever, Icon: Thermometer, showInfo: true },
                  ].map(({ label, count, Icon, showInfo }) => (
                    <div
                      key={label}
                      className={`flex flex-col items-center p-3 rounded-xl ${
                        count > 0 ? "bg-green-50" : "bg-red-50"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1 ${count > 0 ? "text-green-600" : "text-red-600"}`} />
                      <span className={`text-xl font-bold ${count > 0 ? "text-green-600" : "text-red-600"}`}>
                        {count}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        {showInfo && (
                          <span title="고열(38℃+) 및 감염 환자 전용">
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

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
                  <Button
                    onClick={() => (window.location.href = `tel:${selectedHospital.phone}`)}
                    className="py-6 rounded-xl"
                  >
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
    </div>
  );
};

export default MapPage;
