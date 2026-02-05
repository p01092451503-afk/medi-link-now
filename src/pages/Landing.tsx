import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Ambulance, Users, MapPin, Clock, Shield, Phone, Activity, Bed, Hospital, TrendingUp, Navigation, ChevronRight, Zap, Globe, HeartPulse, Brain, Target, TrendingDown, Sparkles, X, BarChart3, AlertTriangle } from "lucide-react";
import { useTransferMode } from "@/contexts/TransferModeContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRealtimeHospitals } from "@/hooks/useRealtimeHospitals";
import { useMemo, useState, useEffect } from "react";
import { getHospitalStatus } from "@/data/hospitals";
import { toast } from "@/hooks/use-toast";
import DataFreshnessTimer from "@/components/DataFreshnessTimer";
import { cleanHospitalName } from "@/lib/utils";


const Landing = () => {
  const navigate = useNavigate();
  const { setMode } = useTransferMode();
  const { hospitals, isLoading, lastUpdated } = useRealtimeHospitals();
  const [activeTab, setActiveTab] = useState<"national" | "local">("national");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
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

    // Local stats (only if user location is available) - use distance-based filtering (10km radius)
    let local = null;
    if (userLocation) {
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
      
      // Filter hospitals within 10km radius
      const LOCAL_RADIUS_KM = 10;
      const localHospitals = hospitals.filter(h => {
        const distance = calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng);
        return distance <= LOCAL_RADIUS_KM;
      });

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
            {/* Tab Header - Grayscale */}
            <div className="bg-slate-700 p-1.5">
              <div className="flex gap-1">
                {/* National Tab */}
                <button
                  onClick={() => setActiveTab("national")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "national"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-white/80 hover:bg-white/10"
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
                      : "text-white/80 hover:bg-white/10"
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
                  {activeTab === "national" ? "실시간 전국 현황" : "실시간 내 주변 10km 현황"}
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
            
            {/* Stats Grid - Integrated Dashboard Layout */}
            <AnimatePresence mode="wait">
              <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-2 divide-x divide-y divide-slate-100"
                >
                  {/* 응급실 */}
                  <div className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Hospital className="w-4 h-4 text-blue-500" />
                      <span className="text-[11px] font-medium text-slate-500">응급실</span>
                    </div>
                    <p className="text-[1.75rem] font-black text-slate-900 leading-none">
                      {stats?.totalHospitals !== undefined ? stats.totalHospitals : "---"}
                      <span className="text-xs font-medium text-slate-400 ml-1">개소</span>
                    </p>
                  </div>
                  
                  {/* 병상 */}
                  <div className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Bed className="w-4 h-4 text-slate-500" />
                      <span className="text-[11px] font-medium text-slate-500">총 병상</span>
                    </div>
                    <p className="text-[1.75rem] font-black text-slate-900 leading-none">
                      {stats?.totalBeds !== undefined ? stats.totalBeds.toLocaleString() : "---"}
                      <span className="text-xs font-medium text-slate-400 ml-1">개</span>
                    </p>
                  </div>
                  
                  {/* 여유 - Highlighted with gradient background */}
                  <div className="p-4 bg-gradient-to-br from-emerald-50/80 to-green-50/50 hover:from-emerald-50 hover:to-green-50 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span className="text-[11px] font-medium text-emerald-600">여유 병원</span>
                    </div>
                    <p className="text-[1.75rem] font-black text-emerald-700 leading-none">
                      {stats?.availableHospitals !== undefined ? stats.availableHospitals : "---"}
                      <span className="text-xs font-medium text-emerald-500 ml-1">개소</span>
                    </p>
                  </div>
                  
                  {/* 소아 */}
                  <div className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Users className="w-4 h-4 text-orange-500" />
                      <span className="text-[11px] font-medium text-slate-500">소아 병상</span>
                    </div>
                    <p className="text-[1.75rem] font-black text-slate-900 leading-none">
                      {stats?.pediatricBeds !== undefined ? stats.pediatricBeds.toLocaleString() : "---"}
                      <span className="text-xs font-medium text-slate-400 ml-1">개</span>
                    </p>
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

        {/* Trust Indicators - 2x2 Grid Equal Width */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full mb-8"
        >
         <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
            {/* 전국 응급실 */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer">
                  <Hospital className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">
                    {isLoading ? "---" : `${hospitals.length}+ 응급실`}
                  </span>
                </button>
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
            
            {/* 실시간 업데이트 */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-700">60초 실시간</span>
                </button>
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
            
            {/* 24시간 운영 */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">24h 연중무휴</span>
                </button>
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
                </div>
              </PopoverContent>
            </Popover>

            {/* AI 예측 분석 */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 hover:from-violet-100 hover:to-indigo-100 transition-colors cursor-pointer">
                  <Brain className="w-3.5 h-3.5 text-violet-600" />
                  <span className="text-xs font-semibold text-violet-700">AI 예측</span>
                  <span className="px-1 py-0.5 text-[8px] font-bold text-white bg-violet-500 rounded">β</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 rounded-2xl border border-violet-200 shadow-lg" side="bottom">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">AI 예측 분석</p>
                      <span className="px-1.5 py-0.5 text-[8px] font-bold text-white bg-violet-500 rounded">Beta</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    공식 데이터를 넘어선 스마트 분석으로 병상 확보 확률, 실시간 이동 현황, 병상 소진 트렌드를 제공합니다.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                    <div className="text-center p-2 bg-slate-50 rounded-xl">
                      <Target className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                      <p className="text-[10px] font-medium text-slate-700">확보 확률</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-xl">
                      <Ambulance className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                      <p className="text-[10px] font-medium text-slate-700">이동 현황</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-xl">
                      <TrendingDown className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                      <p className="text-[10px] font-medium text-slate-700">소진 트렌드</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate("/map")}
                    className="w-full flex items-center justify-center gap-1.5 pt-2 text-[11px] text-violet-600 font-medium hover:text-violet-700"
                  >
                    <span>병원 상세정보에서 확인</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </PopoverContent>
            </Popover>

           {/* 119 통계 인사이트 */}
           <Popover>
             <PopoverTrigger asChild>
               <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:from-amber-100 hover:to-orange-100 transition-colors cursor-pointer">
                 <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
                 <span className="text-xs font-semibold text-amber-700">119 통계</span>
               </button>
             </PopoverTrigger>
             <PopoverContent className="w-80 p-4 rounded-2xl border border-amber-200 shadow-lg" side="bottom">
               <div className="space-y-3">
                 <div className="flex items-center gap-2.5">
                   <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                     <BarChart3 className="w-4 h-4 text-amber-600" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-800">119 통계 인사이트</p>
                     <span className="text-[10px] text-slate-500">소방청 구급 데이터 기반</span>
                   </div>
                 </div>
                 <p className="text-xs text-slate-500 leading-relaxed">
                   과거 3년간의 119 구급 출동 통계를 분석하여 지역별 응급 수요 패턴과 병원별 이송 현황을 제공합니다.
                 </p>
                 <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                   <div className="text-center p-2 bg-amber-50 rounded-xl">
                     <AlertTriangle className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                     <p className="text-[10px] font-medium text-slate-700">수요 예측</p>
                   </div>
                   <div className="text-center p-2 bg-amber-50 rounded-xl">
                     <TrendingUp className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                     <p className="text-[10px] font-medium text-slate-700">혼잡 시간대</p>
                   </div>
                 </div>
                 <button 
                   onClick={() => navigate("/map?role=paramedic")}
                   className="w-full flex items-center justify-center gap-1.5 pt-2 text-[11px] text-amber-600 font-medium hover:text-amber-700"
                 >
                   <span>지도에서 확인하기</span>
                   <ChevronRight className="w-3.5 h-3.5" />
                 </button>
               </div>
             </PopoverContent>
           </Popover>
          </div>
        </motion.div>

        {/* Role Selection - Card Style Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="w-full"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-primary to-blue-600" />
            <p className="text-xs font-bold text-slate-600">서비스 선택</p>
          </div>
          
          <div className="space-y-3">
            {/* Guardian/Patient Card */}
            <motion.button
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.98, y: 0 }}
              onClick={() => navigate("/guardian")}
             className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-white border border-blue-100/60 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group"
            >
             {/* Left accent bar - always visible */}
             <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-2xl" />
              
              <div className="flex items-center w-full py-4 px-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 via-blue-100/80 to-indigo-100/50 flex items-center justify-center shrink-0 ring-1 ring-blue-100/50 group-hover:ring-blue-200 transition-all">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left flex-1 ml-3.5">
                  <p className="text-[15px] font-semibold text-slate-800 tracking-tight">보호자 / 환자</p>
                  <p className="text-[13px] text-slate-400 mt-0.5">응급실 찾기 · 가족 건강관리</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </motion.button>

            {/* Private Ambulance Card */}
            <motion.button
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.98, y: 0 }}
              onClick={() => navigate("/driver-intro")}
             className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-50/80 via-white to-white border border-violet-100/60 shadow-sm hover:shadow-md hover:border-violet-200 transition-all duration-300 group"
            >
             {/* Left accent bar - always visible */}
             <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-violet-400 to-purple-600 rounded-l-2xl" />
              
              <div className="flex items-center w-full py-4 px-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-50 via-violet-100/80 to-purple-100/50 flex items-center justify-center shrink-0 ring-1 ring-violet-100/50 group-hover:ring-violet-200 transition-all">
                  <Ambulance className="w-6 h-6 text-violet-600" />
                </div>
                <div className="text-left flex-1 ml-3.5">
                  <p className="text-[15px] font-semibold text-slate-800 tracking-tight">민간 구급차</p>
                  <p className="text-[13px] text-slate-400 mt-0.5">전원 · 퇴원 이송</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 group-hover:text-violet-500 group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </motion.button>

            {/* Paramedic Card */}
            <motion.button
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.98, y: 0 }}
              onClick={() => navigate("/paramedic")}
             className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50/80 via-white to-white border border-orange-100/60 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-300 group"
            >
             {/* Left accent bar - always visible */}
             <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-l-2xl" />
              
              <div className="flex items-center w-full py-4 px-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 via-orange-100/80 to-orange-100/50 flex items-center justify-center shrink-0 ring-1 ring-orange-100/50 group-hover:ring-orange-200 transition-all">
                  <Ambulance className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-left flex-1 ml-3.5">
                  <p className="text-[15px] font-semibold text-slate-800 tracking-tight">구급대원</p>
                  <p className="text-[13px] text-slate-400 mt-0.5">병상 현황 · 거절이력 공유</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 group-hover:text-orange-500 group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </motion.button>
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
