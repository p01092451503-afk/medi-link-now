import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, MapPin, User, FileText, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ScheduledCallFormProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: [number, number] | null;
}

const ScheduledCallForm = ({ isOpen, onClose, userLocation }: ScheduledCallFormProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    patientCondition: "",
    pickupLocation: "",
    destination: "",
    scheduledDate: "",
    scheduledTime: "",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!formData.scheduledDate || !formData.scheduledTime) {
      toast({ title: "날짜와 시간을 입력해주세요", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const scheduledTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();

    const { error } = await supabase.from("ambulance_dispatch_requests").insert({
      pickup_location: formData.pickupLocation || "미정",
      pickup_lat: userLocation?.[0] || 37.5665,
      pickup_lng: userLocation?.[1] || 126.978,
      destination: formData.destination || null,
      patient_name: formData.patientName || null,
      patient_condition: formData.patientCondition || null,
      notes: formData.notes || null,
      requester_id: user?.id || null,
      status: "scheduled",
      is_scheduled: true,
      scheduled_time: scheduledTime,
    });

    setIsLoading(false);

    if (error) {
      toast({ title: "예약 실패", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "📅 예약 호출이 등록되었습니다", description: "기사들의 입찰을 기다려주세요." });
    onClose();
    setFormData({ patientName: "", patientCondition: "", pickupLocation: "", destination: "", scheduledDate: "", scheduledTime: "", notes: "" });
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

            <div className="px-6 pb-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">예약 호출</h2>
                  <p className="text-sm text-muted-foreground">퇴원/전원 예약</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-foreground mb-1">
                    <Calendar className="w-3.5 h-3.5" /> 날짜
                  </label>
                  <Input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData((p) => ({ ...p, scheduledDate: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-foreground mb-1">
                    <Clock className="w-3.5 h-3.5" /> 시간
                  </label>
                  <Input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData((p) => ({ ...p, scheduledTime: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-foreground mb-1">
                  <User className="w-3.5 h-3.5" /> 환자 이름
                </label>
                <Input
                  placeholder="환자 이름"
                  value={formData.patientName}
                  onChange={(e) => setFormData((p) => ({ ...p, patientName: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-foreground mb-1">
                  <FileText className="w-3.5 h-3.5" /> 환자 상태
                </label>
                <Input
                  placeholder="예: 거동 불편, 침대 이송 필요"
                  value={formData.patientCondition}
                  onChange={(e) => setFormData((p) => ({ ...p, patientCondition: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-foreground mb-1">
                  <MapPin className="w-3.5 h-3.5" /> 출발지
                </label>
                <Input
                  placeholder="병원 이름 또는 주소"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData((p) => ({ ...p, pickupLocation: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-foreground mb-1">
                  <MapPin className="w-3.5 h-3.5" /> 목적지
                </label>
                <Input
                  placeholder="도착 주소"
                  value={formData.destination}
                  onChange={(e) => setFormData((p) => ({ ...p, destination: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">추가 메모</label>
                <Textarea
                  placeholder="특이사항 (예: 산소 필요, 들것 이송)"
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="p-6 pt-0">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full py-6 text-base font-bold rounded-2xl bg-foreground text-background hover:opacity-90"
              >
                {isLoading ? (
                  <AmbulanceLoader variant="inline" message="등록 중" />
                ) : (
                  <><Send className="w-5 h-5 mr-2" /> 예약 호출 등록</>
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ScheduledCallForm;
