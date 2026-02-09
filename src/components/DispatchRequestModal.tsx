import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  MapPin, 
  User, 
  FileText, 
  Send, 
  Loader2,
  Ambulance,
  Navigation
} from "lucide-react";
import { DriverPresence } from "@/hooks/useDriverPresence";
import { useDispatchRequests } from "@/hooks/useDispatchRequests";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface DispatchRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDriver?: DriverPresence | null;
  userLocation: [number, number] | null;
  pickupAddress?: string;
}

const DispatchRequestModal = ({
  isOpen,
  onClose,
  selectedDriver,
  userLocation,
  pickupAddress = "",
}: DispatchRequestModalProps) => {
  const { createRequest, isLoading } = useDispatchRequests();
  const [formData, setFormData] = useState({
    patientName: "",
    patientCondition: "",
    pickupLocation: pickupAddress,
    destination: "",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!userLocation) {
      return;
    }

    const request = await createRequest({
      pickup_location: formData.pickupLocation || "현재 위치",
      pickup_lat: userLocation[0],
      pickup_lng: userLocation[1],
      destination: formData.destination || undefined,
      patient_name: formData.patientName || undefined,
      patient_condition: formData.patientCondition || undefined,
      notes: formData.notes || undefined,
      estimated_distance_km: selectedDriver 
        ? Math.sqrt(
            Math.pow(selectedDriver.lat - userLocation[0], 2) + 
            Math.pow(selectedDriver.lng - userLocation[1], 2)
          ) * 111
        : undefined,
    });

    if (request) {
      onClose();
      setFormData({
        patientName: "",
        patientCondition: "",
        pickupLocation: "",
        destination: "",
        notes: "",
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[2000]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[2001] bg-background rounded-t-3xl max-h-[85vh] overflow-y-auto"
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-muted rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Ambulance className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">구급대원 호출</h2>
                    {selectedDriver && (
                      <p className="text-sm text-muted-foreground">
                        {selectedDriver.name}님에게 요청
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {!userLocation && (
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-2xl text-sm text-muted-foreground">
                  <Navigation className="w-4 h-4" />
                  <span>위치 서비스를 켜주세요</span>
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <User className="w-4 h-4" />
                  환자 이름 (선택)
                </label>
                <Input
                  placeholder="환자 이름을 입력하세요"
                  value={formData.patientName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, patientName: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <FileText className="w-4 h-4" />
                  환자 상태 (선택)
                </label>
                <Input
                  placeholder="예: 가슴 통증, 호흡 곤란"
                  value={formData.patientCondition}
                  onChange={(e) => setFormData((prev) => ({ ...prev, patientCondition: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  픽업 위치
                </label>
                <Input
                  placeholder="상세 주소 또는 랜드마크"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pickupLocation: e.target.value }))}
                  className="rounded-xl"
                />
                {userLocation && (
                  <p className="text-xs text-muted-foreground mt-1">
                    현재 위치: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  목적지 (선택)
                </label>
                <Input
                  placeholder="병원 이름 또는 주소"
                  value={formData.destination}
                  onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  추가 메모
                </label>
                <Textarea
                  placeholder="구급대원에게 전달할 내용 (예: 아파트 동/호수, 접근 방법)"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="p-6 pt-0">
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !userLocation}
                className="w-full py-6 text-base font-bold rounded-2xl bg-foreground text-background hover:opacity-90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    요청 중...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    구급대원 호출 요청
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DispatchRequestModal;