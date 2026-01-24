import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  MapPin, 
  DollarSign, 
  Clock, 
  TrendingUp,
  RotateCcw,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface ReturnTripRequest {
  id: string;
  patientName: string;
  pickupLocation: string;
  pickupCity: string;
  destination: string;
  destinationCity: string;
  estimatedFee: number;
  distance: string;
  timePosted: string;
}

// Mock return trip requests
const mockReturnTrips: ReturnTripRequest[] = [
  {
    id: "r1",
    patientName: "정OO",
    pickupLocation: "대구광역시 수성구",
    pickupCity: "대구",
    destination: "서울아산병원",
    destinationCity: "서울",
    estimatedFee: 250000,
    distance: "280km",
    timePosted: "10분 전",
  },
  {
    id: "r2",
    patientName: "최OO",
    pickupLocation: "대전광역시 서구",
    pickupCity: "대전",
    destination: "세브란스병원",
    destinationCity: "서울",
    estimatedFee: 180000,
    distance: "160km",
    timePosted: "25분 전",
  },
  {
    id: "r3",
    patientName: "한OO",
    pickupLocation: "광주광역시 북구",
    pickupCity: "광주",
    destination: "삼성서울병원",
    destinationCity: "서울",
    estimatedFee: 320000,
    distance: "320km",
    timePosted: "45분 전",
  },
  {
    id: "r4",
    patientName: "임OO",
    pickupLocation: "부산광역시 해운대구",
    pickupCity: "부산",
    destination: "서울대병원",
    destinationCity: "서울",
    estimatedFee: 380000,
    distance: "400km",
    timePosted: "1시간 전",
  },
  {
    id: "r5",
    patientName: "윤OO",
    pickupLocation: "창원시 성산구",
    pickupCity: "창원",
    destination: "고려대병원",
    destinationCity: "서울",
    estimatedFee: 350000,
    distance: "360km",
    timePosted: "1시간 전",
  },
];

interface RevenueTabProps {
  todayRevenue: number;
  completedTrips: number;
}

const RevenueTab = ({ todayRevenue, completedTrips }: RevenueTabProps) => {
  const [currentLocation, setCurrentLocation] = useState("");
  const [homeBase, setHomeBase] = useState("서울");
  const [acceptedTrips, setAcceptedTrips] = useState<string[]>([]);

  // Filter trips that match the route back to home base
  const matchingTrips = mockReturnTrips.filter((trip) => {
    if (!currentLocation) return true;
    // Simple matching: pickup city contains current location keyword
    // and destination city matches home base
    const matchesRoute = 
      trip.destinationCity.includes(homeBase) &&
      (currentLocation === "" || trip.pickupCity.toLowerCase().includes(currentLocation.toLowerCase()));
    return matchesRoute;
  });

  const handleAcceptTrip = (tripId: string) => {
    setAcceptedTrips((prev) => [...prev, tripId]);
    const trip = mockReturnTrips.find((t) => t.id === tripId);
    toast({
      title: "귀경길 콜 수락!",
      description: `${trip?.patientName}님 - ${trip?.pickupCity} → ${trip?.destinationCity}`,
    });
  };

  const potentialRevenue = matchingTrips.reduce((sum, trip) => sum + trip.estimatedFee, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Today's Summary */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-white">
        <p className="text-sm opacity-80 mb-1">오늘의 수입</p>
        <p className="text-4xl font-bold mb-4">₩{todayRevenue.toLocaleString()}</p>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{completedTrips}건 완료</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>평균 ₩{completedTrips > 0 ? Math.round(todayRevenue / completedTrips).toLocaleString() : 0}/건</span>
          </div>
        </div>
      </div>

      {/* Return Trip Matching Section */}
      <div className="bg-white rounded-2xl p-5 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">귀경길 콜 매칭</h3>
          <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            공차 방지
          </span>
        </div>

        {/* Route Input */}
        <div className="grid grid-cols-5 gap-2 items-end mb-4">
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground mb-1.5 block">현재 위치</Label>
            <Input
              placeholder="예: 부산"
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="flex justify-center items-center pb-2">
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground mb-1.5 block">홈베이스</Label>
            <Input
              placeholder="예: 서울"
              value={homeBase}
              onChange={(e) => setHomeBase(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        {/* Potential Revenue */}
        <div className="bg-green-50 rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">예상 추가 수익</span>
          </div>
          <span className="text-lg font-bold text-green-600">
            +₩{potentialRevenue.toLocaleString()}
          </span>
        </div>

        {/* Matching Trips */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            🔙 귀경길 콜 ({matchingTrips.length}건)
          </p>
          
          {matchingTrips.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              현재 경로에 맞는 콜이 없습니다
            </div>
          ) : (
            matchingTrips.map((trip) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-xl p-4 border-2 transition-colors ${
                  acceptedTrips.includes(trip.id) 
                    ? "border-green-500 bg-green-50" 
                    : "border-primary/30 hover:border-primary"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{trip.patientName}</span>
                      <span className="text-xs text-muted-foreground">{trip.timePosted}</span>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    +₩{trip.estimatedFee.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm mb-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{trip.pickupLocation}</span>
                  <ArrowRight className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{trip.destination}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    거리: {trip.distance}
                  </span>
                  
                  {acceptedTrips.includes(trip.id) ? (
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <Check className="w-4 h-4" />
                      수락됨
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAcceptTrip(trip.id)}
                      className="rounded-xl"
                    >
                      콜 수락
                    </Button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="bg-white rounded-2xl p-4 border border-border">
        <h3 className="font-semibold text-foreground mb-4">이번 주 요약</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-foreground">12</p>
            <p className="text-xs text-muted-foreground">총 운행</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-primary">₩890,000</p>
            <p className="text-xs text-muted-foreground">총 수입</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RevenueTab;
