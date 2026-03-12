import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronUp, ChevronDown, Clock, CheckCircle, XCircle, Trash2, FileText, RotateCcw, MapPin } from "lucide-react";
import { useTransferRequest, RequestStatus } from "@/contexts/TransferRequestContext";
import { useRealtimeReturnTrips, ReturnTripRequest } from "@/hooks/useRealtimeReturnTrips";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const StatusBadge = ({ status }: { status: RequestStatus }) => {
  const config = {
    pending: {
      icon: Clock,
      label: "승인 대기 중",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    accepted: {
      icon: CheckCircle,
      label: "승인됨",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    rejected: {
      icon: XCircle,
      label: "거절됨",
      className: "bg-red-100 text-red-700 border-red-200",
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

const ReturnTripStatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { icon: typeof Clock; label: string; className: string }> = {
    pending: {
      icon: Clock,
      label: "기사 매칭 대기",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    accepted: {
      icon: CheckCircle,
      label: "기사 매칭 완료",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    completed: {
      icon: CheckCircle,
      label: "이송 완료",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    cancelled: {
      icon: XCircle,
      label: "취소됨",
      className: "bg-red-100 text-red-700 border-red-200",
    },
  };

  const { icon: Icon, label, className } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

const ReturnTripItem = ({ trip }: { trip: ReturnTripRequest }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="px-4 py-3 border-b border-border last:border-b-0"
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="truncate">{trip.pickup_city} → {trip.destination_city}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <ReturnTripStatusBadge status={trip.status} />
          <span className="text-[10px] text-muted-foreground">
            {new Date(trip.created_at).toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{trip.patient_name}</span>
          <span>·</span>
          <span>{trip.distance}</span>
          <span>·</span>
          <span className="font-medium text-foreground">
            {trip.estimated_fee.toLocaleString()}원
          </span>
        </div>
      </div>
    </div>
  </motion.div>
);

const MyRequestsPanel = () => {
  const { requests, removeRequest, clearAllRequests } = useTransferRequest();
  const { trips: returnTrips, isLoading: returnTripsLoading } = useRealtimeReturnTrips();
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("transfer");

  const totalCount = requests.length + returnTrips.length;

  if (totalCount === 0) return null;

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const acceptedCount = requests.filter(r => r.status === "accepted").length;
  const returnPendingCount = returnTrips.filter(t => t.status === "pending").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed bottom-20 inset-x-0 mx-auto z-[1000] w-[calc(100%-2rem)] max-w-80 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-primary to-blue-600 text-white"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="font-semibold text-sm">내 요청 목록</span>
          <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
            {totalCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {(pendingCount + returnPendingCount) > 0 && (
            <span className="flex items-center gap-1 bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
              <Clock className="w-3 h-3" />
              {pendingCount + returnPendingCount}
            </span>
          )}
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full rounded-none border-b border-border h-9 bg-muted/50">
                <TabsTrigger value="transfer" className="flex-1 text-xs h-7 data-[state=active]:bg-card">
                  이송 요청 {requests.length > 0 && `(${requests.length})`}
                </TabsTrigger>
                <TabsTrigger value="return" className="flex-1 text-xs h-7 data-[state=active]:bg-card">
                  <RotateCcw className="w-3 h-3 mr-1" />
                  복귀편 {returnTrips.length > 0 && `(${returnTrips.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="transfer" className="mt-0">
                <div className="max-h-64 overflow-y-auto">
                  {requests.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                      이송 요청이 없습니다
                    </div>
                  ) : (
                    requests.map((request) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="px-4 py-3 border-b border-border last:border-b-0"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {request.hospitalName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <StatusBadge status={request.status} />
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(request.createdAt).toLocaleTimeString("ko-KR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="mt-1.5 text-[10px] text-muted-foreground">
                              {request.patientInfo.age}세 {request.patientInfo.gender === "male" ? "남" : "여"} · {
                                request.patientInfo.mainSymptom === "chest_pain" ? "흉통" :
                                request.patientInfo.mainSymptom === "dyspnea" ? "호흡곤란" :
                                request.patientInfo.mainSymptom === "stroke_symptoms" ? "뇌졸중" :
                                request.patientInfo.mainSymptom === "trauma" ? "외상" :
                                request.patientInfo.mainSymptom
                              }
                            </div>
                          </div>
                          <button
                            onClick={() => removeRequest(request.id)}
                            className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {requests.length > 0 && (
                  <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      {acceptedCount > 0 && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          {acceptedCount} 승인
                        </span>
                      )}
                      {pendingCount > 0 && (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Clock className="w-3 h-3" />
                          {pendingCount} 대기
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllRequests}
                      className="text-[10px] h-6 px-2 text-muted-foreground hover:text-destructive"
                    >
                      전체 삭제
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="return" className="mt-0">
                <div className="max-h-64 overflow-y-auto">
                  {returnTripsLoading ? (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                      불러오는 중...
                    </div>
                  ) : returnTrips.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                      복귀편 요청이 없습니다
                    </div>
                  ) : (
                    returnTrips.map((trip) => (
                      <ReturnTripItem key={trip.id} trip={trip} />
                    ))
                  )}
                </div>

                {returnTrips.length > 0 && (
                  <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center gap-3 text-[10px] text-muted-foreground">
                    {returnPendingCount > 0 && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Clock className="w-3 h-3" />
                        {returnPendingCount}건 매칭 대기
                      </span>
                    )}
                    {returnTrips.filter(t => t.status === "accepted").length > 0 && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        {returnTrips.filter(t => t.status === "accepted").length}건 매칭 완료
                      </span>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyRequestsPanel;
