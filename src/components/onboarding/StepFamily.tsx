import { Users } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StepFamilyProps {
  name: string;
  setName: (v: string) => void;
  relation: string;
  setRelation: (v: string) => void;
  bloodType: string;
  setBloodType: (v: string) => void;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const StepFamily = ({ name, setName, relation, setRelation, bloodType, setBloodType }: StepFamilyProps) => (
  <div className="flex flex-col items-center text-center gap-5 px-6">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
    >
      <Users className="w-8 h-8 text-primary" />
    </motion.div>

    <div>
      <h2 className="text-xl font-bold text-foreground">가족 구성원 등록</h2>
      <p className="text-xs text-muted-foreground mt-1">
        응급 상황 시 빠른 대응을 위해 등록해주세요
        <br />
        <span className="text-[10px]">나중에 추가할 수 있습니다</span>
      </p>
    </div>

    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="w-full max-w-sm flex flex-col gap-3 text-left"
    >
      <div>
        <Label htmlFor="ob-name" className="text-xs text-muted-foreground mb-1">이름</Label>
        <Input
          id="ob-name"
          placeholder="홍길동"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl"
        />
      </div>
      <div>
        <Label htmlFor="ob-rel" className="text-xs text-muted-foreground mb-1">관계</Label>
        <Input
          id="ob-rel"
          placeholder="본인, 배우자, 자녀 등"
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          className="rounded-xl"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1">혈액형</Label>
        <div className="flex gap-1.5 flex-wrap">
          {bloodTypes.map((bt) => (
            <button
              key={bt}
              onClick={() => setBloodType(bt)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                bloodType === bt
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {bt}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  </div>
);

export default StepFamily;
