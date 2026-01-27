import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Ambulance, Users, MapPin, Clock, Shield, Phone, Activity, Bed, Hospital, TrendingUp, Navigation, ChevronRight, Zap, Globe, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRealtimeHospitals } from "@/hooks/useRealtimeHospitals";
import { useMemo, useState, useEffect } from "react";
import { getHospitalStatus, findNearestMajorRegion, findNearestSubRegion, filterHospitalsByRegion, regionOptions } from "@/data/hospitals";
import { toast } from "@/hooks/use-toast";


const Landing = () => {
  const navigate = useNavigate();
  const { hospitals, isLoading, lastUpdated } = useRealtimeHospitals();
  const [activeTab, setActiveTab] = useState<"national" | "local">("national");
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
      <main className="flex-1 flex flex-col items-center px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
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
          className="w-full max-w-sm mb-10"
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
              </div>
            </div>

            {/* Info Bar */}
            <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 px-3 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-[10px] font-medium text-foreground">
                  {activeTab === "national" ? "실시간 전국 현황" : `실시간 ${userRegion || "내 지역"} 현황`}
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
                                {hospital.name}
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
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-sm mb-10"
        >
          <div className="flex items-center justify-center gap-8">
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex flex-col items-center gap-3 group cursor-pointer">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-primary/20 group-hover:border-primary/20">
                    <Hospital className="w-8 h-8 text-primary transition-all duration-300 group-hover:scale-110" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground tracking-tight">
                      {isLoading ? "---" : `${hospitals.length}+`}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium">전국 응급실</p>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4 rounded-2xl border-0 shadow-xl" side="bottom">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm font-bold">전국 응급실 네트워크</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    서울, 경기, 부산 등 전국 17개 시·도의 응급의료기관 정보를 실시간으로 제공합니다. 
                    권역응급의료센터부터 지역응급의료기관까지 모든 등급의 응급실을 포함합니다.
                  </p>
                  <div className="flex items-center gap-4 pt-1 text-[10px] text-muted-foreground">
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
                <div className="flex flex-col items-center gap-3 group cursor-pointer">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-100 via-green-50 to-emerald-50/50 flex items-center justify-center shadow-lg shadow-green-500/10 border border-green-200/50 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-green-500/20 group-hover:border-green-300/50">
                    <Activity className="w-8 h-8 text-emerald-600 transition-all duration-300 group-hover:scale-110" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground tracking-tight">30초</p>
                    <p className="text-[11px] text-muted-foreground font-medium">실시간 업데이트</p>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4 rounded-2xl border-0 shadow-xl" side="bottom">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-100 to-green-50 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-sm font-bold">실시간 병상 정보</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    국립중앙의료원 응급의료포털과 직접 연동하여 30초마다 최신 병상 현황을 갱신합니다.
                    일반병상, 소아병상, 음압격리병상 등 세부 정보까지 확인 가능합니다.
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] text-emerald-600 font-medium">
                      {lastUpdated ? `마지막 업데이트: ${lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : "연결 중..."}
                    </span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex flex-col items-center gap-3 group cursor-pointer">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-100 via-sky-50 to-blue-50/50 flex items-center justify-center shadow-lg shadow-blue-500/10 border border-blue-200/50 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-blue-500/20 group-hover:border-blue-300/50">
                    <Clock className="w-8 h-8 text-blue-600 transition-all duration-300 group-hover:scale-110" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground tracking-tight">24시간</p>
                    <p className="text-[11px] text-muted-foreground font-medium">연중무휴 운영</p>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4 rounded-2xl border-0 shadow-xl" side="bottom">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-sky-50 flex items-center justify-center">
                      <HeartPulse className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-sm font-bold">365일 24시간 서비스</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    응급상황은 시간을 가리지 않습니다. Medi-Link는 새벽, 주말, 공휴일 관계없이 
                    언제든지 가장 가까운 응급실 정보를 제공합니다.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-sky-50/50 rounded-xl">
                      <p className="text-sm font-bold text-blue-600">24h</p>
                      <p className="text-[10px] text-muted-foreground">하루</p>
                    </div>
                    <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-sky-50/50 rounded-xl">
                      <p className="text-sm font-bold text-blue-600">7일</p>
                      <p className="text-[10px] text-muted-foreground">주간</p>
                    </div>
                    <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-sky-50/50 rounded-xl">
                      <p className="text-sm font-bold text-blue-600">365일</p>
                      <p className="text-[10px] text-muted-foreground">연간</p>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </motion.div>

        {/* Role Selection Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-4"
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
          className="w-full max-w-sm space-y-4"
        >
          {/* Guardian Button */}
          <button
            onClick={() => navigate("/map")}
            className="w-full h-20 px-6 rounded-3xl bg-teal-600 shadow-xl shadow-teal-500/25 relative overflow-hidden group transition-all duration-300 hover:bg-teal-500 hover:shadow-2xl hover:shadow-teal-500/30 hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative flex items-center w-full h-full">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1 ml-4 flex flex-col justify-center">
                <p className="text-lg font-bold text-white leading-tight tracking-tight">보호자 / 환자</p>
                <p className="text-xs font-medium text-white/75 leading-tight mt-1">응급실 찾기 · 가족 건강관리</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:translate-x-1">
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </button>

          {/* Ambulance Driver Button */}
          <button
            onClick={() => navigate("/driver-intro")}
            className="w-full h-20 px-6 rounded-3xl bg-orange-500 shadow-xl shadow-orange-500/25 relative overflow-hidden group transition-all duration-300 hover:bg-orange-400 hover:shadow-2xl hover:shadow-orange-500/30 hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative flex items-center w-full h-full">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Ambulance className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1 ml-4 flex flex-col justify-center">
                <p className="text-lg font-bold text-white leading-tight tracking-tight">구급대원 / 기사님</p>
                <p className="text-xs font-medium text-white/75 leading-tight mt-1">수익 최적화 · 자동 운행일지</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:translate-x-1">
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative mt-auto">
        {/* Gradient divider */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        <div className="px-6 py-6 space-y-4">
          {/* Brand + Social */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Ambulance className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Medi-Link</span>
          </div>
          
          {/* Links */}
          <div className="flex items-center justify-center gap-6">
            <a 
              href="/terms" 
              className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              이용약관
            </a>
            <a 
              href="/privacy" 
              className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              개인정보처리방침
            </a>
            <a 
              href="tel:119" 
              className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              119
            </a>
          </div>
          
          {/* Copyright */}
          <div className="pt-3 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground/70 text-center">
              © 2026 Medi-Link · 실시간 응급실 병상 정보 서비스
            </p>
            <p className="text-[9px] text-muted-foreground/50 text-center mt-1">
              본 서비스는 정보 제공 목적이며, 응급 시 119에 신고하세요
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
