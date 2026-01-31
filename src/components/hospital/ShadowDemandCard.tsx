import { Ambulance, AlertTriangle, Users, Loader2 } from "lucide-react";
import { useHospitalEnRouteCount } from "@/hooks/useAmbulanceTrips";

interface ShadowDemandCardProps {
  hospitalId: string;
  officialBeds: number;
}

const ShadowDemandCard = ({ hospitalId, officialBeds }: ShadowDemandCardProps) => {
  // Real-time ambulance count from database
  const { count: ambulancesEnRoute, isLoading } = useHospitalEnRouteCount(hospitalId);
  const estimatedBeds = Math.max(0, officialBeds - ambulancesEnRoute);
  const hasConflict = ambulancesEnRoute > 0 && estimatedBeds < officialBeds;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Ambulance className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">실시간 이동 현황</h4>
          <p className="text-[10px] text-muted-foreground">Real-time Traffic</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Ambulances En Route */}
        <div className="bg-white rounded-lg p-2.5 border border-slate-100 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-3.5 h-3.5 text-orange-500" />
          </div>
          {isLoading ? (
            <Loader2 className="w-4 h-4 mx-auto text-orange-500 animate-spin" />
          ) : (
            <p className="text-lg font-bold text-orange-600">{ambulancesEnRoute}</p>
          )}
          <p className="text-[10px] text-muted-foreground">이동 중</p>
        </div>

        {/* Official Beds */}
        <div className="bg-white rounded-lg p-2.5 border border-slate-100 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">공식 데이터</p>
          <p className="text-lg font-bold text-slate-600">{officialBeds}</p>
          <p className="text-[10px] text-muted-foreground">병상</p>
        </div>

        {/* Estimated Beds - Highlighted */}
        <div className={`rounded-lg p-2.5 text-center border-2 ${
          estimatedBeds > 5 
            ? "bg-green-50 border-green-300" 
            : estimatedBeds > 0 
            ? "bg-yellow-50 border-yellow-300" 
            : "bg-red-50 border-red-300"
        }`}>
          <p className="text-[10px] text-muted-foreground mb-1">예상 가용</p>
          <p className={`text-xl font-bold ${
            estimatedBeds > 5 
              ? "text-green-600" 
              : estimatedBeds > 0 
              ? "text-yellow-600" 
              : "text-red-600"
          }`}>
            {estimatedBeds}
          </p>
          <p className="text-[10px] text-muted-foreground">병상</p>
        </div>
      </div>

      {/* Warning if there's shadow demand */}
      {hasConflict && (
        <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            <span className="font-medium">{ambulancesEnRoute}대의 구급차</span>가 현재 이 병원으로 이동 중입니다. 
            실제 가용 병상은 <span className="font-bold">{estimatedBeds}개</span>일 수 있습니다.
          </p>
        </div>
      )}

      {!hasConflict && ambulancesEnRoute === 0 && (
        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
          <span className="text-green-600">✓</span>
          <p className="text-xs text-green-700">
            현재 이 병원으로 이동 중인 구급차가 없습니다.
          </p>
        </div>
      )}

      {/* 119 Disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center mt-2 opacity-70">
        * 119 이송 정보는 포함되지 않았습니다.
      </p>
    </div>
  );
};

export default ShadowDemandCard;
