import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  UserPlus, 
  Droplets, 
  Heart, 
  AlertTriangle, 
  Check,
  Calendar,
  Weight,
  Pill,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FamilyMember,
  Gender,
  GENDER_LABELS,
  RELATION_LABELS,
  BLOOD_TYPE_LABELS,
  COMMON_CHRONIC_DISEASES,
  COMMON_ALLERGIES,
  COMMON_MEDICATIONS,
} from "@/types/familyMember";

interface FamilyMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<FamilyMember, "id" | "createdAt" | "updatedAt">) => void;
  initialData?: FamilyMember;
}

const FamilyMemberForm = ({ isOpen, onClose, onSave, initialData }: FamilyMemberFormProps) => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("unknown");
  const [relation, setRelation] = useState<FamilyMember["relation"]>("self");
  const [bloodType, setBloodType] = useState<FamilyMember["bloodType"]>("unknown");
  const [chronicDiseases, setChronicDiseases] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  // New fields
  const [birthDate, setBirthDate] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [medications, setMedications] = useState<string[]>([]);
  const [guardianContact, setGuardianContact] = useState("");

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setAge(initialData.age?.toString() || "");
      setGender(initialData.gender || "unknown");
      setRelation(initialData.relation || "self");
      setBloodType(initialData.bloodType || "unknown");
      setChronicDiseases(initialData.chronicDiseases || []);
      setAllergies(initialData.allergies || []);
      setNotes(initialData.notes || "");
      setBirthDate(initialData.birthDate || "");
      setWeightKg(initialData.weightKg?.toString() || "");
      setMedications(initialData.medications || []);
      setGuardianContact(initialData.guardianContact || "");
    } else {
      // Reset to defaults
      setName("");
      setAge("");
      setGender("unknown");
      setRelation("self");
      setBloodType("unknown");
      setChronicDiseases([]);
      setAllergies([]);
      setNotes("");
      setBirthDate("");
      setWeightKg("");
      setMedications([]);
      setGuardianContact("");
    }
  }, [initialData, isOpen]);

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

  const toggleMedication = (med: string) => {
    setMedications((prev) =>
      prev.includes(med) ? prev.filter((m) => m !== med) : [...prev, med]
    );
  };

  const handleSubmit = () => {
    if (!name.trim() || !age) return;

    onSave({
      name: name.trim(),
      age: parseInt(age),
      gender,
      relation,
      bloodType,
      chronicDiseases,
      allergies,
      notes: notes.trim() || undefined,
      birthDate: birthDate || undefined,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      medications: medications.length > 0 ? medications : undefined,
      guardianContact: guardianContact.trim() || undefined,
    });

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
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-2xl z-[2001] max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
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
                className="p-2 hover:bg-secondary rounded-full transition-colors"
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
                    <Label className="text-base font-medium mb-2 block">이름 *</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="홍길동"
                      className="text-lg py-6 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium mb-2 block">나이 *</Label>
                    <Input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="45"
                      className="text-lg py-6 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium mb-2 block">성별</Label>
                    <div className="flex gap-2">
                      {Object.entries(GENDER_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setGender(key as Gender)}
                          className={`flex-1 py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                            gender === key
                              ? key === "male" 
                                ? "bg-blue-500 text-white" 
                                : key === "female"
                                  ? "bg-pink-500 text-white"
                                  : "bg-muted-foreground text-white"
                              : "bg-secondary text-foreground hover:bg-accent"
                          }`}
                        >
                          {key === "male" ? "👨 " : key === "female" ? "👩 " : ""}{label}
                        </button>
                      ))}
                    </div>
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

              {/* Additional Info - Birth Date, Weight, Contact */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">2</span>
                  추가 정보
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      생년월일
                    </Label>
                    <Input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="py-5 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Weight className="w-4 h-4 text-green-500" />
                      체중 (kg)
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="60.5"
                      className="py-5 rounded-xl"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Phone className="w-4 h-4 text-gray-500" />
                      보호자 연락처
                    </Label>
                    <Input
                      type="tel"
                      value={guardianContact}
                      onChange={(e) => setGuardianContact(e.target.value)}
                      placeholder="010-1234-5678"
                      className="py-5 rounded-xl"
                    />
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
                      type="button"
                      onClick={() => setBloodType(key as FamilyMember["bloodType"])}
                      className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                        bloodType === key
                          ? "bg-red-500 text-white"
                          : "bg-secondary text-foreground hover:bg-accent"
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
                      type="button"
                      onClick={() => toggleChronicDisease(disease)}
                      className={`py-2 px-4 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                        chronicDiseases.includes(disease)
                          ? "bg-primary text-white"
                          : "bg-secondary text-foreground hover:bg-accent"
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
                      type="button"
                      onClick={() => toggleAllergy(allergy)}
                      className={`py-2 px-4 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                        allergies.includes(allergy)
                          ? "bg-orange-500 text-white"
                          : "bg-secondary text-foreground hover:bg-accent"
                      }`}
                    >
                      {allergies.includes(allergy) && <Check className="w-4 h-4" />}
                      {allergy}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medications */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Pill className="w-5 h-5 text-purple-500" />
                  복용 중인 약물
                </h4>
                <div className="flex flex-wrap gap-2">
                  {COMMON_MEDICATIONS.map((med) => (
                    <button
                      key={med}
                      type="button"
                      onClick={() => toggleMedication(med)}
                      className={`py-2 px-4 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                        medications.includes(med)
                          ? "bg-purple-500 text-white"
                          : "bg-gray-100 text-foreground hover:bg-gray-200"
                      }`}
                    >
                      {medications.includes(med) && <Check className="w-4 h-4" />}
                      {med}
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
                  placeholder="기타 특이사항, 복용 중인 약물 상세 정보..."
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
