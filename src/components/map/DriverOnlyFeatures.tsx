import { useState } from "react";
import { motion } from "framer-motion";
import { Users, FileText } from "lucide-react";
import LiveReportFAB from "@/components/LiveReportFAB";
import PatientInfoModal from "@/components/PatientInfoModal";
import { Hospital } from "@/data/hospitals";
import { DriverPresence } from "@/hooks/useDriverPresence";
import type { LiveReport } from "@/components/LiveReportFAB";

interface DriverOnlyFeaturesProps {
  selectedHospital: Hospital | null;
  onReport?: (report: LiveReport) => void;
  nearbyDrivers?: DriverPresence[];
}

const DriverOnlyFeatures = ({ 
  selectedHospital, 
  onReport,
  nearbyDrivers = []
}: DriverOnlyFeaturesProps) => {
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showNearbyDrivers, setShowNearbyDrivers] = useState(false);

  return (
    <>
      {/* Driver Mode Indicator */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-4 right-4 z-[1000]"
      >
        <div className="flex items-center gap-2 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          구급대원 모드
        </div>
      </motion.div>

      {/* Live Report FAB - Only visible to drivers */}
      <LiveReportFAB onReport={onReport} />

      {/* Driver Quick Actions */}
      <div className="fixed bottom-24 right-4 z-[999] flex flex-col gap-2">
        {/* Patient Info Button */}
        {selectedHospital && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowPatientModal(true)}
            className="w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
            title="환자 정보 공유"
          >
            <FileText className="w-6 h-6" />
          </motion.button>
        )}

        {/* Nearby Drivers Toggle */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => setShowNearbyDrivers(!showNearbyDrivers)}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${
            showNearbyDrivers
              ? "bg-emerald-500 text-white"
              : "bg-white text-emerald-600 hover:bg-emerald-50"
          }`}
          title="주변 구급대원"
        >
          <Users className="w-6 h-6" />
          {nearbyDrivers.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {nearbyDrivers.length}
            </span>
          )}
        </motion.button>
      </div>

      {/* Patient Info Modal */}
      {selectedHospital && (
        <PatientInfoModal
          isOpen={showPatientModal}
          onClose={() => setShowPatientModal(false)}
          hospitalName={selectedHospital.nameKr}
        />
      )}
    </>
  );
};

export default DriverOnlyFeatures;
