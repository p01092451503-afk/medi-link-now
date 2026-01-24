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
  Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";

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
  const [activeTab, setActiveTab] = useState<"calls" | "revenue" | "map">("calls");

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

  const todayRevenue = mockCalls
    .filter((c) => c.status === "completed")
    .reduce((sum, c) => sum + c.estimatedFee, 0);

  const pendingCalls = mockCalls.filter((c) => c.status === "pending");
  const completedCalls = mockCalls.filter((c) => c.status === "completed");

  return (
    <div className="min-h-screen bg-background">
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
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-border">
        <div className="flex">
          {[
            { id: "calls", label: "호출 목록", icon: Phone },
            { id: "revenue", label: "수입", icon: DollarSign },
            { id: "map", label: "지도", icon: Map },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
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
            {/* Pending Calls */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
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
                      <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-medium rounded-full">
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
            {/* Today's Summary */}
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-white">
              <p className="text-sm opacity-80 mb-1">오늘의 수입</p>
              <p className="text-4xl font-bold mb-4">₩{todayRevenue.toLocaleString()}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{completedCalls.length}건 완료</span>
                </div>
                <div className="flex items-center gap-1">
                  <Navigation className="w-4 h-4" />
                  <span>12.4km 운행</span>
                </div>
              </div>
            </div>

            {/* Weekly Stats */}
            <div className="bg-white rounded-2xl p-4 border border-border">
              <h3 className="font-semibold text-foreground mb-4">이번 주 요약</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-foreground">12</p>
                  <p className="text-xs text-muted-foreground">총 운행</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-primary">₩890,000</p>
                  <p className="text-xs text-muted-foreground">총 수입</p>
                </div>
              </div>
            </div>
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
            <Button onClick={() => navigate("/map")} className="rounded-xl">
              전체 지도 보기
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default DriverDashboard;
