import { createRoot } from "react-dom/client";
import { validateEnv } from "./lib/config";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Sentry 지연 초기화 (프로덕션에서만)
if (import.meta.env.PROD) {
  import("@sentry/react").then((Sentry) => {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN ?? "",
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      integrations: [Sentry.browserTracingIntegration()],
    });
  });
}

// 앱 시작 전 필수 환경변수 검증
validateEnv();

createRoot(document.getElementById("root")!).render(<App />);
