import { useState, useCallback, useMemo } from "react";
import { Search, Menu, Crosshair, Loader2, X, Phone, Navigation, Stethoscope, Baby, Thermometer, RefreshCw, Info, EyeOff } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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
} from "@/data/hospitals";
import { toast } from "@/hooks/use-toast";
import { cleanHospitalName } from "@/lib/utils";
import MapView from "@/components/MapView";
import { useRealtimeHospitals } from "@/hooks/useRealtimeHospitals";
import { useMoonlightHospitals } from "@/hooks/useMoonlightHospitals";
import RegionSelector from "@/components/RegionSelector";

const DEFAULT_CENTER: [number, number] = [37.5, 127.0]; // Seoul Capital Area center

const Index = () => {
  const { hospitals: hospitalData, isLoading: isLoadingHospitals, lastUpdated, refetch } = useRealtimeHospitals();
  const { isMoonlightHospital, isLoading: isLoadingMoonlight } = useMoonlightHospitals();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeMajorRegion, setActiveMajorRegion] = useState<MajorRegionType>("all");
  const [activeRegion, setActiveRegion] = useState<RegionType>("all");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [excludeFullHospitals, setExcludeFullHospitals] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(10);

  const filteredHospitals = useMemo(() => {
    let result = filterHospitals(hospitalData, activeFilter);
    // Override moonlight filter to use official API data
    if (activeFilter === "moonlight") {
      result = hospitalData.filter((h) => isMoonlightHospital(h.nameKr));
    }
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
    if (userLocation) {
      result = result.map((h) => ({ ...h, distance: calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng) }));
      result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return result;
  }, [activeFilter, activeRegion, searchQuery, excludeFullHospitals, userLocation, hospitalData, isMoonlightHospital]);

  const handleMajorRegionChange = useCallback((region: MajorRegionType) => {
    setActiveMajorRegion(region);
    setActiveRegion(region);
    const regionData = regionOptions.find((r) => r.id === region);
    if (regionData) {
      setMapCenter(regionData.center);
      setMapZoom(regionData.zoom || (region === "all" ? 7 : 11));
    }
  }, []);

  const handleSubRegionChange = useCallback((region: RegionType) => {
    setActiveRegion(region);
    const regionData = regionOptions.find((r) => r.id === region);
    if (regionData) {
      setMapCenter(regionData.center);
      setMapZoom(regionData.zoom || 13);
    }
  }, []);


  const handleHospitalClick = useCallback((hospital: Hospital) => {
    setSelectedHospital(hospital);
    setMapCenter([hospital.lat, hospital.lng]);
    setMapZoom(16); // Zoom in when hospital is clicked
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
          <button className="bg-white rounded-xl p-2.5 shadow-lg hover:bg-gray-50 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Filter Section */}
      <div className="absolute top-20 left-0 right-0 z-[1000] px-4 space-y-2">
        {/* Region Filter - 2-level selector */}
        <RegionSelector
          majorRegion={activeMajorRegion}
          subRegion={activeRegion}
          onMajorRegionChange={handleMajorRegionChange}
          onSubRegionChange={handleSubRegionChange}
          hospitalCount={filteredHospitals.length}
        />

        {/* Bed Type Filter Chips with Exclude Full Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
          {/* Moonlight Children's Hospital Filter */}
          <button
            onClick={() => setActiveFilter(activeFilter === "moonlight" ? "all" : "moonlight")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shadow-md transition-all flex items-center gap-1 ${
              activeFilter === "moonlight"
                ? "bg-indigo-600 text-white shadow-indigo-600/30"
                : "bg-white text-muted-foreground hover:bg-indigo-50 border border-indigo-200"
            }`}
          >
            🌙 달빛어린이병원
          </button>
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

      {/* Right Side Controls */}

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
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[1002] max-h-[80vh] overflow-y-auto"
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
                    <h2 className="text-xl font-bold text-foreground">{cleanHospitalName(selectedHospital.nameKr)}</h2>
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

                <div className="grid grid-cols-2 gap-3">
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
