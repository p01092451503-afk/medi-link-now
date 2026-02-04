import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Phone, MapPin, Building2, Bed } from "lucide-react";
import { NursingHospital } from "@/hooks/useNursingHospitals";
import NavigationSelector from "./NavigationSelector";

interface NursingHospitalBottomSheetProps {
  hospital: NursingHospital | null;
  isOpen: boolean;
  onClose: () => void;
}

const NursingHospitalBottomSheet = ({
  hospital,
  isOpen,
  onClose,
}: NursingHospitalBottomSheetProps) => {
  if (!hospital) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-3xl max-h-[60vh] overflow-y-auto px-5 pb-8"
      >
        <SheetHeader className="pb-2">
          {/* Drag Handle */}
          <div className="flex justify-center pt-2 pb-4">
            <div className="w-10 h-1 bg-muted rounded-full" />
          </div>
          
          {/* Hospital Name & Type */}
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                {hospital.type}
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">{hospital.name}</h2>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Phone */}
          {hospital.phone && (
            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">전화번호</p>
                <a 
                  href={`tel:${hospital.phone}`} 
                  className="text-lg font-semibold text-foreground hover:text-purple-600 transition-colors"
                >
                  {hospital.phone}
                </a>
              </div>
            </div>
          )}

          {/* Address */}
          <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">주소</p>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {hospital.address}
              </p>
            </div>
          </div>

          {/* Beds (if available) */}
          {hospital.beds && hospital.beds > 0 && (
            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Bed className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">병상 수</p>
                <p className="text-lg font-semibold text-foreground">
                  {hospital.beds}개
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex gap-3">
            {/* Phone Call Button */}
            {hospital.phone && (
              <a
                href={`tel:${hospital.phone}`}
                className="flex-1 h-14 flex items-center justify-center gap-2 bg-purple-600 text-white rounded-2xl font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/30"
              >
                <Phone className="w-5 h-5" />
                병원 전화
              </a>
            )}
            
            {/* Navigation Button */}
            <div className={hospital.phone ? "flex-1" : "w-full"}>
              <NavigationSelector
                destination={{
                  lat: hospital.lat,
                  lng: hospital.lng,
                  name: hospital.name,
                }}
                variant="outline"
                size="lg"
                className="w-full h-14 justify-center border-purple-300 text-purple-600 hover:bg-purple-50 rounded-2xl"
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NursingHospitalBottomSheet;
