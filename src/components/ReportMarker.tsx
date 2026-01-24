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
    label: "교통 정체",
  },
  construction: {
    icon: Construction,
    color: "#EAB308", // yellow-500
    label: "공사 중",
  },
  hospital_full: {
    icon: Building2,
    color: "#EF4444", // red-500
    label: "병원 만실",
  },
  police: {
    icon: ShieldAlert,
    color: "#3B82F6", // blue-500
    label: "경찰 단속",
  },
};

const createReportIcon = (type: LiveReport["type"]) => {
  const config = reportConfig[type];
  const IconComponent = config.icon;
  
  const iconHtml = renderToString(
    <div
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        backgroundColor: config.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "3px solid white",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <IconComponent size={18} color="white" />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: "report-marker-icon",
    iconSize: L.point(36, 36),
    iconAnchor: L.point(18, 18),
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
