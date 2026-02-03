import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface PrivateTrafficContextType {
  trafficByHospital: Map<number, number>;
  incrementTraffic: (hospitalId: number) => void;
  decrementTraffic: (hospitalId: number) => void;
  getTrafficCount: (hospitalId: number) => number;
  isHighTraffic: (hospitalId: number) => boolean;
  getAdjustedBeds: (hospitalId: number, officialBeds: number) => number;
  resetTraffic: (hospitalId: number) => void;
}

const PrivateTrafficContext = createContext<PrivateTrafficContextType | undefined>(undefined);

// Initial mock traffic data for some hospitals
const INITIAL_MOCK_TRAFFIC: Record<number, number> = {
  1: 2,  // 서울아산병원 - 2 en route
  2: 1,  // 삼성서울병원 - 1 en route
  6: 3,  // 세브란스병원 - 3 en route (high traffic)
  10: 1, // 서울대병원 - 1 en route
  24: 2, // 분당서울대 - 2 en route
  30: 1, // 부산대병원 - 1 en route
};

export function PrivateTrafficProvider({ children }: { children: ReactNode }) {
  const [trafficByHospital, setTrafficByHospital] = useState<Map<number, number>>(() => {
    const map = new Map<number, number>();
    Object.entries(INITIAL_MOCK_TRAFFIC).forEach(([id, count]) => {
      map.set(Number(id), count);
    });
    return map;
  });

  const incrementTraffic = useCallback((hospitalId: number) => {
    setTrafficByHospital(prev => {
      const newMap = new Map(prev);
      newMap.set(hospitalId, (newMap.get(hospitalId) || 0) + 1);
      return newMap;
    });
  }, []);

  const decrementTraffic = useCallback((hospitalId: number) => {
    setTrafficByHospital(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(hospitalId) || 0;
      if (current > 0) {
        newMap.set(hospitalId, current - 1);
      }
      return newMap;
    });
  }, []);

  const getTrafficCount = useCallback((hospitalId: number): number => {
    return trafficByHospital.get(hospitalId) || 0;
  }, [trafficByHospital]);

  const isHighTraffic = useCallback((hospitalId: number): boolean => {
    return getTrafficCount(hospitalId) > 2;
  }, [getTrafficCount]);

  const getAdjustedBeds = useCallback((hospitalId: number, officialBeds: number): number => {
    const traffic = getTrafficCount(hospitalId);
    return Math.max(0, officialBeds - traffic);
  }, [getTrafficCount]);

  const resetTraffic = useCallback((hospitalId: number) => {
    setTrafficByHospital(prev => {
      const newMap = new Map(prev);
      newMap.delete(hospitalId);
      return newMap;
    });
  }, []);

  return (
    <PrivateTrafficContext.Provider
      value={{
        trafficByHospital,
        incrementTraffic,
        decrementTraffic,
        getTrafficCount,
        isHighTraffic,
        getAdjustedBeds,
        resetTraffic,
      }}
    >
      {children}
    </PrivateTrafficContext.Provider>
  );
}

export function usePrivateTraffic() {
  const context = useContext(PrivateTrafficContext);
  if (context === undefined) {
    throw new Error("usePrivateTraffic must be used within a PrivateTrafficProvider");
  }
  return context;
}
