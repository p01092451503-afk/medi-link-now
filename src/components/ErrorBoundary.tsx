import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Phone, RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-foreground mb-2">
                일시적인 오류가 발생했습니다
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                잠시 후 다시 시도해주세요.<br />
                문제가 지속되면 앱을 새로고침 해주세요.
              </p>
            </div>

            <button
              onClick={this.handleReload}
              className="w-full py-3.5 rounded-2xl bg-secondary text-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-secondary/80 active:scale-[0.98] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              새로고침
            </button>

            {/* 119 버튼은 에러 상태에서도 항상 표시 */}
            <a
              href="tel:119"
              className="w-full py-4 rounded-2xl bg-destructive text-destructive-foreground font-bold text-[15px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <Phone className="w-5 h-5" />
              긴급 신고: 119
            </a>

            <p className="text-[11px] text-muted-foreground/60">
              응급 상황 시 위 버튼으로 즉시 신고하세요
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
