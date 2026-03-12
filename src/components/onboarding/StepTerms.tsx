import { useState } from "react";
import { FileText, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StepTermsProps {
  allAgreed: boolean;
  onAgreeAll: (agreed: boolean) => void;
}

const terms = [
  { id: "service", label: "이용약관 동의", required: true, link: "/terms" },
  { id: "privacy", label: "개인정보처리방침 동의", required: true, link: "/privacy" },
  { id: "location", label: "위치정보 이용 동의", required: true, link: "/privacy#location" },
  { id: "marketing", label: "마케팅 수신 동의 (선택)", required: false },
];

const StepTerms = ({ allAgreed, onAgreeAll }: StepTermsProps) => {
  const [checked, setChecked] = useState<Record<string, boolean>>(
    allAgreed ? Object.fromEntries(terms.map((t) => [t.id, true])) : {}
  );

  const requiredAll = terms.filter((t) => t.required).every((t) => checked[t.id]);
  const allChecked = terms.every((t) => checked[t.id]);

  const toggleAll = () => {
    const next = !allChecked;
    const newState = Object.fromEntries(terms.map((t) => [t.id, next]));
    setChecked(newState);
    onAgreeAll(next && terms.filter((t) => t.required).every((t) => newState[t.id]));
  };

  const toggle = (id: string) => {
    const newState = { ...checked, [id]: !checked[id] };
    setChecked(newState);
    onAgreeAll(terms.filter((t) => t.required).every((t) => newState[t.id]));
  };

  return (
    <div className="flex flex-col items-center text-center gap-6 px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center"
      >
        <FileText className="w-8 h-8 text-foreground" />
      </motion.div>

      <div>
        <h2 className="text-xl font-bold text-foreground">약관 동의</h2>
        <p className="text-[13px] text-muted-foreground mt-1">서비스 이용을 위해 약관에 동의해주세요</p>
      </div>

      <div className="w-full max-w-sm space-y-2">
        {/* Agree All */}
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleAll}
          className={`w-full flex items-center gap-3 px-4 py-[14px] rounded-2xl border text-left transition-colors duration-150 ${
            allChecked
              ? "border-foreground/15 bg-secondary shadow-sm"
              : "border-transparent bg-secondary/60 hover:bg-secondary"
          }`}
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-150 ${
            allChecked ? "bg-foreground" : "bg-muted"
          }`}>
            <Check className={`w-3.5 h-3.5 ${allChecked ? "text-background" : "text-muted-foreground/30"}`} strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-[15px] text-foreground flex-1">전체 동의하기</span>
        </motion.button>

        <div className="h-px bg-border/60 mx-3" />

        {/* Individual terms */}
        {terms.map((t, i) => (
          <motion.button
            key={t.id}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.04 + i * 0.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggle(t.id)}
            className="w-full flex items-center gap-3 px-4 py-[10px] rounded-xl text-left transition-colors hover:bg-secondary/40"
          >
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors duration-150 ${
              checked[t.id] ? "bg-foreground" : "bg-muted"
            }`}>
              <Check className={`w-3 h-3 ${checked[t.id] ? "text-background" : "text-muted-foreground/20"}`} strokeWidth={2.5} />
            </div>
            <span className={`flex-1 text-[14px] ${
              t.required ? "text-foreground" : "text-muted-foreground"
            }`}>
              {t.label}
              {t.required && <span className="text-destructive ml-0.5 text-[11px]">필수</span>}
            </span>
            {t.link && (
              <a
                href={t.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground/40 hover:text-muted-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </a>
            )}
          </motion.button>
        ))}

        <AnimatePresence>
          {!requiredAll && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[11px] text-muted-foreground pt-1 px-1"
            >
              필수 약관에 모두 동의해야 다음 단계로 이동할 수 있습니다
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StepTerms;
