import { useState, useEffect, useMemo } from "react";
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
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AccountDeleteModal from "@/components/AccountDeleteModal";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
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

import RejectionLoggerFAB from "@/components/RejectionLoggerFAB";
import RejectionTimeline from "@/components/RejectionTimeline";
import RejectionTickerFeed from "@/components/RejectionTickerFeed";
import VoiceEmergencyLogFAB from "@/components/VoiceEmergencyLogFAB";
import { useRejectionLogs } from "@/hooks/useRejectionLogs";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import { useReviews } from "@/hooks/useReviews";
import { useBids } from "@/hooks/useBids";
import CallWaitingToggle from "@/components/CallWaitingToggle";
import IncomingCallPopup from "@/components/IncomingCallPopup";
import DriverReviewCard from "@/components/DriverReviewCard";
import DriverBidForm from "@/components/DriverBidForm";
import driverDefaultAvatar from "@/assets/avatars/driver-default.jpg";

// Helper function to format time ago
const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${Math.floor(diffHours / 24)}일 전`;
};

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
  const { isTracking, startTracking, stopTracking, nearbyDrivers, currentLocation: driverLocation } = useDriverPresence();
  const { pendingRequests, myRequests, acceptRequest, startTransport, isLoading: isDispatchLoading } = useDispatchRequests();
  const { logs: rejectionLogs } = useRejectionLogs();
  const { isCallWaiting, toggleCallWaiting } = useDriverLocation();
  const { driverStats } = useReviews(user?.id);
  const [incomingCall, setIncomingCall] = useState<any>(null);

  // Listen for broadcast dispatch notifications
  useEffect(() => {
    if (!user?.id || !isCallWaiting) return;

    const channel = supabase
      .channel("dispatch_broadcast")
      .on("broadcast", { event: "new_dispatch" }, (payload) => {
        const data = payload.payload;
        if (data.nearby_driver_ids?.includes(user.id)) {
          setIncomingCall(data);
        }
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user?.id, isCallWaiting]);

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

  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "로그아웃되었습니다" });
    navigate("/");
  };

  // Real dispatch request acceptance
  const handleAcceptCall = async (requestId: string) => {
    const success = await acceptRequest(requestId);
    if (success) {
      toast({ title: "호출을 수락했습니다!", description: "이송 시작 버튼을 눌러주세요." });
    }
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

  // Get completed requests from myRequests
  const completedRequests = myRequests.filter((r) => r.status === "completed");

  // Haversine distance calculation (km)
  const calcDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Proximity-based dispatch filtering: 10km → 20km → 50km → all
  const { filteredRequests, activeRadiusLabel } = useMemo(() => {
    if (!driverLocation || pendingRequests.length === 0) {
      return { filteredRequests: pendingRequests.map(r => ({ ...r, distanceFromDriver: null as number | null })), activeRadiusLabel: "전국" };
    }

    const [dLat, dLng] = driverLocation;
    const withDistance = pendingRequests.map(r => ({
      ...r,
      distanceFromDriver: calcDistance(dLat, dLng, r.pickup_lat, r.pickup_lng),
    }));

    // Sort by distance
    withDistance.sort((a, b) => a.distanceFromDriver - b.distanceFromDriver);

    // Try expanding radius: 10km → 20km → 50km → all
    const radiusSteps = [
      { km: 10, label: "10km 이내" },
      { km: 20, label: "20km 이내" },
      { km: 50, label: "50km 이내" },
    ];

    for (const step of radiusSteps) {
      const inRange = withDistance.filter(r => r.distanceFromDriver <= step.km);
      if (inRange.length > 0) {
        return { filteredRequests: inRange, activeRadiusLabel: step.label };
      }
    }

    // No requests within 50km, show all
    return { filteredRequests: withDistance, activeRadiusLabel: "전국" };
  }, [driverLocation, pendingRequests]);

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
    <div className="min-h-screen bg-background pb-48">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={driverDefaultAvatar}
              alt="드라이버"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-foreground tracking-tight">드라이버님</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsHotlineOpen(true)}
              className="text-foreground"
            >
              <Star className="w-4 h-4" />
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteAccount(true)}
              className="text-destructive/70 hover:text-destructive text-xs"
            >
              회원탈퇴
            </Button>
          </div>
        </div>
      </header>

      {/* Quick Actions Bar */}
      <div className="sticky top-[60px] z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setIsPatientInfoOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-foreground flex-shrink-0 whitespace-nowrap transition-colors hover:bg-secondary/80"
          >
            <Activity className="w-3.5 h-3.5" />
            환자 정보 입력
          </button>
          <button
            onClick={() => setIsSimulateMode(!isSimulateMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 whitespace-nowrap ${
              isSimulateMode 
                ? "bg-foreground text-background" 
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {isSimulateMode ? (
              <ToggleRight className="w-3.5 h-3.5" />
            ) : (
              <ToggleLeft className="w-3.5 h-3.5" />
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 whitespace-nowrap ${
              isTracking 
                ? "bg-foreground text-background" 
                : "bg-secondary text-muted-foreground"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isTracking ? "animate-pulse" : ""}`} />
            {isTracking ? "위치 공유 중" : "위치 공유"}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-[108px] z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex">
          <button
            onClick={() => navigate("/map?mode=driver")}
            className="flex items-center justify-center gap-1.5 py-2.5 px-5 mx-4 my-1.5 text-sm font-bold bg-foreground text-background rounded-lg transition-colors hover:opacity-90"
          >
            <Map className="w-4 h-4" />
            지도
          </button>
           {[
             { id: "calls", label: "호출", icon: Phone },
             { id: "revenue", label: "수익", icon: DollarSign },
             { id: "log", label: "운행일지", icon: FileText },
             { id: "bids", label: "입찰", icon: DollarSign, action: () => navigate("/driver-bids") },
           ].map(({ id, label, icon: Icon, action }) => (
             <button
               key={id}
               onClick={() => {
                 if (action) {
                   action();
                 } else {
                   setActiveTab(id as typeof activeTab);
                 }
               }}
               className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                 activeTab === id
                   ? "text-foreground border-b-2 border-foreground"
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
            {/* Call Waiting Toggle */}
            <CallWaitingToggle isActive={isCallWaiting} onToggle={toggleCallWaiting} />

            {/* Driver Review Stats */}
            <DriverReviewCard stats={driverStats} />

            {/* Real-time Rejection Ticker Feed */}
            <RejectionTickerFeed />
            {/* Pending Calls */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-foreground" />
                대기 중인 호출 ({filteredRequests.length})
                {driverLocation && (
                  <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-foreground">
                    {activeRadiusLabel}
                  </span>
                )}
                {!driverLocation && isTracking && (
                  <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    위치 확인 중...
                  </span>
                )}
                {!isTracking && (
                  <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    위치 공유 OFF
                  </span>
                )}
              </h3>
              {isDispatchLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card rounded-2xl p-4 border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="bg-card rounded-2xl p-6 border border-border text-center">
                  <Phone className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-muted-foreground text-sm">
                    {driverLocation ? "근처에 대기 중인 호출이 없습니다" : "대기 중인 호출이 없습니다"}
                  </p>
                  {!isTracking && (
                    <p className="text-xs text-muted-foreground mt-2">
                      위치 공유를 켜면 가까운 호출을 우선 받을 수 있습니다
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-card rounded-2xl p-4 border border-border"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-foreground tracking-tight">
                            {request.patient_name || "환자"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(request.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {request.distanceFromDriver !== null && (
                            <span className="px-2 py-1 bg-secondary text-foreground text-xs font-bold rounded-full">
                              {request.distanceFromDriver < 1 
                                ? `${Math.round(request.distanceFromDriver * 1000)}m`
                                : `${request.distanceFromDriver.toFixed(1)}km`
                              }
                            </span>
                          )}
                          <span className="px-2 py-1 bg-secondary text-muted-foreground text-xs font-medium rounded-full">
                            대기 중
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span className="text-muted-foreground">{request.pickup_location}</span>
                        </div>
                        {request.destination && (
                          <div className="flex items-start gap-2 text-sm">
                            <Navigation className="w-4 h-4 text-foreground mt-0.5" />
                            <span className="text-foreground font-medium">{request.destination}</span>
                          </div>
                        )}
                        {request.patient_condition && (
                          <div className="text-xs text-muted-foreground bg-secondary rounded-lg px-2 py-1">
                            환자 상태: {request.patient_condition}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {request.estimated_distance_km 
                              ? `이송 거리: ${request.estimated_distance_km.toFixed(1)}km` 
                              : "거리 미정"}
                          </span>
                          {request.estimated_fee && (
                            <span className="text-lg font-bold text-foreground">
                              ₩{request.estimated_fee.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleAcceptCall(request.id)}
                        disabled={isDispatchLoading}
                        className="w-full rounded-xl bg-foreground text-background hover:opacity-90"
                      >
                        호출 수락
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scheduled Calls (Bidding) */}
            {myRequests.filter(r => (r as any).is_scheduled && r.status === "scheduled").length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-foreground" />
                  예약 호출 (입찰 가능)
                </h3>
                <div className="space-y-3">
                  {myRequests
                    .filter(r => (r as any).is_scheduled && r.status === "scheduled")
                    .map(req => (
                      <div key={req.id} className="bg-card rounded-2xl p-4 border border-border">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{req.patient_name || "환자"}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {(req as any).scheduled_time 
                                ? new Date((req as any).scheduled_time).toLocaleString("ko-KR") 
                                : "시간 미정"}
                            </p>
                          </div>
                          <span className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground">예약</span>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {req.pickup_location} → {req.destination || "미정"}
                        </div>
                        <DriverBidForm 
                          onSubmit={async (amount, message) => {
                            const { useBids } = await import("@/hooks/useBids");
                            // Inline bid creation
                            const { data, error } = await supabase.from("bids").insert({
                              request_id: req.id,
                              driver_id: user!.id,
                              bid_amount: amount,
                              message: message || null,
                            }).select().single();
                            if (!error) {
                              toast({ title: "입찰이 등록되었습니다" });
                            }
                            return data;
                          }}
                          isLoading={false}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Completed Calls */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-foreground" />
                완료된 운행 ({completedRequests.length})
              </h3>
              <div className="space-y-3">
                {completedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-secondary rounded-2xl p-4 opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {request.patient_name || "환자"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.destination || request.pickup_location}
                        </p>
                      </div>
                      {request.estimated_fee && (
                        <span className="text-foreground font-semibold">
                          +₩{request.estimated_fee.toLocaleString()}
                        </span>
                      )}
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
            className="space-y-4"
          >
            {/* Rejection Timeline */}
            <RejectionTimeline />
            
            <DrivingLogHistory 
              logs={drivingLogs}
              rejectionLogs={rejectionLogs}
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

      {/* Rejection Logger FAB removed per user request */}


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


      {/* Incoming Call Popup */}
      {incomingCall && (
        <IncomingCallPopup
          call={incomingCall}
          onAccept={async (requestId) => {
            const success = await acceptRequest(requestId);
            if (success) setIncomingCall(null);
            return success;
          }}
          onReject={() => setIncomingCall(null)}
        />
      )}

      <AccountDeleteModal open={showDeleteAccount} onOpenChange={setShowDeleteAccount} />
    </div>
  );
};

export default DriverDashboard;
