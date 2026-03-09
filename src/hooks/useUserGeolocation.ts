import { useState, useEffect } from "react";

/**
 * Hook to get user's geolocation and reverse-geocode district name.
 */
export function useUserGeolocation() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userDistrictName, setUserDistrictName] = useState<string | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);

  // Auto-get location on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
      },
      () => {
        console.log("Auto-location failed, using default center");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  // Reverse geocode user location to get district name
  useEffect(() => {
    if (!userLocation) {
      setUserDistrictName(undefined);
      return;
    }

    const [lat, lng] = userLocation;

    if ((window as any).kakao?.maps?.services) {
      const kakaoApi = (window as any).kakao;
      const geocoder = new kakaoApi.maps.services.Geocoder();
      geocoder.coord2RegionCode(lng, lat, (result: any, status: any) => {
        if (status === kakaoApi.maps.services.Status.OK && result.length > 0) {
          const region = result.find((r: any) => r.region_type === "H") || result[0];
          const districtName = region.region_2depth_name || region.region_1depth_name;
          setUserDistrictName(districtName);
        }
      });
    } else {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=ko`)
        .then(res => res.json())
        .then(data => {
          const addr = data?.address;
          const districtName = addr?.city_district || addr?.borough || addr?.city || addr?.county || addr?.town || addr?.suburb;
          if (districtName) setUserDistrictName(districtName);
        })
        .catch(err => console.error('Reverse geocoding fallback failed:', err));
    }
  }, [userLocation]);

  return {
    userLocation,
    setUserLocation,
    userDistrictName,
    isLocating,
  };
}
