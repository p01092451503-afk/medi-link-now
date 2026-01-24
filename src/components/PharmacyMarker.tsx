import { Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { HolidayPharmacy } from "@/hooks/useHolidayPharmacies";
import { Phone } from "lucide-react";

interface PharmacyMarkerProps {
  pharmacy: HolidayPharmacy;
}

// Green pharmacy icon
const createPharmacyIcon = () => {
  return L.divIcon({
    className: "custom-pharmacy-marker",
    html: `
      <div style="
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(34, 197, 94, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 16px;
        ">💊</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

const PharmacyMarker = ({ pharmacy }: PharmacyMarkerProps) => {
  const icon = createPharmacyIcon();

  const formatTime = (open?: string, close?: string) => {
    if (!open || !close) return "정보 없음";
    const formatHour = (time: string) => {
      if (time.length === 4) {
        return `${time.slice(0, 2)}:${time.slice(2)}`;
      }
      return time;
    };
    return `${formatHour(open)} - ${formatHour(close)}`;
  };

  const is24Hours = pharmacy.holidayOpen === '00:00' && pharmacy.holidayClose === '24:00';

  return (
    <Marker
      position={[pharmacy.lat, pharmacy.lng]}
      icon={icon}
    >
      <Tooltip direction="top" offset={[0, -30]} opacity={0.95}>
        <div className="text-sm font-semibold">{pharmacy.name}</div>
        <div className="text-xs text-green-600">
          {is24Hours ? '24시간 운영' : `휴일: ${formatTime(pharmacy.holidayOpen, pharmacy.holidayClose)}`}
        </div>
      </Tooltip>
      <Popup>
        <div className="p-2 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">💊</span>
            <div>
              <h3 className="font-bold text-base text-green-700">{pharmacy.name}</h3>
              {is24Hours && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  24시간
                </span>
              )}
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="text-gray-600">
              <span className="font-medium">📍 주소:</span> {pharmacy.address}
            </div>
            
            {pharmacy.phone && (
              <a
                href={`tel:${pharmacy.phone}`}
                className="flex items-center gap-1 text-green-600 hover:text-green-800"
              >
                <Phone className="w-4 h-4" />
                {pharmacy.phone}
              </a>
            )}
            
            <div className="border-t pt-2 mt-2">
              <div className="text-gray-700">
                <span className="font-medium">🗓️ 휴일 운영시간:</span>
                <div className="ml-5 text-green-600 font-medium">
                  {formatTime(pharmacy.holidayOpen, pharmacy.holidayClose)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default PharmacyMarker;
