import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Ambulance, Users, MapPin, Clock, Shield, Phone, Activity, Bed, Hospital, TrendingUp, Navigation, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRealtimeHospitals } from "@/hooks/useRealtimeHospitals";
import { useMemo, useState, useEffect } from "react";
import { getHospitalStatus, findNearestMajorRegion, findNearestSubRegion, filterHospitalsByRegion, regionOptions } from "@/data/hospitals";
import { toast } from "@/hooks/use-toast";
import PartnerSection from "@/components/PartnerSection";


const Landing = () => {
  const navigate = useNavigate();
  const { hospitals, isLoading, lastUpdated } = useRealtimeHospitals();
  const [activeTab, setActiveTab] = useState<"national" | "local" | "compare">("national");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Get user location when switching to local tab
  const handleLocalTab = () => {
    if (activeTab === "local") return;
    
    if (!userLocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);
          
          // Find nearest region
          const majorRegion = findNearestMajorRegion(coords[0], coords[1]);
          const subRegion = findNearestSubRegion(coords[0], coords[1], majorRegion);
          
          // Get region display name
          const subRegionOption = regionOptions.find(r => r.id === subRegion);
          const majorRegionOption = regionOptions.find(r => r.id === majorRegion);
          setUserRegion(subRegionOption?.labelKr || majorRegionOption?.labelKr || "내 지역");
          
          setIsLocating(false);
          setActiveTab("local");
        },
        (error) => {
          toast({
            title: "위치 권한 필요",
            description: "내 지역 현황을 보려면 위치 권한을 허용해주세요.",
            variant: "destructive",
          });
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setActiveTab("local");
    }
  };

  // Calculate real-time statistics for both national and local
  const { nationalStats, localStats } = useMemo(() => {
    if (!hospitals.length) return { nationalStats: null, localStats: null };

    // National stats
    const nationalTotalBeds = hospitals.reduce(
      (sum, h) => sum + h.beds.general + h.beds.pediatric + h.beds.fever,
      0
    );
    const nationalAvailableHospitals = hospitals.filter(
      (h) => getHospitalStatus(h) === "available"
    ).length;
    const nationalPediatricBeds = hospitals.reduce((sum, h) => sum + h.beds.pediatric, 0);

    const national = {
      totalHospitals: hospitals.length,
      totalBeds: nationalTotalBeds,
      availableHospitals: nationalAvailableHospitals,
      pediatricBeds: nationalPediatricBeds,
    };

    // Local stats (only if user location is available)
    let local = null;
    if (userLocation) {
      const majorRegion = findNearestMajorRegion(userLocation[0], userLocation[1]);
      const subRegion = findNearestSubRegion(userLocation[0], userLocation[1], majorRegion);
      const localHospitals = filterHospitalsByRegion(hospitals, subRegion);

      const localTotalBeds = localHospitals.reduce(
        (sum, h) => sum + h.beds.general + h.beds.pediatric + h.beds.fever,
        0
      );
      const localAvailableHospitals = localHospitals.filter(
        (h) => getHospitalStatus(h) === "available"
      ).length;
      const localPediatricBeds = localHospitals.reduce((sum, h) => sum + h.beds.pediatric, 0);

      local = {
        totalHospitals: localHospitals.length,
        totalBeds: localTotalBeds,
        availableHospitals: localAvailableHospitals,
        pediatricBeds: localPediatricBeds,
      };
    }

    return { nationalStats: national, localStats: local };
  }, [hospitals, userLocation]);

  // Get current stats based on active tab
  const stats = activeTab === "local" ? localStats : nationalStats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Ambulance className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Medi-Link</h1>
            <p className="text-xs text-muted-foreground">실시간 응급실 병상 정보</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <h2 className="text-3xl font-bold text-foreground mb-3">
            응급상황,<br />
            <span className="text-primary">가장 가까운 병상</span>을<br />
            찾아드립니다
          </h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            전국 응급실 실시간 병상 현황을 확인하고 가장 빠른 경로를 안내받으세요
          </p>
        </motion.div>

        {/* Live Statistics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-sm mb-5"
        >
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Tab Header */}
            <div className="bg-gradient-to-r from-primary to-blue-600 p-1">
              <div className="flex gap-1">
                {/* National Tab */}
                <button
                  onClick={() => setActiveTab("national")}
                  className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    activeTab === "national"
                      ? "bg-white text-primary shadow-sm"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  <Hospital className="w-3 h-3" />
                  <span>전국</span>
                </button>
                
                {/* Local Tab */}
                <button
                  onClick={handleLocalTab}
                  disabled={isLocating}
                  className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    activeTab === "local"
                      ? "bg-white text-primary shadow-sm"
                      : "text-white/90 hover:bg-white/10"
                  } disabled:opacity-50`}
                >
                  {isLocating ? (
                    <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Navigation className="w-3 h-3" />
                  )}
                  <span>내 지역</span>
                </button>

                {/* Compare Tab */}
                <button
                  onClick={() => {
                    if (!userLocation) {
                      handleLocalTab();
                    }
                    setActiveTab("compare");
                  }}
                  disabled={isLocating}
                  className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    activeTab === "compare"
                      ? "bg-white text-primary shadow-sm"
                      : "text-white/90 hover:bg-white/10"
                  } disabled:opacity-50`}
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>비교</span>
                </button>
              </div>
            </div>

            {/* Info Bar */}
            <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 px-3 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-[10px] font-medium text-foreground">
                  {activeTab === "national" && "실시간 전국 현황"}
                  {activeTab === "local" && `실시간 ${userRegion || "내 지역"} 현황`}
                  {activeTab === "compare" && "전국 vs 내 지역 비교"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-muted-foreground">
                  {isLoading ? "로딩 중..." : lastUpdated ? `${lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준` : ""}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
            
            {/* Stats Grid */}
            <AnimatePresence mode="wait">
              {activeTab === "compare" ? (
                <motion.div
                  key="compare"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-2 space-y-2"
                >
                  {/* Comparison Header */}
                  <div className="flex items-center justify-between px-1 text-[9px] font-medium text-muted-foreground">
                    <span>항목</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                        <span>전국</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span>{userRegion || "내 지역"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hospitals Row with Bar */}
                  <div className="bg-white rounded-xl p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                          <Hospital className="w-2.5 h-2.5 text-primary" />
                        </div>
                        <span className="text-[10px] font-medium text-foreground">응급실</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">{nationalStats?.totalHospitals || 0}</span>
                        <span className="text-primary font-bold">{localStats?.totalHospitals || 0}</span>
                      </div>
                    </div>
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-gray-300 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: nationalStats?.totalHospitals 
                            ? `${Math.min(((localStats?.totalHospitals || 0) / nationalStats.totalHospitals) * 100, 100)}%` 
                            : "0%" 
                        }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-end pr-1.5">
                        <span className="text-[8px] font-bold text-white drop-shadow-sm">
                          {nationalStats?.totalHospitals 
                            ? `${((localStats?.totalHospitals || 0) / nationalStats.totalHospitals * 100).toFixed(1)}%` 
                            : "0%"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Beds Row with Bar */}
                  <div className="bg-white rounded-xl p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-green-100 flex items-center justify-center">
                          <Bed className="w-2.5 h-2.5 text-green-600" />
                        </div>
                        <span className="text-[10px] font-medium text-foreground">병상</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">{nationalStats?.totalBeds || 0}</span>
                        <span className="text-green-600 font-bold">{localStats?.totalBeds || 0}</span>
                      </div>
                    </div>
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-gray-300 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: nationalStats?.totalBeds 
                            ? `${Math.min(((localStats?.totalBeds || 0) / nationalStats.totalBeds) * 100, 100)}%` 
                            : "0%" 
                        }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-end pr-1.5">
                        <span className="text-[8px] font-bold text-white drop-shadow-sm">
                          {nationalStats?.totalBeds 
                            ? `${((localStats?.totalBeds || 0) / nationalStats.totalBeds * 100).toFixed(1)}%` 
                            : "0%"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Available Row with Bar */}
                  <div className="bg-white rounded-xl p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center">
                          <TrendingUp className="w-2.5 h-2.5 text-blue-600" />
                        </div>
                        <span className="text-[10px] font-medium text-foreground">여유 병원</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">{nationalStats?.availableHospitals || 0}</span>
                        <span className="text-blue-600 font-bold">{localStats?.availableHospitals || 0}</span>
                      </div>
                    </div>
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-gray-300 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-sky-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: nationalStats?.availableHospitals 
                            ? `${Math.min(((localStats?.availableHospitals || 0) / nationalStats.availableHospitals) * 100, 100)}%` 
                            : "0%" 
                        }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.4 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-end pr-1.5">
                        <span className="text-[8px] font-bold text-white drop-shadow-sm">
                          {nationalStats?.availableHospitals 
                            ? `${((localStats?.availableHospitals || 0) / nationalStats.availableHospitals * 100).toFixed(1)}%` 
                            : "0%"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pediatric Row with Bar */}
                  <div className="bg-white rounded-xl p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-pink-100 flex items-center justify-center">
                          <Users className="w-2.5 h-2.5 text-pink-600" />
                        </div>
                        <span className="text-[10px] font-medium text-foreground">소아 병상</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">{nationalStats?.pediatricBeds || 0}</span>
                        <span className="text-pink-600 font-bold">{localStats?.pediatricBeds || 0}</span>
                      </div>
                    </div>
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-gray-300 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-rose-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: nationalStats?.pediatricBeds 
                            ? `${Math.min(((localStats?.pediatricBeds || 0) / nationalStats.pediatricBeds) * 100, 100)}%` 
                            : "0%" 
                        }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.5 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-end pr-1.5">
                        <span className="text-[8px] font-bold text-white drop-shadow-sm">
                          {nationalStats?.pediatricBeds 
                            ? `${((localStats?.pediatricBeds || 0) / nationalStats.pediatricBeds * 100).toFixed(1)}%` 
                            : "0%"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {localStats && nationalStats && (
                    <div className="bg-primary/5 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-muted-foreground">
                        <span className="font-bold text-primary">{userRegion || "내 지역"}</span>은 전국 대비
                      </p>
                      <p className="text-xs font-bold text-foreground mt-0.5">
                        병상 <span className="text-green-600">{((localStats.totalBeds / nationalStats.totalBeds) * 100).toFixed(1)}%</span>
                        {" · "}
                        여유 <span className="text-blue-600">{((localStats.availableHospitals / nationalStats.availableHospitals) * 100).toFixed(1)}%</span>
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-4 gap-1 p-2"
                >
                  <div className="bg-white rounded-xl p-2 text-center">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1">
                      <Hospital className="w-3 h-3 text-primary" />
                    </div>
                    <p className="text-lg font-bold text-foreground leading-none">
                      {stats?.totalHospitals || "---"}
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">응급실</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-2 text-center">
                    <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-1">
                      <Bed className="w-3 h-3 text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-green-600 leading-none">
                      {stats?.totalBeds || "---"}
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">병상</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-2 text-center">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-1">
                      <TrendingUp className="w-3 h-3 text-blue-600" />
                    </div>
                    <p className="text-lg font-bold text-blue-600 leading-none">
                      {stats?.availableHospitals || "---"}
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">여유</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-2 text-center">
                    <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center mx-auto mb-1">
                      <Users className="w-3 h-3 text-pink-600" />
                    </div>
                    <p className="text-lg font-bold text-pink-600 leading-none">
                      {stats?.pediatricBeds || "---"}
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">소아</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Role Selection Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-3"
        >
          <p className="text-sm font-medium text-muted-foreground text-center">
            어떤 서비스가 필요하신가요?
          </p>
        </motion.div>

        {/* User Segmentation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-sm space-y-3"
        >
          {/* Guardian Button */}
          <button
            onClick={() => navigate("/map")}
            className="w-full h-[72px] px-5 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 relative overflow-hidden group transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center w-full h-full">
              <Users className="w-7 h-7 text-white shrink-0" />
              <div className="text-left flex-1 ml-4 flex flex-col justify-center">
                <p className="text-base font-semibold text-white leading-tight">보호자 / 환자</p>
                <p className="text-xs font-normal text-white/80 leading-tight mt-0.5">응급실 찾기, 가족 건강관리</p>
              </div>
              <span className="text-xl text-white shrink-0">→</span>
            </div>
          </button>

          {/* Ambulance Driver Button */}
          <button
            onClick={() => navigate("/driver-intro")}
            className="w-full h-[72px] px-5 rounded-2xl border-2 border-orange-400 bg-white hover:bg-orange-50 relative overflow-hidden group transition-colors"
          >
            <div className="relative flex items-center w-full h-full">
              <Ambulance className="w-7 h-7 text-orange-500 shrink-0" />
              <div className="text-left flex-1 ml-4 flex flex-col justify-center">
                <p className="text-base font-semibold text-orange-600 leading-tight">구급대원 / 기사님</p>
                <p className="text-xs font-normal text-orange-500/70 leading-tight mt-0.5">수익 최적화, 자동 운행일지</p>
              </div>
              <span className="text-xl text-orange-500 shrink-0">→</span>
            </div>
          </button>
        </motion.div>

        {/* Partner Section - Ad Space */}
        <PartnerSection />

        {/* Emergency Call */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-4"
        >
          <a
            href="tel:119"
            className="flex items-center gap-2 text-destructive font-semibold hover:underline"
          >
            <Phone className="w-4 h-4" />
            긴급 상황? 119 바로 전화
          </a>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-xs text-muted-foreground">
          © 2024 Medi-Link. 응급 의료 정보 서비스
        </p>
      </footer>
    </div>
  );
};

export default Landing;
