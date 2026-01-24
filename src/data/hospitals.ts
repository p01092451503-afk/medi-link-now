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
    isolation: number;
  };
  equipment: string[];
  distance?: number;
}

export const hospitals: Hospital[] = [
  {
    id: 1,
    name: "Seoul Asan Medical Center",
    nameKr: "서울아산병원",
    category: "Regional Emergency Center",
    lat: 37.5266,
    lng: 127.1082,
    phone: "02-3010-3333",
    address: "88 Olympic-ro 43-gil, Songpa-gu, Seoul",
    beds: {
      general: 5,
      pediatric: 3,
      isolation: 2,
    },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
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
    beds: {
      general: 8,
      pediatric: 0,
      isolation: 4,
    },
    equipment: ["CT", "MRI", "Ventilator"],
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
    beds: {
      general: 0,
      pediatric: 2,
      isolation: 0,
    },
    equipment: ["CT", "MRI"],
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
    beds: {
      general: 3,
      pediatric: 1,
      isolation: 1,
    },
    equipment: ["CT", "Ventilator"],
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
    beds: {
      general: 2,
      pediatric: 0,
      isolation: 0,
    },
    equipment: ["CT"],
  },
  {
    id: 6,
    name: "Seoul National University Bundang Hospital",
    nameKr: "분당서울대학교병원",
    category: "Regional Emergency Center",
    lat: 37.3518,
    lng: 127.1233,
    phone: "031-787-7114",
    address: "82 Gumi-ro 173beon-gil, Bundang-gu, Seongnam",
    beds: {
      general: 12,
      pediatric: 4,
      isolation: 3,
    },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
  },
  {
    id: 7,
    name: "VHS Medical Center",
    nameKr: "중앙보훈병원",
    category: "Local Emergency Center",
    lat: 37.4995,
    lng: 127.1103,
    phone: "02-2225-1114",
    address: "53 Jinhwangdo-ro 61-gil, Gangdong-gu, Seoul",
    beds: {
      general: 0,
      pediatric: 0,
      isolation: 2,
    },
    equipment: ["CT", "MRI"],
  },
  {
    id: 8,
    name: "Gangdong Kyunghee University Hospital",
    nameKr: "강동경희대학교병원",
    category: "Local Emergency Center",
    lat: 37.5394,
    lng: 127.1457,
    phone: "02-440-6114",
    address: "892 Dongnam-ro, Gangdong-gu, Seoul",
    beds: {
      general: 6,
      pediatric: 2,
      isolation: 1,
    },
    equipment: ["CT", "MRI", "Ventilator"],
  },
  {
    id: 9,
    name: "Songpa-gu Health Center",
    nameKr: "송파구보건소",
    category: "Public Health Center",
    lat: 37.5047,
    lng: 127.1127,
    phone: "02-2147-3500",
    address: "326 Olympic-ro, Songpa-gu, Seoul",
    beds: {
      general: 1,
      pediatric: 1,
      isolation: 5,
    },
    equipment: ["CT"],
  },
  {
    id: 10,
    name: "Gangnam-gu Medical Center",
    nameKr: "강남구의료원",
    category: "Local Emergency Center",
    lat: 37.5172,
    lng: 127.0391,
    phone: "02-3462-1234",
    address: "423 Teheran-ro, Gangnam-gu, Seoul",
    beds: {
      general: 4,
      pediatric: 0,
      isolation: 1,
    },
    equipment: ["CT", "Ventilator"],
  },
  {
    id: 11,
    name: "Seoul Medical Center",
    nameKr: "서울의료원",
    category: "Regional Emergency Center",
    lat: 37.5669,
    lng: 127.0661,
    phone: "02-2276-7000",
    address: "156 Sinnae-ro, Jungnang-gu, Seoul",
    beds: {
      general: 7,
      pediatric: 3,
      isolation: 4,
    },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
  },
  {
    id: 12,
    name: "Lotte World Tower Medical",
    nameKr: "롯데월드타워의원",
    category: "Emergency Clinic",
    lat: 37.5125,
    lng: 127.1025,
    phone: "02-3213-0000",
    address: "300 Olympic-ro, Songpa-gu, Seoul",
    beds: {
      general: 0,
      pediatric: 0,
      isolation: 0,
    },
    equipment: ["CT"],
  },
  {
    id: 13,
    name: "Cheongdam Medical Center",
    nameKr: "청담의료원",
    category: "Local Emergency Center",
    lat: 37.5219,
    lng: 127.0474,
    phone: "02-511-5555",
    address: "416 Apgujeong-ro, Gangnam-gu, Seoul",
    beds: {
      general: 3,
      pediatric: 1,
      isolation: 0,
    },
    equipment: ["CT", "MRI"],
  },
  {
    id: 14,
    name: "Olympic Park Medical Center",
    nameKr: "올림픽공원의료원",
    category: "Emergency Clinic",
    lat: 37.5203,
    lng: 127.1214,
    phone: "02-410-2000",
    address: "424 Olympic-ro, Songpa-gu, Seoul",
    beds: {
      general: 2,
      pediatric: 0,
      isolation: 1,
    },
    equipment: ["CT"],
  },
  {
    id: 15,
    name: "Gangnam St. Mary's Hospital",
    nameKr: "강남성모병원",
    category: "Regional Emergency Center",
    lat: 37.5015,
    lng: 127.0656,
    phone: "02-590-1114",
    address: "222 Banpo-daero, Seocho-gu, Seoul",
    beds: {
      general: 9,
      pediatric: 5,
      isolation: 3,
    },
    equipment: ["CT", "MRI", "Ventilator", "ECMO"],
  },
];

export type FilterType = "all" | "adult" | "pediatric" | "isolation" | "ct";

export const filterOptions: { id: FilterType; label: string; labelKr: string }[] = [
  { id: "all", label: "All", labelKr: "전체" },
  { id: "adult", label: "Adult ER", labelKr: "성인 응급" },
  { id: "pediatric", label: "Pediatric ER", labelKr: "소아 응급" },
  { id: "isolation", label: "Isolation Room", labelKr: "격리실" },
  { id: "ct", label: "CT Available", labelKr: "CT 가능" },
];

export const getHospitalStatus = (hospital: Hospital): "available" | "limited" | "unavailable" => {
  const totalBeds = hospital.beds.general + hospital.beds.pediatric + hospital.beds.isolation;
  if (totalBeds === 0) return "unavailable";
  if (totalBeds <= 2) return "limited";
  return "available";
};

export const filterHospitals = (hospitals: Hospital[], filter: FilterType): Hospital[] => {
  switch (filter) {
    case "adult":
      return hospitals.filter((h) => h.beds.general > 0);
    case "pediatric":
      return hospitals.filter((h) => h.beds.pediatric > 0);
    case "isolation":
      return hospitals.filter((h) => h.beds.isolation > 0);
    case "ct":
      return hospitals.filter((h) => h.equipment.includes("CT"));
    default:
      return hospitals;
  }
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
