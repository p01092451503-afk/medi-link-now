import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type AppMode = "emergency" | "transfer";

export type TransferFilterType = "all" | "hospital" | "nursing";

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
  { id: "hospital", label: "General Hospital", labelKr: "일반 병원" },
  { id: "nursing", label: "Nursing Hospital", labelKr: "요양병원" },
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
