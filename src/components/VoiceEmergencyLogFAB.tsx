import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, Sparkles, X, AlertTriangle, Check, Edit3, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Check if SpeechRecognition is available
const SpeechRecognition = 
  (window as any).SpeechRecognition || 
  (window as any).webkitSpeechRecognition;

const isSpeechRecognitionSupported = !!SpeechRecognition;

interface ParsedPatientData {
  age?: string;
  gender?: "M" | "F";
  ageGender?: string;
  chiefComplaint?: string;
  bloodPressure?: string;
  pulse?: string;
  spo2?: string;
  ktasLevel?: string;
  ktasReason?: string;
  symptoms?: string[];
}

interface PatientFormData {
  ageGender: string;
  chiefComplaint: string;
  bloodPressure: string;
  pulse: string;
  spo2: string;
  ktasLevel: string;
  symptoms: string[];
}

const ktasLevels = [
  { value: "1", label: "1등급 - 소생", color: "bg-blue-600", textColor: "text-white" },
  { value: "2", label: "2등급 - 긴급", color: "bg-red-500", textColor: "text-white" },
  { value: "3", label: "3등급 - 응급", color: "bg-yellow-500", textColor: "text-black" },
  { value: "4", label: "4등급 - 준응급", color: "bg-green-500", textColor: "text-white" },
  { value: "5", label: "5등급 - 비응급", color: "bg-white border border-gray-300", textColor: "text-gray-700" },
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
  "심정지 (Cardiac Arrest)",
  "경련 (Seizure)",
  "기타 (Other)",
];

const VoiceEmergencyLogFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isSupported, setIsSupported] = useState(isSpeechRecognitionSupported);
  const [recognition, setRecognition] = useState<any>(null);
  const [transcript, setTranscript] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState("");
  const [originalTranscript, setOriginalTranscript] = useState("");
  const [ktasAlert, setKtasAlert] = useState<{ level: string; reason: string } | null>(null);
  
  const [formData, setFormData] = useState<PatientFormData>({
    ageGender: "",
    chiefComplaint: "",
    bloodPressure: "",
    pulse: "",
    spo2: "",
    ktasLevel: "",
    symptoms: [],
  });

  useEffect(() => {
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "ko-KR";

    recognitionInstance.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      
      if (finalTranscript) {
        setOriginalTranscript(finalTranscript);
        setEditedTranscript(finalTranscript);
        setIsEditMode(true);
        recognition?.stop();
        setIsListening(false);
      }
    };

    recognitionInstance.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      
      if (event.error === "not-allowed") {
        toast({
          title: "마이크 권한이 필요합니다",
          description: "브라우저 설정에서 마이크 권한을 허용해주세요",
          variant: "destructive",
        });
      } else if (event.error === "no-speech") {
        toast({
          title: "음성이 감지되지 않았습니다",
          description: "다시 시도해주세요",
        });
      }
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      recognitionInstance.abort();
    };
  }, []);

  const parseWithAI = useCallback(async (text: string) => {
    setIsProcessingAI(true);
    setKtasAlert(null);
    
    try {
      console.log("Sending to AI for parsing:", text);
      
      const { data, error } = await supabase.functions.invoke("parse-patient-info", {
        body: { transcript: text },
      });

      if (error) {
        console.error("Edge function error:", error);
        parseWithRegex(text);
        return;
      }

      if (data?.success && data?.data) {
        console.log("AI parsed data:", data.data);
        
        const parsedData: ParsedPatientData = data.data;
        
        setFormData(prev => ({
          ...prev,
          ageGender: parsedData.ageGender || prev.ageGender,
          chiefComplaint: parsedData.chiefComplaint || prev.chiefComplaint,
          bloodPressure: parsedData.bloodPressure || prev.bloodPressure,
          pulse: parsedData.pulse || prev.pulse,
          spo2: parsedData.spo2 || prev.spo2,
          ktasLevel: parsedData.ktasLevel || prev.ktasLevel,
          symptoms: parsedData.symptoms || prev.symptoms,
        }));

        // Show KTAS alert for critical levels
        if (parsedData.ktasLevel === "1" || parsedData.ktasLevel === "2") {
          setKtasAlert({
            level: parsedData.ktasLevel,
            reason: parsedData.ktasReason || "중증 증상 감지",
          });
        }
        
        const filledFields = [];
        if (parsedData.ageGender) filledFields.push("나이/성별");
        if (parsedData.chiefComplaint) filledFields.push("주호소");
        if (parsedData.bloodPressure) filledFields.push("혈압");
        if (parsedData.pulse) filledFields.push("맥박");
        if (parsedData.spo2) filledFields.push("산소포화도");
        if (parsedData.ktasLevel) filledFields.push("KTAS");

        if (filledFields.length > 0) {
          toast({
            title: "🤖 AI 분석 완료",
            description: `${filledFields.join(", ")} 항목이 자동 입력되었습니다`,
          });
        }
      } else if (data?.error) {
        console.error("AI parsing error:", data.error);
        toast({
          title: "AI 분석 실패",
          description: "기본 파싱으로 처리합니다",
        });
        parseWithRegex(text);
      }
    } catch (err) {
      console.error("AI parsing failed:", err);
      parseWithRegex(text);
    } finally {
      setIsProcessingAI(false);
    }
  }, []);

  const parseWithRegex = useCallback((text: string) => {
    const parsed: ParsedPatientData = {};

    // Parse gender
    if (/남자|남성|남/.test(text)) {
      parsed.gender = "M";
    } else if (/여자|여성|여/.test(text)) {
      parsed.gender = "F";
    }

    // Parse age
    const ageMatch = text.match(/(\d{1,3})\s*(세|살)/);
    const ageDecadeMatch = text.match(/(\d{1,2})0?\s*대/);
    if (ageMatch) {
      parsed.age = ageMatch[1];
    } else if (ageDecadeMatch) {
      parsed.age = `${ageDecadeMatch[1]}0대`;
    }

    // Combine age and gender
    if (parsed.age || parsed.gender) {
      const genderStr = parsed.gender === "M" ? "남" : parsed.gender === "F" ? "여" : "";
      parsed.ageGender = `${genderStr}/${parsed.age || ""}`;
    }

    // Parse blood pressure
    const bpMatch = text.match(/혈압\s*(\d{2,3})\s*(?:에|\/|,|\s)\s*(\d{2,3})/);
    if (bpMatch) {
      parsed.bloodPressure = `${bpMatch[1]}/${bpMatch[2]}`;
    }

    // Parse pulse
    const pulseMatch = text.match(/(?:맥박|심박|심박수)\s*(\d{2,3})/);
    if (pulseMatch) {
      parsed.pulse = pulseMatch[1];
    }

    // Parse SpO2
    const spo2Match = text.match(/(?:산소포화도|산소|에스피오투|spo2)\s*(\d{2,3})/i);
    if (spo2Match) {
      parsed.spo2 = spo2Match[1];
    }

    // Parse symptoms and determine KTAS
    const symptoms: string[] = [];
    let ktasLevel = "5";
    let ktasReason = "";

    // Critical symptoms (KTAS 1)
    const criticalKeywords = ["심정지", "무호흡", "호흡 없", "맥박 없", "심폐소생술", "CPR"];
    for (const keyword of criticalKeywords) {
      if (text.includes(keyword)) {
        ktasLevel = "1";
        ktasReason = `${keyword} 감지 - 소생 필요`;
        symptoms.push(keyword);
        break;
      }
    }

    // Urgent symptoms (KTAS 2)
    if (ktasLevel !== "1") {
      const urgentKeywords = ["의식 없", "의식불명", "대량출혈", "출혈", "경련", "발작", "마비", "뇌졸중"];
      for (const keyword of urgentKeywords) {
        if (text.includes(keyword)) {
          ktasLevel = "2";
          ktasReason = `${keyword} 감지 - 긴급`;
          symptoms.push(keyword);
          break;
        }
      }
    }

    // Emergency symptoms (KTAS 3)
    if (ktasLevel !== "1" && ktasLevel !== "2") {
      const emergencyKeywords = ["흉통", "가슴 통증", "호흡곤란", "숨이 안", "심한 복통"];
      for (const keyword of emergencyKeywords) {
        if (text.includes(keyword)) {
          ktasLevel = "3";
          ktasReason = `${keyword} 감지 - 응급`;
          symptoms.push(keyword);
        }
      }
    }

    // Chief complaint mapping
    const complaintKeywords = [
      { keywords: ["흉통", "가슴 통증", "가슴이 아프"], value: "흉통 (Chest Pain)" },
      { keywords: ["호흡곤란", "숨이 안 쉬어", "숨을 못 쉬"], value: "호흡곤란 (Dyspnea)" },
      { keywords: ["복통", "배가 아프", "배 아프"], value: "복통 (Abdominal Pain)" },
      { keywords: ["두통", "머리가 아프", "머리 아프"], value: "두통 (Headache)" },
      { keywords: ["의식", "정신을 잃", "기절"], value: "의식변화 (Mental Status Change)" },
      { keywords: ["외상", "다쳤", "사고"], value: "외상 (Trauma)" },
      { keywords: ["발열", "열이 나", "열 나"], value: "발열 (Fever)" },
      { keywords: ["어지러", "어지럼"], value: "어지러움 (Dizziness)" },
      { keywords: ["심정지", "심장"], value: "심정지 (Cardiac Arrest)" },
      { keywords: ["경련", "발작"], value: "경련 (Seizure)" },
    ];

    for (const complaint of complaintKeywords) {
      for (const keyword of complaint.keywords) {
        if (text.includes(keyword)) {
          parsed.chiefComplaint = complaint.value;
          break;
        }
      }
      if (parsed.chiefComplaint) break;
    }

    parsed.ktasLevel = ktasLevel;
    parsed.ktasReason = ktasReason;
    parsed.symptoms = symptoms;

    setFormData(prev => ({
      ...prev,
      ageGender: parsed.ageGender || prev.ageGender,
      chiefComplaint: parsed.chiefComplaint || prev.chiefComplaint,
      bloodPressure: parsed.bloodPressure || prev.bloodPressure,
      pulse: parsed.pulse || prev.pulse,
      spo2: parsed.spo2 || prev.spo2,
      ktasLevel: parsed.ktasLevel || prev.ktasLevel,
      symptoms: [...prev.symptoms, ...symptoms],
    }));

    if (ktasLevel === "1" || ktasLevel === "2") {
      setKtasAlert({ level: ktasLevel, reason: ktasReason });
    }
    
    const filledFields = [];
    if (parsed.ageGender) filledFields.push("나이/성별");
    if (parsed.chiefComplaint) filledFields.push("주호소");
    if (parsed.bloodPressure) filledFields.push("혈압");
    if (parsed.pulse) filledFields.push("맥박");
    if (parsed.spo2) filledFields.push("산소포화도");
    if (parsed.ktasLevel) filledFields.push("KTAS");

    if (filledFields.length > 0) {
      toast({
        title: "음성 인식 완료",
        description: `${filledFields.join(", ")} 항목이 입력되었습니다`,
      });
    }
  }, []);

  const handleConfirmEdit = useCallback(() => {
    if (editedTranscript.trim()) {
      parseWithAI(editedTranscript);
      setIsEditMode(false);
    }
  }, [editedTranscript, parseWithAI]);

  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setEditedTranscript("");
    setOriginalTranscript("");
    setTranscript("");
  }, []);

  const handleResetEdit = useCallback(() => {
    setEditedTranscript(originalTranscript);
  }, [originalTranscript]);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      setIsEditMode(false);
      setEditedTranscript("");
      setOriginalTranscript("");
      recognition.start();
      setIsListening(true);
      toast({
        title: "🎙️ 음성 인식 시작",
        description: "환자 정보를 말씀해주세요",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      ageGender: "",
      chiefComplaint: "",
      bloodPressure: "",
      pulse: "",
      spo2: "",
      ktasLevel: "",
      symptoms: [],
    });
    setKtasAlert(null);
    setTranscript("");
    setEditedTranscript("");
    setOriginalTranscript("");
    setIsEditMode(false);
  };

  const copyToClipboard = () => {
    const summary = generateSummary();
    navigator.clipboard.writeText(summary);
    toast({
      title: "복사 완료",
      description: "클립보드에 복사되었습니다",
    });
  };

  const generateSummary = () => {
    const parts = [];
    if (formData.ageGender) parts.push(formData.ageGender);
    if (formData.chiefComplaint) parts.push(formData.chiefComplaint.split(" (")[0]);
    if (formData.bloodPressure) parts.push(`BP ${formData.bloodPressure}`);
    if (formData.pulse) parts.push(`PR ${formData.pulse}`);
    if (formData.spo2) parts.push(`SpO2 ${formData.spo2}%`);
    if (formData.ktasLevel) parts.push(`KTAS ${formData.ktasLevel}등급`);
    return parts.join(" / ");
  };

  const getKtasColor = (level: string) => {
    return ktasLevels.find(k => k.value === level)?.color || "bg-gray-200";
  };

  const getKtasTextColor = (level: string) => {
    return ktasLevels.find(k => k.value === level)?.textColor || "text-gray-700";
  };

  if (!isSupported) {
    return null;
  }

  return (
    <>
      {/* Floating Mic Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-44 left-[calc(50%-4rem)] z-40 w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-2xl flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          boxShadow: ["0 10px 30px rgba(239, 68, 68, 0.4)", "0 10px 40px rgba(239, 68, 68, 0.6)", "0 10px 30px rgba(239, 68, 68, 0.4)"]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Mic className="w-7 h-7" />
      </motion.button>

      {/* Bottom Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0 overflow-hidden dark:bg-slate-900" hideCloseButton>
          <div className="h-full flex flex-col dark:bg-slate-900">
            {/* Header */}
            <SheetHeader className="px-5 pt-6 pb-4 border-b border-border bg-gradient-to-r from-red-500 to-orange-500 text-white">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-white text-xl font-bold flex items-center gap-2">
                  <Mic className="w-6 h-6" />
                  AI 음성 구급일지
                </SheetTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-white/80 text-sm">음성으로 환자 정보를 기록하세요</p>
            </SheetHeader>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white dark:bg-slate-900">
              {/* KTAS Alert */}
              <AnimatePresence>
                {ktasAlert && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    className={`p-4 rounded-2xl ${
                      ktasAlert.level === "1" 
                        ? "bg-blue-600 text-white" 
                        : "bg-red-500 text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        <AlertTriangle className="w-8 h-8" />
                      </motion.div>
                      <div>
                        <p className="font-bold text-lg">
                          ⚠️ KTAS {ktasAlert.level}등급 추정
                        </p>
                        <p className="text-sm opacity-90">{ktasAlert.reason}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Voice Input Section */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4">
                <AnimatePresence mode="wait">
                  {isEditMode && !isProcessingAI ? (
                    <motion.div
                      key="edit-mode"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">인식된 텍스트 확인</span>
                      </div>
                      
                      <Textarea
                        value={editedTranscript}
                        onChange={(e) => setEditedTranscript(e.target.value)}
                        className="min-h-[80px] resize-none rounded-xl border-primary/20 focus:border-primary text-sm dark:bg-slate-700 dark:border-slate-600"
                        placeholder="음성 인식 결과..."
                      />
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleConfirmEdit}
                          size="sm"
                          className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                          disabled={!editedTranscript.trim()}
                        >
                          <Sparkles className="w-4 h-4 mr-1" />
                          AI 분석 시작
                        </Button>
                        <Button
                          onClick={handleResetEdit}
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          disabled={editedTranscript === originalTranscript}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          size="sm"
                          variant="ghost"
                          className="rounded-xl"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="mic-mode" className="space-y-3">
                      {/* Large Mic Button */}
                      <motion.button
                        onClick={toggleListening}
                        disabled={isProcessingAI}
                        className={`w-full py-6 rounded-2xl font-semibold flex flex-col items-center justify-center gap-3 transition-all disabled:opacity-70 ${
                          isListening
                            ? "bg-red-500 text-white"
                            : isProcessingAI
                            ? "bg-purple-500 text-white"
                            : "bg-gradient-to-r from-primary to-primary/80 text-white"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="relative h-12 w-24 flex items-center justify-center">
                          {isProcessingAI ? (
                            <Sparkles className="w-12 h-12 animate-pulse" />
                          ) : isListening ? (
                            <>
                              {/* Waveform Animation */}
                              <div className="flex items-end gap-1 h-12">
                                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                  <motion.div
                                    key={i}
                                    className="w-1.5 bg-white rounded-full"
                                    animate={{ 
                                      height: [8, 32, 16, 40, 12, 28, 8] 
                                    }}
                                    transition={{
                                      duration: 0.8,
                                      repeat: Infinity,
                                      delay: i * 0.1,
                                      ease: "easeInOut"
                                    }}
                                  />
                                ))}
                              </div>
                              <motion.div
                                className="absolute inset-0 rounded-full bg-white/30 pointer-events-none"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              />
                            </>
                          ) : (
                            <Mic className="w-12 h-12" />
                          )}
                        </div>
                        <span className="text-lg">
                          {isProcessingAI 
                            ? "🤖 AI가 분석 중..." 
                            : isListening 
                            ? "듣고 있습니다..." 
                            : "🎙️ 탭하여 음성 입력"
                          }
                        </span>
                      </motion.button>

                      {/* Transcript Display */}
                      <AnimatePresence>
                        {(isListening || isProcessingAI) && transcript && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`border rounded-xl p-3 ${
                              isProcessingAI 
                                ? "bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800" 
                                : "bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {isProcessingAI ? (
                                <>
                                  <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                                  <span className="text-xs font-medium text-purple-600">AI 분석 중...</span>
                                </>
                              ) : (
                                <>
                                  <div className="flex gap-1">
                                    {[0, 1, 2].map((i) => (
                                      <motion.div
                                        key={i}
                                        className="w-1.5 h-4 bg-primary rounded-full"
                                        animate={{ scaleY: [0.5, 1, 0.5] }}
                                        transition={{
                                          duration: 0.6,
                                          repeat: Infinity,
                                          delay: i * 0.15,
                                        }}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs font-medium text-primary">인식 중...</span>
                                </>
                              )}
                            </div>
                            <p className="text-sm text-foreground">{transcript}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!isListening && !isProcessingAI && (
                        <p className="text-xs text-center text-muted-foreground">
                          예: "50대 남성, 흉통 호소, 혈압 130에 80, 맥박 100"
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">나이/성별</Label>
                    <Input
                      value={formData.ageGender}
                      onChange={(e) => setFormData(prev => ({ ...prev, ageGender: e.target.value }))}
                      placeholder="예: 남/55"
                      className="mt-1 rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">KTAS 등급</Label>
                    <Select
                      value={formData.ktasLevel}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, ktasLevel: value }))}
                    >
                      <SelectTrigger className={`mt-1 rounded-xl dark:bg-slate-800 dark:border-slate-700 ${formData.ktasLevel ? getKtasColor(formData.ktasLevel) + " " + getKtasTextColor(formData.ktasLevel) : ""}`}>
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {ktasLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${level.color}`} />
                              {level.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">주호소 (C.C)</Label>
                  <Select
                    value={formData.chiefComplaint}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, chiefComplaint: value }))}
                  >
                    <SelectTrigger className="mt-1 rounded-xl dark:bg-slate-800 dark:border-slate-700">
                      <SelectValue placeholder="증상 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {chiefComplaints.map((complaint) => (
                        <SelectItem key={complaint} value={complaint}>
                          {complaint}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">혈압 (BP)</Label>
                    <Input
                      value={formData.bloodPressure}
                      onChange={(e) => setFormData(prev => ({ ...prev, bloodPressure: e.target.value }))}
                      placeholder="130/80"
                      className="mt-1 rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">맥박 (PR)</Label>
                    <Input
                      value={formData.pulse}
                      onChange={(e) => setFormData(prev => ({ ...prev, pulse: e.target.value }))}
                      placeholder="100"
                      className="mt-1 rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">SpO2</Label>
                    <Input
                      value={formData.spo2}
                      onChange={(e) => setFormData(prev => ({ ...prev, spo2: e.target.value }))}
                      placeholder="98%"
                      className="mt-1 rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                </div>

                {/* Symptom Tags */}
                {formData.symptoms.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">감지된 증상</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.symptoms.map((symptom, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full text-sm font-medium"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-border bg-white dark:bg-slate-900 space-y-3">
              {/* Summary Preview */}
              {(formData.ageGender || formData.chiefComplaint || formData.bloodPressure) && (
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">요약</p>
                  <p>{generateSummary() || "입력된 정보가 없습니다"}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
                >
                  초기화
                </Button>
                <Button
                  onClick={copyToClipboard}
                  className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/80"
                  disabled={!formData.ageGender && !formData.chiefComplaint}
                >
                  <Check className="w-4 h-4 mr-2" />
                  복사하기
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default VoiceEmergencyLogFAB;
