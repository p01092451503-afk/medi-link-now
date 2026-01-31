import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LogOut, 
  MapPin, 
  Phone, 
  Clock, 
  DollarSign, 
  Navigation,
  User,
  CheckCircle2,
  AlertCircle,
  Map,
  FileText,
  Activity,
  Star,
  Radio,
  Loader2,
  ToggleLeft,
  ToggleRight,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import RevenueTab from "@/components/RevenueTab";
import RevenueStatsWidget from "@/components/RevenueStatsWidget";
import { useDrivingLogs, type CreateDrivingLogInput, type UpdateRevenueInput } from "@/hooks/useDrivingLogs";
import DrivingLogHistory from "@/components/DrivingLogHistory";
import DrivingStatsWidget from "@/components/DrivingStatsWidget";
import PatientInfoModal from "@/components/PatientInfoModal";
import HotlineManager, { useHotlines } from "@/components/HotlineManager";
import { useDriverPresence } from "@/hooks/useDriverPresence";
import { useDispatchRequests } from "@/hooks/useDispatchRequests";
import TripManagementWidget from "@/components/TripManagementWidget";

// Mock call data
const mockCalls = [
  {
    id: "1",
    patientName: "김OO",
    location: "서울시 강남구 테헤란로 123",
    hospital: "삼성서울병원 응급실",
    distance: "3.2km",
    status: "pending",
    estimatedFee: 75000,
    time: "5분 전",
  },
  {
    id: "2",
    patientName: "박OO",
    location: "서울시 서초구 반포대로 45",
    hospital: "세브란스병원 응급실",
    distance: "7.8km",
    status: "pending",
    estimatedFee: 120000,
    time: "12분 전",
  },
  {
    id: "3",
    patientName: "이OO",
    location: "서울시 송파구 올림픽로 300",
    hospital: "서울아산병원 응급실",
    distance: "2.1km",
    status: "completed",
    estimatedFee: 65000,
    time: "1시간 전",
  },
];

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<"calls" | "revenue" | "log" | "map">("calls");
  const [isPatientInfoOpen, setIsPatientInfoOpen] = useState(false);
  const [isHotlineOpen, setIsHotlineOpen] = useState(false);
  const [isSimulateMode, setIsSimulateMode] = useState(false);
  
  // Driving logs from database
  const { 
    logs: drivingLogs, 
    isLoading: isLogsLoading, 
    createLog, 
    deleteLog,
    updateRevenue,
    currentMonth,
    setCurrentMonth,
    stats 
  } = useDrivingLogs();
  
  const { hotlines, toggleFavorite, removeHotline } = useHotlines();
  const { isTracking, startTracking, stopTracking, nearbyDrivers } = useDriverPresence();
  const { pendingRequests, acceptRequest } = useDispatchRequests();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/login");
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "로그아웃되었습니다" });
    navigate("/");
  };

  const handleAcceptCall = (callId: string) => {
    toast({ title: "호출을 수락했습니다!", description: "환자에게 연락 중..." });
  };

  const handleLogComplete = async (input: CreateDrivingLogInput): Promise<string | null> => {
    const log = await createLog(input);
    return log?.id || null;
  };

  const handleRevenueUpdate = (logId: string, data: UpdateRevenueInput) => {
    updateRevenue(logId, data);
  };

  const handleDeleteLog = (id: string) => {
    deleteLog(id);
  };

  const todayRevenue = mockCalls
    .filter((c) => c.status === "completed")
    .reduce((sum, c) => sum + c.estimatedFee, 0);

  const pendingCalls = mockCalls.filter((c) => c.status === "pending");
  const completedCalls = mockCalls.filter((c) => c.status === "completed");

  // Convert DB logs to stats widget format
  const statsLogs = drivingLogs.map(log => ({
    id: log.id,
    date: log.date,
    startTime: new Date(log.start_time).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    endTime: new Date(log.end_time).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    startLocation: log.start_location,
    endLocation: log.end_location,
    distance: log.distance_km,
    patientName: log.patient_name || "",
  }));

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">드라이버님</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHotlineOpen(true)}
              className="text-yellow-500"
            >
              <Star className="w-4 h-4 fill-yellow-500" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground"
            >
              <LogOut className="w-4 h-4 mr-1" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* Quick Actions Bar */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPatientInfoOpen(true)}
            className="rounded-full flex-1"
          >
            <Activity className="w-4 h-4 mr-1" />
            환자 정보 입력
          </Button>
          <button
            onClick={() => setIsSimulateMode(!isSimulateMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isSimulateMode 
                ? "bg-green-100 text-green-700" 
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {isSimulateMode ? (
              <ToggleRight className="w-4 h-4" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
            시뮬레이션
          </button>
          <button
            onClick={() => {
              if (isTracking) {
                stopTracking();
                toast({ title: "위치 공유 중지됨" });
              } else {
                startTracking({ name: user?.email || "구급대원", vehicleType: "ambulance" });
                toast({ title: "위치 공유 시작됨", description: "보호자/환자에게 표시됩니다." });
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isTracking 
                ? "bg-green-500 text-white" 
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <Radio className={`w-4 h-4 ${isTracking ? "animate-pulse" : ""}`} />
            {isTracking ? "위치 공유 중" : "위치 공유"}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-[108px] z-40 bg-white border-b border-border">
        <div className="flex">
          {[
            { id: "calls", label: "호출", icon: Phone },
            { id: "revenue", label: "수익", icon: DollarSign },
            { id: "log", label: "운행일지", icon: FileText },
            { id: "map", label: "지도", icon: Map },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                if (id === "map") {
                  navigate("/map?mode=driver");
                } else {
                  setActiveTab(id as typeof activeTab);
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                activeTab === id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="p-4">
        {activeTab === "calls" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Driving Stats Summary */}
            <DrivingStatsWidget logs={statsLogs} />
            {/* Pending Calls */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                대기 중인 호출 ({pendingCalls.length})
              </h3>
              <div className="space-y-3">
                {pendingCalls.map((call) => (
                  <div
                    key={call.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-border"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{call.patientName}</p>
                        <p className="text-xs text-muted-foreground">{call.time}</p>
                      </div>
                      <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                        대기 중
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">{call.location}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Navigation className="w-4 h-4 text-primary mt-0.5" />
                        <span className="text-foreground font-medium">{call.hospital}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">예상 거리: {call.distance}</span>
                        <span className="text-lg font-bold text-primary">
                          ₩{call.estimatedFee.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleAcceptCall(call.id)}
                      className="w-full rounded-xl"
                    >
                      호출 수락
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Calls */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                완료된 운행 ({completedCalls.length})
              </h3>
              <div className="space-y-3">
                {completedCalls.map((call) => (
                  <div
                    key={call.id}
                    className="bg-gray-50 rounded-2xl p-4 border border-border opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{call.patientName}</p>
                        <p className="text-xs text-muted-foreground">{call.hospital}</p>
                      </div>
                      <span className="text-green-600 font-semibold">
                        +₩{call.estimatedFee.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "revenue" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Revenue Stats Widget with Charts */}
            <RevenueStatsWidget 
              logs={drivingLogs} 
              currentMonth={currentMonth} 
            />
            
            {/* Return Trip Matching */}
            <RevenueTab 
              todayRevenue={stats.totalRevenue} 
              completedTrips={drivingLogs.filter(l => l.revenue_amount).length} 
            />
          </motion.div>
        )}

        {activeTab === "log" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <DrivingLogHistory 
              logs={drivingLogs} 
              isLoading={isLogsLoading}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onDeleteLog={handleDeleteLog}
              stats={stats}
            />
          </motion.div>
        )}

        {activeTab === "map" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Map className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">지도 보기</h3>
            <p className="text-sm text-muted-foreground mb-6">
              환자 위치와 최적 경로를 확인하세요
            </p>
            <Button onClick={() => navigate("/map?mode=driver")} className="rounded-xl">
              전체 지도 보기
            </Button>
          </motion.div>
        )}
      </main>

      {/* Trip Management Widget - 통합된 이송/운행 관리 */}
      <TripManagementWidget 
        onLogComplete={handleLogComplete}
        onRevenueUpdate={handleRevenueUpdate}
        isSimulateMode={isSimulateMode}
      />

      {/* Patient Info Modal */}
      <PatientInfoModal
        isOpen={isPatientInfoOpen}
        onClose={() => setIsPatientInfoOpen(false)}
      />

      {/* Hotline Manager */}
      <HotlineManager
        isOpen={isHotlineOpen}
        onClose={() => setIsHotlineOpen(false)}
        contacts={hotlines}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
};

export default DriverDashboard;
