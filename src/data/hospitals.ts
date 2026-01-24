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

export type RegionType = "all" | "seoul" | "incheon" | "gyeonggi" | "busan" | "daegu" | "daejeon" | "gwangju" | "ulsan";

export const regionOptions: { id: RegionType; label: string; labelKr: string; center: [number, number] }[] = [
  { id: "all", label: "All Regions", labelKr: "전체", center: [37.5, 127.0] },
  { id: "seoul", label: "Seoul", labelKr: "서울", center: [37.5665, 126.9780] },
  { id: "incheon", label: "Incheon", labelKr: "인천", center: [37.4563, 126.7052] },
  { id: "gyeonggi", label: "Gyeonggi", labelKr: "경기", center: [37.4138, 127.5183] },
  { id: "busan", label: "Busan", labelKr: "부산", center: [35.1796, 129.0756] },
  { id: "daegu", label: "Daegu", labelKr: "대구", center: [35.8714, 128.6014] },
  { id: "daejeon", label: "Daejeon", labelKr: "대전", center: [36.3504, 127.3845] },
  { id: "gwangju", label: "Gwangju", labelKr: "광주", center: [35.1595, 126.8526] },
  { id: "ulsan", label: "Ulsan", labelKr: "울산", center: [35.5384, 129.3114] },
];

export const getRegionFromHospital = (hospital: Hospital): RegionType => {
  const region = hospital.region.toLowerCase();
  if (region.includes("서울")) return "seoul";
  if (region.includes("인천")) return "incheon";
  if (region.includes("경기")) return "gyeonggi";
  if (region.includes("부산")) return "busan";
  if (region.includes("대구")) return "daegu";
  if (region.includes("대전")) return "daejeon";
  if (region.includes("광주")) return "gwangju";
  if (region.includes("울산")) return "ulsan";
  return "all";
};

export const filterHospitalsByRegion = (hospitals: Hospital[], region: RegionType): Hospital[] => {
  if (region === "all") return hospitals;
  return hospitals.filter((h) => getRegionFromHospital(h) === region);
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
