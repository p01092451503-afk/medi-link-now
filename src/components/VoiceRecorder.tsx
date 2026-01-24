import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  onParsedData: (data: ParsedPatientData) => void;
}

export interface ParsedPatientData {
  age?: string;
  gender?: "M" | "F";
  ageGender?: string;
  chiefComplaint?: string;
  bloodPressure?: string;
  pulse?: string;
  spo2?: string;
  ktasLevel?: string;
}

// Check if SpeechRecognition is available
const SpeechRecognition = 
  (window as any).SpeechRecognition || 
  (window as any).webkitSpeechRecognition;

const VoiceRecorder = ({ onTranscript, onParsedData }: VoiceRecorderProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [recognition, setRecognition] = useState<any>(null);
  const [transcript, setTranscript] = useState("");

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
        onTranscript(finalTranscript);
        // Use AI to parse the transcript
        parseWithAI(finalTranscript);
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
  }, [onTranscript]);

  const parseWithAI = useCallback(async (text: string) => {
    setIsProcessingAI(true);
    
    try {
      console.log("Sending to AI for parsing:", text);
      
      const { data, error } = await supabase.functions.invoke("parse-patient-info", {
        body: { transcript: text },
      });

      if (error) {
        console.error("Edge function error:", error);
        // Fall back to regex parsing
        parseWithRegex(text);
        return;
      }

      if (data?.success && data?.data) {
        console.log("AI parsed data:", data.data);
        onParsedData(data.data);
        
        const filledFields = [];
        if (data.data.ageGender) filledFields.push("나이/성별");
        if (data.data.chiefComplaint) filledFields.push("주 호소");
        if (data.data.bloodPressure) filledFields.push("혈압");
        if (data.data.pulse) filledFields.push("맥박");
        if (data.data.spo2) filledFields.push("산소포화도");
        if (data.data.ktasLevel) filledFields.push("KTAS");

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
      // Fall back to regex parsing
      parseWithRegex(text);
    } finally {
      setIsProcessingAI(false);
    }
  }, [onParsedData]);

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
    if (ageMatch) {
      parsed.age = ageMatch[1];
    }

    // Combine age and gender
    if (parsed.age || parsed.gender) {
      parsed.ageGender = `${parsed.gender || ""}/${parsed.age || ""}`;
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

    // Parse chief complaints
    const complaintKeywords = [
      { keywords: ["흉통", "가슴 통증", "가슴이 아프"], value: "흉통 (Chest Pain)" },
      { keywords: ["호흡곤란", "숨이 안 쉬어", "숨을 못 쉬"], value: "호흡곤란 (Dyspnea)" },
      { keywords: ["복통", "배가 아프", "배 아프"], value: "복통 (Abdominal Pain)" },
      { keywords: ["두통", "머리가 아프", "머리 아프"], value: "두통 (Headache)" },
      { keywords: ["의식", "정신을 잃", "기절"], value: "의식변화 (Mental Status Change)" },
      { keywords: ["외상", "다쳤", "사고"], value: "외상 (Trauma)" },
      { keywords: ["발열", "열이 나", "열 나"], value: "발열 (Fever)" },
      { keywords: ["어지러", "어지럼"], value: "어지러움 (Dizziness)" },
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

    onParsedData(parsed);
    
    const filledFields = [];
    if (parsed.ageGender) filledFields.push("나이/성별");
    if (parsed.chiefComplaint) filledFields.push("주 호소");
    if (parsed.bloodPressure) filledFields.push("혈압");
    if (parsed.pulse) filledFields.push("맥박");
    if (parsed.spo2) filledFields.push("산소포화도");

    if (filledFields.length > 0) {
      toast({
        title: "음성 인식 완료",
        description: `${filledFields.join(", ")} 항목이 입력되었습니다`,
      });
    }
  }, [onParsedData]);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      recognition.start();
      setIsListening(true);
      toast({
        title: "음성 인식 시작",
        description: "환자 정보를 말씀해주세요",
      });
    }
  };

  if (!isSupported) {
    return (
      <div className="text-center p-4 bg-gray-100 rounded-xl">
        <MicOff className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-muted-foreground">
          이 브라우저에서는 음성 인식을 지원하지 않습니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mic Button */}
      <motion.button
        onClick={toggleListening}
        disabled={isProcessingAI}
        whileTap={{ scale: 0.95 }}
        className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all disabled:opacity-70 ${
          isListening
            ? "bg-red-500 text-white"
            : isProcessingAI
            ? "bg-purple-500 text-white"
            : "bg-gradient-to-r from-primary to-primary/80 text-white hover:shadow-lg"
        }`}
      >
        <div className="relative">
          {isProcessingAI ? (
            <Sparkles className="w-6 h-6 animate-pulse" />
          ) : isListening ? (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-white/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-white/20"
                animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
              <Mic className="w-6 h-6 relative z-10" />
            </>
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </div>
        <span>
          {isProcessingAI 
            ? "🤖 AI가 분석 중..." 
            : isListening 
            ? "듣고 있습니다... (탭하여 중지)" 
            : "🎙️ 음성으로 입력하기 (AI 분석)"
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
                ? "bg-purple-50 border-purple-200" 
                : "bg-primary/5 border-primary/20"
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

      {/* Instructions */}
      {!isListening && !isProcessingAI && (
        <p className="text-xs text-center text-muted-foreground">
          예: "55세 남자, 흉통 호소, 혈압 140에 90, 맥박 88"
        </p>
      )}
    </div>
  );
};

export default VoiceRecorder;
