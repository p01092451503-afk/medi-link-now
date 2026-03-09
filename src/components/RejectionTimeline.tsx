import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ban, Clock, Share2, X, Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRejectionLogs, REJECTION_REASONS } from '@/hooks/useRejectionLogs';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { cleanHospitalName } from '@/lib/utils';

interface Props {
  compact?: boolean;
}

const RejectionTimeline = ({ compact = false }: Props) => {
  const { getTodayLogs, isLoading } = useRejectionLogs();
  const [isShareMode, setIsShareMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);
  
  const todayLogs = getTodayLogs();

  const getReasonLabel = (reasonId: string) => {
    return REJECTION_REASONS.find(r => r.id === reasonId)?.label || reasonId;
  };

  const getReasonIcon = (reasonId: string) => {
    return REJECTION_REASONS.find(r => r.id === reasonId)?.icon || '❌';
  };

  const handleCopyTimeline = () => {
    const timelineText = todayLogs
      .map(log => {
        const time = format(new Date(log.recorded_at), 'HH:mm', { locale: ko });
        return `${time} ${cleanHospitalName(log.hospital_name)} - ${getReasonLabel(log.rejection_reason)}`;
      })
      .join('\n');

    const fullText = `[구급차 병원 연락 이력]\n${format(new Date(), 'yyyy년 M월 d일', { locale: ko })}\n\n${timelineText}\n\n※ Find-ER 파인더에서 자동 생성됨`;

    navigator.clipboard.writeText(fullText);
    toast({
      title: "복사되었습니다",
      description: "타임라인이 클립보드에 복사되었습니다.",
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-slate-400">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (todayLogs.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
            <Ban className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-slate-800">오늘의 거부 이력</p>
            <p className="text-xs text-slate-500">{todayLogs.length}건 기록됨</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsShareMode(true);
            }}
            className="h-8 px-3 text-xs"
          >
            <Share2 className="w-3.5 h-3.5 mr-1" />
            공유
          </Button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Timeline */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="relative pl-4 border-l-2 border-red-200 space-y-3">
                {todayLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-red-400 border-2 border-white" />
                    
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="text-lg">{getReasonIcon(log.rejection_reason)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-800 truncate">
                          {cleanHospitalName(log.hospital_name)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-red-600 font-medium">
                            {getReasonLabel(log.rejection_reason)}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(log.recorded_at), 'HH:mm', { locale: ko })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Mode Modal */}
      <AnimatePresence>
        {isShareMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setIsShareMode(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Share Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-800">공유용 이력</h3>
                <button
                  onClick={() => setIsShareMode(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Clean List View */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-slate-500 mb-2">
                  {format(new Date(), 'yyyy년 M월 d일', { locale: ko })} 병원 연락 이력
                </p>
                <div className="space-y-2">
                  {todayLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400 font-mono">
                        {format(new Date(log.recorded_at), 'HH:mm', { locale: ko })}
                      </span>
                      <span className="text-slate-700 flex-1 truncate">
                        {cleanHospitalName(log.hospital_name)}
                      </span>
                      <span className="text-red-500 text-xs shrink-0">
                        {getReasonLabel(log.rejection_reason)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Copy Button */}
              <Button
                onClick={handleCopyTimeline}
                className="w-full bg-gradient-to-r from-primary to-blue-600"
              >
                <Copy className="w-4 h-4 mr-2" />
                타임라인 복사하기
              </Button>
              <p className="text-xs text-slate-400 text-center mt-3">
                복사 후 보호자에게 공유할 수 있습니다
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RejectionTimeline;
