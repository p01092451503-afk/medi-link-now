import { useState } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MapLegendPopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors border border-gray-100"
        aria-label="지도 범례 보기"
      >
        <HelpCircle className="w-5 h-5 text-gray-600" />
      </button>

      {/* Popup Overlay - Rendered via Portal to avoid parent container issues */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-[2000]"
                onClick={() => setIsOpen(false)}
              />

              {/* Popup Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed left-4 right-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-2xl shadow-2xl z-[2001] overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    지도 보는 법
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto">
                  {/* Traffic Light Colors */}
                  <section>
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      🚦 병상 상태 (신호등 색상)
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-green-50 border border-green-200">
                        <span className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shadow-md">12</span>
                        <div>
                          <p className="font-medium text-green-800">초록색 = 여유</p>
                          <p className="text-xs text-green-600">병상 5개 이상, 빠른 입원 가능</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                        <span className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-md">3</span>
                        <div>
                          <p className="font-medium text-amber-800">노란색 = 보통</p>
                          <p className="text-xs text-amber-600">병상 1~4개, 대기 예상</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-red-50 border border-red-200">
                        <span className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold shadow-md">0</span>
                        <div>
                          <p className="font-medium text-red-800">빨간색 = 만실</p>
                          <p className="text-xs text-red-600">병상 없음, 입원 대기 필요</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Cluster Markers */}
                  <section>
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      🔵 클러스터 (묶음 표시)
                    </h3>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <svg width="50" height="50" viewBox="0 0 50 50">
                            <circle cx="25" cy="25" r="18" fill="none" stroke="#10B981" strokeWidth="6" strokeDasharray="40 100" />
                            <circle cx="25" cy="25" r="18" fill="none" stroke="#F59E0B" strokeWidth="6" strokeDasharray="30 100" strokeDashoffset="-40" />
                            <circle cx="25" cy="25" r="18" fill="none" stroke="#EF4444" strokeWidth="6" strokeDasharray="30 100" strokeDashoffset="-70" />
                            <circle cx="25" cy="25" r="12" fill="white" />
                            <text x="25" y="29" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#10B981">62</text>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">가운데 숫자 = 총 병상 수</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            도넛 색상은 해당 지역 병원들의 상태 비율을 나타냅니다.
                            초록이 많으면 여유 있는 병원이 많다는 뜻이에요.
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              여유
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              보통
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              만실
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Marker Badges */}
                  <section>
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      🏷️ 병원 마커 표시
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-center">
                        <span className="text-xs font-medium px-2 py-0.5 bg-red-600 text-white rounded">권역</span>
                        <p className="text-xs text-red-700 mt-1.5">권역응급의료센터</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-200 text-center">
                        <span className="text-xs font-medium px-2 py-0.5 bg-orange-500 text-white rounded">지역센터</span>
                        <p className="text-xs text-orange-700 mt-1.5">지역응급의료센터</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-center">
                        <span className="text-lg">👶</span>
                        <p className="text-xs text-amber-700 mt-0.5">소아 진료 가능</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-center">
                        <span className="text-lg">➕</span>
                        <p className="text-xs text-purple-700 mt-0.5">외상센터</p>
                      </div>
                    </div>
                  </section>

                  {/* Tip */}
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-primary font-medium">💡 TIP</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      클러스터를 탭하면 해당 지역 병원 목록을 볼 수 있어요.
                      개별 병원 마커를 탭하면 상세 정보와 전화 연결이 가능합니다.
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default MapLegendPopup;
