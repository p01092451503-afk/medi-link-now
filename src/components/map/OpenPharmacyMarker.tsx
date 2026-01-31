import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { NearbyPharmacy } from "@/hooks/useNearbyPharmacies";
import { Moon, Calendar } from "lucide-react";

interface OpenPharmacyMarkerProps {
  pharmacy: NearbyPharmacy;
  onClick: (pharmacy: NearbyPharmacy) => void;
}

// Format time from HHMM to HH:MM
const formatTime = (time?: string): string => {
  if (!time || time.length < 4) return "-";
  return `${time.slice(0, 2)}:${time.slice(2)}`;
};

// Check if pharmacy is a night pharmacy
const isNightPharmacy = (pharmacy: NearbyPharmacy): boolean => {
  const closeTime = parseInt(pharmacy.todayCloseTime || "0", 10);
  return closeTime >= 2200 || closeTime < 400;
};

// Check if pharmacy has holiday hours
const hasHolidayHours = (pharmacy: NearbyPharmacy): boolean => {
  return !!(pharmacy.dutyTime7s || pharmacy.dutyTime8s);
};

// Create pharmacy marker icon
const createPharmacyIcon = (isNight: boolean, isHoliday: boolean) => {
  const bgColor = isNight 
    ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" 
    : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)";
  const borderColor = isNight ? "#4338ca" : "#15803d";
  const shadowColor = isNight ? "rgba(99, 102, 241, 0.4)" : "rgba(34, 197, 94, 0.4)";

  const badges = [];
  if (isNight) badges.push("🌙");
  if (isHoliday) badges.push("📅");
  const badgeHtml = badges.length > 0 
    ? `<span style="position: absolute; top: -6px; right: -6px; font-size: 10px; background: white; border-radius: 10px; padding: 1px 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">${badges.join("")}</span>` 
    : "";

  return L.divIcon({
    className: "custom-marker",
    html: `
      <style>
        .pharmacy-open-marker-container {
          transition: transform 0.2s ease-out;
        }
        .pharmacy-open-marker-container:hover {
          transform: scale(1.15);
        }
      </style>
      <div class="pharmacy-open-marker-container" style="
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
          background: ${bgColor};
          border: 3px solid ${borderColor};
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px ${shadowColor};
          cursor: pointer;
        ">
          <span style="font-size: 16px;">💊</span>
          ${badgeHtml}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid ${borderColor};
          margin-top: -2px;
        "></div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
  });
};

const OpenPharmacyMarker = ({ pharmacy, onClick }: OpenPharmacyMarkerProps) => {
  const isNight = isNightPharmacy(pharmacy);
  const isHoliday = hasHolidayHours(pharmacy);
  const icon = createPharmacyIcon(isNight, isHoliday);

  const formatDistance = (km?: number): string => {
    if (!km) return "";
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  return (
    <Marker
      position={[pharmacy.lat, pharmacy.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(pharmacy),
      }}
    >
      <Tooltip 
        direction="top" 
        offset={[0, -55]} 
        opacity={1}
        className="!bg-white !border-gray-200 !shadow-lg !rounded-lg !px-3 !py-2 !text-sm !text-gray-800"
      >
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-semibold">{pharmacy.name}</span>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-green-600 font-medium">
              {formatTime(pharmacy.todayOpenTime)} - {formatTime(pharmacy.todayCloseTime)}
            </span>
            {pharmacy.distance && (
              <span className="text-gray-400">• {formatDistance(pharmacy.distance)}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isNight && <span className="text-[10px] text-indigo-600">🌙 심야</span>}
            {isHoliday && <span className="text-[10px] text-amber-600">📅 휴일</span>}
          </div>
        </div>
      </Tooltip>
    </Marker>
  );
};

export default OpenPharmacyMarker;
