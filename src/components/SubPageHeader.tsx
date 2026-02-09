import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface SubPageHeaderProps {
  title?: string;
  backTo?: string;
  rightElement?: React.ReactNode;
}

const SubPageHeader = ({ title = "파인더", backTo, rightElement }: SubPageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else if (window.history.length > 2 && document.referrer) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="px-5 py-4 flex items-center justify-between max-w-lg mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          돌아가기
        </button>
        <h1 className="text-[15px] font-bold text-foreground tracking-tight">{title}</h1>
        <div className="w-16 flex justify-end">
          {rightElement}
        </div>
      </div>
    </header>
  );
};

export default SubPageHeader;
