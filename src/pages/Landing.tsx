import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Ambulance, Users, MapPin, Clock, Shield, Phone, Activity, Bed, Hospital, TrendingUp, Navigation, ChevronRight, Zap, Globe, HeartPulse, Brain, Target, TrendingDown, Sparkles, X, Truck } from "lucide-react";
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
            {/* Tab Header */}
            <div className="bg-blue-500 p-1.5">
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
            
            {/* Stats Grid - Card Separated Layout */}
            <AnimatePresence mode="wait">
              <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-2 gap-3 p-4"
                >
                  {/* 응급실 Card */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Hospital className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">응급실</span>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {stats?.totalHospitals !== undefined ? stats.totalHospitals : "---"}
                      <span className="text-sm font-medium text-slate-400 ml-1">개소</span>
                    </p>
                  </div>
                  
                  {/* 병상 Card */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Bed className="w-4 h-4 text-slate-600" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">총 병상</span>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {stats?.totalBeds !== undefined ? stats.totalBeds.toLocaleString() : "---"}
                      <span className="text-sm font-medium text-slate-400 ml-1">개</span>
                    </p>
                  </div>
                  
                  {/* 여유 Card - Highlighted */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">여유 병원</span>
                    </div>
                    <p className="text-2xl font-extrabold text-emerald-700">
                      {stats?.availableHospitals !== undefined ? stats.availableHospitals : "---"}
                      <span className="text-sm font-medium text-emerald-500 ml-1">개소</span>
                    </p>
                  </div>
                  
                  {/* 소아 Card */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Users className="w-4 h-4 text-orange-600" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">소아 병상</span>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {stats?.pediatricBeds !== undefined ? stats.pediatricBeds.toLocaleString() : "---"}
                      <span className="text-sm font-medium text-slate-400 ml-1">개</span>
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
          <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
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
          </div>
        </motion.div>

        {/* Role Selection - Compact Cards */}
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
            {/* Guardian Button - Primary CTA */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate("/guardian")}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 relative overflow-hidden group transition-all duration-300 shadow-md shadow-blue-500/20"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative flex items-center w-full">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1 ml-3">
                  <p className="text-sm font-bold text-white leading-tight">보호자 / 환자</p>
                  <p className="text-[11px] text-blue-100 leading-tight">응급실 찾기 · 가족 건강관리</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/70 shrink-0" />
              </div>
            </motion.button>

            {/* Two Column - Private Transfer & Paramedic */}
            <div className="grid grid-cols-2 gap-2">
              {/* Private Transfer Mode Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/driver-intro")}
                className="py-3 px-3 rounded-xl bg-white border border-slate-200 group transition-all duration-300 hover:border-slate-300 hover:shadow-sm"
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <Truck className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">민간 구급차</p>
                    <p className="text-xs text-slate-400 leading-tight">전원 · 퇴원 이송</p>
                  </div>
                </div>
              </motion.button>

              {/* Ambulance Driver Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/paramedic")}
                className="py-3 px-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 group transition-all duration-300 hover:border-orange-300 hover:shadow-sm"
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <Ambulance className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">구급대원</p>
                    <p className="text-xs text-slate-400 leading-tight">병상 · 거절이력</p>
                  </div>
                </div>
              </motion.button>
            </div>
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
