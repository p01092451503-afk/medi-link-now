import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Hospital, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRejectionLogs, REJECTION_REASONS } from '@/hooks/useRejectionLogs';
import { useRealtimeHospitals } from '@/hooks/useRealtimeHospitals';
import { toast } from '@/hooks/use-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'hospital' | 'reason' | 'success';

const RejectionLoggerModal = ({ isOpen, onClose }: Props) => {
  const [step, setStep] = useState<Step>('hospital');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<{ id: number; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { hospitals } = useRealtimeHospitals();
  const { addLog } = useRejectionLogs();

  // Get user location
  useEffect(() => {
    if (isOpen) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Location error:', error);
          toast({
            title: "위치 권한 필요",
            description: "가까운 병원을 찾으려면 위치 권한이 필요합니다.",
            variant: "destructive",
          });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [isOpen]);

  // Calculate nearest hospitals
  const nearestHospitals = useMemo(() => {
    if (!userLocation || !hospitals.length) return [];

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
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
        id: h.id,
        name: h.name,
        distance: calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [hospitals, userLocation]);

  const handleHospitalSelect = (hospital: { id: number; name: string }) => {
    setSelectedHospital(hospital);
    setStep('reason');
  };

  const handleReasonSelect = async (reason: string) => {
    if (!selectedHospital) return;

    setIsSubmitting(true);
    try {
      await addLog(
        selectedHospital.id,
        selectedHospital.name,
        reason
      );
      
      setStep('success');
      toast({
        title: "기록되었습니다",
        description: `${selectedHospital.name} - ${REJECTION_REASONS.find(r => r.id === reason)?.label}`,
      });
      
      setTimeout(() => {
        onClose();
        setStep('hospital');
        setSelectedHospital(null);
      }, 1500);
    } catch (error) {
      console.error('Error adding rejection log:', error);
      toast({
        title: "기록 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep('hospital');
    setSelectedHospital(null);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
              <Hospital className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">거부 이력 기록</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 'hospital' && '병원을 선택해주세요'}
                {step === 'reason' && '거절 사유를 선택해주세요'}
                {step === 'success' && '기록 완료'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Step: Hospital Selection */}
        {step === 'hospital' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-4">
              <MapPin className="w-4 h-4 text-primary" />
              <span>가장 가까운 응급실</span>
            </div>

            {!userLocation ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-slate-500 dark:text-slate-400">위치 확인 중...</span>
              </div>
            ) : nearestHospitals.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                주변 병원을 찾을 수 없습니다
              </div>
            ) : (
              nearestHospitals.map((hospital, index) => (
                <motion.button
                  key={hospital.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleHospitalSelect(hospital)}
                  className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-primary font-bold shadow-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-white truncate">{hospital.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{hospital.distance.toFixed(1)}km</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4 text-red-500 dark:text-red-400" />
                  </div>
                </motion.button>
              ))
            )}
          </div>
        )}

        {/* Step: Reason Selection */}
        {step === 'reason' && selectedHospital && (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950/50 rounded-xl p-3 mb-4">
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">{selectedHospital.name}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {REJECTION_REASONS.map((reason, index) => (
                <motion.button
                  key={reason.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleReasonSelect(reason.id)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-red-100 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <span>{reason.icon}</span>
                  <span className="font-medium text-sm">{reason.label}</span>
                </motion.button>
              ))}
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                setStep('hospital');
                setSelectedHospital(null);
              }}
              className="w-full mt-4"
            >
              다른 병원 선택
            </Button>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-semibold text-slate-800 dark:text-white">기록되었습니다</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {selectedHospital?.name}
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RejectionLoggerModal;
