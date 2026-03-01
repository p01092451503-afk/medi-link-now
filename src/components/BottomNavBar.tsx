import { useLocation, useNavigate } from "react-router-dom";
import { Map, Search, Ambulance, User } from "lucide-react";

const navItems = [
  { path: "/map", label: "지도", icon: Map },
  { path: "/guardian", label: "검색", icon: Search },
  { path: "/fare-calculator", label: "요청", icon: Ambulance },
  { path: "/login", label: "프로필", icon: User },
];

const BottomNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 바텀 내비 표시 안 할 페이지들
  const hideOnPaths = ["/onboarding", "/landing", "/intro", "/", "/admin", "/admin/login"];
  if (hideOnPaths.includes(location.pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[900] bg-background/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 min-h-[44px] transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;
