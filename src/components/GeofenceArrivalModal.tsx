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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
            onClick={onCancel}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-[2001] max-w-sm mx-auto"
          >
            <div className="bg-background rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-foreground p-6 text-center text-background">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 mx-auto mb-3 rounded-full bg-background/10 flex items-center justify-center"
                >
                  <MapPin className="w-8 h-8" />
                </motion.div>
                
                <h2 className="text-xl font-bold mb-1">
                  목적지 근처입니다
                </h2>
                <p className="opacity-60 text-sm">
                  {hospitalName}
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start gap-3 mb-6 p-4 bg-secondary rounded-2xl">
                  <AlertTriangle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    목적지 반경 500m 내에 진입했습니다. 이송을 완료 처리하시겠습니까?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={onCancel}
                    className="py-6 rounded-2xl"
                  >
                    <X className="w-4 h-4 mr-2" />
                    계속 이송
                  </Button>
                  <Button
                    onClick={onConfirm}
                    className="py-6 rounded-2xl bg-foreground text-background hover:opacity-90"
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