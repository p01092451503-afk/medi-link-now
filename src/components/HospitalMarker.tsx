import { Marker } from "react-leaflet";
import { Hospital, FilterType } from "@/data/hospitals";
import { getDisplayBeds, getMarkerStatus, createHospitalIcon } from "./map/hospitalIconUtils";

interface HospitalMarkerProps {
  hospital: Hospital & { distance?: number };
  onClick: (hospital: Hospital) => void;
  activeFilter: FilterType;
  opacity?: number;
}

const HospitalMarker = ({ hospital, onClick, activeFilter, opacity = 1 }: HospitalMarkerProps) => {
  const displayBeds = getDisplayBeds(hospital, activeFilter);
  const status = getMarkerStatus(displayBeds);
  const icon = createHospitalIcon(
    status, 
    displayBeds,
    hospital.category,
    hospital.isTraumaCenter
  );

  return (
    <Marker
      position={[hospital.lat, hospital.lng]}
      icon={icon}
      opacity={opacity}
      eventHandlers={{
        click: () => onClick(hospital),
      }}
    />
  );
};

export default HospitalMarker;
