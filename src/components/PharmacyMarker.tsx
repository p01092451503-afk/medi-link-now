import { Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { HolidayPharmacy } from "@/hooks/useHolidayPharmacies";
import { Phone } from "lucide-react";

interface PharmacyMarkerProps {
  pharmacy: HolidayPharmacy;
}

// Green pharmacy icon - unified style with hospital markers
const createPharmacyIcon = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <style>
        .pharmacy-marker-container {
          transition: transform 0.2s ease-out;
        }
        .pharmacy-marker-container:hover {
          transform: scale(1.15);
        }
      </style>
      <div class="pharmacy-marker-container" style="
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
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border: 3px solid #15803d;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
          cursor: pointer;
        ">
          <span style="font-size: 16px;">💊</span>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid #15803d;
          margin-top: -2px;
        "></div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
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
      <Tooltip 
        direction="top" 
        offset={[0, -55]} 
        opacity={1}
        className="!bg-white !border-gray-200 !shadow-lg !rounded-lg !px-3 !py-2 !text-sm !text-gray-800"
      >
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-semibold">{pharmacy.name}</span>
          <span className="text-xs text-green-600 font-medium">
            {is24Hours ? '24시간 운영' : `휴일: ${formatTime(pharmacy.holidayOpen, pharmacy.holidayClose)}`}
          </span>
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
