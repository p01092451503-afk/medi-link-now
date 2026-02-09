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

  const displayAge = member.birthDate 
    ? Math.floor((new Date().getTime() - new Date(member.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : member.age;

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
        title: "클립보드에 복사됨",
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
            className="fixed inset-0 bg-black/60 z-[2000]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-6 left-4 right-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-background rounded-3xl shadow-2xl z-[2001] overflow-hidden flex flex-col max-h-[calc(100vh-2.5rem)]"
          >
            {/* Header */}
            <div className="bg-foreground text-background px-5 py-4 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{member.name}</h2>
                  <p className="opacity-60 text-sm">
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
                      className="p-2 hover:bg-background/20 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-background/20 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Blood Type */}
              <div className="bg-secondary rounded-2xl p-4 text-center">
                <Droplets className="w-8 h-8 text-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground mb-0.5">혈액형</p>
                <p className="text-3xl font-black text-foreground">
                  {BLOOD_TYPE_LABELS[member.bloodType]}
                </p>
              </div>

              {/* Birth Date & Weight */}
              <div className="grid grid-cols-2 gap-3">
                {member.birthDate && (
                  <div className="bg-secondary rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calendar className="w-4 h-4 text-foreground" />
                      <span className="text-xs text-muted-foreground">생년월일</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {new Date(member.birthDate).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                )}
                {member.weightKg && (
                  <div className="bg-secondary rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Weight className="w-4 h-4 text-foreground" />
                      <span className="text-xs text-muted-foreground">체중</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {member.weightKg} kg
                    </p>
                  </div>
                )}
              </div>

              {/* Allergies */}
              {member.allergies.length > 0 && (
                <div className="bg-destructive/10 border-2 border-destructive/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <span className="text-base font-bold text-foreground">알레르기</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.allergies.map((allergy) => (
                      <span
                        key={allergy}
                        className="px-3 py-1.5 bg-destructive/20 text-foreground text-base font-bold rounded-full"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Chronic Diseases */}
              {member.chronicDiseases.length > 0 && (
                <div className="bg-secondary rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-foreground" />
                    <span className="text-base font-bold text-foreground">기저질환</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.chronicDiseases.map((disease) => (
                      <span
                        key={disease}
                        className="px-3 py-1.5 bg-background text-foreground text-base font-semibold rounded-full"
                      >
                        {disease}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications */}
              {member.medications && member.medications.length > 0 && (
                <div className="bg-secondary rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="w-5 h-5 text-foreground" />
                    <span className="text-base font-bold text-foreground">복용 중인 약물</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.medications.map((med) => (
                      <span
                        key={med}
                        className="px-3 py-1.5 bg-background text-foreground text-base font-semibold rounded-full"
                      >
                        {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Guardian Contact */}
              {member.guardianContact && (
                <div className="bg-secondary rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-5 h-5 text-foreground" />
                    <span className="text-base font-bold text-foreground">보호자 연락처</span>
                  </div>
                  <a 
                    href={`tel:${member.guardianContact}`}
                    className="text-xl font-bold text-foreground hover:underline"
                  >
                    {member.guardianContact}
                  </a>
                </div>
              )}

              {/* Notes */}
              {member.notes && (
                <div className="bg-secondary rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-5 h-5 text-foreground" />
                    <span className="text-base font-bold text-foreground">특이사항</span>
                  </div>
                  <p className="text-base text-foreground whitespace-pre-wrap">
                    {member.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-border p-3 space-y-2 bg-secondary shrink-0">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="w-full py-4 rounded-2xl text-sm font-semibold"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    복사됨!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    119 전달용 텍스트 복사
                  </>
                )}
              </Button>

              <Button
                onClick={() => onCallAmbulance(member)}
                className="w-full py-4 rounded-2xl text-sm font-bold bg-foreground text-background hover:opacity-90"
              >
                <Ambulance className="w-4 h-4 mr-2" />
                이 환자로 호출
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MedicalPassportDetailModal;