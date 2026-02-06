import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { NursingHospital } from "@/hooks/useNursingHospitals";

interface NursingHospitalMarkerProps {
  hospital: NursingHospital;
  onClick?: (hospital: NursingHospital) => void;
  onMouseEnter?: (lat: number, lng: number) => void;
  onMouseLeave?: () => void;
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
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
          border: 2px solid #7C3AED;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
          cursor: pointer;
        ">
          <span style="
            color: white;
            font-size: 14px;
            font-weight: 700;
            line-height: 1;
          ">요양</span>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 8px solid #7C3AED;
          margin-top: -2px;
        "></div>
      </div>
    `,
    iconSize: [42, 58],
    iconAnchor: [21, 50],
    popupAnchor: [0, -50],
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
    </Marker>
  );
};

export default NursingHospitalMarker;
