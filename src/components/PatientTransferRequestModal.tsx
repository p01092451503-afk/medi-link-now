import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Activity, Heart, Droplet, Wind, Send, Brain } from "lucide-react";
import AmbulanceLoader from "@/components/AmbulanceLoader";
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
import { toast } from "@/hooks/use-toast";

interface PatientTransferRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalId: number;
  hospitalName: string;
  onRequestSent: (requestId: string) => void;
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
  const { addRequest } = useTransferRequest();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    mainSymptom: "",
    avpu: "",
    gcsEye: "",
    gcsVerbal: "",
    gcsMotor: "",
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

    const requestId = addRequest({
      hospitalId,
      hospitalName,
      patientInfo: formData,
    });

    toast({
      title: `${hospitalName}에 요청 전송됨`,
      description: "병원 응답 결과를 기록해주세요.",
    });

    onRequestSent(requestId);
    onClose();

    setFormData({
      age: "",
      gender: "",
      mainSymptom: "",
      avpu: "",
      gcsEye: "",
      gcsVerbal: "",
      gcsMotor: "",
      bp: "",
      hr: "",
      spo2: "",
    });

    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[1100]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[5vh] bottom-[5vh] bg-background rounded-3xl shadow-2xl z-[1101] max-w-md mx-auto overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-background border-b border-border px-5 py-4 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-lg font-bold text-foreground">디지털 이송 요청</h2>
                <p className="text-xs text-muted-foreground">{hospitalName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Patient Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <User className="w-4 h-4" />
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
                      className="h-10 rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-xs">성별 *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent className="z-[1200]">
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
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="주증상 선택" />
                    </SelectTrigger>
                    <SelectContent className="z-[1200]">
                      {SYMPTOM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="avpu" className="text-xs flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    의식 수준 (AVPU)
                  </Label>
                  <Select
                    value={formData.avpu}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, avpu: value }))}
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="의식 수준 선택" />
                    </SelectTrigger>
                    <SelectContent className="z-[1200]">
                      <SelectItem value="alert">A - 명료 (Alert)</SelectItem>
                      <SelectItem value="voice">V - 음성 반응 (Voice)</SelectItem>
                      <SelectItem value="pain">P - 통증 반응 (Pain)</SelectItem>
                      <SelectItem value="unresponsive">U - 무반응 (Unresponsive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* GCS Score */}
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    GCS 점수 (Glasgow Coma Scale)
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">눈 (Eye)</Label>
                      <Select
                        value={formData.gcsEye}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, gcsEye: value }))}
                      >
                        <SelectTrigger className="h-9 text-xs rounded-xl">
                          <SelectValue placeholder="E" />
                        </SelectTrigger>
                        <SelectContent className="z-[1200]">
                          <SelectItem value="4">4 - 자발적</SelectItem>
                          <SelectItem value="3">3 - 음성</SelectItem>
                          <SelectItem value="2">2 - 통증</SelectItem>
                          <SelectItem value="1">1 - 없음</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">언어 (Verbal)</Label>
                      <Select
                        value={formData.gcsVerbal}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, gcsVerbal: value }))}
                      >
                        <SelectTrigger className="h-9 text-xs rounded-xl">
                          <SelectValue placeholder="V" />
                        </SelectTrigger>
                        <SelectContent className="z-[1200]">
                          <SelectItem value="5">5 - 지남력</SelectItem>
                          <SelectItem value="4">4 - 혼란</SelectItem>
                          <SelectItem value="3">3 - 부적절</SelectItem>
                          <SelectItem value="2">2 - 불명확</SelectItem>
                          <SelectItem value="1">1 - 없음</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">운동 (Motor)</Label>
                      <Select
                        value={formData.gcsMotor}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, gcsMotor: value }))}
                      >
                        <SelectTrigger className="h-9 text-xs rounded-xl">
                          <SelectValue placeholder="M" />
                        </SelectTrigger>
                        <SelectContent className="z-[1200]">
                          <SelectItem value="6">6 - 지시수행</SelectItem>
                          <SelectItem value="5">5 - 통증회피</SelectItem>
                          <SelectItem value="4">4 - 도피반응</SelectItem>
                          <SelectItem value="3">3 - 이상굴곡</SelectItem>
                          <SelectItem value="2">2 - 이상신전</SelectItem>
                          <SelectItem value="1">1 - 없음</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {formData.gcsEye && formData.gcsVerbal && formData.gcsMotor && (
                    <div className="text-xs text-center py-1.5 px-3 bg-secondary rounded-xl font-medium text-foreground">
                      GCS 총점: {Number(formData.gcsEye) + Number(formData.gcsVerbal) + Number(formData.gcsMotor)}/15
                    </div>
                  )}
                </div>
              </div>

              {/* Vital Signs */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Activity className="w-4 h-4" />
                  활력징후 (Vital Signs)
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bp" className="text-xs flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      혈압 (BP)
                    </Label>
                    <Input
                      id="bp"
                      placeholder="120/80"
                      value={formData.bp}
                      onChange={(e) => setFormData(prev => ({ ...prev, bp: e.target.value }))}
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="hr" className="text-xs flex items-center gap-1">
                      <Droplet className="w-3 h-3" />
                      심박수 (HR)
                    </Label>
                    <Input
                      id="hr"
                      type="number"
                      placeholder="72"
                      value={formData.hr}
                      onChange={(e) => setFormData(prev => ({ ...prev, hr: e.target.value }))}
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="spo2" className="text-xs flex items-center gap-1">
                      <Wind className="w-3 h-3" />
                      산소포화도
                    </Label>
                    <Input
                      id="spo2"
                      type="number"
                      placeholder="98"
                      value={formData.spo2}
                      onChange={(e) => setFormData(prev => ({ ...prev, spo2: e.target.value }))}
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 rounded-2xl bg-foreground text-background hover:opacity-90 font-bold"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
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