import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  MapPin, 
  Navigation, 
  Download, 
  ArrowLeft, 
  Clock,
  AlertCircle,
  Ambulance,
  Receipt
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

// 요금 계산 로직 (대한민국 법정 요금 기준)
const FARE_CONFIG = {
  general: {
    baseFare: 30000, // 기본요금 (10km 이내)
    baseDistance: 10, // 기본 거리 (km)
    extraPerKm: 1000, // 추가 1km당 요금
    label: "일반 구급차",
  },
  special: {
    baseFare: 75000, // 기본요금 (10km 이내)
    baseDistance: 10, // 기본 거리 (km)
    extraPerKm: 1300, // 추가 1km당 요금
    label: "특수 구급차",
  },
};

// 심야 할증 시간 (00:00 ~ 04:00)
const NIGHT_SURCHARGE_START = 0;
const NIGHT_SURCHARGE_END = 4;
const NIGHT_SURCHARGE_RATE = 0.2; // 20% 할증

interface FareResult {
  baseFare: number;
  extraFare: number;
  subtotal: number;
  surcharge: number;
  total: number;
  distance: number;
  isNightTime: boolean;
}

const calculateFare = (
  distanceKm: number,
  type: "general" | "special",
  isNightTime: boolean
): FareResult => {
  const config = FARE_CONFIG[type];
  const baseFare = config.baseFare;
  const extraDistance = Math.max(0, distanceKm - config.baseDistance);
  const extraFare = Math.ceil(extraDistance) * config.extraPerKm;
  const subtotal = baseFare + extraFare;
  const surcharge = isNightTime ? Math.round(subtotal * NIGHT_SURCHARGE_RATE) : 0;
  const total = subtotal + surcharge;

  return {
    baseFare,
    extraFare,
    subtotal,
    surcharge,
    total,
    distance: distanceKm,
    isNightTime,
  };
};

const FareCalculatorPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [distance, setDistance] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "special">("general");
  const [isNightTime, setIsNightTime] = useState(() => {
    const hour = new Date().getHours();
    return hour >= NIGHT_SURCHARGE_START && hour < NIGHT_SURCHARGE_END;
  });

  const handleCalculateDistance = useCallback(async () => {
    if (!origin.trim() || !destination.trim()) {
      toast({
        title: "입력 오류",
        description: "출발지와 목적지를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    
    // Kakao Maps API를 사용한 거리 계산
    try {
      const kakao = (window as any).kakao;
      
      if (!kakao || !kakao.maps || !kakao.maps.services) {
        // Kakao API가 없으면 직선거리로 대략 계산 (데모용)
        // 실제로는 주소 검색 후 거리 계산 필요
        const mockDistance = Math.random() * 50 + 5; // 5~55km 랜덤
        setDistance(Math.round(mockDistance * 10) / 10);
        toast({
          title: "거리 계산 완료",
          description: `예상 거리: ${mockDistance.toFixed(1)}km (테스트 데이터)`,
        });
        setIsCalculating(false);
        return;
      }

      const geocoder = new kakao.maps.services.Geocoder();
      
      // 출발지 좌표 검색
      const getCoords = (address: string): Promise<{ lat: number; lng: number }> => {
        return new Promise((resolve, reject) => {
          geocoder.addressSearch(address, (result: any, status: any) => {
            if (status === kakao.maps.services.Status.OK) {
              resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
            } else {
              // 주소 검색 실패시 키워드 검색 시도
              const places = new kakao.maps.services.Places();
              places.keywordSearch(address, (placeResult: any, placeStatus: any) => {
                if (placeStatus === kakao.maps.services.Status.OK) {
                  resolve({ lat: parseFloat(placeResult[0].y), lng: parseFloat(placeResult[0].x) });
                } else {
                  reject(new Error("주소를 찾을 수 없습니다"));
                }
              });
            }
          });
        });
      };

      const [originCoords, destCoords] = await Promise.all([
        getCoords(origin),
        getCoords(destination),
      ]);

      // Haversine 공식으로 직선 거리 계산
      const R = 6371; // 지구 반경 (km)
      const dLat = ((destCoords.lat - originCoords.lat) * Math.PI) / 180;
      const dLon = ((destCoords.lng - originCoords.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((originCoords.lat * Math.PI) / 180) *
          Math.cos((destCoords.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const straightDistance = R * c;
      
      // 실제 도로 거리는 직선거리의 약 1.3배로 추정
      const estimatedRoadDistance = straightDistance * 1.3;
      const roundedDistance = Math.round(estimatedRoadDistance * 10) / 10;
      
      setDistance(roundedDistance);
      toast({
        title: "거리 계산 완료",
        description: `예상 거리: ${roundedDistance}km`,
      });
    } catch (error) {
      console.error("Distance calculation error:", error);
      toast({
        title: "계산 오류",
        description: "거리 계산 중 오류가 발생했습니다. 주소를 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  }, [origin, destination, toast]);

  const handleSaveImage = useCallback(async () => {
    if (!receiptRef.current) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });
      
      const link = document.createElement("a");
      link.download = `구급차_요금_견적서_${new Date().toISOString().split("T")[0]}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast({
        title: "저장 완료",
        description: "견적서 이미지가 저장되었습니다.",
      });
    } catch (error) {
      console.error("Image save error:", error);
      toast({
        title: "저장 실패",
        description: "이미지 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const generalFare = distance !== null ? calculateFare(distance, "general", isNightTime) : null;
  const specialFare = distance !== null ? calculateFare(distance, "special", isNightTime) : null;
  const currentFare = activeTab === "general" ? generalFare : specialFare;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-5 py-4 flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </button>
          <h1 className="text-[15px] font-bold text-foreground">요금 계산기</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="px-5 py-6 space-y-6 max-w-lg mx-auto">
        {/* 입력 섹션 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              출발지 / 목적지 입력
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">출발지</label>
              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="출발지 주소 또는 장소명"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">목적지</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="목적지 주소 또는 병원명"
                  className="pl-10"
                />
              </div>
            </div>

            {/* 심야 할증 토글 */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">심야 할증 (00:00~04:00)</span>
              </div>
              <button
                onClick={() => setIsNightTime(!isNightTime)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isNightTime ? "bg-amber-500" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    isNightTime ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <Button 
              onClick={handleCalculateDistance} 
              className="w-full"
              disabled={isCalculating}
            >
              {isCalculating ? "계산 중..." : "거리 계산하기"}
            </Button>
          </CardContent>
        </Card>

        {/* 결과 섹션 */}
        {distance !== null && (
          <div ref={receiptRef} className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* 영수증 헤더 */}
            <div className="bg-primary text-primary-foreground p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Receipt className="h-5 w-5" />
                <span className="font-bold">예상 견적서</span>
              </div>
              <p className="text-xs opacity-80">
                {new Date().toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* 탭 */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "general" | "special")}>
              <TabsList className="w-full grid grid-cols-2 rounded-none h-12">
                <TabsTrigger value="general" className="rounded-none data-[state=active]:bg-blue-50">
                  <Ambulance className="h-4 w-4 mr-2" />
                  일반 구급차
                </TabsTrigger>
                <TabsTrigger value="special" className="rounded-none data-[state=active]:bg-amber-50">
                  <Ambulance className="h-4 w-4 mr-2" />
                  특수 구급차
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="mt-0">
                <FareReceiptContent fare={generalFare!} type="general" origin={origin} destination={destination} />
              </TabsContent>
              <TabsContent value="special" className="mt-0">
                <FareReceiptContent fare={specialFare!} type="special" origin={origin} destination={destination} />
              </TabsContent>
            </Tabs>

            {/* 안내 문구 */}
            <div className="p-4 bg-muted/30 border-t border-dashed">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  이 금액은 법정 요금 기준 예상액이며, 의료 처치료나 대기료 등은 별도입니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 결제 & 이미지 저장 버튼 */}
        {distance !== null && currentFare && (
          <div className="space-y-3">
            <PaymentButton
              amount={currentFare.total}
              origin={origin}
              destination={destination}
              distanceKm={distance}
              vehicleType={activeTab}
            />
            <Button
              onClick={handleSaveImage}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              예상 견적서 이미지 저장
            </Button>
          </div>
        )}

        {/* 요금 기준 안내 */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              요금 기준 안내
            </h3>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-background rounded-lg">
                  <p className="font-medium text-foreground mb-1">일반 구급차</p>
                  <p>• 기본 (10km 이내): 30,000원</p>
                  <p>• 추가 1km당: 1,000원</p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <p className="font-medium text-foreground mb-1">특수 구급차</p>
                  <p>• 기본 (10km 이내): 75,000원</p>
                  <p>• 추가 1km당: 1,300원</p>
                </div>
              </div>
              <p className="p-3 bg-amber-50 rounded-lg text-amber-700">
                🌙 심야 할증 (00:00~04:00): 총 요금의 20% 추가
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

// 영수증 내용 컴포넌트
const FareReceiptContent = ({
  fare,
  type,
  origin,
  destination,
}: {
  fare: FareResult;
  type: "general" | "special";
  origin: string;
  destination: string;
}) => {
  const config = FARE_CONFIG[type];
  
  return (
    <div className="p-4 space-y-4">
      {/* 경로 정보 */}
      <div className="text-sm space-y-1 pb-3 border-b border-dashed">
        <div className="flex items-center gap-2">
          <Navigation className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">출발:</span>
          <span className="font-medium truncate">{origin}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-red-500" />
          <span className="text-muted-foreground">도착:</span>
          <span className="font-medium truncate">{destination}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-muted-foreground">예상 거리:</span>
          <span className="font-bold text-primary">{fare.distance.toFixed(1)} km</span>
        </div>
      </div>

      {/* 요금 내역 */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">기본요금 (10km 이내)</span>
          <span>{fare.baseFare.toLocaleString()}원</span>
        </div>
        {fare.extraFare > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              추가 거리 ({Math.ceil(fare.distance - config.baseDistance)}km × {config.extraPerKm.toLocaleString()}원)
            </span>
            <span>{fare.extraFare.toLocaleString()}원</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2">
          <span className="text-muted-foreground">소계</span>
          <span>{fare.subtotal.toLocaleString()}원</span>
        </div>
        {fare.isNightTime && (
          <div className="flex justify-between text-amber-600">
            <span>심야 할증 (20%)</span>
            <span>+{fare.surcharge.toLocaleString()}원</span>
          </div>
        )}
      </div>

      {/* 총 금액 */}
      <div className={`p-4 rounded-xl text-center ${
        type === "general" ? "bg-blue-50" : "bg-amber-50"
      }`}>
        <p className="text-sm text-muted-foreground mb-1">예상 총 요금</p>
        <p className={`text-3xl font-bold ${
          type === "general" ? "text-blue-600" : "text-amber-600"
        }`}>
          {fare.total.toLocaleString()}
          <span className="text-lg ml-1">원</span>
        </p>
      </div>
    </div>
  );
};

export default FareCalculatorPage;
