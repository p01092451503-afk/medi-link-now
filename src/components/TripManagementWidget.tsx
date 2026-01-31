import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  MapPin,
  Play,
  CheckCircle2,
  X,
  Search,
  Loader2,
  Ambulance,
  Clock,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAmbulanceTrips } from "@/hooks/useAmbulanceTrips";
import { useDriverPresence } from "@/hooks/useDriverPresence";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GeofenceArrivalModal from "@/components/GeofenceArrivalModal";
import NavigationSelector from "@/components/NavigationSelector";
import FareInputModal, { type PaymentMethod } from "@/components/FareInputModal";
import { type CreateDrivingLogInput, type UpdateRevenueInput } from "@/hooks/useDrivingLogs";

interface HospitalOption {
  id: number;
  name: string;
  address: string;
  region: string;
  lat?: number;
  lng?: number;
}

interface TripManagementWidgetProps {
  onLogComplete?: (input: CreateDrivingLogInput) => Promise<string | null>;
  onRevenueUpdate?: (logId: string, data: UpdateRevenueInput) => void;
  isSimulateMode?: boolean;
}

const GEOFENCE_RADIUS_KM = 0.5; // 500m

const TripManagementWidget = ({ onLogComplete, onRevenueUpdate, isSimulateMode = false }: TripManagementWidgetProps) => {
  const { myActiveTrip, startTrip, completeTrip, cancelTrip, isLoading } = useAmbulanceTrips();
  const { updateStatus } = useDriverPresence();
  const [isSelectingHospital, setIsSelectingHospital] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [tripDuration, setTripDuration] = useState<string>("");
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [startLocation, setStartLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<HospitalOption | null>(null);
  const [showFareModal, setShowFareModal] = useState(false);
  const [pendingLogId, setPendingLogId] = useState<string | null>(null);
  const [completedHospitalName, setCompletedHospitalName] = useState<string>("");
  const geofenceWatchIdRef = useRef<number | null>(null);
  const hasShownArrivalModalRef = useRef(false);

  // Fetch hospitals from Supabase (including lat/lng for geofencing)
  useEffect(() => {
    const fetchHospitals = async () => {
      setIsLoadingHospitals(true);
      try {
        const { data, error } = await supabase
          .from("hospitals")
          .select("id, name, address, region, lat, lng")
          .order("name");

        if (error) throw error;
        setHospitals(data || []);
      } catch (error) {
        console.error("Error fetching hospitals:", error);
        toast.error("병원 목록을 불러오는데 실패했습니다");
      } finally {
        setIsLoadingHospitals(false);
      }
    };

    fetchHospitals();
  }, []);

  // Calculate trip duration
  useEffect(() => {
    if (!myActiveTrip) {
      setTripDuration("");
      return;
    }

    const updateDuration = () => {
      const startTime = new Date(myActiveTrip.started_at).getTime();
      const now = Date.now();
      const diffMs = now - startTime;
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      setTripDuration(`${diffMins}:${diffSecs.toString().padStart(2, "0")}`);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [myActiveTrip]);

  // Geofencing: Watch location and check proximity to destination
  useEffect(() => {
    if (!myActiveTrip || !destinationCoords || isSimulateMode) {
      return;
    }

    hasShownArrivalModalRef.current = false;

    const checkGeofence = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const distance = calculateDistance(
        latitude,
        longitude,
        destinationCoords.lat,
        destinationCoords.lng
      );

      console.log(`Distance to destination: ${distance.toFixed(2)}km`);

      if (distance <= GEOFENCE_RADIUS_KM && !hasShownArrivalModalRef.current) {
        hasShownArrivalModalRef.current = true;
        setShowArrivalModal(true);
      }
    };

    if (navigator.geolocation) {
      geofenceWatchIdRef.current = navigator.geolocation.watchPosition(
        checkGeofence,
        (error) => console.error("Geofence watch error:", error),
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        }
      );
    }

    return () => {
      if (geofenceWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geofenceWatchIdRef.current);
        geofenceWatchIdRef.current = null;
      }
    };
  }, [myActiveTrip, destinationCoords, isSimulateMode]);

  const filteredHospitals = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve) => {
      if (isSimulateMode) {
        resolve({ lat: 37.5665 + Math.random() * 0.1, lng: 126.978 + Math.random() * 0.1 });
        return;
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
          },
          () => resolve({ lat: 37.5665, lng: 126.978 }),
          { timeout: 5000, enableHighAccuracy: false }
        );
      } else {
        resolve({ lat: 37.5665, lng: 126.978 });
      }
    });
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSelectHospital = async (hospital: HospitalOption) => {
    try {
      const result = await startTrip(hospital.id, hospital.name);
      if (result) {
        setTripStartTime(new Date());
        setSelectedHospital(hospital);
        setIsSelectingHospital(false);
        setSearchQuery("");
        
        updateStatus("busy");
        
        if (hospital.lat && hospital.lng) {
          setDestinationCoords({
            lat: hospital.lat,
            lng: hospital.lng,
            name: hospital.name,
          });
        }
        
        getLocation().then(setStartLocation);
      }
    } catch (error) {
      console.error("Error starting trip:", error);
      toast.error("이송 시작에 실패했습니다");
    }
  };

  const handleCompleteTrip = async () => {
    const hospitalName = selectedHospital?.name || myActiveTrip?.destination_hospital_name || "";
    setCompletedHospitalName(hospitalName);
    
    if (tripStartTime && startLocation && onLogComplete) {
      const endLocation = await getLocation();
      const endTime = new Date();
      const distance = calculateDistance(
        startLocation.lat, startLocation.lng,
        endLocation.lat, endLocation.lng
      );

      const logInput: CreateDrivingLogInput = {
        startTime: tripStartTime,
        endTime: endTime,
        startLocation: { lat: startLocation.lat, lng: startLocation.lng },
        endLocation: { lat: endLocation.lat, lng: endLocation.lng },
        distanceKm: isSimulateMode ? Math.round(Math.random() * 20 + 5) : distance,
        patientName: myActiveTrip?.patient_condition || undefined,
        hospitalName: hospitalName,
        hospitalId: selectedHospital?.id || myActiveTrip?.destination_hospital_id,
      };
      
      const logId = await onLogComplete(logInput);
      if (logId) {
        setPendingLogId(logId);
        setShowFareModal(true);
      }
    }

    await completeTrip();
    
    updateStatus("available");
    
    setTripStartTime(null);
    setStartLocation(null);
    setDestinationCoords(null);
    setSelectedHospital(null);
    setShowArrivalModal(false);
  };

  const handleFareSubmit = (data: { revenueAmount: number; paymentMethod: PaymentMethod; revenueMemo?: string }) => {
    if (pendingLogId && onRevenueUpdate) {
      onRevenueUpdate(pendingLogId, data);
    }
    setShowFareModal(false);
    setPendingLogId(null);
    setCompletedHospitalName("");
  };

  const handleFareClose = () => {
    setShowFareModal(false);
    setPendingLogId(null);
    setCompletedHospitalName("");
  };

  const handleCancelTrip = async () => {
    await cancelTrip();
    
    updateStatus("available");
    
    setTripStartTime(null);
    setStartLocation(null);
    setDestinationCoords(null);
    setSelectedHospital(null);
    setShowArrivalModal(false);
  };

  const handleArrivalModalCancel = () => {
    setShowArrivalModal(false);
  };

  if (isLoading) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-40">
        <div className="bg-white rounded-2xl shadow-lg border border-border p-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeofenceArrivalModal
        isOpen={showArrivalModal}
        hospitalName={destinationCoords?.name || myActiveTrip?.destination_hospital_name || ""}
        onConfirm={handleCompleteTrip}
        onCancel={handleArrivalModalCancel}
      />

      <AnimatePresence>
        {myActiveTrip ? (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 z-40"
          >
            <div className="bg-white rounded-2xl shadow-lg border-2 border-primary p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Ambulance className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">이송 중</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{tripDuration}</span>
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  운행 중 (Busy)
                </span>
              </div>

              <div className="bg-muted/50 rounded-xl p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Navigation className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {myActiveTrip.destination_hospital_name}
                    </p>
                    {myActiveTrip.patient_condition && (
                      <p className="text-xs text-muted-foreground mt-1">
                        환자 상태: {myActiveTrip.patient_condition}
                      </p>
                    )}
                  </div>
                  {destinationCoords && (
                    <NavigationSelector
                      destination={destinationCoords}
                      variant="ghost"
                      size="sm"
                      showLabel={false}
                      className="h-8 w-8 p-0"
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelTrip}
                  className="flex-1 rounded-xl text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4 mr-1" />
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleCompleteTrip}
                  className="flex-[2] rounded-xl bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  도착 완료
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 z-40"
          >
            <Sheet open={isSelectingHospital} onOpenChange={setIsSelectingHospital}>
              <SheetTrigger asChild>
                <Button className="w-full rounded-2xl py-6 text-base shadow-lg bg-slate-800 hover:bg-slate-700">
                  <Play className="w-5 h-5 mr-2" />
                  이송 시작하기
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
                <SheetHeader className="mb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    목적지 병원 선택
                  </SheetTitle>
                </SheetHeader>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="병원명, 주소로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>

                <ScrollArea className="h-[calc(80vh-180px)]">
                  {isLoadingHospitals ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : filteredHospitals.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>검색 결과가 없습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-2 pr-4">
                      {filteredHospitals.map((hospital) => (
                        <button
                          key={hospital.id}
                          onClick={() => handleSelectHospital(hospital)}
                          className="w-full p-4 bg-muted/30 hover:bg-muted/50 rounded-xl text-left transition-colors"
                        >
                          <p className="font-medium text-foreground">{hospital.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {hospital.region}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fare Input Modal */}
      <FareInputModal
        isOpen={showFareModal}
        onClose={handleFareClose}
        onSubmit={handleFareSubmit}
        hospitalName={completedHospitalName}
      />
    </>
  );
};

export default TripManagementWidget;
