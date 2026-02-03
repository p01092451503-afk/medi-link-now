import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronUp, ChevronDown, Clock, CheckCircle, XCircle, Trash2, FileText } from "lucide-react";
import { useTransferRequest, RequestStatus } from "@/contexts/TransferRequestContext";
import { Button } from "@/components/ui/button";

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

const MyRequestsPanel = () => {
  const { requests, removeRequest, clearAllRequests } = useTransferRequest();
  const [isExpanded, setIsExpanded] = useState(true);

  // Don't render if no requests
  if (requests.length === 0) return null;

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const acceptedCount = requests.filter(r => r.status === "accepted").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed bottom-4 right-4 z-[1000] w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
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
            {requests.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
              <Clock className="w-3 h-3" />
              {pendingCount}
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
            <div className="max-h-64 overflow-y-auto">
              {requests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="px-4 py-3 border-b border-gray-100 last:border-b-0"
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
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
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
                className="text-[10px] h-6 px-2 text-muted-foreground hover:text-red-500"
              >
                전체 삭제
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyRequestsPanel;
