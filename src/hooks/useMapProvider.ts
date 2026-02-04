import { useState, useCallback } from "react";

export type MapProvider = "leaflet" | "kakao";

export const useMapProvider = () => {
  const [provider, setProvider] = useState<MapProvider>("leaflet");

  const toggleProvider = useCallback(() => {
    setProvider((prev) => (prev === "leaflet" ? "kakao" : "leaflet"));
  }, []);

  const setMapProvider = useCallback((newProvider: MapProvider) => {
    setProvider(newProvider);
  }, []);

  return {
    provider,
    toggleProvider,
    setMapProvider,
    isKakao: provider === "kakao",
    isLeaflet: provider === "leaflet",
  };
};
