import { Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import { NursingHospital } from "@/hooks/useNursingHospitals";

interface NursingHospitalMarkerProps {
  hospital: NursingHospital;
  onClick?: (hospital: NursingHospital) => void;
}

const createNursingMarkerIcon = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <style>
        .nursing-marker-container {
          transition: transform 0.2s ease-out;
        }
        .nursing-marker-container:hover {
          transform: scale(1.15);
        }
      </style>
      <div class="nursing-marker-container" style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
      ">
        <div style="
          position: relative;
          min-width: 36px;
          height: 36px;
          padding: 0 8px;
          background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
          border: 3px solid #7C3AED;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
          cursor: pointer;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7V10C2 16.5 6.84 22.74 12 24C17.16 22.74 22 16.5 22 10V7L12 2Z" fill="white" opacity="0.9"/>
            <path d="M12 6V12M9 9H15" stroke="#7C3AED" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid #7C3AED;
          margin-top: -2px;
        "></div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
  });
};

const NursingHospitalMarker = ({ hospital, onClick }: NursingHospitalMarkerProps) => {
  const icon = createNursingMarkerIcon();

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
          <span className="font-semibold">{hospital.name}</span>
          <span className="text-xs text-purple-600 font-medium">{hospital.type}</span>
        </div>
      </Tooltip>
      <Popup>
        <div className="text-sm min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7V10C2 16.5 6.84 22.74 12 24C17.16 22.74 22 16.5 22 10V7L12 2Z" fill="#8B5CF6"/>
                <path d="M12 6V12M9 9H15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <strong className="text-base block">{hospital.name}</strong>
              <span className="text-xs text-purple-600 font-medium">{hospital.type}</span>
            </div>
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            <p className="flex items-center gap-1">
              <span>📍</span> {hospital.address}
            </p>
            {hospital.phone && (
              <p className="flex items-center gap-1">
                <span>📞</span> 
                <a href={`tel:${hospital.phone}`} className="text-blue-600 hover:underline">
                  {hospital.phone}
                </a>
              </p>
            )}
            {hospital.beds && hospital.beds > 0 && (
              <p className="flex items-center gap-1">
                <span>🛏️</span> 병상 {hospital.beds}개
              </p>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default NursingHospitalMarker;
