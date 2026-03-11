import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { validateEnv } from "./lib/config";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Sentry 초기화
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN ?? "",
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  enabled: import.meta.env.PROD,
  integrations: [Sentry.browserTracingIntegration()],
});

// 앱 시작 전 필수 환경변수 검증
validateEnv();

createRoot(document.getElementById("root")!).render(<App />);
