import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Clock, Navigation, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export interface DrivingLog {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  patientName: string;
}

interface DrivingLogWidgetProps {
  onLogComplete?: (log: DrivingLog) => void;
  isSimulateMode?: boolean;
}

const DrivingLogWidget = ({ onLogComplete, isSimulateMode = false }: DrivingLogWidgetProps) => {
  const [isDriving, setIsDriving] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startLocation, setStartLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDriving && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isDriving, startTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve) => {
      if (isSimulateMode) {
        // Simulate location for testing
        resolve({ lat: 37.5665 + Math.random() * 0.1, lng: 126.978 + Math.random() * 0.1 });
        return;
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => {
            // Fallback to Seoul coordinates
            resolve({ lat: 37.5665, lng: 126.978 });
          }
        );
      } else {
        resolve({ lat: 37.5665, lng: 126.978 });
      }
    });
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleStartDriving = async () => {
    const location = await getLocation();
    setStartLocation(location);
    setStartTime(new Date());
    setElapsedTime(0);
    setIsDriving(true);
    toast({
      title: "운행 시작",
      description: isSimulateMode ? "시뮬레이션 모드로 운행을 시작합니다" : "GPS 추적이 시작되었습니다",
    });
  };

  const handleStopDriving = async () => {
    if (!startTime || !startLocation) return;

    const endLocation = await getLocation();
    const endTime = new Date();
    const distance = calculateDistance(
      startLocation.lat,
      startLocation.lng,
      endLocation.lat,
      endLocation.lng
    );

    const log: DrivingLog = {
      id: Date.now().toString(),
      date: startTime.toLocaleDateString("ko-KR"),
      startTime: startTime.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      endTime: endTime.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      startLocation: `${startLocation.lat.toFixed(4)}, ${startLocation.lng.toFixed(4)}`,
      endLocation: `${endLocation.lat.toFixed(4)}, ${endLocation.lng.toFixed(4)}`,
      distance: isSimulateMode ? Math.round(Math.random() * 20 + 5) : Math.round(distance * 10) / 10,
      patientName: "환자명 미입력",
    };

    setIsDriving(false);
    setStartTime(null);
    setElapsedTime(0);
    setStartLocation(null);

    if (onLogComplete) {
      onLogComplete(log);
    }

    toast({
      title: "운행 완료",
      description: `운행 거리: ${log.distance}km`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-20 right-4 z-[1000]"
    >
      <AnimatePresence mode="wait">
        {isDriving ? (
          <motion.div
            key="driving"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-border p-4 min-w-[180px]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-semibold text-foreground">운행 중</span>
            </div>
            
            <div className="flex items-center gap-2 mb-3 bg-gray-50 rounded-xl p-3">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-xl font-mono font-bold text-foreground">
                {formatTime(elapsedTime)}
              </span>
            </div>

            <Button
              onClick={handleStopDriving}
              variant="destructive"
              className="w-full rounded-xl"
            >
              <Square className="w-4 h-4 mr-2" />
              운행 종료
            </Button>
          </motion.div>
        ) : (
          <motion.button
            key="start"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={handleStartDriving}
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            <Play className="w-5 h-5" />
            운행 시작
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DrivingLogWidget;
