import { FilterType } from "@/data/hospitals";

export interface SymptomAnalysisResult {
  suggestedFilter: FilterType;
  keywords: string[];
  message: string;
  icon: "baby" | "trauma" | "cardio" | "general" | "fever";
  severity: "low" | "medium" | "high";
}

// Keyword mappings for symptom analysis
const SYMPTOM_MAPPINGS = {
  pediatric: {
    keywords: ["아이", "아기", "영아", "유아", "소아", "어린이", "baby", "child", "toddler", "infant"],
    filter: "pediatric" as FilterType,
    message: "소아응급 병원을 찾고 있습니다...",
    icon: "baby" as const,
  },
  pediatricSymptoms: {
    keywords: ["열", "고열", "발열", "경련", "경기", "토", "구토", "설사", "탈수"],
    filter: "pediatric" as FilterType,
    message: "소아 증상에 맞는 병원을 찾고 있습니다...",
    icon: "fever" as const,
  },
  trauma: {
    keywords: ["피", "출혈", "찢어", "골절", "부러", "다쳤", "다침", "외상", "상처", "뼈", "멍", "타박", "넘어", "추락", "사고", "교통사고"],
    filter: "trauma" as FilterType,
    message: "외상/정형 전문 병원을 찾고 있습니다...",
    icon: "trauma" as const,
  },
  cardio: {
    keywords: ["가슴", "흉통", "심장", "숨", "호흡", "답답", "두근", "심근", "경색", "부정맥", "협심증"],
    filter: "cardio" as FilterType,
    message: "심혈관 전문 병원을 찾고 있습니다...",
    icon: "cardio" as const,
  },
  neuro: {
    keywords: ["머리", "두통", "어지", "현기증", "마비", "뇌", "의식", "졸도", "경련", "발작", "뇌출혈", "뇌경색"],
    filter: "neuro" as FilterType,
    message: "뇌혈관 전문 병원을 찾고 있습니다...",
    icon: "cardio" as const,
  },
  fever: {
    keywords: ["열", "고열", "발열", "38도", "39도", "40도", "몸살", "오한", "감염", "코로나"],
    filter: "fever" as FilterType,
    message: "열/감염 대응 병원을 찾고 있습니다...",
    icon: "fever" as const,
  },
};

// Severity indicators
const HIGH_SEVERITY_KEYWORDS = [
  "의식", "의식없", "숨", "호흡곤란", "심장", "심근경색", "뇌출혈", "출혈", "피", "대량", "경련", "발작", "심정지"
];

const MEDIUM_SEVERITY_KEYWORDS = [
  "고열", "39도", "40도", "골절", "부러", "구토", "설사", "어지", "마비"
];

export const analyzeSymptom = (input: string): SymptomAnalysisResult | null => {
  if (!input || input.trim().length < 2) return null;

  const normalizedInput = input.toLowerCase().trim();
  const matchedKeywords: string[] = [];
  let bestMatch: { category: keyof typeof SYMPTOM_MAPPINGS; score: number } | null = null;

  // Check each category
  for (const [category, config] of Object.entries(SYMPTOM_MAPPINGS)) {
    let score = 0;
    for (const keyword of config.keywords) {
      if (normalizedInput.includes(keyword)) {
        score++;
        matchedKeywords.push(keyword);
      }
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { category: category as keyof typeof SYMPTOM_MAPPINGS, score };
    }
  }

  if (!bestMatch) return null;

  const config = SYMPTOM_MAPPINGS[bestMatch.category];

  // Determine severity
  let severity: "low" | "medium" | "high" = "low";
  for (const keyword of HIGH_SEVERITY_KEYWORDS) {
    if (normalizedInput.includes(keyword)) {
      severity = "high";
      break;
    }
  }
  if (severity !== "high") {
    for (const keyword of MEDIUM_SEVERITY_KEYWORDS) {
      if (normalizedInput.includes(keyword)) {
        severity = "medium";
        break;
      }
    }
  }

  // Special case: If mentions child/baby with other symptoms, prioritize pediatric
  const hasPediatricMention = SYMPTOM_MAPPINGS.pediatric.keywords.some((k) => normalizedInput.includes(k));
  if (hasPediatricMention && bestMatch.category !== "pediatric") {
    return {
      suggestedFilter: "pediatric",
      keywords: matchedKeywords,
      message: "소아 환자 증상에 맞는 병원을 찾고 있습니다...",
      icon: "baby",
      severity,
    };
  }

  return {
    suggestedFilter: config.filter,
    keywords: matchedKeywords,
    message: config.message,
    icon: config.icon,
    severity,
  };
};

// Get example symptoms for placeholder
export const getSymptomExamples = (): string[] => [
  "아이가 열이 나요",
  "머리를 다쳤어요",
  "가슴이 답답해요",
  "다리가 부러진 것 같아요",
  "아기가 토해요",
];
