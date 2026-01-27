import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Heart, Activity, Droplet, Clock, Copy, Send, Check } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import VoiceRecorder, { type ParsedPatientData } from "./VoiceRecorder";

interface PatientInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalName?: string;
  eta?: number;
}

interface PatientInfo {
  ageGender: string;
  chiefComplaint: string;
  bloodPressure: string;
  pulse: string;
  spo2: string;
  ktasLevel: string;
}

const ktasLevels = [
  { value: "1", label: "1등급 - 소생", color: "bg-blue-500" },
  { value: "2", label: "2등급 - 긴급", color: "bg-red-500" },
  { value: "3", label: "3등급 - 응급", color: "bg-yellow-500" },
  { value: "4", label: "4등급 - 준응급", color: "bg-green-500" },
  { value: "5", label: "5등급 - 비응급", color: "bg-white border border-gray-300" },
];

const chiefComplaints = [
  "흉통 (Chest Pain)",
  "호흡곤란 (Dyspnea)",
  "복통 (Abdominal Pain)",
  "두통 (Headache)",
  "의식변화 (Mental Status Change)",
  "외상 (Trauma)",
  "발열 (Fever)",
  "어지러움 (Dizziness)",
  "기타 (Other)",
];

const PatientInfoModal = ({ isOpen, onClose, hospitalName, eta = 10 }: PatientInfoModalProps) => {
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    ageGender: "",
    chiefComplaint: "",
    bloodPressure: "",
    pulse: "",
    spo2: "",
    ktasLevel: "",
  });
  const [copied, setCopied] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");

  const handleVoiceTranscript = useCallback((text: string) => {
    setLastTranscript(text);
  }, []);

  const handleParsedData = useCallback((data: ParsedPatientData) => {
    setPatientInfo((prev) => ({
      ...prev,
      ageGender: data.ageGender || prev.ageGender,
      chiefComplaint: data.chiefComplaint || prev.chiefComplaint,
      bloodPressure: data.bloodPressure || prev.bloodPressure,
      pulse: data.pulse || prev.pulse,
      spo2: data.spo2 || prev.spo2,
    }));

    // Show success feedback
    const filledFields = [];
    if (data.ageGender) filledFields.push("나이/성별");
    if (data.chiefComplaint) filledFields.push("주 호소");
    if (data.bloodPressure) filledFields.push("혈압");
    if (data.pulse) filledFields.push("맥박");
    if (data.spo2) filledFields.push("산소포화도");

    if (filledFields.length > 0) {
      toast({
        title: "음성 인식 완료",
        description: `${filledFields.join(", ")} 항목이 입력되었습니다`,
      });
    }
  }, []);

  const generateSummary = () => {
    const { ageGender, chiefComplaint, bloodPressure, pulse, spo2, ktasLevel } = patientInfo;
    const parts = [];
    
    if (ageGender) parts.push(ageGender);
    if (chiefComplaint) parts.push(chiefComplaint.split(" (")[0]);
    if (bloodPressure) parts.push(`BP:${bloodPressure}`);
    if (pulse) parts.push(`HR:${pulse}`);
    if (spo2) parts.push(`SpO2:${spo2}%`);
    if (ktasLevel) parts.push(`KTAS:${ktasLevel}`);
    
    const summary = parts.join(", ");
    return summary ? `${summary} (ETA: ${eta}min)` : "";
  };

  const handleCopy = async () => {
    const summary = generateSummary();
    if (!summary) {
      toast({
        title: "정보를 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast({
        title: "복사되었습니다",
        description: summary,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "복사 실패",
        variant: "destructive",
      });
    }
  };

  const handleSend = () => {
    const summary = generateSummary();
    if (!summary) {
      toast({
        title: "정보를 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    // Mock send action
    toast({
      title: "전송 완료",
      description: hospitalName 
        ? `${hospitalName} 응급실로 정보가 전송되었습니다`
        : "응급실로 정보가 전송되었습니다",
    });
    onClose();
  };

  const handleReset = () => {
    setPatientInfo({
      ageGender: "",
      chiefComplaint: "",
      bloodPressure: "",
      pulse: "",
      spo2: "",
      ktasLevel: "",
    });
    setLastTranscript("");
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
            className="fixed inset-0 bg-black/60 z-[2000]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-4 bottom-4 bg-white rounded-3xl shadow-2xl z-[2001] max-w-md mx-auto overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary to-primary/80 p-5 text-white z-10">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Activity className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">환자 정보 입력</h3>
                  <p className="text-sm opacity-80">Pre-Triage Info</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Voice Recorder */}
              <VoiceRecorder
                onTranscript={handleVoiceTranscript}
                onParsedData={handleParsedData}
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">또는 직접 입력</span>
                </div>
              </div>

              {/* Age/Gender */}
              <div>
                <Label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-primary" />
                  나이/성별
                </Label>
                <Input
                  placeholder="예: M/55, F/32"
                  value={patientInfo.ageGender}
                  onChange={(e) => setPatientInfo({ ...patientInfo, ageGender: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              {/* Chief Complaint */}
              <div>
                <Label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-primary" />
                  주 호소
                </Label>
                <Select
                  value={patientInfo.chiefComplaint}
                  onValueChange={(value) => setPatientInfo({ ...patientInfo, chiefComplaint: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="주 호소 증상 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-[2100]">
                    {chiefComplaints.map((complaint) => (
                      <SelectItem key={complaint} value={complaint}>
                        {complaint}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vitals Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    혈압 (BP)
                  </Label>
                  <Input
                    placeholder="120/80"
                    value={patientInfo.bloodPressure}
                    onChange={(e) => setPatientInfo({ ...patientInfo, bloodPressure: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    맥박 (HR)
                  </Label>
                  <Input
                    placeholder="72"
                    value={patientInfo.pulse}
                    onChange={(e) => setPatientInfo({ ...patientInfo, pulse: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    산소포화도
                  </Label>
                  <Input
                    placeholder="98"
                    value={patientInfo.spo2}
                    onChange={(e) => setPatientInfo({ ...patientInfo, spo2: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* KTAS Level */}
              <div>
                <Label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                  <Droplet className="w-4 h-4 text-primary" />
                  KTAS 단계
                </Label>
                <div className="grid grid-cols-5 gap-2">
                  {ktasLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setPatientInfo({ ...patientInfo, ktasLevel: level.value })}
                      className={`relative h-12 rounded-xl font-bold text-lg transition-all ${level.color} ${
                        patientInfo.ktasLevel === level.value
                          ? "ring-2 ring-offset-2 ring-primary scale-105"
                          : "opacity-70 hover:opacity-100"
                      } ${level.value === "5" ? "text-gray-700" : "text-white"}`}
                    >
                      {level.value}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {patientInfo.ktasLevel && ktasLevels.find(l => l.value === patientInfo.ktasLevel)?.label}
                </p>
              </div>

              {/* Preview */}
              {generateSummary() && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">미리보기</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {generateSummary()}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="py-6 rounded-xl font-semibold"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 mr-2 text-green-500" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      복사
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSend}
                  className="py-6 rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/80"
                >
                  <Send className="w-5 h-5 mr-2" />
                  전송
                </Button>
              </div>

              {/* Reset Button */}
              <Button
                onClick={handleReset}
                variant="ghost"
                className="w-full text-muted-foreground"
              >
                초기화
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PatientInfoModal;
