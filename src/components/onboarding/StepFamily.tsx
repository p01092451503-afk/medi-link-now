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
  <div className="flex flex-col items-center text-center gap-6 px-6">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center"
    >
      <Users className="w-8 h-8 text-foreground" />
    </motion.div>

    <div>
      <h2 className="text-xl font-bold text-foreground">가족 구성원 등록</h2>
      <p className="text-[13px] text-muted-foreground mt-1">
        응급 상황 시 빠른 대응을 위해 등록해주세요
      </p>
      <p className="text-[11px] text-muted-foreground/60 mt-0.5">나중에 추가할 수 있습니다</p>
    </div>

    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="w-full max-w-sm space-y-4 text-left"
    >
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="ob-name" className="text-[12px] text-muted-foreground font-medium pl-1">이름</Label>
        <Input
          id="ob-name"
          placeholder="홍길동"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 rounded-2xl border-transparent bg-secondary/60 focus:bg-secondary focus:border-foreground/15 text-[14px] px-4 placeholder:text-muted-foreground/40"
        />
      </div>

      {/* Relation */}
      <div className="space-y-1.5">
        <Label htmlFor="ob-rel" className="text-[12px] text-muted-foreground font-medium pl-1">관계</Label>
        <Input
          id="ob-rel"
          placeholder="본인, 배우자, 자녀 등"
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          className="h-12 rounded-2xl border-transparent bg-secondary/60 focus:bg-secondary focus:border-foreground/15 text-[14px] px-4 placeholder:text-muted-foreground/40"
        />
      </div>

      {/* Blood type */}
      <div className="space-y-1.5">
        <Label className="text-[12px] text-muted-foreground font-medium pl-1">혈액형</Label>
        <div className="flex gap-1.5 flex-wrap">
          {bloodTypes.map((bt, i) => (
            <motion.button
              key={bt}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBloodType(bt === bloodType ? "" : bt)}
              className={`px-3.5 py-2 text-[12px] rounded-xl font-medium transition-colors duration-150 ${
                bloodType === bt
                  ? "bg-foreground text-background"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {bt}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  </div>
);

export default StepFamily;
