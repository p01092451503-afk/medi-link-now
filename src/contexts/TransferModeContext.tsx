import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type AppMode = "emergency" | "transfer";

export type TransferFilterType = "all" | "icu-general" | "icu-neuro" | "icu-cardio" | "ward" | "isolation";

interface TransferModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isTransferMode: boolean;
  transferFilter: TransferFilterType;
  setTransferFilter: (filter: TransferFilterType) => void;
}

const TransferModeContext = createContext<TransferModeContextType | undefined>(undefined);

export const transferFilterOptions: { id: TransferFilterType; label: string; labelKr: string }[] = [
  { id: "all", label: "All Facilities", labelKr: "전체" },
  { id: "icu-general", label: "General ICU", labelKr: "일반 중환자실" },
  { id: "icu-neuro", label: "Neuro ICU", labelKr: "신경계 중환자실" },
  { id: "icu-cardio", label: "Cardio ICU", labelKr: "심장 중환자실" },
  { id: "ward", label: "General Ward", labelKr: "일반병실" },
  { id: "isolation", label: "Isolation Room", labelKr: "격리병실" },
];

export function TransferModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>("emergency");
  const [transferFilter, setTransferFilter] = useState<TransferFilterType>("all");

  const isTransferMode = mode === "transfer";

  // Apply transfer mode theme class to body
  useEffect(() => {
    if (isTransferMode) {
      document.body.classList.add("transfer-mode");
    } else {
      document.body.classList.remove("transfer-mode");
    }
    return () => {
      document.body.classList.remove("transfer-mode");
    };
  }, [isTransferMode]);

  return (
    <TransferModeContext.Provider
      value={{
        mode,
        setMode,
        isTransferMode,
        transferFilter,
        setTransferFilter,
      }}
    >
      {children}
    </TransferModeContext.Provider>
  );
}

export function useTransferMode() {
  const context = useContext(TransferModeContext);
  if (context === undefined) {
    throw new Error("useTransferMode must be used within a TransferModeProvider");
  }
  return context;
}
