import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="text-center max-w-sm">
        <p className="text-6xl font-extrabold text-foreground tracking-tight mb-4">404</p>
        <p className="text-lg font-semibold text-foreground mb-2">페이지를 찾을 수 없습니다</p>
        <p className="text-sm text-muted-foreground mb-8">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-2xl text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
        >
          홈으로 돌아가기
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotFound;
