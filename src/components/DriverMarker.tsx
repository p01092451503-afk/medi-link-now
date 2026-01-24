import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { DriverPresence } from "@/hooks/useDriverPresence";
import { Ambulance, Clock, Phone } from "lucide-react";

interface DriverMarkerProps {
  driver: DriverPresence;
  onCallDriver?: (driver: DriverPresence) => void;
}

const createDriverIcon = (status: DriverPresence["status"]) => {
  const bgColor = status === "available" ? "#22c55e" : status === "busy" ? "#f59e0b" : "#6b7280";
  const pulseClass = status === "available" ? "driver-pulse" : "";

  return L.divIcon({
    className: "driver-marker-icon",
    html: `
      <div class="relative ${pulseClass}">
        <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white" 
             style="background-color: ${bgColor}">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 10H6"/>
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
        </div>
        ${status === "available" ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>' : ''}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

const getStatusLabel = (status: DriverPresence["status"]) => {
  switch (status) {
    case "available":
      return { text: "대기 중", color: "text-green-600 bg-green-100" };
    case "busy":
      return { text: "이동 중", color: "text-yellow-600 bg-yellow-100" };
    default:
      return { text: "오프라인", color: "text-gray-600 bg-gray-100" };
  }
};

const DriverMarker = ({ driver, onCallDriver }: DriverMarkerProps) => {
  const statusInfo = getStatusLabel(driver.status);
  const lastUpdated = new Date(driver.lastUpdated);
  const minutesAgo = Math.round((Date.now() - lastUpdated.getTime()) / 60000);

  return (
    <Marker
      position={[driver.lat, driver.lng]}
      icon={createDriverIcon(driver.status)}
    >
      <Popup className="driver-popup">
        <div className="min-w-[200px] p-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Ambulance className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{driver.name}</h3>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
            </div>
          </div>

          {driver.vehicleType && (
            <p className="text-xs text-muted-foreground mb-2">
              차량: {driver.vehicleType}
            </p>
          )}

          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Clock className="w-3 h-3" />
            <span>{minutesAgo < 1 ? "방금 전" : `${minutesAgo}분 전 업데이트`}</span>
          </div>

          {driver.status === "available" && onCallDriver && (
            <button
              onClick={() => onCallDriver(driver)}
              className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <Phone className="w-4 h-4" />
              호출하기
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default DriverMarker;
