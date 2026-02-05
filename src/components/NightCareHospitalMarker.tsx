 import { Marker, Tooltip } from "react-leaflet";
 import L from "leaflet";
 import type { HospitalDetailData } from "@/hooks/useHospitalDetails";
 
 interface NightCareHospitalMarkerProps {
   hospital: HospitalDetailData;
   onClick?: (hospital: HospitalDetailData) => void;
 }
 
 const createNightCareMarkerIcon = () => {
   return L.divIcon({
     className: "custom-marker",
     html: `
       <style>
         .nightcare-marker-container {
           transition: transform 0.2s ease-out;
         }
         .nightcare-marker-container:hover {
           transform: scale(1.15);
         }
       </style>
       <div class="nightcare-marker-container" style="
         position: relative;
         display: flex;
         flex-direction: column;
         align-items: center;
         cursor: pointer;
       ">
         <div style="
           position: relative;
           width: 42px;
           height: 42px;
           background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
           border: 2px solid #4338CA;
           border-radius: 50%;
           display: flex;
           align-items: center;
           justify-content: center;
           box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
           cursor: pointer;
         ">
           <span style="
             color: white;
             font-size: 16px;
             line-height: 1;
           ">🌃</span>
         </div>
         <div style="
           width: 0;
           height: 0;
           border-left: 7px solid transparent;
           border-right: 7px solid transparent;
           border-top: 8px solid #4338CA;
           margin-top: -2px;
         "></div>
       </div>
     `,
     iconSize: [42, 58],
     iconAnchor: [21, 50],
     popupAnchor: [0, -50],
   });
 };
 
 const NightCareHospitalMarker = ({ hospital, onClick }: NightCareHospitalMarkerProps) => {
   if (!hospital.lat || !hospital.lng) return null;
   
   const icon = createNightCareMarkerIcon();
 
   return (
     <Marker
       position={[hospital.lat, hospital.lng]}
       icon={icon}
       eventHandlers={{
         click: () => onClick?.(hospital),
       }}
     >
       <Tooltip 
         direction="top" 
         offset={[0, -55]} 
         opacity={1}
         className="!bg-white !border-gray-200 !shadow-lg !rounded-lg !px-3 !py-2 !text-sm !text-gray-800"
       >
         <div className="flex flex-col items-center gap-0.5">
           <span className="font-semibold">{hospital.hospitalName}</span>
           <span className="text-xs text-indigo-600 font-medium">야간진료</span>
         </div>
       </Tooltip>
     </Marker>
   );
 };
 
 export default NightCareHospitalMarker;