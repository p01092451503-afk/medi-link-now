import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Hospital, getHospitalStatus } from "@/data/hospitals";
import { X, Phone, Stethoscope, Baby, Thermometer, Info, AlertTriangle, Heart, Brain, Activity, Droplet, Star, Ambulance, Truck, Send, Clock, CheckCircle } from "lucide-react";
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
import Fire119VerifiedBadge from "@/components/hospital/Fire119VerifiedBadge";
import NavigationSelector from "@/components/NavigationSelector";
import QuickRejectionButton from "@/components/QuickRejectionButton";
import PatientTransferRequestModal from "@/components/PatientTransferRequestModal";
import TransferResultModal from "@/components/TransferResultModal";
import { useAuth } from "@/hooks/useAuth";
import { useIncomingAmbulancesForHospital } from "@/hooks/useIncomingAmbulances";
import { useTransferRequest } from "@/contexts/TransferRequestContext";
import { useTransferMode } from "@/contexts/TransferModeContext";
interface HospitalBottomSheetProps {
  hospital: Hospital | null;
  onClose: () => void;
  distance?: number;
  userLocation?: [number, number] | null;
  onCallAmbulance?: () => void;
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
}) => {
  // 음수 병상은 0으로 표시 (API 데이터 이상값 처리)
  const displayCount = adjustedCount !== undefined ? adjustedCount : Math.max(0, count);
  const hasIncoming = incomingCount !== undefined && incomingCount > 0;
  
  // 0보다 크면 여유, 0이면 병원 전체 만실 여부에 따라 색상 결정
  const isAvailable = displayCount > 0;

  // 색상 결정: 
  // - 여유 = 초록
  // - 없음 + 병원 만실 = 빨강
  // - 없음 + 병원 여유/혼잡 = 회색 (해당 병상만 없는 것)
  let bgColor: string;
  let textColor: string;
  
  if (isAvailable) {
    bgColor = "bg-green-50 dark:bg-green-950/50";
    textColor = "text-green-600 dark:text-green-400";
  } else if (isHospitalFull) {
    bgColor = "bg-red-50 dark:bg-red-950/50";
    textColor = "text-red-500 dark:text-red-400";
  } else {
    bgColor = "bg-gray-50 dark:bg-slate-800";
    textColor = "text-gray-400 dark:text-slate-500";
  }

  return (
    <div
      className={`flex flex-col items-center justify-center p-3 rounded-xl ${bgColor}`}
    >
      <Icon
        className={`w-5 h-5 mb-1 ${textColor}`}
      />
      <span
        className={`text-xl font-bold ${textColor}`}
      >
        {displayCount}
      </span>
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground text-center">{label}</span>
          {showTooltip && tooltipText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {hasIncoming && (
          <span className="text-[10px] text-orange-500 font-medium flex items-center gap-0.5">
            <Truck className="w-3 h-3" />
            이송 중 {incomingCount}대
          </span>
        )}
      </div>
    </div>
  );
};

// Acceptance badge component
const AcceptanceBadge = ({
  label,
  available,
  icon: Icon,
}: {
  label: string;
  available: boolean;
  icon: React.ElementType;
}) => (
  <div
    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
      available
        ? "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
        : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-700"
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    <span>{label}</span>
    <span className="ml-auto">{available ? "✅" : "❌"}</span>
  </div>
);

const HospitalBottomSheet = ({ hospital, onClose, distance, userLocation, onCallAmbulance }: HospitalBottomSheetProps) => {
  const [searchParams] = useSearchParams();
  const { addHotline, removeHotline, isHotline, hotlines } = useHotlines();
  const { user } = useAuth();
  const { getRequestByHospitalId } = useTransferRequest();
  const { isTransferMode } = useTransferMode();
  const [showRoadview, setShowRoadview] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastRequestId, setLastRequestId] = useState<string>("");
  
  // Check if in paramedic/driver mode
  const isParamedicMode = searchParams.get("role") === "paramedic";
  const isDriverMode = searchParams.get("mode") === "driver";
  const showTransferButton = isTransferMode || isParamedicMode || isDriverMode;
  
  // 이송 중인 구급차 수 가져오기
  const { incomingCount } = useIncomingAmbulancesForHospital(hospital?.id);
  const { isMoonlightHospital } = useMoonlightHospitals();
  
  // Get existing transfer request for this hospital
  const existingRequest = hospital ? getRequestByHospitalId(hospital.id) : undefined;
  
  if (!hospital) return null;

  const status = getHospitalStatus(hospital);
  const totalBeds = hospital.beds.general + hospital.beds.pediatric + hospital.beds.fever;
  const hasPediatric = hospital.beds.pediatric > 0;
  const isFavorite = isHotline(hospital.phone);
  
  // 실질 가용 병상 계산 (이송 중 차량 수 차감)
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
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl z-[1002] max-h-[85vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-slate-600 rounded-full" />
            </div>

            <div className="px-5 pb-8 pt-1 max-h-[75vh] overflow-y-auto">
              {/* Alert Message */}
              {hospital.alertMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-start gap-2"
                >
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">실시간 안내</p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-0.5">{hospital.alertMessage}</p>
                  </div>
                </motion.div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        status === "unavailable"
                          ? "bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400"
                          : status === "limited"
                          ? "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400"
                          : "bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full animate-pulse ${
                          status === "unavailable"
                            ? "bg-red-500"
                            : status === "limited"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      />
                      {status === "unavailable"
                        ? "만실"
                        : status === "limited"
                        ? "혼잡"
                        : "여유"}
                    </span>
                    {hospital.isTraumaCenter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                        🏥 권역외상센터
                      </span>
                    )}
                    {hasPediatric && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                        👶 아이 진료
                      </span>
                    )}
                    {/* Moonlight Hospital Badge - only for officially designated hospitals */}
                    <MoonlightBadge isMoonlight={isMoonlightHospital(hospital.nameKr)} />
                    {distance && (
                      <span className="text-xs text-muted-foreground">
                        {distance.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-0.5">
                    {cleanHospitalName(hospital.nameKr)}
                  </h2>
                  <p className="text-sm text-muted-foreground">{hospital.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{hospital.category}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Private Ambulance Call Button - Guardian/Patient Mode (Top Priority) */}
              {!showTransferButton && onCallAmbulance && (
                <div className="mb-4">
                  <Button
                    onClick={onCallAmbulance}
                    className="w-full py-5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-red-500/20"
                  >
                    <Ambulance className="w-5 h-5 mr-2" />
                    이 병원으로 사설 구급차 부르기
                  </Button>
                </div>
              )}

              {/* 119 Verified Badge - Historical Transfer Data */}
              <Fire119VerifiedBadge 
                hospitalName={hospital.nameKr}
                hospitalId={hospital.id}
                showChart={true}
              />

              {/* AI Predictive Features Section - Premium Design */}
              <div className="relative mb-6 p-4 rounded-2xl bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 dark:from-violet-950/50 dark:via-indigo-950/50 dark:to-blue-950/50 border border-violet-200/50 dark:border-violet-800/50 shadow-xl shadow-violet-500/10 overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br from-violet-400/20 to-indigo-400/20 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-400/20 blur-2xl" />
                
                {/* Header */}
                <div className="relative flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">AI 예측 분석</h3>
                      <span className="text-[9px] font-bold text-white bg-gradient-to-r from-violet-500 to-indigo-500 px-2 py-0.5 rounded-full shadow-sm">
                        BETA
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Predictive Analytics</p>
                  </div>
                  <BedTrendIndicator hospitalId={hospital.id?.toString() || hospital.name} />
                </div>
                
                {/* Cards Container */}
                <div className="relative space-y-3">
                  {/* Congestion Forecast */}
                  <CongestionForecast 
                    hospitalId={hospital.id?.toString() || hospital.name}
                    officialBeds={totalBeds}
                  />
                  
                  {/* Shadow Demand Visualization */}
                  <ShadowDemandCard 
                    hospitalId={hospital.id?.toString() || hospital.name}
                    officialBeds={totalBeds}
                  />
                </div>
              </div>

              {/* Bed Status Grid */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">실질 가용 병상</h3>
                  {incomingCount > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
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
                {/* AI Acceptance Prediction Badge */}
                <AIAcceptanceBadge hospitalId={hospital.id} />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <BedStatusCard
                  label="성인"
                  count={hospital.beds.general}
                  adjustedCount={adjustedGeneralBeds}
                  incomingCount={incomingCount}
                  icon={Stethoscope}
                  type="general"
                  isHospitalFull={status === "unavailable"}
                />
                <BedStatusCard
                  label="소아"
                  count={hospital.beds.pediatric}
                  icon={Baby}
                  type="pediatric"
                  isHospitalFull={status === "unavailable"}
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

              {/* Wait Time Prediction */}
              <div className="mb-5">
                <WaitTimePrediction
                  hospitalId={hospital.id}
                  totalBeds={
                    Math.max(0, hospital.beds?.general || 0) +
                    Math.max(0, hospital.beds?.pediatric || 0) +
                    Math.max(0, hospital.beds?.fever || 0)
                  }
                />
              </div>

              {/* Procedure Availability Section */}
              {hospital.acceptance && (
                <div className="mb-5">
                  <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-primary" />
                    수용/시술 가능 여부
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <AcceptanceBadge
                      label="심근경색"
                      available={hospital.acceptance.heart}
                      icon={Heart}
                    />
                    <AcceptanceBadge
                      label="뇌출혈"
                      available={hospital.acceptance.brainBleed}
                      icon={Brain}
                    />
                    <AcceptanceBadge
                      label="뇌경색"
                      available={hospital.acceptance.brainStroke}
                      icon={Brain}
                    />
                    <AcceptanceBadge
                      label="응급내시경"
                      available={hospital.acceptance.endoscopy}
                      icon={Activity}
                    />
                    <AcceptanceBadge
                      label="응급투석"
                      available={hospital.acceptance.dialysis}
                      icon={Droplet}
                    />
                  </div>
                </div>
              )}


              {/* Contact Info */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium flex-1">{hospital.phone}</span>
                  <button
                    onClick={handleToggleHotline}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    aria-label={isFavorite ? "핫라인에서 제거" : "핫라인에 추가"}
                  >
                    <Star 
                      className={`w-5 h-5 transition-colors ${
                        isFavorite 
                          ? "text-yellow-500 fill-yellow-500" 
                          : "text-gray-400"
                      }`} 
                    />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground pl-7">{hospital.address}</p>
              </div>

              {/* Digital Transfer Request Button - Transfer Mode, Paramedic, or Driver */}
              {showTransferButton && (
                existingRequest ? (
                  <div className={`w-full mb-3 py-4 px-4 rounded-xl border-2 flex items-center justify-center gap-2 ${
                    existingRequest.status === "pending" 
                      ? "bg-yellow-50 dark:bg-yellow-950/50 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400"
                      : existingRequest.status === "accepted"
                      ? "bg-green-50 dark:bg-green-950/50 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
                      : "bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400"
                  }`}>
                    {existingRequest.status === "pending" ? (
                      <>
                        <Clock className="w-5 h-5 animate-pulse" />
                        <span className="font-semibold">승인 대기 중 ⏳</span>
                      </>
                    ) : existingRequest.status === "accepted" ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">요청 승인됨 ✅</span>
                      </>
                    ) : (
                      <>
                        <X className="w-5 h-5" />
                        <span className="font-semibold">요청 거절됨 ❌</span>
                      </>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowTransferModal(true)}
                    className="w-full mb-3 py-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    디지털 이송 요청 (Request Transfer)
                  </Button>
                )
              )}


              {/* ER Entrance Roadview Button - Driver/Paramedic only */}
              {showTransferButton && (
                <Button
                  onClick={() => setShowRoadview(true)}
                  variant="outline"
                  className="w-full mb-3 py-5 rounded-xl border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 font-medium"
                >
                  <Ambulance className="w-5 h-5 mr-2" />
                  응급실 입구 로드뷰 (ER Entrance View)
                </Button>
              )}

              {/* Quick Rejection Report Button - Driver/Paramedic only */}
              {showTransferButton && user && hospital.id && (
                <div className="mb-4">
                  <QuickRejectionButton
                    hospitalId={hospital.id}
                    hospitalName={cleanHospitalName(hospital.nameKr)}
                    variant="button"
                    className="w-full py-5 rounded-xl font-medium"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleCall}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-14 rounded-xl"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  응급실 전화
                </Button>
                <NavigationSelector
                  destination={{
                    lat: hospital.lat,
                    lng: hospital.lng,
                    name: cleanHospitalName(hospital.nameKr),
                  }}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/5 font-semibold h-14 rounded-xl"
                />
              </div>
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

        </>
      )}
    </AnimatePresence>
  );
};

export default HospitalBottomSheet;
