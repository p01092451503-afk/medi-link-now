// Severe disease acceptance / procedure availability
export interface HospitalAcceptance {
  heart: boolean;       // 심근경색 (Myocardial Infarction)
  brainBleed: boolean;  // 뇌출혈 (Cerebral Hemorrhage)
  brainStroke: boolean; // 뇌경색 (Cerebral Infarction)
  endoscopy: boolean;   // 응급내시경 (Emergency Endoscopy)
  dialysis: boolean;    // 응급투석 (Emergency Dialysis)
}

export interface Hospital {
  id: number;
  name: string;
  nameKr: string;
  category: string;
  lat: number;
  lng: number;
  phone: string;
  address: string;
  beds: {
    general: number;
    pediatric: number;
    fever: number;
  };
  equipment: string[];
  distance?: number;
  region: string;
  // New fields for extended API data
  isTraumaCenter?: boolean;     // 권역외상센터 여부
  acceptance?: HospitalAcceptance;
  alertMessage?: string;        // Real-time hospital message
}

export const hospitals: Hospital[] = [
  // ===== SEOUL - Gangnam/Songpa =====
  {
    id: 1,
    name: "Seoul Asan Medical Center",
    nameKr: "서울아산병원",
    category: "Regional Emergency Center",
    lat: 37.5266,
    lng: 127.1082,
    phone: "02-3010-3333",
    address: "88 Olympic-ro 43-gil, Songpa-gu, Seoul",
    beds: { general: 5, pediatric: 3, fever: 2 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "서울 송파구",
    isTraumaCenter: true,
    acceptance: { heart: true, brainBleed: true, brainStroke: true, endoscopy: true, dialysis: true },
    alertMessage: "신경외과 전문의 24시간 상주 중",
  },
  {
    id: 2,
    name: "Samsung Medical Center",
    nameKr: "삼성서울병원",
    category: "Regional Emergency Center",
    lat: 37.4881,
    lng: 127.0855,
    phone: "02-3410-2114",
    address: "81 Irwon-ro, Gangnam-gu, Seoul",
    beds: { general: 8, pediatric: 0, fever: 4 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "서울 강남구",
    isTraumaCenter: false,
    acceptance: { heart: true, brainBleed: false, brainStroke: true, endoscopy: true, dialysis: false },
    alertMessage: "CT 스캐너 점검 중, 14:00까지 뇌 스캔 불가",
  },
  {
    id: 3,
    name: "Gangnam Severance Hospital",
    nameKr: "강남세브란스병원",
    category: "Local Emergency Center",
    lat: 37.4968,
    lng: 127.0474,
    phone: "02-2019-3114",
    address: "211 Eonju-ro, Gangnam-gu, Seoul",
    beds: { general: 0, pediatric: 2, fever: 0 },
    equipment: ["CT", "MRI"],
    region: "서울 강남구",
    acceptance: { heart: false, brainBleed: false, brainStroke: true, endoscopy: false, dialysis: true },
  },
  {
    id: 4,
    name: "Konkuk University Medical Center",
    nameKr: "건국대학교병원",
    category: "Local Emergency Center",
    lat: 37.5406,
    lng: 127.0707,
    phone: "02-2030-5114",
    address: "120-1 Neungdong-ro, Gwangjin-gu, Seoul",
    beds: { general: 3, pediatric: 1, fever: 1 },
    equipment: ["CT", "Ventilator"],
    region: "서울 광진구",
  },
  {
    id: 5,
    name: "Jamsil Seoul Clinic",
    nameKr: "잠실서울의원",
    category: "Emergency Clinic",
    lat: 37.5133,
    lng: 127.1001,
    phone: "02-423-7575",
    address: "345 Songpa-daero, Songpa-gu, Seoul",
    beds: { general: 2, pediatric: 0, fever: 0 },
    equipment: ["CT"],
    region: "서울 송파구",
  },

  // ===== SEOUL - Mapo/Yongsan =====
  {
    id: 6,
    name: "Severance Hospital",
    nameKr: "세브란스병원",
    category: "Regional Emergency Center",
    lat: 37.5622,
    lng: 126.9410,
    phone: "02-2228-5800",
    address: "50-1 Yonsei-ro, Seodaemun-gu, Seoul",
    beds: { general: 12, pediatric: 5, fever: 4 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "서울 서대문구",
  },
  {
    id: 7,
    name: "Ewha Womans University Medical Center",
    nameKr: "이화여대목동병원",
    category: "Regional Emergency Center",
    lat: 37.5343,
    lng: 126.8867,
    phone: "02-2650-5555",
    address: "1071 Anyangcheon-ro, Yangcheon-gu, Seoul",
    beds: { general: 7, pediatric: 4, fever: 2 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "서울 양천구",
  },
  {
    id: 8,
    name: "Hongdae Emergency Clinic",
    nameKr: "홍대응급의원",
    category: "Emergency Clinic",
    lat: 37.5563,
    lng: 126.9237,
    phone: "02-333-1199",
    address: "123 Hongik-ro, Mapo-gu, Seoul",
    beds: { general: 1, pediatric: 0, fever: 1 },
    equipment: ["CT"],
    region: "서울 마포구",
  },
  {
    id: 9,
    name: "Yongsan Soonchunhyang Hospital",
    nameKr: "용산순천향병원",
    category: "Local Emergency Center",
    lat: 37.5388,
    lng: 126.9720,
    phone: "02-709-9119",
    address: "59 Hannam-daero, Yongsan-gu, Seoul",
    beds: { general: 4, pediatric: 2, fever: 1 },
    equipment: ["CT", "MRI"],
    region: "서울 용산구",
  },

  // ===== SEOUL - Jongno/Jung-gu =====
  {
    id: 10,
    name: "Seoul National University Hospital",
    nameKr: "서울대학교병원",
    category: "Regional Emergency Center",
    lat: 37.5796,
    lng: 126.9990,
    phone: "02-2072-2114",
    address: "101 Daehak-ro, Jongno-gu, Seoul",
    beds: { general: 15, pediatric: 6, fever: 5 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "서울 종로구",
    isTraumaCenter: true,
    acceptance: { heart: true, brainBleed: true, brainStroke: true, endoscopy: true, dialysis: true },
    alertMessage: "중증외상팀 대기 중",
  },
  {
    id: 11,
    name: "Boramae Medical Center",
    nameKr: "보라매병원",
    category: "Regional Emergency Center",
    lat: 37.4921,
    lng: 126.9261,
    phone: "02-870-2114",
    address: "20 Boramae-ro 5-gil, Dongjak-gu, Seoul",
    beds: { general: 6, pediatric: 3, fever: 3 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "서울 동작구",
  },

  // ===== SEOUL - Nowon/Gangbuk =====
  {
    id: 12,
    name: "Korea University Anam Hospital",
    nameKr: "고려대안암병원",
    category: "Regional Emergency Center",
    lat: 37.5867,
    lng: 127.0261,
    phone: "02-920-5114",
    address: "73 Goryeodae-ro, Seongbuk-gu, Seoul",
    beds: { general: 9, pediatric: 4, fever: 3 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "서울 성북구",
  },
  {
    id: 13,
    name: "Nowon Eulji University Hospital",
    nameKr: "노원을지대학교병원",
    category: "Local Emergency Center",
    lat: 37.6551,
    lng: 127.0561,
    phone: "02-970-8000",
    address: "68 Hangeulbiseok-ro, Nowon-gu, Seoul",
    beds: { general: 5, pediatric: 2, fever: 2 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "서울 노원구",
  },
  {
    id: 14,
    name: "Kangbuk Samsung Hospital",
    nameKr: "강북삼성병원",
    category: "Local Emergency Center",
    lat: 37.5681,
    lng: 126.9687,
    phone: "02-2001-2001",
    address: "29 Saemunan-ro, Jongno-gu, Seoul",
    beds: { general: 0, pediatric: 0, fever: 2 },
    equipment: ["CT", "MRI"],
    region: "서울 종로구",
  },
  {
    id: 15,
    name: "Seoul Medical Center",
    nameKr: "서울의료원",
    category: "Regional Emergency Center",
    lat: 37.5669,
    lng: 127.0661,
    phone: "02-2276-7000",
    address: "156 Sinnae-ro, Jungnang-gu, Seoul",
    beds: { general: 7, pediatric: 3, fever: 4 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "서울 중랑구",
  },

  // ===== INCHEON =====
  {
    id: 16,
    name: "Inha University Hospital",
    nameKr: "인하대학교병원",
    category: "Regional Emergency Center",
    lat: 37.4507,
    lng: 126.6536,
    phone: "032-890-2114",
    address: "27 Inhang-ro, Jung-gu, Incheon",
    beds: { general: 10, pediatric: 4, fever: 3 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "인천 중구",
  },
  {
    id: 17,
    name: "Gachon University Gil Hospital",
    nameKr: "가천대길병원",
    category: "Regional Emergency Center",
    lat: 37.4536,
    lng: 126.7027,
    phone: "032-460-3114",
    address: "21 Namdong-daero 774beon-gil, Namdong-gu, Incheon",
    beds: { general: 8, pediatric: 3, fever: 2 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "인천 남동구",
  },
  {
    id: 18,
    name: "Songdo Severance Hospital",
    nameKr: "송도세브란스병원",
    category: "Local Emergency Center",
    lat: 37.3837,
    lng: 126.6564,
    phone: "032-670-3000",
    address: "20 Convensia-daero, Yeonsu-gu, Incheon",
    beds: { general: 6, pediatric: 2, fever: 1 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "인천 연수구",
  },
  {
    id: 19,
    name: "Bupyeong Saram Hospital",
    nameKr: "부평사랑병원",
    category: "Emergency Clinic",
    lat: 37.5074,
    lng: 126.7219,
    phone: "032-509-5000",
    address: "233 Bupyeong-daero, Bupyeong-gu, Incheon",
    beds: { general: 3, pediatric: 1, fever: 0 },
    equipment: ["CT"],
    region: "인천 부평구",
  },
  {
    id: 20,
    name: "Incheon St. Mary's Hospital",
    nameKr: "인천성모병원",
    category: "Regional Emergency Center",
    lat: 37.4479,
    lng: 126.6987,
    phone: "032-280-5000",
    address: "56 Dongsu-ro, Bupyeong-gu, Incheon",
    beds: { general: 0, pediatric: 0, fever: 0 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "인천 부평구",
  },

  // ===== GYEONGGI-DO - Suwon =====
  {
    id: 21,
    name: "Ajou University Hospital",
    nameKr: "아주대학교병원",
    category: "Regional Emergency Center",
    lat: 37.2794,
    lng: 127.0455,
    phone: "031-219-5114",
    address: "164 Worldcup-ro, Yeongtong-gu, Suwon",
    beds: { general: 11, pediatric: 5, fever: 4 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "경기 수원시",
  },
  {
    id: 22,
    name: "Suwon St. Vincent Hospital",
    nameKr: "수원성빈센트병원",
    category: "Regional Emergency Center",
    lat: 37.2629,
    lng: 127.0346,
    phone: "031-249-8114",
    address: "93 Jungbu-daero, Paldal-gu, Suwon",
    beds: { general: 7, pediatric: 3, fever: 2 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "경기 수원시",
  },
  {
    id: 23,
    name: "Suwon Medical Center",
    nameKr: "수원시의료원",
    category: "Local Emergency Center",
    lat: 37.2897,
    lng: 126.9838,
    phone: "031-220-3000",
    address: "79 Suin-ro, Paldal-gu, Suwon",
    beds: { general: 4, pediatric: 1, fever: 3 },
    equipment: ["CT", "Ventilator"],
    region: "경기 수원시",
  },

  // ===== GYEONGGI-DO - Bundang (Seongnam) =====
  {
    id: 24,
    name: "Seoul National University Bundang Hospital",
    nameKr: "분당서울대학교병원",
    category: "Regional Emergency Center",
    lat: 37.3518,
    lng: 127.1233,
    phone: "031-787-7114",
    address: "82 Gumi-ro 173beon-gil, Bundang-gu, Seongnam",
    beds: { general: 12, pediatric: 4, fever: 3 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "경기 성남시",
  },
  {
    id: 25,
    name: "CHA Bundang Medical Center",
    nameKr: "차의과대학교부속분당차병원",
    category: "Local Emergency Center",
    lat: 37.3766,
    lng: 127.1151,
    phone: "031-780-5000",
    address: "59 Yatap-ro, Bundang-gu, Seongnam",
    beds: { general: 5, pediatric: 3, fever: 1 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "경기 성남시",
  },
  {
    id: 26,
    name: "Bundang Jesaeng Hospital",
    nameKr: "분당제생병원",
    category: "Local Emergency Center",
    lat: 37.3848,
    lng: 127.1243,
    phone: "031-779-0000",
    address: "20 Seohyeon-ro 180beon-gil, Bundang-gu, Seongnam",
    beds: { general: 3, pediatric: 1, fever: 1 },
    equipment: ["CT", "MRI"],
    region: "경기 성남시",
  },

  // ===== GYEONGGI-DO - Goyang (Ilsan) =====
  {
    id: 27,
    name: "National Health Insurance Service Ilsan Hospital",
    nameKr: "국민건강보험공단일산병원",
    category: "Regional Emergency Center",
    lat: 37.6756,
    lng: 126.7573,
    phone: "031-900-0114",
    address: "100 Ilsan-ro, Ilsandong-gu, Goyang",
    beds: { general: 9, pediatric: 3, fever: 3 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "경기 고양시",
  },
  {
    id: 28,
    name: "Myongji Hospital",
    nameKr: "명지병원",
    category: "Local Emergency Center",
    lat: 37.6391,
    lng: 126.8667,
    phone: "031-810-5114",
    address: "55 Hwasu-ro 14beon-gil, Deogyang-gu, Goyang",
    beds: { general: 6, pediatric: 2, fever: 2 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "경기 고양시",
  },
  {
    id: 29,
    name: "Ilsan Baek Hospital",
    nameKr: "일산백병원",
    category: "Local Emergency Center",
    lat: 37.6516,
    lng: 126.7710,
    phone: "031-910-7114",
    address: "170 Juhan-ro, Ilsanseo-gu, Goyang",
    beds: { general: 4, pediatric: 2, fever: 1 },
    equipment: ["CT", "MRI"],
    region: "경기 고양시",
  },

  // ===== BUSAN =====
  {
    id: 30,
    name: "Pusan National University Hospital",
    nameKr: "부산대학교병원",
    category: "Regional Emergency Center",
    lat: 35.1397,
    lng: 129.0382,
    phone: "051-240-7000",
    address: "179 Gudeok-ro, Seo-gu, Busan",
    beds: { general: 14, pediatric: 6, fever: 5 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "부산 서구",
    isTraumaCenter: true,
    acceptance: { heart: true, brainBleed: true, brainStroke: true, endoscopy: true, dialysis: true },
  },
  {
    id: 31,
    name: "Dong-A University Hospital",
    nameKr: "동아대학교병원",
    category: "Regional Emergency Center",
    lat: 35.1062,
    lng: 129.0149,
    phone: "051-240-5000",
    address: "26 Daesingongwon-ro, Seo-gu, Busan",
    beds: { general: 10, pediatric: 4, fever: 3 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "부산 서구",
  },
  {
    id: 32,
    name: "Haeundae Paik Hospital",
    nameKr: "해운대백병원",
    category: "Local Emergency Center",
    lat: 35.1652,
    lng: 129.1595,
    phone: "051-797-0100",
    address: "875 Haeun-daero, Haeundae-gu, Busan",
    beds: { general: 7, pediatric: 3, fever: 2 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "부산 해운대구",
  },
  {
    id: 33,
    name: "Busan St. Mary's Hospital",
    nameKr: "부산성모병원",
    category: "Local Emergency Center",
    lat: 35.1516,
    lng: 129.0562,
    phone: "051-933-7000",
    address: "25-14 Yongho-ro, Nam-gu, Busan",
    beds: { general: 5, pediatric: 2, fever: 1 },
    equipment: ["CT", "MRI"],
    region: "부산 남구",
  },
  {
    id: 34,
    name: "Kosin University Gospel Hospital",
    nameKr: "고신대학교복음병원",
    category: "Regional Emergency Center",
    lat: 35.0967,
    lng: 129.0173,
    phone: "051-990-6114",
    address: "262 Gamcheon-ro, Seo-gu, Busan",
    beds: { general: 0, pediatric: 0, fever: 0 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "부산 서구",
  },
  {
    id: 35,
    name: "Busan Medical Center",
    nameKr: "부산의료원",
    category: "Local Emergency Center",
    lat: 35.1847,
    lng: 129.0851,
    phone: "051-507-3000",
    address: "359 Worldcup-daero, Yeonje-gu, Busan",
    beds: { general: 6, pediatric: 2, fever: 4 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "부산 연제구",
  },

  // ===== DAEGU =====
  {
    id: 36,
    name: "Kyungpook National University Hospital",
    nameKr: "경북대학교병원",
    category: "Regional Emergency Center",
    lat: 35.8669,
    lng: 128.6086,
    phone: "053-200-5114",
    address: "130 Dongdeok-ro, Jung-gu, Daegu",
    beds: { general: 13, pediatric: 5, fever: 4 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "대구 중구",
  },
  {
    id: 37,
    name: "Yeungnam University Hospital",
    nameKr: "영남대학교병원",
    category: "Regional Emergency Center",
    lat: 35.8528,
    lng: 128.6254,
    phone: "053-620-3114",
    address: "170 Hyeonchung-ro, Nam-gu, Daegu",
    beds: { general: 11, pediatric: 4, fever: 3 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "대구 남구",
  },
  {
    id: 38,
    name: "Keimyung University Dongsan Hospital",
    nameKr: "계명대학교동산병원",
    category: "Regional Emergency Center",
    lat: 35.8565,
    lng: 128.4876,
    phone: "053-250-7114",
    address: "1095 Dalgubeol-daero, Dalseo-gu, Daegu",
    beds: { general: 8, pediatric: 3, fever: 2 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "대구 달서구",
  },
  {
    id: 39,
    name: "Daegu Catholic University Medical Center",
    nameKr: "대구가톨릭대학교병원",
    category: "Local Emergency Center",
    lat: 35.8516,
    lng: 128.6425,
    phone: "053-650-4000",
    address: "33 Duryugongwon-ro 17-gil, Nam-gu, Daegu",
    beds: { general: 6, pediatric: 2, fever: 2 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "대구 남구",
  },
  {
    id: 40,
    name: "Daegu Medical Center",
    nameKr: "대구의료원",
    category: "Local Emergency Center",
    lat: 35.9014,
    lng: 128.5556,
    phone: "053-560-7575",
    address: "157 Hoguk-ro, Buk-gu, Daegu",
    beds: { general: 0, pediatric: 0, fever: 5 },
    equipment: ["CT", "MRI"],
    region: "대구 북구",
  },

  // ===== DAEJEON =====
  {
    id: 41,
    name: "Chungnam National University Hospital",
    nameKr: "충남대학교병원",
    category: "Regional Emergency Center",
    lat: 36.3233,
    lng: 127.4207,
    phone: "042-280-7114",
    address: "282 Munhwa-ro, Jung-gu, Daejeon",
    beds: { general: 12, pediatric: 5, fever: 4 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "대전 중구",
  },
  {
    id: 42,
    name: "Eulji University Hospital",
    nameKr: "을지대학교병원",
    category: "Regional Emergency Center",
    lat: 36.3563,
    lng: 127.3808,
    phone: "042-611-3000",
    address: "95 Dunsanseo-ro, Seo-gu, Daejeon",
    beds: { general: 9, pediatric: 3, fever: 2 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "대전 서구",
  },
  {
    id: 43,
    name: "Daejeon St. Mary's Hospital",
    nameKr: "대전성모병원",
    category: "Local Emergency Center",
    lat: 36.3177,
    lng: 127.4389,
    phone: "042-220-9114",
    address: "64 Daeheung-ro, Jung-gu, Daejeon",
    beds: { general: 5, pediatric: 2, fever: 1 },
    equipment: ["CT", "MRI"],
    region: "대전 중구",
  },
  {
    id: 44,
    name: "Konyang University Hospital",
    nameKr: "건양대학교병원",
    category: "Local Emergency Center",
    lat: 36.3081,
    lng: 127.3392,
    phone: "042-600-9114",
    address: "158 Gwanjeodong-ro, Seo-gu, Daejeon",
    beds: { general: 4, pediatric: 1, fever: 2 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "대전 서구",
  },

  // ===== GWANGJU =====
  {
    id: 45,
    name: "Chonnam National University Hospital",
    nameKr: "전남대학교병원",
    category: "Regional Emergency Center",
    lat: 35.1408,
    lng: 126.9231,
    phone: "062-220-5114",
    address: "42 Jebong-ro, Dong-gu, Gwangju",
    beds: { general: 14, pediatric: 6, fever: 5 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "광주 동구",
  },
  {
    id: 46,
    name: "Chosun University Hospital",
    nameKr: "조선대학교병원",
    category: "Regional Emergency Center",
    lat: 35.1417,
    lng: 126.9333,
    phone: "062-220-3114",
    address: "365 Pilmun-daero, Dong-gu, Gwangju",
    beds: { general: 10, pediatric: 4, fever: 3 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "광주 동구",
  },
  {
    id: 47,
    name: "Gwangju Christian Hospital",
    nameKr: "광주기독병원",
    category: "Local Emergency Center",
    lat: 35.1518,
    lng: 126.8897,
    phone: "062-650-5000",
    address: "37 Yangnim-ro, Nam-gu, Gwangju",
    beds: { general: 5, pediatric: 2, fever: 1 },
    equipment: ["CT", "MRI"],
    region: "광주 남구",
  },
  {
    id: 48,
    name: "Gwangju Medical Center",
    nameKr: "광주의료원",
    category: "Local Emergency Center",
    lat: 35.1712,
    lng: 126.9127,
    phone: "062-670-7000",
    address: "77 Pyeonghwa-gil, Buk-gu, Gwangju",
    beds: { general: 0, pediatric: 0, fever: 4 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "광주 북구",
  },

  // ===== ULSAN =====
  {
    id: 49,
    name: "Ulsan University Hospital",
    nameKr: "울산대학교병원",
    category: "Regional Emergency Center",
    lat: 35.5380,
    lng: 129.3115,
    phone: "052-250-7000",
    address: "877 Bangeojinsunhwan-doro, Dong-gu, Ulsan",
    beds: { general: 11, pediatric: 4, fever: 3 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "울산 동구",
  },
  {
    id: 50,
    name: "Ulsan Donggang Hospital",
    nameKr: "울산동강병원",
    category: "Local Emergency Center",
    lat: 35.5540,
    lng: 129.3230,
    phone: "052-241-1114",
    address: "239 Taehwa-ro, Jung-gu, Ulsan",
    beds: { general: 6, pediatric: 2, fever: 2 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "울산 중구",
  },

  // ===== Additional Seoul Hospitals =====
  {
    id: 51,
    name: "Gangdong Kyunghee University Hospital",
    nameKr: "강동경희대학교병원",
    category: "Local Emergency Center",
    lat: 37.5394,
    lng: 127.1457,
    phone: "02-440-6114",
    address: "892 Dongnam-ro, Gangdong-gu, Seoul",
    beds: { general: 6, pediatric: 2, fever: 1 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "서울 강동구",
  },
  {
    id: 52,
    name: "VHS Medical Center",
    nameKr: "중앙보훈병원",
    category: "Local Emergency Center",
    lat: 37.4995,
    lng: 127.1103,
    phone: "02-2225-1114",
    address: "53 Jinhwangdo-ro 61-gil, Gangdong-gu, Seoul",
    beds: { general: 0, pediatric: 0, fever: 2 },
    equipment: ["CT", "MRI"],
    region: "서울 강동구",
  },
  {
    id: 53,
    name: "Hanyang University Medical Center",
    nameKr: "한양대학교병원",
    category: "Regional Emergency Center",
    lat: 37.5577,
    lng: 127.0443,
    phone: "02-2290-8114",
    address: "222-1 Wangsimni-ro, Seongdong-gu, Seoul",
    beds: { general: 8, pediatric: 4, fever: 3 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "서울 성동구",
  },
  {
    id: 54,
    name: "Kyung Hee University Hospital",
    nameKr: "경희대학교병원",
    category: "Regional Emergency Center",
    lat: 37.5939,
    lng: 127.0531,
    phone: "02-958-8114",
    address: "23 Kyungheedae-ro, Dongdaemun-gu, Seoul",
    beds: { general: 7, pediatric: 3, fever: 2 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "서울 동대문구",
  },
  {
    id: 55,
    name: "Gangnam St. Mary's Hospital",
    nameKr: "강남성모병원",
    category: "Regional Emergency Center",
    lat: 37.5015,
    lng: 127.0656,
    phone: "02-590-1114",
    address: "222 Banpo-daero, Seocho-gu, Seoul",
    beds: { general: 9, pediatric: 5, fever: 3 },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
    region: "서울 서초구",
  },
  {
    id: 56,
    name: "Seoul Paik Hospital",
    nameKr: "서울백병원",
    category: "Local Emergency Center",
    lat: 37.5660,
    lng: 127.0063,
    phone: "02-2270-0114",
    address: "99 Mareunnae-ro, Jung-gu, Seoul",
    beds: { general: 4, pediatric: 1, fever: 1 },
    equipment: ["CT", "MRI"],
    region: "서울 중구",
  },

  // ===== Additional Gyeonggi Hospitals =====
  {
    id: 57,
    name: "Uijeongbu Eulji Medical Center",
    nameKr: "의정부을지대학교병원",
    category: "Regional Emergency Center",
    lat: 37.7415,
    lng: 127.0474,
    phone: "031-951-3000",
    address: "712 Dongil-ro, Uijeongbu-si, Gyeonggi-do",
    beds: { general: 8, pediatric: 3, fever: 2 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "경기 의정부시",
  },
  {
    id: 58,
    name: "Anyang Sam Hospital",
    nameKr: "안양샘병원",
    category: "Local Emergency Center",
    lat: 37.3923,
    lng: 126.9267,
    phone: "031-467-9114",
    address: "9 Samdeok-ro, Manan-gu, Anyang-si",
    beds: { general: 5, pediatric: 2, fever: 1 },
    equipment: ["CT", "MRI"],
    region: "경기 안양시",
  },
  {
    id: 59,
    name: "Pyeongtaek St. Mary's Hospital",
    nameKr: "평택성모병원",
    category: "Local Emergency Center",
    lat: 36.9914,
    lng: 127.0857,
    phone: "031-659-0114",
    address: "45 Pyeongtaek 5-ro, Pyeongtaek-si, Gyeonggi-do",
    beds: { general: 4, pediatric: 1, fever: 2 },
    equipment: ["CT", "MRI"],
    region: "경기 평택시",
  },
  {
    id: 60,
    name: "Yongin Severance Hospital",
    nameKr: "용인세브란스병원",
    category: "Local Emergency Center",
    lat: 37.2853,
    lng: 127.0811,
    phone: "031-5189-8000",
    address: "363 Dongbaekjukjeon-daero, Giheung-gu, Yongin-si",
    beds: { general: 6, pediatric: 3, fever: 2 },
    equipment: ["CT", "MRI", "Ventilator"],
    region: "경기 용인시",
  },
];

// Bed/Equipment filters
export type BedFilterType = "all" | "adult" | "pediatric" | "fever" | "ct";

// Procedure availability filters (시술 가능 여부)
export type ProcedureFilterType = "heart" | "brainBleed" | "brainStroke" | "endoscopy" | "dialysis" | "trauma";

// Combined filter type
export type FilterType = BedFilterType | ProcedureFilterType;

export const filterOptions: { id: FilterType; label: string; labelKr: string; category: "bed" | "procedure" }[] = [
  // Bed availability filters
  { id: "all", label: "All", labelKr: "전체", category: "bed" },
  { id: "adult", label: "Adult ER", labelKr: "성인 응급", category: "bed" },
  { id: "pediatric", label: "Pediatric ER", labelKr: "소아 응급", category: "bed" },
  { id: "fever", label: "Fever/Infection", labelKr: "열/감염", category: "bed" },
  { id: "ct", label: "CT Available", labelKr: "CT 가능", category: "bed" },
  // Procedure availability filters
  { id: "heart", label: "Heart Attack", labelKr: "심근경색", category: "procedure" },
  { id: "brainBleed", label: "Brain Hemorrhage", labelKr: "뇌출혈", category: "procedure" },
  { id: "brainStroke", label: "Brain Infarction", labelKr: "뇌경색", category: "procedure" },
  { id: "endoscopy", label: "Endoscopy", labelKr: "응급내시경", category: "procedure" },
  { id: "dialysis", label: "Dialysis", labelKr: "응급투석", category: "procedure" },
  { id: "trauma", label: "Trauma Center", labelKr: "외상센터", category: "procedure" },
];

export const getHospitalStatus = (hospital: Hospital): "available" | "limited" | "unavailable" => {
  const totalBeds = hospital.beds.general + hospital.beds.pediatric + hospital.beds.fever;
  if (totalBeds === 0) return "unavailable";
  if (totalBeds <= 2) return "limited";
  return "available";
};

export const filterHospitals = (hospitals: Hospital[], filter: FilterType): Hospital[] => {
  switch (filter) {
    // Bed availability filters
    case "adult":
      return hospitals.filter((h) => h.beds.general > 0);
    case "pediatric":
      return hospitals.filter((h) => h.beds.pediatric > 0);
    case "fever":
      return hospitals.filter((h) => h.beds.fever > 0);
    case "ct":
      return hospitals.filter((h) => h.equipment.includes("CT"));
    // Procedure availability filters (시술 가능 여부)
    case "heart":
      return hospitals.filter((h) => h.acceptance?.heart === true);
    case "brainBleed":
      return hospitals.filter((h) => h.acceptance?.brainBleed === true);
    case "brainStroke":
      return hospitals.filter((h) => h.acceptance?.brainStroke === true);
    case "endoscopy":
      return hospitals.filter((h) => h.acceptance?.endoscopy === true);
    case "dialysis":
      return hospitals.filter((h) => h.acceptance?.dialysis === true);
    case "trauma":
      return hospitals.filter((h) => h.isTraumaCenter === true);
    default:
      return hospitals;
  }
};

// Major region types (광역시/도)
export type MajorRegionType = "all" | "seoul" | "incheon" | "gyeonggi" | "busan" | "daegu" | "daejeon" | "gwangju" | "ulsan" | "sejong" | "gangwon" | "chungbuk" | "chungnam" | "jeonbuk" | "jeonnam" | "gyeongbuk" | "gyeongnam" | "jeju";

// Sub-region types (시/군/구)
export type SubRegionType = string;

// Combined region type
export type RegionType = MajorRegionType | SubRegionType;

// Region option with optional sub-regions
export interface RegionOption {
  id: RegionType;
  label: string;
  labelKr: string;
  center: [number, number];
  zoom?: number;
  parent?: MajorRegionType;
}

export const regionOptions: RegionOption[] = [
  // 전체
  { id: "all", label: "All Regions", labelKr: "전체", center: [36.5, 127.5], zoom: 7 },
  
  // 서울특별시 및 구
  { id: "seoul", label: "Seoul", labelKr: "서울특별시", center: [37.5665, 126.9780], zoom: 12 },
  { id: "seoul-gangnam", label: "Gangnam-gu", labelKr: "강남구", center: [37.5172, 127.0473], zoom: 14, parent: "seoul" },
  { id: "seoul-gangdong", label: "Gangdong-gu", labelKr: "강동구", center: [37.5301, 127.1238], zoom: 14, parent: "seoul" },
  { id: "seoul-gangbuk", label: "Gangbuk-gu", labelKr: "강북구", center: [37.6396, 127.0257], zoom: 14, parent: "seoul" },
  { id: "seoul-gangseo", label: "Gangseo-gu", labelKr: "강서구", center: [37.5509, 126.8495], zoom: 14, parent: "seoul" },
  { id: "seoul-gwanak", label: "Gwanak-gu", labelKr: "관악구", center: [37.4784, 126.9516], zoom: 14, parent: "seoul" },
  { id: "seoul-gwangjin", label: "Gwangjin-gu", labelKr: "광진구", center: [37.5385, 127.0823], zoom: 14, parent: "seoul" },
  { id: "seoul-guro", label: "Guro-gu", labelKr: "구로구", center: [37.4954, 126.8874], zoom: 14, parent: "seoul" },
  { id: "seoul-geumcheon", label: "Geumcheon-gu", labelKr: "금천구", center: [37.4519, 126.9020], zoom: 14, parent: "seoul" },
  { id: "seoul-nowon", label: "Nowon-gu", labelKr: "노원구", center: [37.6542, 127.0568], zoom: 14, parent: "seoul" },
  { id: "seoul-dobong", label: "Dobong-gu", labelKr: "도봉구", center: [37.6688, 127.0471], zoom: 14, parent: "seoul" },
  { id: "seoul-dongdaemun", label: "Dongdaemun-gu", labelKr: "동대문구", center: [37.5744, 127.0400], zoom: 14, parent: "seoul" },
  { id: "seoul-dongjak", label: "Dongjak-gu", labelKr: "동작구", center: [37.5124, 126.9393], zoom: 14, parent: "seoul" },
  { id: "seoul-mapo", label: "Mapo-gu", labelKr: "마포구", center: [37.5663, 126.9014], zoom: 14, parent: "seoul" },
  { id: "seoul-seodaemun", label: "Seodaemun-gu", labelKr: "서대문구", center: [37.5791, 126.9368], zoom: 14, parent: "seoul" },
  { id: "seoul-seocho", label: "Seocho-gu", labelKr: "서초구", center: [37.4837, 127.0324], zoom: 14, parent: "seoul" },
  { id: "seoul-seongdong", label: "Seongdong-gu", labelKr: "성동구", center: [37.5633, 127.0371], zoom: 14, parent: "seoul" },
  { id: "seoul-seongbuk", label: "Seongbuk-gu", labelKr: "성북구", center: [37.5894, 127.0167], zoom: 14, parent: "seoul" },
  { id: "seoul-songpa", label: "Songpa-gu", labelKr: "송파구", center: [37.5145, 127.1066], zoom: 14, parent: "seoul" },
  { id: "seoul-yangcheon", label: "Yangcheon-gu", labelKr: "양천구", center: [37.5270, 126.8665], zoom: 14, parent: "seoul" },
  { id: "seoul-yeongdeungpo", label: "Yeongdeungpo-gu", labelKr: "영등포구", center: [37.5264, 126.8963], zoom: 14, parent: "seoul" },
  { id: "seoul-yongsan", label: "Yongsan-gu", labelKr: "용산구", center: [37.5326, 126.9909], zoom: 14, parent: "seoul" },
  { id: "seoul-eunpyeong", label: "Eunpyeong-gu", labelKr: "은평구", center: [37.6027, 126.9291], zoom: 14, parent: "seoul" },
  { id: "seoul-jongno", label: "Jongno-gu", labelKr: "종로구", center: [37.5735, 126.9790], zoom: 14, parent: "seoul" },
  { id: "seoul-jung", label: "Jung-gu", labelKr: "중구", center: [37.5641, 126.9979], zoom: 14, parent: "seoul" },
  { id: "seoul-jungnang", label: "Jungnang-gu", labelKr: "중랑구", center: [37.6066, 127.0927], zoom: 14, parent: "seoul" },
  
  // 인천광역시 및 구/군
  { id: "incheon", label: "Incheon", labelKr: "인천광역시", center: [37.4563, 126.7052], zoom: 11 },
  { id: "incheon-jung", label: "Jung-gu", labelKr: "중구", center: [37.4737, 126.6216], zoom: 13, parent: "incheon" },
  { id: "incheon-dong", label: "Dong-gu", labelKr: "동구", center: [37.4737, 126.6433], zoom: 14, parent: "incheon" },
  { id: "incheon-michuhol", label: "Michuhol-gu", labelKr: "미추홀구", center: [37.4635, 126.6502], zoom: 14, parent: "incheon" },
  { id: "incheon-yeonsu", label: "Yeonsu-gu", labelKr: "연수구", center: [37.4100, 126.6783], zoom: 13, parent: "incheon" },
  { id: "incheon-namdong", label: "Namdong-gu", labelKr: "남동구", center: [37.4469, 126.7312], zoom: 13, parent: "incheon" },
  { id: "incheon-bupyeong", label: "Bupyeong-gu", labelKr: "부평구", center: [37.5074, 126.7219], zoom: 13, parent: "incheon" },
  { id: "incheon-gyeyang", label: "Gyeyang-gu", labelKr: "계양구", center: [37.5371, 126.7376], zoom: 13, parent: "incheon" },
  { id: "incheon-seo", label: "Seo-gu", labelKr: "서구", center: [37.5454, 126.6760], zoom: 12, parent: "incheon" },
  { id: "incheon-ganghwa", label: "Ganghwa-gun", labelKr: "강화군", center: [37.7469, 126.4878], zoom: 11, parent: "incheon" },
  { id: "incheon-ongjin", label: "Ongjin-gun", labelKr: "옹진군", center: [37.4469, 126.6367], zoom: 10, parent: "incheon" },
  
  // 경기도 및 시/군
  { id: "gyeonggi", label: "Gyeonggi", labelKr: "경기도", center: [37.4138, 127.5183], zoom: 9 },
  { id: "gyeonggi-suwon", label: "Suwon", labelKr: "수원시", center: [37.2636, 127.0286], zoom: 12, parent: "gyeonggi" },
  { id: "gyeonggi-seongnam", label: "Seongnam", labelKr: "성남시", center: [37.4200, 127.1265], zoom: 12, parent: "gyeonggi" },
  { id: "gyeonggi-goyang", label: "Goyang", labelKr: "고양시", center: [37.6584, 126.8320], zoom: 12, parent: "gyeonggi" },
  { id: "gyeonggi-yongin", label: "Yongin", labelKr: "용인시", center: [37.2411, 127.1776], zoom: 11, parent: "gyeonggi" },
  { id: "gyeonggi-bucheon", label: "Bucheon", labelKr: "부천시", center: [37.5034, 126.7660], zoom: 13, parent: "gyeonggi" },
  { id: "gyeonggi-ansan", label: "Ansan", labelKr: "안산시", center: [37.3219, 126.8309], zoom: 12, parent: "gyeonggi" },
  { id: "gyeonggi-anyang", label: "Anyang", labelKr: "안양시", center: [37.3943, 126.9568], zoom: 13, parent: "gyeonggi" },
  { id: "gyeonggi-namyangju", label: "Namyangju", labelKr: "남양주시", center: [37.6360, 127.2165], zoom: 11, parent: "gyeonggi" },
  { id: "gyeonggi-hwaseong", label: "Hwaseong", labelKr: "화성시", center: [37.1997, 126.8312], zoom: 10, parent: "gyeonggi" },
  { id: "gyeonggi-pyeongtaek", label: "Pyeongtaek", labelKr: "평택시", center: [36.9921, 127.0857], zoom: 11, parent: "gyeonggi" },
  { id: "gyeonggi-uijeongbu", label: "Uijeongbu", labelKr: "의정부시", center: [37.7381, 127.0337], zoom: 13, parent: "gyeonggi" },
  { id: "gyeonggi-siheung", label: "Siheung", labelKr: "시흥시", center: [37.3800, 126.8030], zoom: 12, parent: "gyeonggi" },
  { id: "gyeonggi-paju", label: "Paju", labelKr: "파주시", center: [37.7600, 126.7800], zoom: 11, parent: "gyeonggi" },
  { id: "gyeonggi-gimpo", label: "Gimpo", labelKr: "김포시", center: [37.6153, 126.7156], zoom: 12, parent: "gyeonggi" },
  { id: "gyeonggi-gwangmyeong", label: "Gwangmyeong", labelKr: "광명시", center: [37.4786, 126.8640], zoom: 13, parent: "gyeonggi" },
  { id: "gyeonggi-gwangju", label: "Gwangju", labelKr: "광주시", center: [37.4095, 127.2550], zoom: 12, parent: "gyeonggi" },
  { id: "gyeonggi-gunpo", label: "Gunpo", labelKr: "군포시", center: [37.3617, 126.9352], zoom: 13, parent: "gyeonggi" },
  { id: "gyeonggi-hanam", label: "Hanam", labelKr: "하남시", center: [37.5392, 127.2148], zoom: 13, parent: "gyeonggi" },
  { id: "gyeonggi-osan", label: "Osan", labelKr: "오산시", center: [37.1499, 127.0695], zoom: 13, parent: "gyeonggi" },
  { id: "gyeonggi-icheon", label: "Icheon", labelKr: "이천시", center: [37.2720, 127.4350], zoom: 11, parent: "gyeonggi" },
  { id: "gyeonggi-anseong", label: "Anseong", labelKr: "안성시", center: [37.0080, 127.2797], zoom: 11, parent: "gyeonggi" },
  { id: "gyeonggi-uiwang", label: "Uiwang", labelKr: "의왕시", center: [37.3449, 126.9685], zoom: 13, parent: "gyeonggi" },
  { id: "gyeonggi-yangju", label: "Yangju", labelKr: "양주시", center: [37.7850, 127.0456], zoom: 11, parent: "gyeonggi" },
  { id: "gyeonggi-pocheon", label: "Pocheon", labelKr: "포천시", center: [37.8949, 127.2003], zoom: 10, parent: "gyeonggi" },
  { id: "gyeonggi-yeoju", label: "Yeoju", labelKr: "여주시", center: [37.2984, 127.6366], zoom: 11, parent: "gyeonggi" },
  { id: "gyeonggi-dongducheon", label: "Dongducheon", labelKr: "동두천시", center: [37.9034, 127.0606], zoom: 13, parent: "gyeonggi" },
  { id: "gyeonggi-guri", label: "Guri", labelKr: "구리시", center: [37.5943, 127.1295], zoom: 13, parent: "gyeonggi" },
  { id: "gyeonggi-gwacheon", label: "Gwacheon", labelKr: "과천시", center: [37.4292, 126.9876], zoom: 14, parent: "gyeonggi" },
  { id: "gyeonggi-gapyeong", label: "Gapyeong-gun", labelKr: "가평군", center: [37.8316, 127.5095], zoom: 10, parent: "gyeonggi" },
  { id: "gyeonggi-yangpyeong", label: "Yangpyeong-gun", labelKr: "양평군", center: [37.4917, 127.4872], zoom: 10, parent: "gyeonggi" },
  { id: "gyeonggi-yeoncheon", label: "Yeoncheon-gun", labelKr: "연천군", center: [38.0966, 127.0747], zoom: 10, parent: "gyeonggi" },
  
  // 부산광역시 및 구/군
  { id: "busan", label: "Busan", labelKr: "부산광역시", center: [35.1796, 129.0756], zoom: 11 },
  { id: "busan-jung", label: "Jung-gu", labelKr: "중구", center: [35.1060, 129.0324], zoom: 14, parent: "busan" },
  { id: "busan-seo", label: "Seo-gu", labelKr: "서구", center: [35.0977, 129.0243], zoom: 14, parent: "busan" },
  { id: "busan-dong", label: "Dong-gu", labelKr: "동구", center: [35.1294, 129.0455], zoom: 14, parent: "busan" },
  { id: "busan-yeongdo", label: "Yeongdo-gu", labelKr: "영도구", center: [35.0912, 129.0678], zoom: 13, parent: "busan" },
  { id: "busan-busanjin", label: "Busanjin-gu", labelKr: "부산진구", center: [35.1631, 129.0535], zoom: 13, parent: "busan" },
  { id: "busan-dongnae", label: "Dongnae-gu", labelKr: "동래구", center: [35.1960, 129.0653], zoom: 13, parent: "busan" },
  { id: "busan-nam", label: "Nam-gu", labelKr: "남구", center: [35.1365, 129.0849], zoom: 13, parent: "busan" },
  { id: "busan-buk", label: "Buk-gu", labelKr: "북구", center: [35.1972, 128.9903], zoom: 12, parent: "busan" },
  { id: "busan-haeundae", label: "Haeundae-gu", labelKr: "해운대구", center: [35.1630, 129.1635], zoom: 12, parent: "busan" },
  { id: "busan-saha", label: "Saha-gu", labelKr: "사하구", center: [35.1046, 128.9746], zoom: 13, parent: "busan" },
  { id: "busan-geumjeong", label: "Geumjeong-gu", labelKr: "금정구", center: [35.2427, 129.0925], zoom: 12, parent: "busan" },
  { id: "busan-gangseo", label: "Gangseo-gu", labelKr: "강서구", center: [35.2123, 128.9808], zoom: 11, parent: "busan" },
  { id: "busan-yeonje", label: "Yeonje-gu", labelKr: "연제구", center: [35.1764, 129.0800], zoom: 14, parent: "busan" },
  { id: "busan-suyeong", label: "Suyeong-gu", labelKr: "수영구", center: [35.1458, 129.1133], zoom: 14, parent: "busan" },
  { id: "busan-sasang", label: "Sasang-gu", labelKr: "사상구", center: [35.1527, 128.9912], zoom: 13, parent: "busan" },
  { id: "busan-gijang", label: "Gijang-gun", labelKr: "기장군", center: [35.2444, 129.2222], zoom: 11, parent: "busan" },
  
  // 대구광역시 및 구/군
  { id: "daegu", label: "Daegu", labelKr: "대구광역시", center: [35.8714, 128.6014], zoom: 11 },
  { id: "daegu-jung", label: "Jung-gu", labelKr: "중구", center: [35.8690, 128.6059], zoom: 14, parent: "daegu" },
  { id: "daegu-dong", label: "Dong-gu", labelKr: "동구", center: [35.8865, 128.6355], zoom: 13, parent: "daegu" },
  { id: "daegu-seo", label: "Seo-gu", labelKr: "서구", center: [35.8718, 128.5592], zoom: 14, parent: "daegu" },
  { id: "daegu-nam", label: "Nam-gu", labelKr: "남구", center: [35.8460, 128.5975], zoom: 14, parent: "daegu" },
  { id: "daegu-buk", label: "Buk-gu", labelKr: "북구", center: [35.8857, 128.5828], zoom: 13, parent: "daegu" },
  { id: "daegu-suseong", label: "Suseong-gu", labelKr: "수성구", center: [35.8584, 128.6308], zoom: 13, parent: "daegu" },
  { id: "daegu-dalseo", label: "Dalseo-gu", labelKr: "달서구", center: [35.8299, 128.5327], zoom: 12, parent: "daegu" },
  { id: "daegu-dalseong", label: "Dalseong-gun", labelKr: "달성군", center: [35.7748, 128.4313], zoom: 10, parent: "daegu" },
  { id: "daegu-gunwi", label: "Gunwi-gun", labelKr: "군위군", center: [36.2428, 128.5728], zoom: 10, parent: "daegu" },
  
  // 대전광역시 및 구
  { id: "daejeon", label: "Daejeon", labelKr: "대전광역시", center: [36.3504, 127.3845], zoom: 11 },
  { id: "daejeon-dong", label: "Dong-gu", labelKr: "동구", center: [36.3121, 127.4549], zoom: 12, parent: "daejeon" },
  { id: "daejeon-jung", label: "Jung-gu", labelKr: "중구", center: [36.3257, 127.4214], zoom: 13, parent: "daejeon" },
  { id: "daejeon-seo", label: "Seo-gu", labelKr: "서구", center: [36.3554, 127.3836], zoom: 12, parent: "daejeon" },
  { id: "daejeon-yuseong", label: "Yuseong-gu", labelKr: "유성구", center: [36.3623, 127.3562], zoom: 12, parent: "daejeon" },
  { id: "daejeon-daedeok", label: "Daedeok-gu", labelKr: "대덕구", center: [36.3467, 127.4156], zoom: 12, parent: "daejeon" },
  
  // 광주광역시 및 구
  { id: "gwangju", label: "Gwangju", labelKr: "광주광역시", center: [35.1595, 126.8526], zoom: 11 },
  { id: "gwangju-dong", label: "Dong-gu", labelKr: "동구", center: [35.1462, 126.9234], zoom: 13, parent: "gwangju" },
  { id: "gwangju-seo", label: "Seo-gu", labelKr: "서구", center: [35.1522, 126.8895], zoom: 13, parent: "gwangju" },
  { id: "gwangju-nam", label: "Nam-gu", labelKr: "남구", center: [35.1328, 126.9025], zoom: 13, parent: "gwangju" },
  { id: "gwangju-buk", label: "Buk-gu", labelKr: "북구", center: [35.1744, 126.9120], zoom: 12, parent: "gwangju" },
  { id: "gwangju-gwangsan", label: "Gwangsan-gu", labelKr: "광산구", center: [35.1394, 126.7936], zoom: 12, parent: "gwangju" },
  
  // 울산광역시 및 구/군
  { id: "ulsan", label: "Ulsan", labelKr: "울산광역시", center: [35.5384, 129.3114], zoom: 11 },
  { id: "ulsan-jung", label: "Jung-gu", labelKr: "중구", center: [35.5690, 129.3328], zoom: 13, parent: "ulsan" },
  { id: "ulsan-nam", label: "Nam-gu", labelKr: "남구", center: [35.5446, 129.3302], zoom: 13, parent: "ulsan" },
  { id: "ulsan-dong", label: "Dong-gu", labelKr: "동구", center: [35.5050, 129.4163], zoom: 13, parent: "ulsan" },
  { id: "ulsan-buk", label: "Buk-gu", labelKr: "북구", center: [35.5828, 129.3612], zoom: 12, parent: "ulsan" },
  { id: "ulsan-ulju", label: "Ulju-gun", labelKr: "울주군", center: [35.5220, 129.0995], zoom: 10, parent: "ulsan" },
  
  // 세종특별자치시
  { id: "sejong", label: "Sejong", labelKr: "세종특별자치시", center: [36.4800, 127.2890], zoom: 11 },
  
  // 강원특별자치도 주요 시
  { id: "gangwon", label: "Gangwon", labelKr: "강원특별자치도", center: [37.8228, 128.1555], zoom: 8 },
  { id: "gangwon-chuncheon", label: "Chuncheon", labelKr: "춘천시", center: [37.8813, 127.7298], zoom: 11, parent: "gangwon" },
  { id: "gangwon-wonju", label: "Wonju", labelKr: "원주시", center: [37.3422, 127.9202], zoom: 11, parent: "gangwon" },
  { id: "gangwon-gangneung", label: "Gangneung", labelKr: "강릉시", center: [37.7519, 128.8760], zoom: 10, parent: "gangwon" },
  { id: "gangwon-donghae", label: "Donghae", labelKr: "동해시", center: [37.5247, 129.1143], zoom: 12, parent: "gangwon" },
  { id: "gangwon-sokcho", label: "Sokcho", labelKr: "속초시", center: [38.2070, 128.5918], zoom: 12, parent: "gangwon" },
  { id: "gangwon-samcheok", label: "Samcheok", labelKr: "삼척시", center: [37.4500, 129.1651], zoom: 10, parent: "gangwon" },
  { id: "gangwon-taebaek", label: "Taebaek", labelKr: "태백시", center: [37.1640, 128.9856], zoom: 11, parent: "gangwon" },
  
  // 충청북도 주요 시
  { id: "chungbuk", label: "Chungbuk", labelKr: "충청북도", center: [36.6357, 127.4914], zoom: 9 },
  { id: "chungbuk-cheongju", label: "Cheongju", labelKr: "청주시", center: [36.6424, 127.4890], zoom: 11, parent: "chungbuk" },
  { id: "chungbuk-chungju", label: "Chungju", labelKr: "충주시", center: [36.9910, 127.9259], zoom: 11, parent: "chungbuk" },
  { id: "chungbuk-jecheon", label: "Jecheon", labelKr: "제천시", center: [37.1325, 128.1910], zoom: 11, parent: "chungbuk" },
  
  // 충청남도 주요 시
  { id: "chungnam", label: "Chungnam", labelKr: "충청남도", center: [36.5184, 126.8000], zoom: 9 },
  { id: "chungnam-cheonan", label: "Cheonan", labelKr: "천안시", center: [36.8151, 127.1139], zoom: 11, parent: "chungnam" },
  { id: "chungnam-asan", label: "Asan", labelKr: "아산시", center: [36.7897, 127.0018], zoom: 11, parent: "chungnam" },
  { id: "chungnam-gongju", label: "Gongju", labelKr: "공주시", center: [36.4465, 127.1190], zoom: 11, parent: "chungnam" },
  { id: "chungnam-nonsan", label: "Nonsan", labelKr: "논산시", center: [36.1872, 127.0987], zoom: 11, parent: "chungnam" },
  { id: "chungnam-seosan", label: "Seosan", labelKr: "서산시", center: [36.7845, 126.4503], zoom: 11, parent: "chungnam" },
  { id: "chungnam-dangjin", label: "Dangjin", labelKr: "당진시", center: [36.8894, 126.6294], zoom: 11, parent: "chungnam" },
  
  // 전북특별자치도 주요 시
  { id: "jeonbuk", label: "Jeonbuk", labelKr: "전북특별자치도", center: [35.8203, 127.1086], zoom: 9 },
  { id: "jeonbuk-jeonju", label: "Jeonju", labelKr: "전주시", center: [35.8242, 127.1480], zoom: 11, parent: "jeonbuk" },
  { id: "jeonbuk-gunsan", label: "Gunsan", labelKr: "군산시", center: [35.9676, 126.7369], zoom: 11, parent: "jeonbuk" },
  { id: "jeonbuk-iksan", label: "Iksan", labelKr: "익산시", center: [35.9482, 126.9576], zoom: 11, parent: "jeonbuk" },
  { id: "jeonbuk-jeongeup", label: "Jeongeup", labelKr: "정읍시", center: [35.5699, 126.8558], zoom: 11, parent: "jeonbuk" },
  { id: "jeonbuk-namwon", label: "Namwon", labelKr: "남원시", center: [35.4164, 127.3903], zoom: 11, parent: "jeonbuk" },
  { id: "jeonbuk-gimje", label: "Gimje", labelKr: "김제시", center: [35.8030, 126.8807], zoom: 11, parent: "jeonbuk" },
  
  // 전라남도 주요 시
  { id: "jeonnam", label: "Jeonnam", labelKr: "전라남도", center: [34.8679, 126.9910], zoom: 9 },
  { id: "jeonnam-mokpo", label: "Mokpo", labelKr: "목포시", center: [34.8118, 126.3922], zoom: 12, parent: "jeonnam" },
  { id: "jeonnam-yeosu", label: "Yeosu", labelKr: "여수시", center: [34.7604, 127.6622], zoom: 11, parent: "jeonnam" },
  { id: "jeonnam-suncheon", label: "Suncheon", labelKr: "순천시", center: [34.9506, 127.4872], zoom: 11, parent: "jeonnam" },
  { id: "jeonnam-naju", label: "Naju", labelKr: "나주시", center: [35.0157, 126.7108], zoom: 11, parent: "jeonnam" },
  { id: "jeonnam-gwangyang", label: "Gwangyang", labelKr: "광양시", center: [34.9407, 127.6956], zoom: 11, parent: "jeonnam" },
  
  // 경상북도 주요 시
  { id: "gyeongbuk", label: "Gyeongbuk", labelKr: "경상북도", center: [36.4919, 128.8889], zoom: 8 },
  { id: "gyeongbuk-pohang", label: "Pohang", labelKr: "포항시", center: [36.0190, 129.3435], zoom: 11, parent: "gyeongbuk" },
  { id: "gyeongbuk-gyeongju", label: "Gyeongju", labelKr: "경주시", center: [35.8562, 129.2247], zoom: 11, parent: "gyeongbuk" },
  { id: "gyeongbuk-gimcheon", label: "Gimcheon", labelKr: "김천시", center: [36.1398, 128.1136], zoom: 11, parent: "gyeongbuk" },
  { id: "gyeongbuk-andong", label: "Andong", labelKr: "안동시", center: [36.5684, 128.7294], zoom: 10, parent: "gyeongbuk" },
  { id: "gyeongbuk-gumi", label: "Gumi", labelKr: "구미시", center: [36.1195, 128.3446], zoom: 11, parent: "gyeongbuk" },
  { id: "gyeongbuk-yeongju", label: "Yeongju", labelKr: "영주시", center: [36.8057, 128.6240], zoom: 10, parent: "gyeongbuk" },
  { id: "gyeongbuk-sangju", label: "Sangju", labelKr: "상주시", center: [36.4110, 128.1591], zoom: 10, parent: "gyeongbuk" },
  { id: "gyeongbuk-mungyeong", label: "Mungyeong", labelKr: "문경시", center: [36.5868, 128.1868], zoom: 10, parent: "gyeongbuk" },
  { id: "gyeongbuk-gyeongsan", label: "Gyeongsan", labelKr: "경산시", center: [35.8251, 128.7415], zoom: 12, parent: "gyeongbuk" },
  
  // 경상남도 주요 시
  { id: "gyeongnam", label: "Gyeongnam", labelKr: "경상남도", center: [35.4606, 128.2132], zoom: 9 },
  { id: "gyeongnam-changwon", label: "Changwon", labelKr: "창원시", center: [35.2270, 128.6811], zoom: 11, parent: "gyeongnam" },
  { id: "gyeongnam-jinju", label: "Jinju", labelKr: "진주시", center: [35.1803, 128.1076], zoom: 11, parent: "gyeongnam" },
  { id: "gyeongnam-tongyeong", label: "Tongyeong", labelKr: "통영시", center: [34.8544, 128.4333], zoom: 11, parent: "gyeongnam" },
  { id: "gyeongnam-sacheon", label: "Sacheon", labelKr: "사천시", center: [35.0035, 128.0649], zoom: 11, parent: "gyeongnam" },
  { id: "gyeongnam-gimhae", label: "Gimhae", labelKr: "김해시", center: [35.2286, 128.8894], zoom: 11, parent: "gyeongnam" },
  { id: "gyeongnam-miryang", label: "Miryang", labelKr: "밀양시", center: [35.5037, 128.7467], zoom: 11, parent: "gyeongnam" },
  { id: "gyeongnam-geoje", label: "Geoje", labelKr: "거제시", center: [34.8808, 128.6211], zoom: 11, parent: "gyeongnam" },
  { id: "gyeongnam-yangsan", label: "Yangsan", labelKr: "양산시", center: [35.3350, 129.0378], zoom: 11, parent: "gyeongnam" },
  
  // 제주특별자치도
  { id: "jeju", label: "Jeju", labelKr: "제주특별자치도", center: [33.4890, 126.4983], zoom: 10 },
  { id: "jeju-jeju", label: "Jeju City", labelKr: "제주시", center: [33.4996, 126.5312], zoom: 11, parent: "jeju" },
  { id: "jeju-seogwipo", label: "Seogwipo", labelKr: "서귀포시", center: [33.2541, 126.5601], zoom: 11, parent: "jeju" },
];

export const getRegionFromHospital = (hospital: Hospital): RegionType => {
  const address = hospital.address || hospital.region || "";
  
  // Check for sub-regions first (more specific match)
  for (const region of regionOptions) {
    if (region.parent && address.includes(region.labelKr)) {
      return region.id;
    }
  }
  
  // Fallback to major regions
  if (address.includes("서울")) return "seoul";
  if (address.includes("인천")) return "incheon";
  if (address.includes("경기")) return "gyeonggi";
  if (address.includes("부산")) return "busan";
  if (address.includes("대구")) return "daegu";
  if (address.includes("대전")) return "daejeon";
  if (address.includes("광주") && !address.includes("경기")) return "gwangju";
  if (address.includes("울산")) return "ulsan";
  if (address.includes("세종")) return "sejong";
  if (address.includes("강원")) return "gangwon";
  if (address.includes("충북") || address.includes("충청북")) return "chungbuk";
  if (address.includes("충남") || address.includes("충청남")) return "chungnam";
  if (address.includes("전북") || address.includes("전라북")) return "jeonbuk";
  if (address.includes("전남") || address.includes("전라남")) return "jeonnam";
  if (address.includes("경북") || address.includes("경상북")) return "gyeongbuk";
  if (address.includes("경남") || address.includes("경상남")) return "gyeongnam";
  if (address.includes("제주")) return "jeju";
  
  return "all";
};

export const filterHospitalsByRegion = (hospitals: Hospital[], region: RegionType): Hospital[] => {
  if (region === "all") return hospitals;
  
  const selectedRegion = regionOptions.find((r) => r.id === region);
  
  // If it's a sub-region, filter by exact match or address contains the sub-region name
  if (selectedRegion?.parent) {
    return hospitals.filter((h) => {
      const address = h.address || "";
      return address.includes(selectedRegion.labelKr);
    });
  }
  
  // If it's a major region, include hospitals from the major region and all its sub-regions
  const childRegions = regionOptions.filter((r) => r.parent === region);
  const childLabels = childRegions.map((r) => r.labelKr);
  
  return hospitals.filter((h) => {
    const hospitalRegion = getRegionFromHospital(h);
    // Direct match with major region
    if (hospitalRegion === region) return true;
    // Check if hospital is in any child region
    const address = h.address || "";
    return childLabels.some((label) => address.includes(label));
  });
};

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
