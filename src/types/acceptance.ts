export interface AcceptancePrediction {
  probability: number;          // 0~100
  estimatedWaitMin: number;     // 예상 대기 시간(분)
  confidence: 'high' | 'medium' | 'low';
  signal: 'green' | 'yellow' | 'red';
  breakdown: {
    occupancyScore: number;     // 점유율 점수 (0~100)
    patternScore: number;       // 시간대 패턴 점수
    weatherScore: number;       // 날씨 환경 점수
    spilloverScore: number;     // 주변 연쇄 과부하 점수
  };
  conditionAcceptance: {
    cardiac: boolean;           // 심정지
    stroke: boolean;            // 뇌졸중
    trauma: boolean;            // 중증외상
    pediatric: boolean;         // 소아응급
    dialysis: boolean;          // 투석
  };
  dataFreshness: {
    realtimeConnected: boolean;
    lastUpdated: Date;
    sourcesActive: number;      // 활성 데이터 소스 수 (최대 4)
  };
}

export type AcceptanceSignal = AcceptancePrediction['signal'];
export type AcceptanceConfidence = AcceptancePrediction['confidence'];
