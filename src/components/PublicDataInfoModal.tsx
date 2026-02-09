import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Shield, 
  Database, 
  Globe, 
  Clock, 
  CheckCircle2,
  Building2,
  FileCheck,
  RefreshCw,
  Server,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicDataInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PublicDataInfoModal = ({ isOpen, onClose }: PublicDataInfoModalProps) => {
  const dataSources = [
    {
      icon: Building2,
      title: "국가응급진료정보망 (NEDIS)",
      description: "보건복지부 산하 국립중앙의료원에서 운영하는 공식 응급의료 정보시스템입니다.",
    },
    {
      icon: Database,
      title: "공공데이터포털 API",
      description: "정부에서 개방한 공식 API를 통해 실시간 응급실 병상 현황을 제공받습니다.",
    },
    {
      icon: RefreshCw,
      title: "실시간 데이터 갱신",
      description: "5분 주기로 전국 500개 이상의 응급의료기관 데이터를 자동 업데이트합니다.",
    },
    {
      icon: Globe,
      title: "전국 응급실 커버리지",
      description: "권역응급의료센터, 지역응급의료센터, 지역응급의료기관 정보를 모두 포함합니다.",
    },
  ];

  const dataTypes = [
    { label: "응급실 가용 병상 수", source: "NEDIS 실시간" },
    { label: "중환자실 병상 현황", source: "NEDIS 실시간" },
    { label: "소아 전용 병상", source: "NEDIS 실시간" },
    { label: "음압격리 병상", source: "NEDIS 실시간" },
    { label: "응급실 전화번호", source: "공공데이터포털" },
    { label: "병원 위치 좌표", source: "공공데이터포털" },
  ];

  const certifications = [
    { name: "정부 공식 데이터 활용", icon: FileCheck },
    { name: "보건복지부 인증 정보", icon: Shield },
    { name: "실시간 자동 동기화", icon: RefreshCw },
    { name: "전국 권역 완벽 커버", icon: Globe },
  ];

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
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[2001] max-h-[90vh] bg-background rounded-t-3xl overflow-hidden"
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted" />
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-5 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                    <Database className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      공공데이터 기반 서비스
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      정부 공식 데이터를 활용한 신뢰할 수 있는 정보
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Trust Banner */}
              <div className="bg-secondary rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                    <Shield className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      정부 공식 데이터로 신뢰할 수 있습니다
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      국가응급진료정보망(NEDIS)의 실시간 데이터를 활용합니다
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Sources */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  데이터 출처
                </h3>
                <div className="space-y-3">
                  {dataSources.map((source, index) => (
                    <motion.div
                      key={source.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3 p-3 bg-secondary rounded-xl"
                    >
                      <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center flex-shrink-0">
                        <source.icon className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {source.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {source.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  데이터 신뢰성
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {certifications.map((cert) => (
                    <div
                      key={cert.name}
                      className="flex items-center gap-2 p-3 bg-secondary rounded-xl"
                    >
                      <CheckCircle2 className="w-4 h-4 text-foreground flex-shrink-0" />
                      <span className="text-xs font-medium text-foreground">
                        {cert.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Types */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  제공 정보 및 갱신 주기
                </h3>
                <div className="bg-secondary rounded-xl overflow-hidden">
                  {dataTypes.map((item, index) => (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between px-4 py-3 ${
                        index !== dataTypes.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <span className="text-sm text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="text-xs font-medium text-foreground bg-background px-2 py-0.5 rounded-full">
                        {item.source}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-secondary rounded-xl p-4 mb-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  본 서비스의 병상 정보는 국가응급진료정보망(NEDIS)에서 제공하는 공식 데이터를 기반으로 합니다. 
                  실시간 상황에 따라 실제 병상 현황과 차이가 있을 수 있으므로, 
                  이송 전 해당 의료기관에 전화 확인을 권장합니다.
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  onClick={onClose}
                  className="w-full py-6 rounded-2xl bg-foreground hover:opacity-90 text-background font-bold"
                >
                  확인했습니다
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => window.open("https://www.data.go.kr", "_blank")}
                  className="w-full text-muted-foreground text-sm gap-1"
                >
                  공공데이터포털 바로가기
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PublicDataInfoModal;