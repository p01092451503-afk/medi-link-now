import { Hospital, getHospitalStatus } from "@/data/hospitals";
import { X, Phone, Navigation, Clock, Stethoscope, Baby, Shield, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface HospitalBottomSheetProps {
  hospital: Hospital | null;
  onClose: () => void;
  distance?: number;
}

const BedStatusCard = ({
  label,
  count,
  icon: Icon,
  type,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  type: "general" | "pediatric" | "isolation";
}) => {
  const isAvailable = count > 0;

  return (
    <div
      className={`flex flex-col items-center justify-center p-3 rounded-xl ${
        isAvailable ? "bg-success-light" : "bg-danger-light"
      }`}
    >
      <Icon
        className={`w-5 h-5 mb-1 ${isAvailable ? "text-success" : "text-danger"}`}
      />
      <span
        className={`text-xl font-bold ${isAvailable ? "text-success" : "text-danger"}`}
      >
        {count}
      </span>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
};

const HospitalBottomSheet = ({ hospital, onClose, distance }: HospitalBottomSheetProps) => {
  if (!hospital) return null;

  const status = getHospitalStatus(hospital);
  const totalBeds = hospital.beds.general + hospital.beds.pediatric + hospital.beds.isolation;

  const handleCall = () => {
    window.location.href = `tel:${hospital.phone}`;
  };

  const handleNavigate = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`,
      "_blank"
    );
  };

  return (
    <AnimatePresence>
      {hospital && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="bottom-sheet-overlay"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bottom-sheet"
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-border rounded-full" />
            </div>

            <div className="px-5 pb-8 pt-1 max-h-[70vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`status-badge ${
                        status === "unavailable" ? "unavailable" : "available"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          status === "unavailable" ? "bg-danger" : "bg-success"
                        } animate-pulse-soft`}
                      />
                      {status === "unavailable"
                        ? "Full"
                        : status === "limited"
                        ? "Limited"
                        : "Available"}
                    </span>
                    {distance && (
                      <span className="text-xs text-muted-foreground">
                        {distance.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-0.5">
                    {hospital.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">{hospital.category}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Bed Status Grid */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <BedStatusCard
                  label="Adult Beds"
                  count={hospital.beds.general}
                  icon={Stethoscope}
                  type="general"
                />
                <BedStatusCard
                  label="Pediatric"
                  count={hospital.beds.pediatric}
                  icon={Baby}
                  type="pediatric"
                />
                <BedStatusCard
                  label="Isolation"
                  count={hospital.beds.isolation}
                  icon={Shield}
                  type="isolation"
                />
              </div>

              {/* Equipment Tags */}
              <div className="mb-5">
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Available Equipment
                </h3>
                <div className="flex flex-wrap gap-2">
                  {hospital.equipment.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-secondary rounded-xl p-4 mb-5">
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{hospital.phone}</span>
                </div>
                <p className="text-xs text-muted-foreground pl-7">{hospital.address}</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleCall}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call ER
                </Button>
                <Button
                  onClick={handleNavigate}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/5 font-semibold py-6 rounded-xl"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Navigate
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HospitalBottomSheet;
