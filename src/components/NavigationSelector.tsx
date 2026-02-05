import { useState } from "react";
import { Navigation, ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  openNavigation, 
  type NavigationApp, 
  type NavigationDestination,
  isMobileDevice 
} from "@/utils/navigationUtils";

interface NavigationSelectorProps {
  destination: NavigationDestination;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  showLabel?: boolean;
}

const navApps = [
  { id: "kakao" as NavigationApp, name: "카카오맵" },
  { id: "naver" as NavigationApp, name: "네이버지도" },
  { id: "tmap" as NavigationApp, name: "티맵" },
  { id: "google" as NavigationApp, name: "구글맵" },
];

const NavigationSelector = ({ 
  destination, 
  variant = "outline",
  size = "default",
  className = "",
  showLabel = true 
}: NavigationSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = isMobileDevice();

  const handleSelectApp = (appId: NavigationApp) => {
    setIsOpen(false);
    openNavigation(appId, destination);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`${className} ${variant === "outline" ? "border-primary text-primary hover:bg-primary/5" : ""}`}
        >
          <Navigation className="w-4 h-4 mr-2" />
          {showLabel && "길안내"}
          <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-2 rounded-xl border-0 shadow-xl z-[2000] bg-white dark:bg-slate-900" 
        align="center"
        side="top"
        sideOffset={8}
      >
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-2 py-1 font-medium">
            {isMobile ? "내비게이션 앱 선택" : "지도 서비스 선택"}
          </p>
          {navApps.map((app) => (
            <button
              key={app.id}
              onClick={() => handleSelectApp(app.id)}
              className="w-full px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <p className="text-sm font-medium text-foreground">{app.name}</p>
            </button>
          ))}
        </div>
        
        <div className="mt-2 pt-2 border-t dark:border-slate-700">
          <p className="text-[10px] text-muted-foreground text-center px-2">
            <MapPin className="w-3 h-3 inline mr-1" />
            {destination.name}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NavigationSelector;
