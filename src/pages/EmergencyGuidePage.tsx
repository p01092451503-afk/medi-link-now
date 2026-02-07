import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Heart,
  Wind,
  Brain,
  Droplets,
  Flame,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const firstAidGuides = [
  {
    id: 'cpr',
    icon: Heart,
    emoji: '❤️',
    title: '심정지 (심폐소생술)',
    instruction: '가슴 중앙을 세고 빠르게 누르세요 (분당 100~120회).',
    steps: [
      '환자를 딱딱한 바닥에 눕히세요',
      '가슴 중앙(양쪽 젖꼭지 사이)에 손꿈치를 올리세요',
      '약 5cm 깊이로 빠르게 30회 압박하세요',
      '머리를 뒤로 젖히고 턱을 들어 기도를 열어주세요',
      '코를 막고 입을 맞대어 2회 인공호흡하세요',
      '119가 올 때까지 30:2 비율로 반복하세요',
    ],
    hasAnimation: true,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
  {
    id: 'choking',
    icon: Wind,
    emoji: '🤐',
    title: '기도폐쇄 (하임리히)',
    instruction: '환자 뒤에 서서, 배꼽 위에 주먹을 대고 위로 강하게 당기세요.',
    steps: [
      '환자 뒤에 서서 양팔로 감싸세요',
      '한 손으로 주먹을 쥐고 배꼽 약간 위에 대세요',
      '다른 손으로 주먹을 감싸 쥐세요',
      '빠르게 위쪽·안쪽으로 힘껏 당기세요',
      '이물질이 나올 때까지 반복하세요',
    ],
    hasAnimation: false,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
  },
  {
    id: 'stroke',
    icon: Brain,
    emoji: '🧠',
    title: '뇌졸중 (FAST)',
    instruction: '얼굴 처짐? 팔 무력? 언어 장애? 즉시 119에 전화하세요.',
    steps: [
      'F (Face) — 웃어보라고 하세요. 한쪽 얼굴이 처지나요?',
      'A (Arm) — 양팔을 들어보라고 하세요. 한쪽이 내려가나요?',
      'S (Speech) — 간단한 문장을 말해보라고 하세요. 발음이 이상한가요?',
      'T (Time) — 위 증상이 하나라도 있으면 즉시 119 신고!',
    ],
    hasAnimation: false,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  {
    id: 'bleeding',
    icon: Droplets,
    emoji: '🩸',
    title: '심한 출혈',
    instruction: '깨끗한 천으로 직접 압박하세요. 부상 부위를 높이 올리세요.',
    steps: [
      '깨끗한 천이나 거즈로 상처 부위를 세게 누르세요',
      '가능하면 부상 부위를 심장보다 높이 올리세요',
      '천이 피에 젖어도 떼지 말고 그 위에 덧대세요',
      '지혈대는 전문가 지시 없이 사용하지 마세요',
      '환자를 안정시키고 119를 기다리세요',
    ],
    hasAnimation: false,
    color: 'text-rose-600',
    bgColor: 'bg-rose-600/10',
    borderColor: 'border-rose-600/20',
  },
  {
    id: 'burns',
    icon: Flame,
    emoji: '🔥',
    title: '화상',
    instruction: '15분간 흐르는 물로 식히세요. 얼음은 사용하지 마세요!',
    steps: [
      '즉시 흐르는 시원한 물로 15~20분간 식히세요',
      '절대 얼음이나 얼음물을 사용하지 마세요',
      '깨끗한 천이나 랩으로 살짝 덮어주세요',
      '물집을 터뜨리지 마세요',
      '연고, 버터, 치약 등을 바르지 마세요',
    ],
    hasAnimation: false,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
];

const CPRPulsingHeart = () => (
  <div className="flex flex-col items-center py-4">
    <motion.div
      animate={{ scale: [1, 1.3, 1, 1.3, 1] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      className="relative"
    >
      <Heart className="w-16 h-16 text-red-500 fill-red-500" />
      <motion.div
        animate={{ opacity: [0, 0.4, 0, 0.4, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-24 h-24 rounded-full bg-red-500/20" />
      </motion.div>
    </motion.div>
    <p className="mt-3 text-sm font-bold text-red-500 tracking-wide">
      분당 100~120회 압박
    </p>
    <div className="flex gap-1 mt-2">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ scaleY: [1, 1.8, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          className="w-2 h-4 bg-red-400 rounded-full"
        />
      ))}
    </div>
  </div>
);

const EmergencyGuidePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-red-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-red-100 dark:border-slate-800">
        <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors text-sm font-medium"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            돌아가기
          </button>
          <span className="font-logo font-extrabold text-slate-800 dark:text-white">
            🆘 응급 가이드
          </span>
          <div className="w-16" />
        </div>
      </header>

      <main className="px-5 pb-28 max-w-lg mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-6 pb-5"
        >
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <span className="text-xl">🆘</span>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-extrabold text-foreground">
                응급 행동 가이드
              </h1>
              <p className="text-sm text-muted-foreground">
                구급차 도착 전 행동 요령
              </p>
            </div>
          </div>
        </motion.div>

        {/* Warning Banner */}
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
            ⚠️ 전문 의료 조치를 대체하지 않습니다
          </p>
        </div>

        {/* Accordion Guide List */}
        <Accordion type="single" collapsible className="space-y-3">
          {firstAidGuides.map((guide) => {
            const Icon = guide.icon;
            return (
              <AccordionItem
                key={guide.id}
                value={guide.id}
                className={`border rounded-xl overflow-hidden ${guide.borderColor} ${guide.bgColor}`}
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <div className={`w-9 h-9 rounded-full ${guide.bgColor} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${guide.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{guide.emoji}</span>
                        <span className="font-bold text-sm text-foreground">{guide.title}</span>
                      </div>
                      <p className={`text-[11px] font-semibold mt-0.5 ${guide.color}`}>
                        {guide.instruction}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {guide.hasAnimation && <CPRPulsingHeart />}
                  <div className="space-y-2 mt-2">
                    {guide.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg bg-background/80 border border-border/50"
                      >
                        <span className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 text-xs font-bold text-foreground">
                          {idx + 1}
                        </span>
                        <p className="text-xs font-medium text-foreground leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Disclaimer */}
        <div className="mt-6 p-3 bg-muted/50 rounded-xl">
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            ※ 이 정보는 일반적인 가이드이며 의료 전문가의 진단을 대체하지 않습니다.
            <br />
            증상이 심하거나 판단이 어려우면 반드시 의사와 상담하세요.
          </p>
        </div>
      </main>

      {/* Sticky 119 Call Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-red-100 dark:border-slate-800 p-4 safe-bottom">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={() => (window.location.href = 'tel:119')}
            className="w-full py-6 rounded-2xl text-base font-bold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/25 border-0"
          >
            <Phone className="w-5 h-5 mr-2" />
            📞 119 전화하기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyGuidePage;
