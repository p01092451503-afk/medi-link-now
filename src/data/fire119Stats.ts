 // 119 Historical Statistics Mock Data
 // Based on hypothetical analysis of 소방청_구급통계서비스 & 소방청_구급정보서비스
 
 export interface Fire119HospitalStat {
   hospitalId: number;
   hospitalName: string;
   totalTransfers: number;
   specialty: string[];  // Top specialties this hospital receives
   ranking: number;      // Regional ranking for emergency transfers
   symptoms: {
     stroke: number;
     trauma: number;
     cardiac: number;
     respiratory: number;
     pediatric: number;
   };
 }
 
 export interface RegionDemandForecast {
   regionId: string;
   regionName: string;
   dayOfWeek: number;    // 0=Sunday, 1=Monday, ..., 6=Saturday
   hour: number;         // 0-23
   demandLevel: "low" | "moderate" | "high" | "critical";
   avgIncidents: number; // Historical average incidents per hour
   message: string;
 }
 
 export interface HourlyBusyData {
   hour: number;
   incidents: number;   // Historical average arrivals
   level: "low" | "moderate" | "high";
 }
 
 // Mock: Top hospitals by 119 transfer volume (simulated from 구급통계서비스)
 export const fire119HospitalStats: Fire119HospitalStat[] = [
   {
     hospitalId: 1,
     hospitalName: "서울아산병원",
     totalTransfers: 8420,
     specialty: ["stroke", "cardiac", "trauma"],
     ranking: 1,
     symptoms: { stroke: 2100, trauma: 1850, cardiac: 1920, respiratory: 1450, pediatric: 1100 }
   },
   {
     hospitalId: 2,
     hospitalName: "삼성서울병원",
     totalTransfers: 7890,
     specialty: ["cardiac", "stroke"],
     ranking: 2,
     symptoms: { stroke: 1980, trauma: 1620, cardiac: 2150, respiratory: 1240, pediatric: 900 }
   },
   {
     hospitalId: 3,
     hospitalName: "서울대병원",
     totalTransfers: 7650,
     specialty: ["trauma", "stroke"],
     ranking: 3,
     symptoms: { stroke: 1850, trauma: 2100, cardiac: 1780, respiratory: 1120, pediatric: 800 }
   },
   {
     hospitalId: 4,
     hospitalName: "세브란스병원",
     totalTransfers: 7200,
     specialty: ["stroke", "respiratory"],
     ranking: 4,
     symptoms: { stroke: 1920, trauma: 1450, cardiac: 1680, respiratory: 1350, pediatric: 800 }
   },
   {
     hospitalId: 5,
     hospitalName: "고려대안암병원",
     totalTransfers: 5890,
     specialty: ["cardiac", "trauma"],
     ranking: 5,
     symptoms: { stroke: 1280, trauma: 1520, cardiac: 1580, respiratory: 890, pediatric: 620 }
   },
   {
     hospitalId: 6,
     hospitalName: "경희대병원",
     totalTransfers: 5450,
     specialty: ["stroke"],
     ranking: 6,
     symptoms: { stroke: 1450, trauma: 1180, cardiac: 1320, respiratory: 850, pediatric: 650 }
   },
   {
     hospitalId: 7,
     hospitalName: "한양대병원",
     totalTransfers: 5120,
     specialty: ["trauma", "respiratory"],
     ranking: 7,
     symptoms: { stroke: 1180, trauma: 1380, cardiac: 1250, respiratory: 780, pediatric: 530 }
   },
   {
     hospitalId: 8,
     hospitalName: "강북삼성병원",
     totalTransfers: 4890,
     specialty: ["cardiac"],
     ranking: 8,
     symptoms: { stroke: 1050, trauma: 1120, cardiac: 1420, respiratory: 720, pediatric: 580 }
   },
   {
     hospitalId: 9,
     hospitalName: "분당서울대병원",
     totalTransfers: 6320,
     specialty: ["stroke", "trauma"],
     ranking: 1,
     symptoms: { stroke: 1680, trauma: 1580, cardiac: 1520, respiratory: 920, pediatric: 620 }
   },
   {
     hospitalId: 10,
     hospitalName: "아주대병원",
     totalTransfers: 5780,
     specialty: ["trauma", "cardiac"],
     ranking: 2,
     symptoms: { stroke: 1320, trauma: 1650, cardiac: 1480, respiratory: 850, pediatric: 480 }
   }
 ];
 
 // Mock: Regional demand forecasts based on historical 119 출동 데이터
 const regionDemandPatterns: Record<string, { peakDays: number[]; peakHours: number[]; baseLevel: number }> = {
   "gangnam": { peakDays: [5, 6], peakHours: [21, 22, 23, 0, 1], baseLevel: 45 },
   "jongno": { peakDays: [4, 5], peakHours: [18, 19, 20, 21], baseLevel: 38 },
   "mapo": { peakDays: [5, 6], peakHours: [20, 21, 22, 23], baseLevel: 35 },
   "songpa": { peakDays: [6, 0], peakHours: [14, 15, 20, 21], baseLevel: 42 },
   "yeongdeungpo": { peakDays: [4, 5], peakHours: [19, 20, 21, 22], baseLevel: 40 },
   "suwon": { peakDays: [5, 6], peakHours: [20, 21, 22], baseLevel: 48 },
   "seongnam": { peakDays: [5, 6], peakHours: [19, 20, 21, 22], baseLevel: 38 },
   "default": { peakDays: [5, 6], peakHours: [20, 21, 22], baseLevel: 30 }
 };
 
 // Generate demand forecast for current time
 export const getDemandForecast = (regionId: string): RegionDemandForecast | null => {
   const now = new Date();
   const dayOfWeek = now.getDay();
   const hour = now.getHours();
   
   const pattern = regionDemandPatterns[regionId] || regionDemandPatterns["default"];
   const isPeakDay = pattern.peakDays.includes(dayOfWeek);
   const isPeakHour = pattern.peakHours.includes(hour);
   
   let demandLevel: "low" | "moderate" | "high" | "critical";
   let avgIncidents: number;
   
   if (isPeakDay && isPeakHour) {
     demandLevel = "critical";
     avgIncidents = Math.round(pattern.baseLevel * 1.8);
   } else if (isPeakDay || isPeakHour) {
     demandLevel = "high";
     avgIncidents = Math.round(pattern.baseLevel * 1.4);
   } else if (hour >= 8 && hour <= 22) {
     demandLevel = "moderate";
     avgIncidents = pattern.baseLevel;
   } else {
     demandLevel = "low";
     avgIncidents = Math.round(pattern.baseLevel * 0.6);
   }
   
   const regionNames: Record<string, string> = {
     "gangnam": "강남구",
     "jongno": "종로구",
     "mapo": "마포구",
     "songpa": "송파구",
     "yeongdeungpo": "영등포구",
     "suwon": "수원시",
     "seongnam": "성남시"
   };
   
   const regionName = regionNames[regionId] || "서울";
   const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
   
   let message = "";
   if (demandLevel === "critical") {
     message = `${regionName}는 ${dayNames[dayOfWeek]}요일 밤 응급 출동이 집중되는 시간대입니다.`;
   } else if (demandLevel === "high") {
     message = `${regionName}는 현재 응급 수요가 평소보다 높은 시간대입니다.`;
   } else if (demandLevel === "moderate") {
     message = `${regionName}는 현재 평균 수준의 응급 수요가 예상됩니다.`;
   } else {
     message = `${regionName}는 현재 응급 수요가 낮은 시간대입니다.`;
   }
   
   return {
     regionId,
     regionName,
     dayOfWeek,
     hour,
     demandLevel,
     avgIncidents,
     message
   };
 };
 
 // Generate hourly busy data for a hospital (simulated from 119 도착 통계)
 export const getHospitalBusyHours = (hospitalId: number): HourlyBusyData[] => {
   // Different hospitals have different peak patterns based on their specialty
   const hospitalStat = fire119HospitalStats.find(h => h.hospitalId === hospitalId);
   const isTraumaFocused = hospitalStat?.specialty.includes("trauma");
   const isStrokeFocused = hospitalStat?.specialty.includes("stroke");
   
   return Array.from({ length: 24 }, (_, hour) => {
     let baseIncidents: number;
     
     // Night hours (0-6): Lower activity
     if (hour >= 0 && hour < 6) {
       baseIncidents = Math.round(5 + Math.random() * 8);
     }
     // Morning (6-9): Rising activity
     else if (hour >= 6 && hour < 9) {
       baseIncidents = Math.round(12 + Math.random() * 10);
     }
     // Daytime (9-17): Moderate to high
     else if (hour >= 9 && hour < 17) {
       baseIncidents = Math.round(18 + Math.random() * 12);
     }
     // Evening rush (17-21): Peak hours
     else if (hour >= 17 && hour < 21) {
       baseIncidents = Math.round(25 + Math.random() * 15);
     }
     // Late evening (21-24): Trauma-focused hospitals peak here
     else {
       baseIncidents = isTraumaFocused 
         ? Math.round(28 + Math.random() * 12)
         : Math.round(15 + Math.random() * 10);
     }
     
     // Stroke-focused hospitals have morning peaks (stroke often occurs early AM)
     if (isStrokeFocused && hour >= 5 && hour < 9) {
       baseIncidents = Math.round(baseIncidents * 1.3);
     }
     
     let level: "low" | "moderate" | "high";
     if (baseIncidents < 15) {
       level = "low";
     } else if (baseIncidents < 25) {
       level = "moderate";
     } else {
       level = "high";
     }
     
     return { hour, incidents: baseIncidents, level };
   });
 };
 
 // Check if a hospital is a "119 Verified" top choice
 export const isHospital119Verified = (hospitalName: string): { verified: boolean; specialty?: string[]; ranking?: number } => {
   // Normalize hospital name for matching
   const normalizedName = hospitalName.replace(/\s/g, "").toLowerCase();
   
   const matchedHospital = fire119HospitalStats.find(stat => {
     const statName = stat.hospitalName.replace(/\s/g, "").toLowerCase();
     return normalizedName.includes(statName) || statName.includes(normalizedName);
   });
   
   if (matchedHospital && matchedHospital.ranking <= 5) {
     return {
       verified: true,
       specialty: matchedHospital.specialty,
       ranking: matchedHospital.ranking
     };
   }
   
   return { verified: false };
 };
 
 // Get top specialty badge text
 export const getSpecialtyBadgeText = (specialty: string[]): string => {
   const specialtyMap: Record<string, string> = {
     stroke: "뇌졸중",
     trauma: "외상",
     cardiac: "심장",
     respiratory: "호흡기",
     pediatric: "소아"
   };
   
   const topSpecialty = specialty[0];
   return specialtyMap[topSpecialty] || "응급";
 };