import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type RequestStatus = "pending" | "accepted" | "rejected";

export interface TransferRequest {
  id: string;
  hospitalId: number;
  hospitalName: string;
  patientInfo: {
    age: string;
    gender: string;
    mainSymptom: string;
    bp: string;
    hr: string;
    spo2: string;
  };
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface TransferRequestContextType {
  requests: TransferRequest[];
  addRequest: (request: Omit<TransferRequest, "id" | "status" | "createdAt" | "updatedAt">) => string;
  updateRequestStatus: (id: string, status: RequestStatus) => void;
  getRequestByHospitalId: (hospitalId: number) => TransferRequest | undefined;
  removeRequest: (id: string) => void;
  clearAllRequests: () => void;
}

const TransferRequestContext = createContext<TransferRequestContextType | undefined>(undefined);

export function TransferRequestProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<TransferRequest[]>([]);

  const addRequest = useCallback((request: Omit<TransferRequest, "id" | "status" | "createdAt" | "updatedAt">) => {
    const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRequest: TransferRequest = {
      ...request,
      id,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setRequests(prev => [...prev, newRequest]);
    return id;
  }, []);

  const updateRequestStatus = useCallback((id: string, status: RequestStatus) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status, updatedAt: new Date() } : req
      )
    );
  }, []);

  const getRequestByHospitalId = useCallback((hospitalId: number) => {
    return requests.find(req => req.hospitalId === hospitalId);
  }, [requests]);

  const removeRequest = useCallback((id: string) => {
    setRequests(prev => prev.filter(req => req.id !== id));
  }, []);

  const clearAllRequests = useCallback(() => {
    setRequests([]);
  }, []);

  return (
    <TransferRequestContext.Provider
      value={{
        requests,
        addRequest,
        updateRequestStatus,
        getRequestByHospitalId,
        removeRequest,
        clearAllRequests,
      }}
    >
      {children}
    </TransferRequestContext.Provider>
  );
}

export function useTransferRequest() {
  const context = useContext(TransferRequestContext);
  if (context === undefined) {
    throw new Error("useTransferRequest must be used within a TransferRequestProvider");
  }
  return context;
}
