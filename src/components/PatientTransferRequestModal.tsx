import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Activity, Heart, Droplet, Wind, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransferRequest } from "@/contexts/TransferRequestContext";
import { usePrivateTraffic } from "@/contexts/PrivateTrafficContext";
import { toast } from "@/hooks/use-toast";

interface PatientTransferRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalId: number;
  hospitalName: string;
  onRequestSent: () => void;
}

const SYMPTOM_OPTIONS = [
  { value: "chest_pain", label: "흉통 (Chest Pain)" },
  { value: "dyspnea", label: "호흡곤란 (Dyspnea)" },
  { value: "altered_mental", label: "의식변화 (Altered Mental Status)" },
  { value: "stroke_symptoms", label: "뇌졸중 증상 (Stroke Symptoms)" },
  { value: "trauma", label: "외상 (Trauma)" },
  { value: "abdominal_pain", label: "복통 (Abdominal Pain)" },
  { value: "gi_bleeding", label: "위장관 출혈 (GI Bleeding)" },
  { value: "seizure", label: "경련 (Seizure)" },
  { value: "fever", label: "발열 (Fever)" },
  { value: "other", label: "기타 (Other)" },
];

const PatientTransferRequestModal = ({
  isOpen,
  onClose,
  hospitalId,
  hospitalName,
  onRequestSent,
}: PatientTransferRequestModalProps) => {
  const { addRequest, updateRequestStatus } = useTransferRequest();
  const { incrementTraffic } = usePrivateTraffic();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    mainSymptom: "",
    bp: "",
    hr: "",
    spo2: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.age || !formData.gender || !formData.mainSymptom) {
      toast({
        title: "필수 정보를 입력해주세요",
        description: "나이, 성별, 주증상은 필수입니다.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Add the request
    const requestId = addRequest({
      hospitalId,
      hospitalName,
      patientInfo: formData,
    });

    // Show toast notification
    toast({
      title: `${hospitalName}에 요청 전송됨!`,
      description: "병원 승인을 기다리는 중입니다...",
    });

    onRequestSent();
    onClose();

    // Reset form
    setFormData({
      age: "",
      gender: "",
      mainSymptom: "",
      bp: "",
      hr: "",
      spo2: "",
    });

    setIsSubmitting(false);

    // Simulate hospital response after 3 seconds
    setTimeout(() => {
      updateRequestStatus(requestId, "accepted");
      
      // Increment private traffic count for this hospital
      incrementTraffic(hospitalId);
      
      // Browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("이송 요청 승인됨!", {
          body: `${hospitalName}에서 이송 요청을 승인했습니다.`,
          icon: "/favicon.png",
        });
      } else {
        // Fallback to alert
        alert(`✅ ${hospitalName}에서 이송 요청을 승인했습니다!`);
      }

      toast({
        title: "요청 승인됨! ✅",
        description: `${hospitalName}에서 이송 요청을 승인했습니다.`,
      });
    }, 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[1100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-[1101] max-w-md mx-auto max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 px-5 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-foreground">디지털 이송 요청</h2>
                <p className="text-xs text-muted-foreground">{hospitalName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Patient Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <User className="w-4 h-4 text-primary" />
                  환자 기본 정보
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="age" className="text-xs">나이 *</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="예: 65"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-xs">성별 *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">남성</SelectItem>
                        <SelectItem value="female">여성</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="symptom" className="text-xs">주증상 *</Label>
                  <Select
                    value={formData.mainSymptom}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, mainSymptom: value }))}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="주증상 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {SYMPTOM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Vital Signs */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Activity className="w-4 h-4 text-red-500" />
                  활력징후 (Vital Signs)
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bp" className="text-xs flex items-center gap-1">
                      <Heart className="w-3 h-3 text-red-500" />
                      혈압 (BP)
                    </Label>
                    <Input
                      id="bp"
                      placeholder="120/80"
                      value={formData.bp}
                      onChange={(e) => setFormData(prev => ({ ...prev, bp: e.target.value }))}
                      className="h-10 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="hr" className="text-xs flex items-center gap-1">
                      <Droplet className="w-3 h-3 text-pink-500" />
                      심박수 (HR)
                    </Label>
                    <Input
                      id="hr"
                      type="number"
                      placeholder="72"
                      value={formData.hr}
                      onChange={(e) => setFormData(prev => ({ ...prev, hr: e.target.value }))}
                      className="h-10 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="spo2" className="text-xs flex items-center gap-1">
                      <Wind className="w-3 h-3 text-blue-500" />
                      산소포화도
                    </Label>
                    <Input
                      id="spo2"
                      type="number"
                      placeholder="98"
                      value={formData.spo2}
                      onChange={(e) => setFormData(prev => ({ ...prev, spo2: e.target.value }))}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white font-semibold"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    전송 중...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    이송 요청 전송
                  </div>
                )}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                * 필수 항목 | 요청 전송 후 병원 승인을 기다려 주세요
              </p>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PatientTransferRequestModal;
