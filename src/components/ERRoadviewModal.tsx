import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Loader2, Ambulance, MapPin, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ERRoadviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalName: string;
  entranceLat?: number;
  entranceLng?: number;
  hospitalLat: number;
  hospitalLng: number;
}

const ERRoadviewModal = ({
  isOpen,
  onClose,
  hospitalName,
  entranceLat,
  entranceLng,
  hospitalLat,
  hospitalLng,
}: ERRoadviewModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [roadviewPanoId, setRoadviewPanoId] = useState<string | null>(null);

  const targetLat = entranceLat || hospitalLat;
  const targetLng = entranceLng || hospitalLng;

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    setHasError(false);

    const checkKakaoSDK = () => {
      if (typeof window !== "undefined" && (window as any).kakao?.maps) {
        initializeRoadview();
      } else {
        setHasError(true);
        setIsLoading(false);
      }
    };

    const initializeRoadview = () => {
      try {
        const kakao = (window as any).kakao;
        const roadviewClient = new kakao.maps.RoadviewClient();
        const position = new kakao.maps.LatLng(targetLat, targetLng);
        
        roadviewClient.getNearestPanoId(position, 100, (panoId: string) => {
          if (panoId === null) {
            setHasError(true);
            setIsLoading(false);
          } else {
            setRoadviewPanoId(panoId);
            setIsLoading(false);
            
            setTimeout(() => {
              const container = document.getElementById("roadview-container");
              if (container) {
                const roadview = new kakao.maps.Roadview(container);
                roadview.setPanoId(panoId, position);
              }
            }, 100);
          }
        });
      } catch (error) {
        console.error("Roadview initialization error:", error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    const timer = setTimeout(checkKakaoSDK, 300);
    return () => clearTimeout(timer);
  }, [isOpen, targetLat, targetLng]);

  const handleOpenGoogleStreetView = () => {
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${targetLat},${targetLng}`;
    window.open(url, "_blank");
  };

  const handleOpenKakaoMap = () => {
    const url = `https://map.kakao.com/?map_type=TYPE_NORMAL&panoid=${roadviewPanoId || ''}&urlX=${targetLng}&urlY=${targetLat}&urlLevel=3`;
    window.open(url, "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[2000]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] bottom-[10%] md:inset-auto md:top-[50%] md:left-[50%] md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-2xl md:h-auto md:max-h-[80vh] bg-background rounded-3xl shadow-2xl z-[2001] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Ambulance className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-lg">
                    응급실 입구 로드뷰
                  </h2>
                  <p className="text-xs text-muted-foreground">{hospitalName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Entrance Info Badge */}
            {entranceLat && entranceLng && (
              <div className="px-4 py-2 bg-secondary border-b border-border">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">
                    응급실 전용 입구 위치 (정문과 다를 수 있음)
                  </span>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 relative bg-secondary min-h-[280px] md:min-h-[350px]">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary">
                  <Loader2 className="w-10 h-10 text-foreground animate-spin mb-4" />
                  <p className="text-sm text-muted-foreground">
                    로드뷰를 불러오는 중...
                  </p>
                </div>
              )}

              {hasError && !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary p-4 md:p-6 overflow-y-auto">
                  <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mb-3 md:mb-4 flex-shrink-0" />
                  <h3 className="font-semibold text-foreground text-base md:text-lg mb-2 text-center">
                    로드뷰를 불러올 수 없습니다
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground text-center mb-4 md:mb-6 max-w-sm px-2">
                    해당 위치의 로드뷰 데이터가 없거나 카카오맵 API가 로드되지 않았습니다.
                  </p>
                  
                  <div className="flex flex-col gap-2 md:gap-3 w-full max-w-xs flex-shrink-0">
                    <Button
                      onClick={handleOpenGoogleStreetView}
                      className="w-full rounded-2xl bg-foreground text-background hover:opacity-90"
                    >
                      Google 스트리트뷰로 보기
                    </Button>
                    <Button
                      onClick={onClose}
                      variant="outline"
                      className="w-full rounded-2xl"
                    >
                      닫기
                    </Button>
                  </div>
                </div>
              )}

              {!hasError && !isLoading && (
                <div
                  id="roadview-container"
                  className="absolute inset-0 w-full h-full"
                />
              )}
            </div>

            {/* Footer Actions */}
            {!hasError && !isLoading && (
              <div className="p-4 border-t border-border bg-background">
                <div className="flex gap-3">
                  <Button
                    onClick={handleOpenKakaoMap}
                    variant="outline"
                    className="flex-1 rounded-2xl"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    카카오맵에서 열기
                  </Button>
                  <Button
                    onClick={handleOpenGoogleStreetView}
                    variant="outline"
                    className="flex-1 rounded-2xl"
                  >
                    Google 스트리트뷰
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ERRoadviewModal;