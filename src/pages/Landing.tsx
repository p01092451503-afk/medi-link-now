import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Ambulance, Users, MapPin, Clock, Shield, Phone, Activity, Bed, Hospital, TrendingUp, Navigation, ChevronRight, Zap, Globe, HeartPulse, Brain, Target, TrendingDown, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useRealtimeHospitals } from "@/hooks/useRealtimeHospitals";
import { useMemo, useState, useEffect } from "react";
import { getHospitalStatus, findNearestMajorRegion, findNearestSubRegion, filterHospitalsByRegion, regionOptions } from "@/data/hospitals";
import { toast } from "@/hooks/use-toast";
import DataFreshnessTimer from "@/components/DataFreshnessTimer";
import { cleanHospitalName } from "@/lib/utils";


const Landing = () => {
  const navigate = useNavigate();
  const { hospitals, isLoading, lastUpdated } = useRealtimeHospitals();
  const [activeTab, setActiveTab] = useState<"national" | "local">("national");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isAIPredictionOpen, setIsAIPredictionOpen] = useState(false);

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

  // Calculate 3 nearest hospitals from user location
  const nearestHospitals = useMemo(() => {
    if (!userLocation || !hospitals.length) return [];

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    return hospitals
      .map(h => ({
        ...h,
        distance: calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [hospitals, userLocation]);

  // Get current stats based on active tab
  const stats = activeTab === "local" ? localStats : nationalStats;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="px-4 py-3 flex items-center justify-center max-w-lg mx-auto">
          <div className="flex items-center">
            <div className="text-center">
              <h1 className="font-logo text-[26px] font-extrabold text-slate-800">Find-ER</h1>
              <p className="text-xs text-slate-500">실시간 응급실 병상 정보</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center px-5 py-6 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-[1.75rem] leading-tight font-extrabold text-slate-900 mb-3 tracking-tight">
            응급상황,<br />
            가장 가까운 병상을<br />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">파인더</span>가 찾아드립니다
          </h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
            전국 응급실 실시간 병상 현황을 확인하고<br />가장 빠른 경로를 안내받으세요
          </p>
        </motion.div>

        {/* Live Statistics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full mb-8"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Tab Header */}
            <div className="bg-slate-700 p-1.5">
              <div className="flex gap-1">
                {/* National Tab */}
                <button
                  onClick={() => setActiveTab("national")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "national"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  <Hospital className="w-4 h-4" />
                  <span>전국</span>
                </button>
                
                {/* Local Tab */}
                <button
                  onClick={handleLocalTab}
                  disabled={isLocating}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "local"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-white/90 hover:bg-white/10"
                  } disabled:opacity-50`}
                >
                  {isLocating ? (
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  <span>내 지역</span>
                </button>
              </div>
            </div>

            {/* Info Bar */}
            <div className="bg-slate-50 px-4 py-2 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-600">
                  {activeTab === "national" ? "실시간 전국 현황" : `실시간 ${userRegion || "내 지역"} 현황`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">
                  {isLoading ? "로딩 중..." : lastUpdated ? `${lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준` : ""}
                </span>
                <div className="relative flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
              </div>
            </div>
            
            {/* Stats Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-4 gap-1 p-2"
                >
                  <div className="bg-white rounded-xl p-2 text-center">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-1">
                      <Hospital className="w-3 h-3 text-slate-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-800 leading-none">
                      {stats?.totalHospitals !== undefined ? stats.totalHospitals : "---"}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">응급실</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-2 text-center">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-1">
                      <Bed className="w-3 h-3 text-slate-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-800 leading-none">
                      {stats?.totalBeds !== undefined ? stats.totalBeds : "---"}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">병상</p>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-2 text-center ring-1 ring-slate-200">
                    <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center mx-auto mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <p className="text-xl font-extrabold text-slate-800 leading-none">
                      {stats?.availableHospitals !== undefined ? stats.availableHospitals : "---"}
                    </p>
                    <p className="text-[9px] font-medium text-slate-500 mt-0.5">여유</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-2 text-center">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-1">
                      <Users className="w-3 h-3 text-slate-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-800 leading-none">
                      {stats?.pediatricBeds !== undefined ? stats.pediatricBeds : "---"}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">소아</p>
                  </div>
                </motion.div>
            </AnimatePresence>

            {/* Nearest Hospitals Preview - Only in Local Tab */}
            <AnimatePresence>
              {activeTab === "local" && nearestHospitals.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-100"
                >
                  <div className="p-2 space-y-1.5">
                    <p className="text-[10px] font-medium text-muted-foreground px-1">가까운 응급실</p>
                    {nearestHospitals.map((hospital, index) => {
                      const status = getHospitalStatus(hospital);
                      const statusColor = status === "available" ? "bg-green-500" : status === "limited" ? "bg-yellow-500" : "bg-red-500";
                      const totalBeds = hospital.beds.general + hospital.beds.pediatric + hospital.beds.fever;
                      
                      return (
                        <button
                          key={hospital.id}
                          onClick={() => navigate(`/map?hospital=${hospital.id}`)}
                          className="w-full flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                              <p className="text-[11px] font-medium text-foreground truncate">
                                {cleanHospitalName(hospital.nameKr)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                {hospital.distance.toFixed(1)}km
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Bed className="w-2.5 h-2.5" />
                                {totalBeds}병상
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                ~{Math.round(hospital.distance / 35 * 60)}분
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full mb-8"
        >
          <div className="flex items-center justify-center gap-6">
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex flex-col items-center gap-3 group cursor-pointer">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center shadow-sm border border-slate-200 transition-all duration-300 group-hover:scale-105 group-hover:border-slate-300">
                    <Hospital className="w-7 h-7 text-slate-600 transition-all duration-300 group-hover:scale-110" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-800 tracking-tight">
                      {isLoading ? "---" : `${hospitals.length}+`}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">전국 응급실</p>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4 rounded-2xl border border-slate-200 shadow-lg" side="bottom">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-slate-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">전국 응급실 네트워크</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    서울, 경기, 부산 등 전국 17개 시·도의 응급의료기관 정보를 실시간으로 제공합니다. 
                    권역응급의료센터부터 지역응급의료기관까지 모든 등급의 응급실을 포함합니다.
                  </p>
                  <div className="flex items-center gap-4 pt-1 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      권역센터
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      지역센터
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      지역기관
                    </span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <DataFreshnessTimer lastUpdated={lastUpdated} isLoading={isLoading} />
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4 rounded-2xl border border-slate-200 shadow-lg" side="bottom">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-slate-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">실시간 병상 정보</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    국립중앙의료원 응급의료포털과 직접 연동하여 60초마다 최신 병상 현황을 갱신합니다.
                    일반병상, 소아병상, 음압격리병상 등 세부 정보까지 확인 가능합니다.
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] text-slate-600 font-medium">
                      {lastUpdated ? `마지막 업데이트: ${lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : "연결 중..."}
                    </span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex flex-col items-center gap-3 group cursor-pointer">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center shadow-sm border border-slate-200 transition-all duration-300 group-hover:scale-105 group-hover:border-slate-300">
                    <Clock className="w-7 h-7 text-slate-600 transition-all duration-300 group-hover:scale-110" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-800 tracking-tight">24시간</p>
                    <p className="text-[11px] text-slate-500 font-medium">연중무휴 운영</p>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4 rounded-2xl border border-slate-200 shadow-lg" side="bottom">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                      <HeartPulse className="w-4 h-4 text-slate-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">365일 24시간 서비스</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    응급상황은 시간을 가리지 않습니다. Find-ER은 새벽, 주말, 공휴일 관계없이 
                    언제든지 가장 가까운 응급실 정보를 제공합니다.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="text-center p-2 bg-slate-50 rounded-xl">
                      <p className="text-sm font-bold text-slate-700">24h</p>
                      <p className="text-[10px] text-slate-400">하루</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-xl">
                      <p className="text-sm font-bold text-slate-700">7일</p>
                      <p className="text-[10px] text-slate-400">주간</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-xl">
                      <p className="text-sm font-bold text-slate-700">365일</p>
                      <p className="text-[10px] text-slate-400">연간</p>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </motion.div>

        {/* AI Prediction Feature Promotion - Collapsible Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full mb-8"
        >
          <Collapsible open={isAIPredictionOpen} onOpenChange={setIsAIPredictionOpen}>
            <div className="relative bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
              {/* Collapsed Banner - Always Visible */}
              <CollapsibleTrigger asChild>
                <button className="relative w-full p-3 flex items-center gap-2.5 hover:bg-slate-100/50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
                    <Brain className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800">AI 예측 분석</h3>
                      <span className="px-1.5 py-0.5 text-[8px] font-bold text-white bg-slate-500 rounded">Beta</span>
                    </div>
                    <p className="text-[10px] text-slate-500">공식 데이터를 넘어선 스마트 분석</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isAIPredictionOpen ? "rotate-90" : ""}`} />
                </button>
              </CollapsibleTrigger>

              {/* Expanded Content */}
              <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                <AnimatePresence mode="wait">
                  {isAIPredictionOpen && (
                    <motion.div 
                      className="px-4 pb-4 pt-1"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                        mass: 0.8
                      }}
                    >
                      {/* Feature Cards - Horizontal compact layout with descriptions */}
                      <motion.div 
                        className="relative grid grid-cols-3 gap-2"
                        initial="hidden"
                        animate="visible"
                        variants={{
                          hidden: { opacity: 0 },
                          visible: {
                            opacity: 1,
                            transition: {
                              staggerChildren: 0.08,
                              delayChildren: 0.05
                            }
                          }
                        }}
                      >
                        {/* Safe Arrival Score */}
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 12, scale: 0.95 },
                            visible: { opacity: 1, y: 0, scale: 1 }
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="flex flex-col items-center p-2.5 bg-white rounded-xl border border-slate-200 text-center hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer w-full">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center mb-1">
                                  <Target className="w-3.5 h-3.5 text-slate-600" />
                                </div>
                                <p className="text-[8px] text-slate-500 mb-0.5">병상 확보</p>
                                <p className="text-lg font-bold text-slate-800 leading-tight">95%</p>
                                <p className="text-[8px] text-slate-500 leading-tight">예상 확률</p>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3 rounded-xl border border-slate-200 shadow-lg" side="top">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <Target className="w-3.5 h-3.5 text-slate-600" />
                                  </div>
                                  <p className="text-sm font-bold text-slate-800">병상 확보 예상 확률</p>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  현재 병상 가용률과 이동 중인 구급차를 분석하여, 도착 시 병상을 확보할 수 있는 확률을 예측합니다.
                                </p>
                                <div className="flex items-center gap-2 pt-1 text-[10px]">
                                  <span className="flex items-center gap-1 text-emerald-600">🟢 95%+ 안전</span>
                                  <span className="flex items-center gap-1 text-amber-600">🟡 70-94% 주의</span>
                                  <span className="flex items-center gap-1 text-red-600">🔴 70%↓ 위험</span>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </motion.div>

                        {/* Shadow Demand */}
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 12, scale: 0.95 },
                            visible: { opacity: 1, y: 0, scale: 1 }
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="flex flex-col items-center p-2.5 bg-white rounded-xl border border-slate-200 text-center hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer w-full">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center mb-1">
                                  <Ambulance className="w-3.5 h-3.5 text-slate-600" />
                                </div>
                                <p className="text-[8px] text-slate-500 mb-0.5">이동 중</p>
                                <p className="text-lg font-bold text-slate-800 leading-tight">2대</p>
                                <p className="text-[8px] text-slate-500 leading-tight">구급차</p>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3 rounded-xl border border-slate-200 shadow-lg" side="top">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <Ambulance className="w-3.5 h-3.5 text-slate-600" />
                                  </div>
                                  <p className="text-sm font-bold text-slate-800">실시간 이동 현황</p>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  현재 병원으로 향하는 민간 구급차 수입니다. 공식 병상 수에서 이 숫자를 빼면 실제 가용 병상을 추정할 수 있습니다.
                                </p>
                                <div className="bg-slate-100 rounded-lg p-2 text-[10px] text-slate-600">
                                  <p className="font-medium">⚠️ 주의사항</p>
                                  <p>119 공공 구급차는 포함되지 않습니다.</p>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </motion.div>

                        {/* Bed Trend */}
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 12, scale: 0.95 },
                            visible: { opacity: 1, y: 0, scale: 1 }
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="flex flex-col items-center p-2.5 bg-white rounded-xl border border-slate-200 text-center hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer w-full">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center mb-1">
                                  <TrendingDown className="w-3.5 h-3.5 text-slate-600" />
                                </div>
                                <p className="text-[8px] text-slate-500 mb-0.5">병상 소진</p>
                                <p className="text-lg font-bold text-slate-800 leading-tight">-3</p>
                                <p className="text-[8px] text-slate-500 leading-tight">병상/시간</p>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3 rounded-xl border border-slate-200 shadow-lg" side="top">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <TrendingDown className="w-3.5 h-3.5 text-slate-600" />
                                  </div>
                                  <p className="text-sm font-bold text-slate-800">병상 소진 트렌드</p>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  최근 1시간 동안의 병상 변화율을 AI가 분석합니다. 음수(-)는 병상이 줄어드는 중, 양수(+)는 병상이 늘어나는 중입니다.
                                </p>
                                <div className="bg-slate-100 rounded-lg p-2 text-[10px] text-slate-600">
                                  <p><span className="font-medium">-3 병상/시간</span> = 1시간에 평균 3개의 병상이 소진됨</p>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </motion.div>
                      </motion.div>

                      {/* Bottom CTA - Compact */}
                      <button 
                        onClick={() => navigate("/map")}
                        className="relative mt-3 pt-2.5 border-t border-slate-200 w-full text-left hover:bg-slate-100/50 -mx-1 px-1 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-slate-500" />
                            <p className="text-[10px] text-slate-600 font-medium">
                              병원 상세정보에서 확인
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                            <span>지도</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </motion.div>

        {/* Role Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="w-full"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary to-blue-600" />
            <p className="text-sm font-bold text-slate-700">어떤 서비스가 필요하신가요?</p>
          </div>
          
          <div className="space-y-3">
            {/* Guardian Button */}
            <button
              onClick={() => navigate("/guardian")}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-slate-700 to-slate-800 border border-slate-600 relative overflow-hidden group transition-all duration-300 hover:from-slate-600 hover:to-slate-700 shadow-lg shadow-slate-900/20"
            >
              <div className="flex items-center w-full">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                  <Ambulance className="w-9 h-9 text-white" />
                </div>
                <div className="text-left flex-1 ml-3.5">
                  <p className="text-base font-bold text-white leading-tight">보호자 / 환자</p>
                  <p className="text-xs text-slate-300 leading-tight mt-0.5">응급실 찾기 · 가족 건강관리</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" />
              </div>
            </button>

            {/* Ambulance Driver Button */}
            <button
              onClick={() => navigate("/driver-intro")}
              className="w-full py-4 px-5 rounded-2xl bg-white border-2 border-slate-200 relative overflow-hidden group transition-all duration-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:border-orange-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center w-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center shrink-0 group-hover:from-orange-100 group-hover:to-red-100 transition-all">
                  <Ambulance className="w-9 h-9 text-slate-600 group-hover:text-orange-600 transition-colors" />
                </div>
                <div className="text-left flex-1 ml-3.5">
                  <p className="text-base font-bold text-slate-700 leading-tight group-hover:text-slate-800">구급대원 / 기사님</p>
                  <p className="text-xs text-slate-500 leading-tight mt-0.5">수익 최적화 · 자동 운행일지</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-orange-500" />
              </div>
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative mt-auto bg-white border-t border-slate-100">
        <div className="px-5 py-6 space-y-4 max-w-lg mx-auto">
          {/* Brand */}
          <div className="flex items-center justify-center gap-1">
            <span className="font-logo text-sm font-extrabold text-slate-700">Find-ER</span>
          </div>
          
          {/* Links */}
          <div className="flex items-center justify-center gap-6">
            <a 
              href="/terms" 
              className="text-xs text-slate-400 hover:text-primary transition-colors duration-200"
            >
              이용약관
            </a>
            <a 
              href="/privacy" 
              className="text-xs text-slate-400 hover:text-primary transition-colors duration-200"
            >
              개인정보처리방침
            </a>
            <a 
              href="tel:119" 
              className="text-xs text-slate-400 hover:text-red-500 transition-colors duration-200 flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              119
            </a>
          </div>
          
          {/* Copyright */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 text-center">
              © 2026 Find-ER · 실시간 응급실 병상 정보 서비스
            </p>
            <p className="text-[9px] text-slate-400/70 text-center mt-1">
              본 서비스는 정보 제공 목적이며, 응급 시 <span className="font-bold text-red-500">119에 신고</span>하세요
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
