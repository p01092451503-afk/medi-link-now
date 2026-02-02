import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Ambulance, Clock, MapPin, Navigation } from "lucide-react";
import { AmbulanceTrip } from "@/hooks/useAmbulanceTrips";
import { cleanHospitalName } from "@/lib/utils";

interface AmbulanceTripMarkerProps {
  trip: AmbulanceTrip;
}

const createAmbulanceTripIcon = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <style>
        .ambulance-trip-marker {
          transition: transform 0.2s ease-out;
        }
        .ambulance-trip-marker:hover {
          transform: scale(1.15);
        }
        @keyframes ambulance-flash {
          0%, 100% { 
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
          }
          50% { 
            box-shadow: 0 4px 24px rgba(239, 68, 68, 0.9);
          }
        }
        @keyframes siren-rotate {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(5deg); }
          100% { transform: rotate(0deg); }
        }
      </style>
      <div class="ambulance-trip-marker" style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
      ">
        <div style="
          position: relative;
          min-width: 44px;
          height: 44px;
          padding: 0 10px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border: 3px solid #b91c1c;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: ambulance-flash 1.5s ease-in-out infinite, siren-rotate 0.3s ease-in-out infinite;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 10H6"/>
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-top: 12px solid #b91c1c;
          margin-top: -2px;
        "></div>
      </div>
    `,
    iconSize: [52, 60],
    iconAnchor: [26, 60],
    popupAnchor: [0, -60],
  });
};

const AmbulanceTripMarker = ({ trip }: AmbulanceTripMarkerProps) => {
  if (trip.current_lat === null || trip.current_lng === null) {
    return null;
  }

  const startTime = new Date(trip.started_at);
  const minutesElapsed = Math.round((Date.now() - startTime.getTime()) / 60000);

  return (
    <Marker
      position={[trip.current_lat, trip.current_lng]}
      icon={createAmbulanceTripIcon()}
    >
      <Popup className="ambulance-trip-popup">
        <div className="min-w-[220px] p-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Ambulance className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-red-600">이송 중</h3>
              {trip.driver_name && (
                <p className="text-xs text-muted-foreground">{trip.driver_name}</p>
              )}
            </div>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full animate-pulse">
              LIVE
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-2">
            <div className="flex items-start gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">목적지</p>
                <p className="text-sm font-medium">{cleanHospitalName(trip.destination_hospital_name)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {minutesElapsed < 1 ? "방금 출발" : `${minutesElapsed}분 전 출발`}
              </span>
            </div>
          </div>

          {trip.patient_condition && (
            <div className="text-xs text-muted-foreground bg-yellow-50 px-2 py-1.5 rounded-lg">
              <span className="font-medium">환자 상태:</span> {trip.patient_condition}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default AmbulanceTripMarker;
