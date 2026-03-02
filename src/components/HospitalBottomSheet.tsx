import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Hospital, getHospitalStatus } from "@/data/hospitals";
import { X, Phone, Stethoscope, Baby, Thermometer, Info, AlertTriangle, Heart, Brain, Activity, Droplet, Star, Ambulance, Truck, Send, Clock, CheckCircle, ChevronRight, Radio } from "lucide-react";
import MoonlightBadge from "@/components/hospital/MoonlightBadge";
import { useMoonlightHospitals } from "@/hooks/useMoonlightHospitals";
import WaitTimePrediction from "@/components/hospital/WaitTimePrediction";
import { cleanHospitalName } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHotlines } from "@/components/HotlineManager";
import { toast } from "@/hooks/use-toast";
import ERRoadviewModal from "@/components/ERRoadviewModal";
import BedTrendIndicator from "@/components/hospital/BedTrendIndicator";
import ShadowDemandCard from "@/components/hospital/ShadowDemandCard";
import CongestionForecast from "@/components/hospital/CongestionForecast";

import AIAcceptanceBadge from "@/components/hospital/AIAcceptanceBadge";
import AcceptancePredictionPanel from "@/components/hospital/AcceptancePredictionPanel";
import Fire119VerifiedBadge from "@/components/hospital/Fire119VerifiedBadge";
import NavigationSelector from "@/components/NavigationSelector";
import QuickRejectionButton from "@/components/QuickRejectionButton";
import PatientTransferRequestModal from "@/components/PatientTransferRequestModal";
import TransferResultModal from "@/components/TransferResultModal";
import { useAuth } from "@/hooks/useAuth";
import { useIncomingAmbulancesForHospital } from "@/hooks/useIncomingAmbulances";
import { useTransferRequest } from "@/contexts/TransferRequestContext";
import { useTransferMode } from "@/contexts/TransferModeContext";
import { useLiveHospitalStatus } from "@/hooks/useLiveHospitalStatus";
import LiveStatusBadge from "@/components/hospital/LiveStatusBadge";
import ReportStatusModal from "@/components/ReportStatusModal";

interface HospitalBottomSheetProps {
  hospital: Hospital | null;
  onClose: () => void;
  distance?: number;
  userLocation?: [number, number] | null;
  onCallAmbulance?: () => void;
  allHospitals?: Hospital[];
}

const BedStatusCard = ({
  label,
  count,
  adjustedCount,
  incomingCount,
  icon: Icon,
  type,
  showTooltip,
  tooltipText,
  isHospitalFull,
  rawCount,
}: {
  label: string;
  count: number;
  adjustedCount?: number;
  incomingCount?: number;
  icon: React.ElementType;
  type: "general" | "pediatric" | "fever";
  showTooltip?: boolean;
  tooltipText?: string;
  isHospitalFull?: boolean;
  rawCount?: number;
}) => {
  const displayCount = adjustedCount !== undefined ? adjustedCount : Math.max(0, count);
  const hasIncoming = incomingCount !== undefined && incomingCount > 0;
  const isAvailable = displayCount > 0;
  // Detect overcrowded state: raw NEDIS value is negative
  const isOvercrowded = (rawCount !== undefined && rawCount < 0) || (count < 0 && adjustedCount === undefined);
  const overflowCount = isOvercrowded ? Math.abs(rawCount ?? count) : 0;

  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-2xl ${
      isOvercrowded ? "bg-destructive/10 ring-1 ring-destructive/20" : "bg-secondary"
    }`}>
      <Icon className={`w-5 h-5 mb-1.5 ${
        isOvercrowded ? "text-destructive" : isAvailable ? "text-foreground" : "text-muted-foreground/50"
      }`} />
      {isOvercrowded ? (
        <>
          <span className="text-2xl font-bold tracking-tight text-destructive">0</span>
          <div className="flex flex-col items-center gap-0.5 mt-1">
            <span className="text-[11px] text-muted-foreground">{label}</span>
            <span className="text-[10px] font-bold text-destructive animate-pulse">
              초과 {overflowCount}명
            </span>
          </div>
        </>
      ) : (
        <>
          <span className={`text-2xl font-bold tracking-tight ${
            isAvailable ? "text-foreground" : isHospitalFull ? "text-destructive" : "text-muted-foreground/40"
          }`}>
            {displayCount}
          </span>
          <div className="flex flex-col items-center gap-0.5 mt-1">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">{label}</span>
              {showTooltip && tooltipText && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground/50" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-[200px]">{tooltipText}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {hasIncoming && (
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-0.5">
                <Truck className="w-3 h-3" />
                이송 중 {incomingCount}대
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const AcceptanceBadge = ({
  label,
  available,
  icon: Icon,
}: {
  label: string;
  available: boolean;
  icon: React.ElementType;
}) => (
  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium ${
    available
      ? "bg-secondary text-foreground"
      : "bg-secondary text-muted-foreground/40"
  }`}>
    <Icon className="w-4 h-4" />
    <span>{label}</span>
    <span className="ml-auto text-[11px]">{available ? "가능" : "불가"}</span>
  </div>
);

