import { useLocation, useNavigate } from "react-router-dom";
import { Map, Home, Heart, User, LayoutDashboard, ClipboardList } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "guardian" | "driver" | "admin" | null;

const BottomNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    if (!user) {
      setRole(null);
      return;
    }
    supabase
      .rpc("get_user_role", { _user_id: user.id })
      .then(({ data }) => setRole((data as UserRole) ?? "guardian"));
  }, [user]);

  // 바텀 내비 표시 안 할 페이지들
  const hideOnPaths = ["/onboarding", "/landing", "/", "/admin", "/admin/login", "/paramedic", "/driver-intro"];
  if (hideOnPaths.includes(location.pathname)) return null;

  const guardianNav = [
    { path: "/guardian", label: "홈", icon: Home },
    { path: "/map", label: "지도", icon: Map },
    { path: "/family", label: "가족", icon: Heart },
    { path: user ? "/login" : "/login", label: user ? "마이" : "로그인", icon: User },
  ];

  const driverNav = [
    { path: "/driver", label: "대시보드", icon: LayoutDashboard },
    { path: "/map?mode=driver", label: "지도", icon: Map },
    { path: "/logs", label: "운행기록", icon: ClipboardList },
    { path: "/login", label: "마이", icon: User },
  ];

  const navItems = role === "driver" ? driverNav : guardianNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[900] safe-area-bottom">
      <div className="mx-3 mb-2">
        <div className="flex items-center justify-around h-[58px] max-w-lg mx-auto px-1 bg-card/90 backdrop-blur-2xl rounded-2xl shadow-lg border border-border/50">
          {navItems.map(({ path, label, icon: Icon }) => {
            const basePath = path.split("?")[0];
            const isActive = location.pathname === basePath;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 min-h-[44px] transition-all duration-200 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                {isActive && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-primary" />
                )}
                <Icon className={`w-[22px] h-[22px] transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                <span className={`text-[10px] transition-all duration-200 ${isActive ? "font-bold" : "font-medium"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavBar;
