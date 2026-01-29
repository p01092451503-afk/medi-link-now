import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HospitalOption {
  id: number;
  name: string;
  address: string;
  region: string;
}

const TripManagementWidget = () => {
  const { myActiveTrip, startTrip, completeTrip, cancelTrip, isLoading } = useAmbulanceTrips();
  const [isSelectingHospital, setIsSelectingHospital] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [tripDuration, setTripDuration] = useState<string>("");

  // Fetch hospitals from Supabase
  useEffect(() => {
    const fetchHospitals = async () => {
      setIsLoadingHospitals(true);
      try {
        const { data, error } = await supabase
          .from("hospitals")
          .select("id, name, address, region")
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

  const filteredHospitals = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectHospital = async (hospital: HospitalOption) => {
    const result = await startTrip(hospital.id, hospital.name);
    if (result) {
      setIsSelectingHospital(false);
      setSearchQuery("");
    }
  };

  const handleCompleteTrip = async () => {
    await completeTrip();
  };

  const handleCancelTrip = async () => {
    await cancelTrip();
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
      {/* Active Trip Card */}
      <AnimatePresence>
        {myActiveTrip ? (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 z-40"
          >
            <div className="bg-white rounded-2xl shadow-lg border-2 border-primary p-4">
              {/* Trip Status Header */}
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
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  진행 중
                </span>
              </div>

              {/* Destination Info */}
              <div className="bg-muted/50 rounded-xl p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Navigation className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {myActiveTrip.destination_hospital_name}
                    </p>
                    {myActiveTrip.patient_condition && (
                      <p className="text-xs text-muted-foreground mt-1">
                        환자 상태: {myActiveTrip.patient_condition}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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
          /* Start Trip Button */
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 z-40"
          >
            <Sheet open={isSelectingHospital} onOpenChange={setIsSelectingHospital}>
              <SheetTrigger asChild>
                <Button className="w-full rounded-2xl py-6 text-base shadow-lg">
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

                {/* Search Input */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="병원명, 주소로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>

                {/* Hospital List */}
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
    </>
  );
};

export default TripManagementWidget;
