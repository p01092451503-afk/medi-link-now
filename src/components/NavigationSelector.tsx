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

// SVG icons for each map app
const KakaoMapIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <rect x="3" y="5" width="18" height="14" rx="2" fill="#3B2A1A" />
    <path d="M7 9h10M7 12h6M7 15h8" stroke="#FFE812" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="17" cy="14" r="2" fill="#FFE812" />
  </svg>
);

const NaverMapIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.5" />
    <path d="M12 6v12M6 12h12" stroke="white" strokeWidth="1.5" />
    <path d="M12 4l1 2h-2l1-2z" fill="#FF3D00" />
    <circle cx="12" cy="12" r="2" fill="white" />
  </svg>
);

const TMapIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <rect x="4" y="8" width="16" height="8" rx="2" fill="white" />
    <circle cx="7" cy="16" r="2" fill="#333" />
    <circle cx="17" cy="16" r="2" fill="#333" />
    <path d="M6 10h4v2H6z" fill="#333" />
    <path d="M14 8h2v4h-2z" fill="#333" />
  </svg>
);

const GoogleMapIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white" />
    <circle cx="12" cy="9" r="2.5" fill="#EA4335" />
  </svg>
);

const navApps = [
  { 
    id: "kakao" as NavigationApp, 
    name: "카카오맵", 
    Icon: KakaoMapIcon,
    bgColor: "bg-[#FFE812]"
  },
  { 
    id: "naver" as NavigationApp, 
    name: "네이버지도", 
    Icon: NaverMapIcon,
    bgColor: "bg-[#03C75A]"
  },
  { 
    id: "tmap" as NavigationApp, 
    name: "티맵", 
    Icon: TMapIcon,
    bgColor: "bg-[#0064FF]"
  },
  { 
    id: "google" as NavigationApp, 
    name: "구글맵", 
    Icon: GoogleMapIcon,
    bgColor: "bg-[#EA4335]"
  },
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
        className="w-56 p-2 rounded-xl border-0 shadow-xl z-[2000]" 
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
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
            >
              <div className={`w-10 h-10 rounded-xl ${app.bgColor} flex items-center justify-center shadow-sm`}>
                <app.Icon />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{app.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {isMobile ? "앱으로 길안내 시작" : "웹에서 경로 확인"}
                </p>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-2 pt-2 border-t">
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
