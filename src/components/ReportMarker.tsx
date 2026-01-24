import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Car, Construction, Building2, ShieldAlert } from "lucide-react";
import { renderToString } from "react-dom/server";
import type { LiveReport } from "./LiveReportFAB";

interface ReportMarkerProps {
  report: LiveReport;
}

const reportConfig = {
  traffic: {
    icon: Car,
    color: "#F97316", // orange-500
    border: "#EA580C", // orange-600
    label: "교통 정체",
  },
  construction: {
    icon: Construction,
    color: "#EAB308", // yellow-500
    border: "#CA8A04", // yellow-600
    label: "공사 중",
  },
  hospital_full: {
    icon: Building2,
    color: "#EF4444", // red-500
    border: "#DC2626", // red-600
    label: "병원 만실",
  },
  police: {
    icon: ShieldAlert,
    color: "#3B82F6", // blue-500
    border: "#2563EB", // blue-600
    label: "경찰 단속",
  },
};

const createReportIcon = (type: LiveReport["type"]) => {
  const config = reportConfig[type];
  const IconComponent = config.icon;
  
  const iconSvg = renderToString(<IconComponent size={16} color="white" strokeWidth={2.5} />);

  return L.divIcon({
    className: "custom-marker",
    html: `
      <style>
        .report-marker-container {
          transition: transform 0.2s ease-out;
        }
        .report-marker-container:hover {
          transform: scale(1.15);
        }
      </style>
      <div class="report-marker-container" style="
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
          background: ${config.color};
          border: 3px solid ${config.border};
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          ${iconSvg}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid ${config.border};
          margin-top: -2px;
        "></div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
  });
};

const ReportMarker = ({ report }: ReportMarkerProps) => {
  const config = reportConfig[report.type];
  const timeSince = Math.floor((Date.now() - report.timestamp.getTime()) / 60000);

  return (
    <Marker
      position={[report.location.lat, report.location.lng]}
      icon={createReportIcon(report.type)}
    >
      <Popup>
        <div className="text-center p-1">
          <p className="font-semibold text-sm" style={{ color: config.color }}>
            {config.label}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {timeSince < 1 ? "방금 전" : `${timeSince}분 전`} 신고됨
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

export default ReportMarker;
