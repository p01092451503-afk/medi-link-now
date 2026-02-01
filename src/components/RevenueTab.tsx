import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  MapPin, 
  DollarSign, 
  Clock, 
  TrendingUp,
  RotateCcw,
  Check,
  Loader2,
  RefreshCw,
  Bell,
  User,
  Flame,
  ToggleLeft,
  ToggleRight,
  Navigation,
  Route,
  Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useRealtimeReturnTrips, type ReturnTripRequest } from "@/hooks/useRealtimeReturnTrips";
import { findEmptyLegMatches, type MatchedTrip, type DriverRoute } from "@/utils/emptyLegMatching";
import { koreanCities } from "@/data/koreanCities";

interface RevenueTabProps {
  todayRevenue: number;
  completedTrips: number;
}

// Major cities for selection
const MAJOR_CITIES = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "창원", "전주", "청주", "천안", "수원"];

const RevenueTab = ({ todayRevenue, completedTrips }: RevenueTabProps) => {
  const [isReturningEmpty, setIsReturningEmpty] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("부산");
  const [homeBase, setHomeBase] = useState("서울");
  const [acceptedTrips, setAcceptedTrips] = useState<string[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  
  const { trips, isLoading, acceptTrip, refetch } = useRealtimeReturnTrips();

  // Build driver route
  const driverRoute: DriverRoute = useMemo(() => ({
    currentLocation,
    destination: homeBase,
    isReturningEmpty,
  }), [currentLocation, homeBase, isReturningEmpty]);

  // Find matching trips using the algorithm
  const matchedTrips: MatchedTrip[] = useMemo(() => {
    if (!isReturningEmpty) {
      // When not returning empty, just filter by destination
      return trips
        .filter(trip => trip.destination_city.includes(homeBase))
        .map(trip => ({
          ...trip,
          matchScore: 0,
          detourDistance: 0,
          detourTimeMinutes: 0,
          isOnRoute: false,
          pickupCoords: null,
          dropoffCoords: null,
        }));
    }
    return findEmptyLegMatches(driverRoute, trips);
  }, [trips, driverRoute, isReturningEmpty, homeBase]);

  // Separate hot matches (on route) from regular matches
  const hotMatches = matchedTrips.filter(t => t.isOnRoute);
  const regularMatches = matchedTrips.filter(t => !t.isOnRoute);

  const handleAcceptTrip = async (tripId: string) => {
    setAcceptingId(tripId);
    const success = await acceptTrip(tripId);
    
    if (success) {
      setAcceptedTrips((prev) => [...prev, tripId]);
      const trip = trips.find((t) => t.id === tripId);
      toast({
        title: "✅ 귀경길 콜 수락!",
        description: `${trip?.patient_name}님 - ${trip?.pickup_city} → ${trip?.destination_city}`,
      });
    }
    setAcceptingId(null);
  };

  const potentialRevenue = matchedTrips.reduce((sum, trip) => sum + trip.estimated_fee, 0);

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${Math.floor(diffHours / 24)}일 전`;
  };

  const TripCard = ({ trip, isHot = false }: { trip: MatchedTrip; isHot?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl p-4 border-2 transition-colors ${
        acceptedTrips.includes(trip.id) 
          ? "border-green-500 bg-green-50" 
          : isHot
            ? "border-orange-400 bg-orange-50/50"
            : "border-primary/30 hover:border-primary"
      }`}
    >
      {/* Hot Match Badge */}
      {isHot && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full">
            <Flame className="w-3 h-3" />
            Empty Leg Match
          </span>
          <span className="text-xs text-orange-600 font-medium">On your way!</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{trip.patient_name}</span>
            <span className="text-xs text-muted-foreground">{formatTimeAgo(trip.created_at)}</span>
          </div>
          {trip.patient_age && trip.patient_gender && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              <span>{trip.patient_gender === 'male' ? '남성' : '여성'} / {trip.patient_age}</span>
              {trip.patient_condition && (
                <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                  {trip.patient_condition === 'stable' ? '안정' : trip.patient_condition}
                </span>
              )}
            </div>
          )}
        </div>
        <span className={`text-lg font-bold ${isHot ? "text-orange-600" : "text-primary"}`}>
          +₩{trip.estimated_fee.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm mb-3">
        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-muted-foreground truncate">{trip.pickup_city}</span>
        <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="font-medium text-foreground truncate">{trip.destination_city}</span>
      </div>

      {/* Detour Info - only show when returning empty */}
      {isReturningEmpty && trip.detourTimeMinutes !== undefined && (
        <div className="flex items-center gap-3 text-xs mb-3 py-2 px-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Route className="w-3.5 h-3.5" />
            <span>우회: +{trip.detourDistance}km</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Timer className="w-3.5 h-3.5" />
            <span>+{trip.detourTimeMinutes}분</span>
          </div>
          {trip.detourTimeMinutes > 0 && (
            <div className="ml-auto text-green-600 font-medium">
              ₩{Math.round(trip.estimated_fee / trip.detourTimeMinutes).toLocaleString()}/분
            </div>
          )}
        </div>
      )}

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
            disabled={acceptingId === trip.id}
            className={`rounded-xl ${isHot ? "bg-orange-500 hover:bg-orange-600" : ""}`}
          >
            {acceptingId === trip.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "콜 수락"
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Today's Summary */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-4 text-white">
        <p className="text-xs opacity-80 mb-1">오늘의 수입</p>
        <p className="text-2xl font-bold mb-2">₩{todayRevenue.toLocaleString()}</p>
        <div className="flex items-center gap-3 text-xs">
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

      {/* Empty Return Toggle Section */}
      <div className="bg-white rounded-2xl p-5 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">빈 차 복귀 모드</h3>
          </div>
          <button
            onClick={() => setIsReturningEmpty(!isReturningEmpty)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isReturningEmpty 
                ? "bg-orange-500 text-white" 
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {isReturningEmpty ? (
              <>
                <ToggleRight className="w-5 h-5" />
                활성화됨
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                비활성화
              </>
            )}
          </button>
        </div>

        <AnimatePresence>
          {isReturningEmpty && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-5 gap-2 items-end mb-4 pt-2">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">현재 위치</Label>
                  <select
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {MAJOR_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-center items-center pb-2">
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">홈베이스</Label>
                  <select
                    value={homeBase}
                    onChange={(e) => setHomeBase(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {MAJOR_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground bg-orange-50 rounded-lg p-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>
                  <strong className="text-orange-600">{currentLocation} → {homeBase}</strong> 경로상의 환자를 자동으로 매칭합니다
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Return Trip Matching Section */}
      <div className="bg-white rounded-2xl p-5 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">귀경길 콜 매칭</h3>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
              <Bell className="w-3 h-3" />
              실시간
            </span>
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
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : matchedTrips.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              현재 경로에 맞는 콜이 없습니다
            </div>
          ) : (
            <>
              {/* Hot Matches - On Route */}
              {hotMatches.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-orange-600 flex items-center gap-1.5">
                    <Flame className="w-4 h-4" />
                    🔥 추천 경유 콜 ({hotMatches.length}건)
                  </p>
                  {hotMatches.map((trip) => (
                    <TripCard key={trip.id} trip={trip} isHot />
                  ))}
                </div>
              )}

              {/* Regular Matches */}
              {regularMatches.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    🔙 귀경길 콜 ({regularMatches.length}건)
                  </p>
                  {regularMatches.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              )}

              {/* Show all if not returning empty */}
              {!isReturningEmpty && matchedTrips.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    🔙 귀경길 콜 ({matchedTrips.length}건)
                  </p>
                  {matchedTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              )}
            </>
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
