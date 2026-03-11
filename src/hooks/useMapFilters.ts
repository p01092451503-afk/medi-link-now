import { useState, useMemo, useCallback } from "react";
import {
  Hospital,
  FilterType,
  filterHospitals,
  calculateDistance,
  RegionType,
  MajorRegionType,
  regionOptions,
  filterHospitalsByRegion,
} from "@/data/hospitals";
import { useTransferMode, TransferFilterType } from "@/contexts/TransferModeContext";
import { getTransferBeds, getTotalICU } from "@/data/transferBedsMock";

const DEFAULT_CENTER: [number, number] = [37.5, 127.0];

export const getZoomForRadius = (radiusKm: number): number => {
  if (radiusKm <= 5) return 13;
  if (radiusKm <= 10) return 12;
  if (radiusKm <= 20) return 11;
  return 10;
};

export const getRadiusForZoom = (zoom: number): number => {
  if (zoom >= 13) return 5;
  if (zoom >= 12) return 10;
  if (zoom >= 11) return 20;
  return 30;
};

export function useMapFilters(hospitalData: Hospital[], userLocation: [number, number] | null) {
  const { isTransferMode, transferFilter } = useTransferMode();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeMajorRegion, setActiveMajorRegion] = useState<MajorRegionType>("seoul");
  const [activeRegion, setActiveRegion] = useState<RegionType>("seoul");
  const [searchQuery, setSearchQuery] = useState("");
  const [excludeFullHospitals, setExcludeFullHospitals] = useState(false);
  const [activeRadius, setActiveRadius] = useState<number | "all">("all");
  const [isPediatricSOS, setIsPediatricSOS] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(10);

  const handleMajorRegionChange = useCallback((region: MajorRegionType) => {
    setActiveMajorRegion(region);
    setActiveRegion(region);
    const regionData = regionOptions.find((r) => r.id === region);
    if (regionData) {
      setMapCenter(regionData.center);
      setMapZoom(regionData.zoom || 11);
    }
  }, []);

  const handleSubRegionChange = useCallback((region: RegionType) => {
    setActiveRegion(region);
    const regionData = regionOptions.find((r) => r.id === region);
    if (regionData) {
      setMapCenter(regionData.center);
      setMapZoom(regionData.zoom || 13);
    }
  }, []);

  const { filteredHospitals } = useMemo(() => {
    let result = isTransferMode ? [...hospitalData] : filterHospitals(hospitalData, activeFilter);

    if (isPediatricSOS && !isTransferMode) {
      result = result.filter((h) => h.hasPediatric || h.beds.pediatric > 0);
    }
    result = filterHospitalsByRegion(result, activeRegion);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((h) => h.name.toLowerCase().includes(query) || h.nameKr.includes(query));
    }

    if (excludeFullHospitals && !isTransferMode) {
      result = result.filter((h) => {
        const totalBeds = (h.beds?.general || 0) + (h.beds?.pediatric || 0) + (h.beds?.fever || 0);
        return totalBeds > 0;
      });
    }

    if (isTransferMode && transferFilter !== "all") {
      result = result.filter((h) => {
        const transferBeds = getTransferBeds(h.id);
        switch (transferFilter) {
          case "hospital":
            return (transferBeds.icuGeneral + transferBeds.icuNeuro + transferBeds.icuCardio + transferBeds.ward + transferBeds.isolation) > 0;
          default:
            return true;
        }
      });
    }

    if (userLocation && activeRadius !== "all") {
      result = result.filter((h) => {
        const distance = calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng);
        return distance <= activeRadius;
      });
    }

    if (userLocation) {
      result = result.map((h) => ({
        ...h,
        distance: calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng),
      }));

      if (isTransferMode) {
        result.sort((a, b) => {
          const icuA = getTotalICU(getTransferBeds(a.id));
          const icuB = getTotalICU(getTransferBeds(b.id));
          if (icuB !== icuA) return icuB - icuA;
          return (a.distance || 0) - (b.distance || 0);
        });
      } else {
        result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
    } else if (isTransferMode) {
      result.sort((a, b) => {
        const icuA = getTotalICU(getTransferBeds(a.id));
        const icuB = getTotalICU(getTransferBeds(b.id));
        return icuB - icuA;
      });
    }

    return { filteredHospitals: result };
  }, [activeFilter, activeRegion, searchQuery, excludeFullHospitals, userLocation, hospitalData, activeRadius, isTransferMode, transferFilter, isPediatricSOS]);

  return {
    activeFilter,
    setActiveFilter,
    activeMajorRegion,
    setActiveMajorRegion,
    activeRegion,
    setActiveRegion,
    searchQuery,
    setSearchQuery,
    excludeFullHospitals,
    setExcludeFullHospitals,
    activeRadius,
    setActiveRadius,
    isPediatricSOS,
    setIsPediatricSOS,
    mapCenter,
    setMapCenter,
    mapZoom,
    setMapZoom,
    filteredHospitals,
    handleMajorRegionChange,
    handleSubRegionChange,
  };
}
