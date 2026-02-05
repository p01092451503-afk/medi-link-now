 import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
 import { Button } from "@/components/ui/button";
 import { Phone, Clock, MapPin, Building2 } from "lucide-react";
 import type { HospitalDetailData } from "@/hooks/useHospitalDetails";
 import { formatOperatingHours } from "@/hooks/useHospitalDetails";
 
 interface NightCareHospitalBottomSheetProps {
   hospital: HospitalDetailData | null;
   isOpen: boolean;
   onClose: () => void;
 }
 
 const NightCareHospitalBottomSheet = ({ hospital, isOpen, onClose }: NightCareHospitalBottomSheetProps) => {
   if (!hospital) return null;
 
   const handleCall = () => {
     if (hospital.phone) {
       window.location.href = `tel:${hospital.phone}`;
     }
   };
 
   return (
     <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
       <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-3xl">
         <SheetHeader className="pb-4 border-b">
           <div className="flex items-start gap-3">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
               <span className="text-xl">🌃</span>
             </div>
             <div className="flex-1 text-left">
               <SheetTitle className="text-lg font-bold">{hospital.hospitalName}</SheetTitle>
               <SheetDescription className="text-sm text-indigo-600 font-medium">
                 야간진료 일반병원
               </SheetDescription>
             </div>
           </div>
         </SheetHeader>
 
         <div className="py-4 space-y-4">
           {/* Address */}
           {hospital.address && (
             <div className="flex items-start gap-3">
               <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
               <span className="text-sm">{hospital.address}</span>
             </div>
           )}
 
           {/* Phone */}
           {hospital.phone && (
             <div className="flex items-center gap-3">
               <Phone className="w-5 h-5 text-muted-foreground" />
               <a href={`tel:${hospital.phone}`} className="text-sm text-primary hover:underline">
                 {hospital.phone}
               </a>
             </div>
           )}
 
           {/* Operating Hours */}
           <div className="space-y-2">
             <div className="flex items-center gap-2">
               <Clock className="w-5 h-5 text-muted-foreground" />
               <span className="text-sm font-medium">진료시간</span>
             </div>
             <div className="ml-7 grid grid-cols-2 gap-2 text-sm">
               <div className="flex justify-between">
                 <span className="text-muted-foreground">월요일</span>
                 <span>{formatOperatingHours(hospital.operatingHours.monday)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">화요일</span>
                 <span>{formatOperatingHours(hospital.operatingHours.tuesday)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">수요일</span>
                 <span>{formatOperatingHours(hospital.operatingHours.wednesday)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">목요일</span>
                 <span>{formatOperatingHours(hospital.operatingHours.thursday)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">금요일</span>
                 <span>{formatOperatingHours(hospital.operatingHours.friday)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">토요일</span>
                 <span>{formatOperatingHours(hospital.operatingHours.saturday)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">일요일</span>
                 <span>{formatOperatingHours(hospital.operatingHours.sunday)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">공휴일</span>
                 <span>{formatOperatingHours(hospital.operatingHours.holiday)}</span>
               </div>
             </div>
           </div>
 
           {/* Departments */}
           {hospital.departments.length > 0 && (
             <div className="space-y-2">
               <div className="flex items-center gap-2">
                 <Building2 className="w-5 h-5 text-muted-foreground" />
                 <span className="text-sm font-medium">진료과목</span>
               </div>
               <div className="ml-7 flex flex-wrap gap-1.5">
                 {hospital.departments.slice(0, 10).map((dept, idx) => (
                   <span
                     key={idx}
                     className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
                   >
                     {dept}
                   </span>
                 ))}
                 {hospital.departments.length > 10 && (
                   <span className="px-2 py-1 text-muted-foreground text-xs">
                     +{hospital.departments.length - 10}
                   </span>
                 )}
               </div>
             </div>
           )}
         </div>
 
         {/* Action Button */}
         <div className="pt-4 border-t">
           <Button
             onClick={handleCall}
             className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
             disabled={!hospital.phone}
           >
             <Phone className="w-4 h-4 mr-2" />
             전화하기
           </Button>
         </div>
       </SheetContent>
     </Sheet>
   );
 };
 
 export default NightCareHospitalBottomSheet;