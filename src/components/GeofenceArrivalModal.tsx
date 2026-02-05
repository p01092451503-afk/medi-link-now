import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GeofenceArrivalModalProps {
  isOpen: boolean;
  hospitalName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const GeofenceArrivalModal = ({ 
  isOpen, 
  hospitalName, 
  onConfirm, 
  onCancel 
}: GeofenceArrivalModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000]"
            onClick={onCancel}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-[2001] max-w-sm mx-auto"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-br from-emerald-500 to-green-500 p-6 text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-white/10 blur-xl" />
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <MapPin className="w-8 h-8 text-white" />
                </motion.div>
                
                <h2 className="text-xl font-bold text-white mb-1">
                  목적지 근처입니다
                </h2>
                <p className="text-white/80 text-sm">
                  {hospitalName}
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start gap-3 mb-6 p-4 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    목적지 반경 500m 내에 진입했습니다. 이송을 완료 처리하시겠습니까?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={onCancel}
                    className="py-6 rounded-xl border-gray-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    계속 이송
                  </Button>
                  <Button
                    onClick={onConfirm}
                    className="py-6 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    완료 처리
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GeofenceArrivalModal;
