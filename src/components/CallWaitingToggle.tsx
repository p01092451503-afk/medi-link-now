import { PhoneCall, PhoneOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface CallWaitingToggleProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

const CallWaitingToggle = ({ isActive, onToggle }: CallWaitingToggleProps) => {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors ${
      isActive 
        ? "bg-foreground/5 border-foreground/20" 
        : "bg-secondary border-border"
    }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        isActive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
      }`}>
        {isActive ? (
          <PhoneCall className="w-5 h-5 animate-pulse" />
        ) : (
          <PhoneOff className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">
          {isActive ? "콜 대기 중" : "콜 대기 OFF"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isActive ? "새 호출이 들어오면 알려드립니다" : "토글을 켜서 호출을 받으세요"}
        </p>
      </div>
      <Switch
        checked={isActive}
        onCheckedChange={onToggle}
      />
    </div>
  );
};

export default CallWaitingToggle;
