import { useState } from "react";
import { FileText, ExternalLink, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";

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
    allAgreed
      ? Object.fromEntries(terms.map((t) => [t.id, true]))
      : {}
  );

  const requiredAll = terms.filter((t) => t.required).every((t) => checked[t.id]);
  const allChecked = terms.every((t) => checked[t.id]);

  const toggleAll = () => {
    const next = !allChecked;
    const newState = Object.fromEntries(terms.map((t) => [t.id, next]));
    setChecked(newState);
    if (next && terms.filter((t) => t.required).every((t) => newState[t.id])) {
      onAgreeAll(true);
    } else {
      onAgreeAll(false);
    }
  };

  const toggle = (id: string) => {
    const newState = { ...checked, [id]: !checked[id] };
    setChecked(newState);
    const reqAll = terms.filter((t) => t.required).every((t) => newState[t.id]);
    onAgreeAll(reqAll);
  };

  return (
    <div className="flex flex-col items-center text-center gap-5 px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
      >
        <FileText className="w-8 h-8 text-primary" />
      </motion.div>

      <div>
        <h2 className="text-xl font-bold text-foreground">약관 동의</h2>
        <p className="text-xs text-muted-foreground mt-1">서비스 이용을 위해 약관에 동의해주세요</p>
      </div>

      <div className="w-full max-w-sm space-y-2">
        {/* Agree All */}
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={toggleAll}
          className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
            allChecked
              ? "border-primary bg-primary/5"
              : "border-border bg-card"
          }`}
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
            allChecked ? "bg-primary" : "bg-muted"
          }`}>
            <Check className={`w-4 h-4 ${allChecked ? "text-primary-foreground" : "text-muted-foreground/40"}`} />
          </div>
          <span className="font-semibold text-sm text-foreground">전체 동의하기</span>
        </motion.button>

        <div className="h-px bg-border mx-2" />

        {/* Individual terms */}
        {terms.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 + i * 0.05 }}
            className="flex items-center gap-3 px-3 py-2.5"
          >
            <Checkbox
              checked={!!checked[t.id]}
              onCheckedChange={() => toggle(t.id)}
              className="rounded-md"
            />
            <span className={`flex-1 text-sm text-left ${
              t.required ? "text-foreground" : "text-muted-foreground"
            }`}>
              {t.label}
              {t.required && <span className="text-destructive ml-0.5">*</span>}
            </span>
            {t.link && (
              <a
                href={t.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:text-primary"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </motion.div>
        ))}

        {!requiredAll && (
          <p className="text-[11px] text-muted-foreground mt-2">
            * 필수 약관에 모두 동의해야 다음 단계로 이동할 수 있습니다
          </p>
        )}
      </div>
    </div>
  );
};

export default StepTerms;
