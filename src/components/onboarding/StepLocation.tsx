import { Locate, Check, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface StepLocationProps {
  granted: boolean | null;
  onRequest: () => void;
}

const StepLocation = ({ granted, onRequest }: StepLocationProps) => (
  <div className="flex flex-col items-center text-center gap-5 px-6">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
        granted ? "bg-success/10" : "bg-primary/10"
      }`}
    >
      {granted ? (
        <Check className="w-8 h-8 text-success" />
      ) : (
        <Locate className="w-8 h-8 text-primary" />
      )}
    </motion.div>

    <div>
      <h2 className="text-xl font-bold text-foreground">위치 권한</h2>
      <p className="text-xs text-muted-foreground mt-1">내 주변 응급실을 찾기 위해 필요합니다</p>
    </div>

    {/* Visual */}
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="w-full max-w-xs rounded-2xl bg-card border border-border/50 p-5 shadow-sm"
    >
      <div className="flex items-start gap-3 text-left">
        <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">위치 정보 사용 안내</p>
          <ul className="text-xs text-muted-foreground mt-2 space-y-1.5">
            <li>• 내 주변 응급실·약국 검색</li>
            <li>• 최단거리 경로 안내</li>
            <li>• 서버에 저장되지 않음</li>
          </ul>
        </div>
      </div>
    </motion.div>

    {granted === null && (
      <Button onClick={onRequest} size="lg" className="gap-2 mt-1 rounded-xl">
        <Locate className="w-4 h-4" />
        위치 권한 허용하기
      </Button>
    )}
    {granted === true && (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 text-success font-medium text-sm"
      >
        <Check className="w-5 h-5" /> 위치 권한이 허용되었습니다
      </motion.div>
    )}
    {granted === false && (
      <p className="text-xs text-destructive max-w-xs">
        위치 권한이 거부되었습니다. 설정에서 수동으로 허용해주세요.
        <br />
        <span className="text-muted-foreground">건너뛰어도 수동으로 지역을 검색할 수 있습니다.</span>
      </p>
    )}
  </div>
);

export default StepLocation;
