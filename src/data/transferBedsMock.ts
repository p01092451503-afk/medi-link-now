// Mock data for transfer mode - ICU and Ward availability
// This simulates ICU and ward capacity for each hospital

export interface TransferBeds {
  icuGeneral: number;    // 일반 중환자실
  icuNeuro: number;      // 신경계 중환자실
  icuCardio: number;     // 심장 중환자실
  ward: number;          // 일반병실
  isolation: number;     // 격리병실
}

// Map hospital ID to transfer beds availability
export const transferBedsData: Record<number, TransferBeds> = {
  // Seoul - Major hospitals have more ICU beds
  1: { icuGeneral: 3, icuNeuro: 2, icuCardio: 1, ward: 15, isolation: 3 },   // 서울아산병원
  2: { icuGeneral: 4, icuNeuro: 1, icuCardio: 2, ward: 12, isolation: 2 },   // 삼성서울병원
  3: { icuGeneral: 1, icuNeuro: 0, icuCardio: 1, ward: 8, isolation: 1 },    // 강남세브란스
  4: { icuGeneral: 2, icuNeuro: 1, icuCardio: 0, ward: 10, isolation: 2 },   // 건국대병원
  5: { icuGeneral: 0, icuNeuro: 0, icuCardio: 0, ward: 5, isolation: 0 },    // 잠실서울의원
  6: { icuGeneral: 5, icuNeuro: 2, icuCardio: 2, ward: 20, isolation: 4 },   // 세브란스병원
  7: { icuGeneral: 3, icuNeuro: 1, icuCardio: 1, ward: 14, isolation: 2 },   // 이대목동병원
  8: { icuGeneral: 0, icuNeuro: 0, icuCardio: 0, ward: 3, isolation: 0 },    // 홍대응급의원
  9: { icuGeneral: 2, icuNeuro: 0, icuCardio: 1, ward: 8, isolation: 1 },    // 용산순천향
  10: { icuGeneral: 6, icuNeuro: 3, icuCardio: 2, ward: 25, isolation: 5 },  // 서울대병원
  11: { icuGeneral: 3, icuNeuro: 1, icuCardio: 1, ward: 12, isolation: 3 },  // 보라매병원
  12: { icuGeneral: 4, icuNeuro: 2, icuCardio: 1, ward: 16, isolation: 3 },  // 고려대안암
  13: { icuGeneral: 2, icuNeuro: 1, icuCardio: 0, ward: 10, isolation: 2 },  // 노원을지대
  14: { icuGeneral: 1, icuNeuro: 0, icuCardio: 0, ward: 6, isolation: 1 },   // 강북삼성
  15: { icuGeneral: 3, icuNeuro: 1, icuCardio: 1, ward: 12, isolation: 4 },  // 서울의료원

  // Incheon
  16: { icuGeneral: 4, icuNeuro: 2, icuCardio: 1, ward: 18, isolation: 3 },  // 인하대병원
  17: { icuGeneral: 3, icuNeuro: 1, icuCardio: 2, ward: 15, isolation: 2 },  // 가천대길병원
  18: { icuGeneral: 2, icuNeuro: 1, icuCardio: 1, ward: 10, isolation: 2 },  // 송도세브란스
  19: { icuGeneral: 1, icuNeuro: 0, icuCardio: 0, ward: 6, isolation: 1 },   // 부평사랑병원
  20: { icuGeneral: 3, icuNeuro: 1, icuCardio: 1, ward: 12, isolation: 2 },  // 인천성모병원

  // Gyeonggi - Suwon
  21: { icuGeneral: 5, icuNeuro: 2, icuCardio: 2, ward: 22, isolation: 4 },  // 아주대병원
  22: { icuGeneral: 3, icuNeuro: 1, icuCardio: 1, ward: 14, isolation: 2 },  // 수원성빈센트
  23: { icuGeneral: 2, icuNeuro: 0, icuCardio: 0, ward: 8, isolation: 3 },   // 수원시의료원

  // Gyeonggi - Bundang
  24: { icuGeneral: 5, icuNeuro: 2, icuCardio: 2, ward: 20, isolation: 4 },  // 분당서울대
  25: { icuGeneral: 2, icuNeuro: 1, icuCardio: 1, ward: 10, isolation: 2 },  // 차의과대분당차
  26: { icuGeneral: 1, icuNeuro: 0, icuCardio: 0, ward: 8, isolation: 1 },   // 분당제생병원

  // Gyeonggi - Goyang
  27: { icuGeneral: 4, icuNeuro: 1, icuCardio: 1, ward: 16, isolation: 3 },  // 일산건보공단
  28: { icuGeneral: 2, icuNeuro: 1, icuCardio: 1, ward: 12, isolation: 2 },  // 명지병원
  29: { icuGeneral: 2, icuNeuro: 0, icuCardio: 1, ward: 10, isolation: 1 },  // 일산백병원

  // Busan
  30: { icuGeneral: 6, icuNeuro: 3, icuCardio: 2, ward: 24, isolation: 5 },  // 부산대병원
  31: { icuGeneral: 4, icuNeuro: 2, icuCardio: 2, ward: 18, isolation: 3 },  // 동아대병원
  32: { icuGeneral: 3, icuNeuro: 1, icuCardio: 1, ward: 14, isolation: 2 },  // 해운대백병원
  33: { icuGeneral: 2, icuNeuro: 0, icuCardio: 1, ward: 10, isolation: 2 },  // 부산성모병원
};

// Get transfer beds for a hospital, with fallback mock data
export const getTransferBeds = (hospitalId: number): TransferBeds => {
  if (transferBedsData[hospitalId]) {
    return transferBedsData[hospitalId];
  }
  
  // Generate random mock data for hospitals not in the list
  // Seed based on hospital ID for consistency
  const seed = hospitalId;
  const random = (min: number, max: number) => {
    const x = Math.sin(seed * (min + 1)) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  return {
    icuGeneral: random(0, 4),
    icuNeuro: random(0, 2),
    icuCardio: random(0, 2),
    ward: random(3, 15),
    isolation: random(0, 3),
  };
};

// Calculate total ICU beds
export const getTotalICU = (beds: TransferBeds): number => {
  return beds.icuGeneral + beds.icuNeuro + beds.icuCardio;
};
