import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  X, 
  Car, 
  Construction, 
  Building2, 
  ShieldAlert,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export interface LiveReport {
  id: string;
  type: "traffic" | "construction" | "hospital_full" | "police";
  location: { lat: number; lng: number };
  timestamp: Date;
  message: string;
}

interface LiveReportFABProps {
  onReport?: (report: LiveReport) => void;
  userLocation?: { lat: number; lng: number };
}

const reportTypes = [
  {
    id: "traffic",
    icon: Car,
    label: "교통 정체",
    labelEn: "Traffic Jam",
    color: "bg-orange-500",
  },
  {
    id: "construction",
    icon: Construction,
    label: "공사 중",
    labelEn: "Construction",
    color: "bg-yellow-500",
  },
  {
    id: "hospital_full",
    icon: Building2,
    label: "병원 만실",
    labelEn: "Hospital Full",
    color: "bg-red-500",
  },
  {
    id: "police",
    icon: ShieldAlert,
    label: "경찰 단속",
    labelEn: "Police Trap",
    color: "bg-blue-500",
  },
];

const LiveReportFAB = ({ onReport, userLocation }: LiveReportFABProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reportedType, setReportedType] = useState<string | null>(null);

  const handleReport = (type: string) => {
    const reportType = reportTypes.find((r) => r.id === type);
    if (!reportType) return;

    const location = userLocation || { lat: 37.5665, lng: 126.978 };
    
    const report: LiveReport = {
      id: Date.now().toString(),
      type: type as LiveReport["type"],
      location,
      timestamp: new Date(),
      message: reportType.label,
    };

    setReportedType(type);
    
    if (onReport) {
      onReport(report);
    }

    toast({
      title: "신고 완료!",
      description: `${reportType.label} 정보가 공유되었습니다`,
    });

    setTimeout(() => {
      setReportedType(null);
      setIsOpen(false);
    }, 1500);
  };

  return (
    <>
      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 right-20 z-[1000] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          isOpen ? "bg-gray-600" : "bg-orange-500 hover:bg-orange-600"
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="alert"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <AlertTriangle className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Report Options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-40 right-4 z-[1000] bg-white rounded-2xl shadow-xl border border-border p-4 min-w-[200px]"
          >
            <p className="text-sm font-semibold text-foreground mb-3">
              실시간 현황 신고
            </p>
            <div className="space-y-2">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                const isReported = reportedType === type.id;
                
                return (
                  <motion.button
                    key={type.id}
                    onClick={() => handleReport(type.id)}
                    disabled={reportedType !== null}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isReported
                        ? "bg-green-50 border-2 border-green-500"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full ${type.color} flex items-center justify-center`}>
                      {isReported ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <Icon className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.labelEn}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              주변 드라이버에게 공유됩니다
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LiveReportFAB;
