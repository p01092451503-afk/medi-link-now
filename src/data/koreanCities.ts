// Korean major cities with coordinates for route matching
export interface CityCoordinate {
  name: string;
  aliases: string[];
  lat: number;
  lng: number;
}

export const koreanCities: CityCoordinate[] = [
  // Major Metropolitan Cities
  { name: "서울", aliases: ["서울시", "서울특별시", "Seoul"], lat: 37.5665, lng: 126.9780 },
  { name: "부산", aliases: ["부산시", "부산광역시", "Busan"], lat: 35.1796, lng: 129.0756 },
  { name: "대구", aliases: ["대구시", "대구광역시", "Daegu"], lat: 35.8714, lng: 128.6014 },
  { name: "인천", aliases: ["인천시", "인천광역시", "Incheon"], lat: 37.4563, lng: 126.7052 },
  { name: "광주", aliases: ["광주시", "광주광역시", "Gwangju"], lat: 35.1595, lng: 126.8526 },
  { name: "대전", aliases: ["대전시", "대전광역시", "Daejeon"], lat: 36.3504, lng: 127.3845 },
  { name: "울산", aliases: ["울산시", "울산광역시", "Ulsan"], lat: 35.5384, lng: 129.3114 },
  { name: "세종", aliases: ["세종시", "세종특별자치시", "Sejong"], lat: 36.4800, lng: 127.2890 },
  
  // Gyeonggi-do
  { name: "수원", aliases: ["수원시"], lat: 37.2636, lng: 127.0286 },
  { name: "고양", aliases: ["고양시"], lat: 37.6584, lng: 126.8320 },
  { name: "용인", aliases: ["용인시"], lat: 37.2411, lng: 127.1775 },
  { name: "성남", aliases: ["성남시"], lat: 37.4200, lng: 127.1267 },
  { name: "부천", aliases: ["부천시"], lat: 37.5034, lng: 126.7660 },
  { name: "안산", aliases: ["안산시"], lat: 37.3219, lng: 126.8309 },
  { name: "화성", aliases: ["화성시"], lat: 37.2000, lng: 126.8314 },
  { name: "평택", aliases: ["평택시"], lat: 36.9921, lng: 127.1127 },
  
  // Gangwon-do
  { name: "춘천", aliases: ["춘천시"], lat: 37.8813, lng: 127.7300 },
  { name: "원주", aliases: ["원주시"], lat: 37.3517, lng: 127.9454 },
  { name: "강릉", aliases: ["강릉시"], lat: 37.7519, lng: 128.8761 },
  { name: "속초", aliases: ["속초시"], lat: 38.2070, lng: 128.5918 },
  
  // Chungcheong-do
  { name: "천안", aliases: ["천안시"], lat: 36.8151, lng: 127.1139 },
  { name: "청주", aliases: ["청주시"], lat: 36.6424, lng: 127.4890 },
  { name: "아산", aliases: ["아산시"], lat: 36.7898, lng: 127.0047 },
  { name: "충주", aliases: ["충주시"], lat: 36.9910, lng: 127.9259 },
  
  // Jeolla-do
  { name: "전주", aliases: ["전주시"], lat: 35.8242, lng: 127.1480 },
  { name: "익산", aliases: ["익산시"], lat: 35.9483, lng: 126.9576 },
  { name: "목포", aliases: ["목포시"], lat: 34.8118, lng: 126.3922 },
  { name: "순천", aliases: ["순천시"], lat: 34.9506, lng: 127.4872 },
  { name: "여수", aliases: ["여수시"], lat: 34.7604, lng: 127.6622 },
  
  // Gyeongsang-do
  { name: "창원", aliases: ["창원시"], lat: 35.2285, lng: 128.6811 },
  { name: "김해", aliases: ["김해시"], lat: 35.2342, lng: 128.8811 },
  { name: "포항", aliases: ["포항시"], lat: 36.0190, lng: 129.3435 },
  { name: "구미", aliases: ["구미시"], lat: 36.1196, lng: 128.3445 },
  { name: "경주", aliases: ["경주시"], lat: 35.8562, lng: 129.2247 },
  { name: "진주", aliases: ["진주시"], lat: 35.1802, lng: 128.1076 },
  { name: "거제", aliases: ["거제시"], lat: 34.8806, lng: 128.6211 },
  { name: "양산", aliases: ["양산시"], lat: 35.3350, lng: 129.0389 },
  { name: "마산", aliases: ["마산"], lat: 35.1815, lng: 128.5722 },
  
  // Jeju
  { name: "제주", aliases: ["제주시", "제주도"], lat: 33.4996, lng: 126.5312 },
  { name: "서귀포", aliases: ["서귀포시"], lat: 33.2531, lng: 126.5595 },
];

// Find city coordinates by name (supports partial matching and aliases)
export const findCityCoordinates = (cityName: string): CityCoordinate | null => {
  const normalized = cityName.toLowerCase().trim();
  
  for (const city of koreanCities) {
    if (city.name.toLowerCase() === normalized) return city;
    if (city.aliases.some(alias => alias.toLowerCase() === normalized)) return city;
    if (city.name.includes(cityName) || cityName.includes(city.name)) return city;
    if (city.aliases.some(alias => alias.includes(cityName) || cityName.includes(alias))) return city;
  }
  
  return null;
};

// Calculate distance between two points using Haversine formula (in km)
export const calculateDistance = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => deg * (Math.PI / 180);

// Calculate distance from a point to a line segment (for route proximity)
export const distanceToLineSegment = (
  pointLat: number, pointLng: number,
  startLat: number, startLng: number,
  endLat: number, endLng: number
): number => {
  const A = pointLat - startLat;
  const B = pointLng - startLng;
  const C = endLat - startLat;
  const D = endLng - startLng;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;
  
  let nearestLat: number, nearestLng: number;
  
  if (param < 0) {
    nearestLat = startLat;
    nearestLng = startLng;
  } else if (param > 1) {
    nearestLat = endLat;
    nearestLng = endLng;
  } else {
    nearestLat = startLat + param * C;
    nearestLng = startLng + param * D;
  }
  
  return calculateDistance(pointLat, pointLng, nearestLat, nearestLng);
};
