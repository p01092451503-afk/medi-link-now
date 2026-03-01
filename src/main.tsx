import { createRoot } from "react-dom/client";
import { validateEnv } from "./lib/config";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import "leaflet/dist/leaflet.css";

// 앱 시작 전 필수 환경변수 검증
validateEnv();

createRoot(document.getElementById("root")!).render(<App />);
