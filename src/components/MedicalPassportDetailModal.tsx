import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Droplets, 
  Heart, 
  AlertTriangle, 
  Copy,
  Check,
  Pill,
  Phone,
  Calendar,
  Weight,
  FileText,
  Ambulance,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FamilyMember, RELATION_LABELS, BLOOD_TYPE_LABELS } from "@/types/familyMember";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface MedicalPassportDetailModalProps {
  member: FamilyMember | null;
  isOpen: boolean;
  onClose: () => void;
  onCallAmbulance: (member: FamilyMember) => void;
  onEdit?: (member: FamilyMember) => void;
}

const MedicalPassportDetailModal = ({ 
  member, 
  isOpen, 
  onClose,
  onCallAmbulance,
  onEdit
}: MedicalPassportDetailModalProps) => {
  const [copied, setCopied] = useState(false);

  if (!member) return null;

  // Calculate age from birth date if available
  const displayAge = member.birthDate 
    ? Math.floor((new Date().getTime() - new Date(member.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : member.age;

  // Generate 119 emergency text
  const generate119Text = () => {
    const parts = [`환자: ${member.name}(${displayAge}세)`];
    
    if (member.weightKg) {
      parts.push(`${member.weightKg}kg`);
    }
    
    if (member.bloodType !== "unknown") {
      parts.push(`혈액형 ${BLOOD_TYPE_LABELS[member.bloodType]}`);
    }
    
    if (member.allergies.length > 0) {
      parts.push(`${member.allergies.join(", ")} 알러지 있음`);
    }
    
    if (member.chronicDiseases.length > 0) {
      parts.push(`기저질환: ${member.chronicDiseases.join(", ")}`);
    }
    
    if (member.medications && member.medications.length > 0) {
      parts.push(`복용약: ${member.medications.join(", ")}`);
    }
    
    if (member.guardianContact) {
      parts.push(`보호자 연락처: ${member.guardianContact}`);
    }

    return parts.join(", ");
  };

  const handleCopy = async () => {
    const text = generate119Text();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "📋 클립보드에 복사됨",
        description: "119 상담원에게 텍스트를 전달하세요",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "복사 실패",
        description: "수동으로 텍스트를 복사해주세요",
        variant: "destructive",
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
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-[2000]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-6 left-4 right-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-[2001] overflow-hidden flex flex-col max-h-[calc(100vh-2.5rem)]"
          >
            {/* Header - More compact */}
            <div className="bg-gradient-to-r from-primary to-primary/80 px-5 py-4 text-white shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{member.name}</h2>
                  <p className="text-white/80 text-sm">
                    {RELATION_LABELS[member.relation]} · {displayAge}세
                    {member.weightKg && ` · ${member.weightKg}kg`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <button
                      onClick={() => {
                        onClose();
                        onEdit(member);
                      }}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Blood Type - Large but not too big */}
              <div className="bg-red-50 rounded-2xl p-4 text-center">
                <Droplets className="w-8 h-8 text-red-500 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground mb-0.5">혈액형</p>
                <p className="text-3xl font-black text-red-600">
                  {BLOOD_TYPE_LABELS[member.bloodType]}
                </p>
              </div>

              {/* Birth Date & Weight */}
              <div className="grid grid-cols-2 gap-3">
                {member.birthDate && (
                  <div className="bg-blue-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-muted-foreground">생년월일</span>
                    </div>
                    <p className="text-lg font-bold text-blue-700">
                      {new Date(member.birthDate).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                )}
                {member.weightKg && (
                  <div className="bg-green-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Weight className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">체중</span>
                    </div>
                    <p className="text-lg font-bold text-green-700">
                      {member.weightKg} kg
                    </p>
                  </div>
                )}
              </div>

              {/* Allergies - Warning Style */}
              {member.allergies.length > 0 && (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span className="text-base font-bold text-orange-700">⚠️ 알레르기</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.allergies.map((allergy) => (
                      <span
                        key={allergy}
                        className="px-3 py-1.5 bg-orange-200 text-orange-800 text-base font-bold rounded-full"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Chronic Diseases */}
              {member.chronicDiseases.length > 0 && (
                <div className="bg-primary/5 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-primary" />
                    <span className="text-base font-bold text-foreground">기저질환</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.chronicDiseases.map((disease) => (
                      <span
                        key={disease}
                        className="px-3 py-1.5 bg-primary/20 text-primary text-base font-semibold rounded-full"
                      >
                        {disease}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications */}
              {member.medications && member.medications.length > 0 && (
                <div className="bg-purple-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="w-5 h-5 text-purple-500" />
                    <span className="text-base font-bold text-purple-700">복용 중인 약물</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.medications.map((med) => (
                      <span
                        key={med}
                        className="px-3 py-1.5 bg-purple-200 text-purple-800 text-base font-semibold rounded-full"
                      >
                        {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Guardian Contact */}
              {member.guardianContact && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-5 h-5 text-gray-600" />
                    <span className="text-base font-bold text-foreground">보호자 연락처</span>
                  </div>
                  <a 
                    href={`tel:${member.guardianContact}`}
                    className="text-xl font-bold text-primary hover:underline"
                  >
                    {member.guardianContact}
                  </a>
                </div>
              )}

              {/* Notes */}
              {member.notes && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span className="text-base font-bold text-foreground">특이사항</span>
                  </div>
                  <p className="text-base text-foreground whitespace-pre-wrap">
                    {member.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions - Compact */}
            <div className="border-t border-border p-3 space-y-2 bg-gray-50 shrink-0">
              {/* Copy for 119 Button */}
              <Button
                onClick={handleCopy}
                variant="outline"
                className="w-full py-4 rounded-xl text-sm font-semibold border-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    복사됨!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    📞 119 전달용 텍스트 복사
                  </>
                )}
              </Button>

              {/* Call Ambulance Button */}
              <Button
                onClick={() => onCallAmbulance(member)}
                className="w-full py-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
              >
                <Ambulance className="w-4 h-4 mr-2" />
                🚑 이 환자로 호출
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MedicalPassportDetailModal;
