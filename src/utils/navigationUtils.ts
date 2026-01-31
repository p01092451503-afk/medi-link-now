// Navigation deep link utilities for Korean map apps

export interface NavigationDestination {
  lat: number;
  lng: number;
  name: string;
}

// Check if device is mobile
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Kakao Map navigation
export const openKakaoNavigation = (dest: NavigationDestination) => {
  const isMobile = isMobileDevice();
  
  if (isMobile) {
    // Mobile: Try app first, fallback to web
    const appUrl = `kakaomap://route?ep=${dest.lat},${dest.lng}&by=CAR`;
    const webUrl = `https://map.kakao.com/link/to/${encodeURIComponent(dest.name)},${dest.lat},${dest.lng}`;
    
    // Try to open app, fallback to web after timeout
    const startTime = Date.now();
    window.location.href = appUrl;
    
    setTimeout(() => {
      // If we're still on this page after 1.5s, app didn't open
      if (Date.now() - startTime < 2000) {
        window.open(webUrl, "_blank");
      }
    }, 1500);
  } else {
    // Desktop: Open web version
    const webUrl = `https://map.kakao.com/link/to/${encodeURIComponent(dest.name)},${dest.lat},${dest.lng}`;
    window.open(webUrl, "_blank");
  }
};

// Naver Map navigation
export const openNaverNavigation = (dest: NavigationDestination) => {
  const isMobile = isMobileDevice();
  
  if (isMobile) {
    // Mobile: Try app first, fallback to web
    const appUrl = `nmap://route/car?dlat=${dest.lat}&dlng=${dest.lng}&dname=${encodeURIComponent(dest.name)}&appname=com.lovable.finder`;
    const webUrl = `https://map.naver.com/v5/directions/-/-/-/car?c=${dest.lng},${dest.lat},15,0,0,0,dh&destination=${encodeURIComponent(dest.name)},${dest.lng},${dest.lat}`;
    
    const startTime = Date.now();
    window.location.href = appUrl;
    
    setTimeout(() => {
      if (Date.now() - startTime < 2000) {
        window.open(webUrl, "_blank");
      }
    }, 1500);
  } else {
    // Desktop: Open web version
    const webUrl = `https://map.naver.com/v5/directions/-/-/-/car?c=${dest.lng},${dest.lat},15,0,0,0,dh&destination=${encodeURIComponent(dest.name)},${dest.lng},${dest.lat}`;
    window.open(webUrl, "_blank");
  }
};

// T Map navigation
export const openTMapNavigation = (dest: NavigationDestination) => {
  const isMobile = isMobileDevice();
  
  if (isMobile) {
    // Mobile: Try app, fallback to web
    const appUrl = `tmap://route?goalname=${encodeURIComponent(dest.name)}&goalx=${dest.lng}&goaly=${dest.lat}`;
    const webUrl = `https://apis.openapi.sk.com/tmap/app/routes?appKey=l7xxab2e1f7c2e024e38b91f23e09d1e8c26&name=${encodeURIComponent(dest.name)}&lon=${dest.lng}&lat=${dest.lat}`;
    
    const startTime = Date.now();
    window.location.href = appUrl;
    
    setTimeout(() => {
      if (Date.now() - startTime < 2000) {
        window.open(webUrl, "_blank");
      }
    }, 1500);
  } else {
    // Desktop: Open web version (T Map web doesn't have great desktop navigation)
    const webUrl = `https://tmap.life/navigation?goalname=${encodeURIComponent(dest.name)}&goalx=${dest.lng}&goaly=${dest.lat}`;
    window.open(webUrl, "_blank");
  }
};

// Google Maps navigation (universal fallback)
export const openGoogleNavigation = (dest: NavigationDestination) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`;
  window.open(url, "_blank");
};

// Navigation app type
export type NavigationApp = "kakao" | "naver" | "tmap" | "google";

// Open navigation with selected app
export const openNavigation = (app: NavigationApp, dest: NavigationDestination) => {
  switch (app) {
    case "kakao":
      openKakaoNavigation(dest);
      break;
    case "naver":
      openNaverNavigation(dest);
      break;
    case "tmap":
      openTMapNavigation(dest);
      break;
    case "google":
    default:
      openGoogleNavigation(dest);
      break;
  }
};