const HospitalBottomSheet = ({ hospital, onClose, distance, userLocation, onCallAmbulance, allHospitals }: HospitalBottomSheetProps) => {
  const [searchParams] = useSearchParams();
  const { addHotline, removeHotline, isHotline, hotlines } = useHotlines();
  const { user } = useAuth();
  const { getRequestByHospitalId } = useTransferRequest();
  const { isTransferMode } = useTransferMode();
  const [showRoadview, setShowRoadview] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [lastRequestId, setLastRequestId] = useState<string>("");
  
  const isParamedicMode = searchParams.get("role") === "paramedic";
  const isDriverMode = searchParams.get("mode") === "driver";
  const showTransferButton = isTransferMode || isParamedicMode || isDriverMode;
  
  const { incomingCount } = useIncomingAmbulancesForHospital(hospital?.id);
  const { isMoonlightHospital } = useMoonlightHospitals();
  const liveStatus = useLiveHospitalStatus(hospital?.id);
  
  const existingRequest = hospital ? getRequestByHospitalId(hospital.id) : undefined;
  
  if (!hospital) return null;

  const status = getHospitalStatus(hospital);
  const totalBeds = hospital.beds.general + hospital.beds.pediatric + hospital.beds.fever;
  const hasPediatric = hospital.beds.pediatric > 0;
  const isFavorite = isHotline(hospital.phone);
  
  const adjustedGeneralBeds = Math.max(0, hospital.beds.general - incomingCount);
  const adjustedTotalBeds = Math.max(0, totalBeds - incomingCount);

  const handleCall = () => {
    window.location.href = `tel:${hospital.phone}`;
  };

  const handleToggleHotline = () => {
    if (isFavorite) {
      const hotline = hotlines.find((h) => h.phone === hospital.phone);
      if (hotline) {
        removeHotline(hotline.id);
        toast({ title: "핫라인에서 제거되었습니다" });
      }
    } else {
      addHotline(cleanHospitalName(hospital.nameKr), hospital.phone);
      toast({ title: "핫라인에 추가되었습니다", description: "드라이버 대시보드에서 확인하세요" });
    }
  };

  const statusConfig = {
    unavailable: { label: "만실", dotClass: "bg-destructive" },
    limited: { label: "혼잡", dotClass: "bg-foreground/50" },
    available: { label: "여유", dotClass: "bg-foreground" },
  };

  const currentStatus = statusConfig[status] || statusConfig.available;

  return (
    <AnimatePresence>
      {hospital && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[1001]"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 500 }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-2xl z-[1002] max-h-[85vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
            </div>

            <div className="px-5 pb-8 pt-1 max-h-[75vh] overflow-y-auto">
              {/* Alert Message */}
              {hospital.alertMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-destructive/5 border border-destructive/10 rounded-2xl flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">실시간 안내</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{hospital.alertMessage}</p>
                  </div>
                </motion.div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-secondary text-foreground">
                      <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dotClass}`} />
                      {currentStatus.label}
                    </span>
                    {hospital.isTraumaCenter && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-foreground">
                        권역외상센터
                      </span>
                    )}
                    {hasPediatric && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-foreground">
                        아이 진료
                      </span>
                    )}
                    <MoonlightBadge isMoonlight={isMoonlightHospital(hospital.nameKr)} />
                    {distance && (
                      <span className="text-xs text-muted-foreground">
                        {distance.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">
                    {cleanHospitalName(hospital.nameKr)}
                  </h2>
                  <p className="text-[13px] text-muted-foreground mt-0.5">{hospital.name}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{hospital.category}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Live Status Badge */}
              {liveStatus.isLive && liveStatus.status && liveStatus.minutesAgo !== null && (
                <div className="mb-4">
                  <LiveStatusBadge
                    status={liveStatus.status}
                    minutesAgo={liveStatus.minutesAgo}
                    comment={liveStatus.report?.comment}
                  />
                </div>
              )}


              {/* 119 Verified Badge */}
              <Fire119VerifiedBadge
                hospitalName={hospital.nameKr}
                hospitalId={hospital.id}
                showChart={true}
              />

              {/* AI Predictive Section */}
              <div className="relative mb-6 p-4 rounded-2xl bg-secondary border border-border">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">AI 예측 분석</h3>
                      <span className="text-[9px] font-bold text-background bg-foreground px-2 py-0.5 rounded-full">
                        BETA
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Predictive Analytics</p>
                  </div>
                  <BedTrendIndicator hospitalId={hospital.id?.toString() || hospital.name} />
                </div>
                
                {/* Cards */}
                <div className="space-y-3">
                  <CongestionForecast 
                    hospitalId={hospital.id?.toString() || hospital.name}
                    officialBeds={totalBeds}
                    hospitalName={hospital.nameKr}
                    hospitalNumericId={hospital.id}
                  />
                  {/* ShadowDemandCard hidden - no incoming data currently */}
                </div>
              </div>

              {/* AI Acceptance Prediction Panel */}
              <div className="mb-6">
                <AcceptancePredictionPanel hospitalId={hospital.id} hospital={hospital} allHospitals={allHospitals} />
              </div>

              {/* Bed Status Grid */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">실질 가용 병상</h3>
                  {incomingCount > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground">
                            <Truck className="w-3 h-3" />
                            이송 중 {incomingCount}대
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-[200px]">
                            현재 이 병원으로 향하는 구급차가 {incomingCount}대 있어,<br/>
                            공식 병상에서 차감하여 실질 가용 병상을 표시합니다.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <AIAcceptanceBadge hospitalId={hospital.id} />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-6">
                <BedStatusCard
                  label="성인"
                  count={hospital.beds.general}
                  adjustedCount={adjustedGeneralBeds}
                  incomingCount={incomingCount}
                  icon={Stethoscope}
                  type="general"
                  isHospitalFull={status === "unavailable"}
                  rawCount={hospital.beds.general}
                />
                <BedStatusCard
                  label="소아"
                  count={hospital.beds.pediatric}
                  icon={Baby}
                  type="pediatric"
                  isHospitalFull={status === "unavailable"}
                  rawCount={hospital.beds.pediatric}
                />
                <BedStatusCard
                  label="열/감염"
                  count={hospital.beds.fever}
                  icon={Thermometer}
                  type="fever"
                  showTooltip={true}
                  tooltipText="고열(38℃+) 및 감염 환자 전용"
                  isHospitalFull={status === "unavailable"}
                />
              </div>

              {/* Wait Time Prediction removed — consolidated into AcceptancePredictionPanel */}

              {/* Procedure Availability */}
              {hospital.acceptance && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-foreground mb-3">
                    수용/시술 가능 여부
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <AcceptanceBadge label="심근경색" available={hospital.acceptance.heart} icon={Heart} />
                    <AcceptanceBadge label="뇌출혈" available={hospital.acceptance.brainBleed} icon={Brain} />
                    <AcceptanceBadge label="뇌경색" available={hospital.acceptance.brainStroke} icon={Brain} />
                    <AcceptanceBadge label="응급내시경" available={hospital.acceptance.endoscopy} icon={Activity} />
                    <AcceptanceBadge label="응급투석" available={hospital.acceptance.dialysis} icon={Droplet} />
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="bg-secondary rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-1.5">
                  <Phone className="w-4 h-4 text-foreground/70" />
                  <span className="text-sm font-semibold text-foreground flex-1">{hospital.phone}</span>
                  <button
                    onClick={handleToggleHotline}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                    aria-label={isFavorite ? "핫라인에서 제거" : "핫라인에 추가"}
                  >
                    <Star 
                      className={`w-5 h-5 transition-colors ${
                        isFavorite 
                          ? "text-foreground fill-foreground" 
                          : "text-muted-foreground/30"
                      }`} 
                    />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground pl-7">{hospital.address}</p>
              </div>

              {/* Digital Transfer Request - Transfer Mode */}
              {showTransferButton && (
                existingRequest ? (
                  <div className={`w-full mb-3 py-4 px-4 rounded-2xl border flex items-center justify-center gap-2 ${
                    existingRequest.status === "pending" 
                      ? "bg-secondary border-border text-muted-foreground"
                      : existingRequest.status === "accepted"
                      ? "bg-secondary border-border text-foreground"
                      : "bg-destructive/5 border-destructive/10 text-destructive"
                  }`}>
                    {existingRequest.status === "pending" ? (
                      <>
                        <Clock className="w-5 h-5 animate-pulse" />
                        <span className="font-semibold">승인 대기 중</span>
                      </>
                    ) : existingRequest.status === "accepted" ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">요청 승인됨</span>
                      </>
                    ) : (
                      <>
                        <X className="w-5 h-5" />
                        <span className="font-semibold">요청 거절됨</span>
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="w-full mb-3 py-4 rounded-2xl bg-foreground text-background font-semibold text-[15px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    <Send className="w-4 h-4" />
                    디지털 이송 요청
                  </button>
                )
              )}

              {/* ER Roadview - Driver/Paramedic only */}
              {showTransferButton && (
                <button
                  onClick={() => setShowRoadview(true)}
                  className="w-full mb-3 py-4 rounded-2xl bg-secondary text-foreground font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-muted transition-colors"
                >
                  응급실 입구 로드뷰
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              )}

              {/* Quick Rejection - Driver/Paramedic only */}
              {showTransferButton && user && hospital.id && (
                <div className="mb-4">
                  <QuickRejectionButton
                    hospitalId={hospital.id}
                    hospitalName={cleanHospitalName(hospital.nameKr)}
                    variant="button"
                    className="w-full py-4 rounded-2xl font-medium"
                  />
                </div>
              )}

              {/* Live Report Button - Driver/Paramedic only */}
              {(isParamedicMode || isDriverMode) && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full mb-3 py-4 rounded-2xl bg-secondary text-foreground font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-muted transition-colors border border-border"
                >
                  <Radio className="w-4 h-4" />
                  현장 상황 제보하기
                </button>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCall}
                  className="bg-foreground text-background font-semibold h-14 rounded-2xl flex items-center justify-center gap-2 text-[14px] hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <Phone className="w-4 h-4" />
                  응급실 전화
                </button>
                <NavigationSelector
                  destination={{
                    lat: hospital.lat,
                    lng: hospital.lng,
                    name: cleanHospitalName(hospital.nameKr),
                  }}
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary font-semibold h-14 rounded-2xl"
                />
              </div>

              {/* Private Ambulance Call Button - Guardian/Patient Mode (below action buttons) */}
              {!showTransferButton && onCallAmbulance && (
                <div className="mt-3">
                  <button
                    onClick={onCallAmbulance}
                    className="w-full py-4 rounded-2xl bg-foreground text-background font-semibold text-[15px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    <Ambulance className="w-5 h-5" />
                    이 병원으로 사설 구급차 부르기
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* ER Roadview Modal */}
          <ERRoadviewModal
            isOpen={showRoadview}
            onClose={() => setShowRoadview(false)}
            hospitalName={cleanHospitalName(hospital.nameKr)}
            entranceLat={hospital.entrance_lat}
            entranceLng={hospital.entrance_lng}
            hospitalLat={hospital.lat}
            hospitalLng={hospital.lng}
          />

          {/* Patient Transfer Request Modal */}
          <PatientTransferRequestModal
            isOpen={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            hospitalId={hospital.id}
            hospitalName={cleanHospitalName(hospital.nameKr)}
            onRequestSent={(requestId: string) => {
              setLastRequestId(requestId);
              setShowResultModal(true);
            }}
          />

          {/* Transfer Result Modal */}
          <TransferResultModal
            isOpen={showResultModal}
            onClose={() => setShowResultModal(false)}
            hospitalId={hospital.id}
            hospitalName={cleanHospitalName(hospital.nameKr)}
            requestId={lastRequestId}
          />

          {/* Report Status Modal */}
          <ReportStatusModal
            isOpen={showReportModal}
            onClose={() => { setShowReportModal(false); liveStatus.refetch(); }}
            hospitalId={hospital.id}
            hospitalName={cleanHospitalName(hospital.nameKr)}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default HospitalBottomSheet;
