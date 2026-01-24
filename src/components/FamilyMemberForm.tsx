import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Droplets, Heart, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FamilyMember,
  RELATION_LABELS,
  BLOOD_TYPE_LABELS,
  COMMON_CHRONIC_DISEASES,
  COMMON_ALLERGIES,
} from "@/types/familyMember";

interface FamilyMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<FamilyMember, "id" | "createdAt" | "updatedAt">) => void;
  initialData?: FamilyMember;
}

const FamilyMemberForm = ({ isOpen, onClose, onSave, initialData }: FamilyMemberFormProps) => {
  const [name, setName] = useState(initialData?.name || "");
  const [age, setAge] = useState(initialData?.age?.toString() || "");
  const [relation, setRelation] = useState<FamilyMember["relation"]>(initialData?.relation || "self");
  const [bloodType, setBloodType] = useState<FamilyMember["bloodType"]>(initialData?.bloodType || "unknown");
  const [chronicDiseases, setChronicDiseases] = useState<string[]>(initialData?.chronicDiseases || []);
  const [allergies, setAllergies] = useState<string[]>(initialData?.allergies || []);
  const [notes, setNotes] = useState(initialData?.notes || "");

  const toggleChronicDisease = (disease: string) => {
    setChronicDiseases((prev) =>
      prev.includes(disease) ? prev.filter((d) => d !== disease) : [...prev, disease]
    );
  };

  const toggleAllergy = (allergy: string) => {
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const handleSubmit = () => {
    if (!name.trim() || !age) return;

    onSave({
      name: name.trim(),
      age: parseInt(age),
      relation,
      bloodType,
      chronicDiseases,
      allergies,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setName("");
    setAge("");
    setRelation("self");
    setBloodType("unknown");
    setChronicDiseases([]);
    setAllergies([]);
    setNotes("");
    onClose();
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
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[2001] max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {initialData ? "가족 정보 수정" : "가족 추가"}
                  </h3>
                  <p className="text-xs text-muted-foreground">응급 상황시 빠른 정보 전달</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-5 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">1</span>
                  기본 정보
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-base font-medium mb-2 block">이름</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="홍길동"
                      className="text-lg py-6 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium mb-2 block">나이</Label>
                    <Input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="45"
                      className="text-lg py-6 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium mb-2 block">관계</Label>
                    <select
                      value={relation}
                      onChange={(e) => setRelation(e.target.value as FamilyMember["relation"])}
                      className="w-full text-lg py-3.5 px-4 rounded-xl border border-input bg-background"
                    >
                      {Object.entries(RELATION_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Blood Type */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-red-500" />
                  혈액형
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(BLOOD_TYPE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setBloodType(key as FamilyMember["bloodType"])}
                      className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                        bloodType === key
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-foreground hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chronic Diseases */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  기저질환
                </h4>
                <div className="flex flex-wrap gap-2">
                  {COMMON_CHRONIC_DISEASES.map((disease) => (
                    <button
                      key={disease}
                      onClick={() => toggleChronicDisease(disease)}
                      className={`py-2 px-4 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                        chronicDiseases.includes(disease)
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-foreground hover:bg-gray-200"
                      }`}
                    >
                      {chronicDiseases.includes(disease) && <Check className="w-4 h-4" />}
                      {disease}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  알레르기
                </h4>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ALLERGIES.map((allergy) => (
                    <button
                      key={allergy}
                      onClick={() => toggleAllergy(allergy)}
                      className={`py-2 px-4 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                        allergies.includes(allergy)
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-foreground hover:bg-gray-200"
                      }`}
                    >
                      {allergies.includes(allergy) && <Check className="w-4 h-4" />}
                      {allergy}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <Label className="text-base font-medium">특이사항 (선택)</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="복용 중인 약물, 기타 특이사항..."
                  className="w-full min-h-[100px] p-4 rounded-xl border border-input bg-background text-base resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!name.trim() || !age}
                className="w-full py-6 rounded-xl text-lg font-semibold"
              >
                {initialData ? "수정 완료" : "가족 추가"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FamilyMemberForm;
