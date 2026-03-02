import { motion } from "framer-motion";
import {
  Heart,
  Wind,
  Brain,
  Droplets,
  Flame,
  Phone,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SubPageHeader from "@/components/SubPageHeader";

const firstAidGuides = [
  {
    id: 'cpr',
    icon: Heart,
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
  },
  {
    id: 'choking',
    icon: Wind,
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
  },
  {
    id: 'stroke',
    icon: Brain,
    title: '뇌졸중 (FAST)',
    instruction: '얼굴 처짐? 팔 무력? 언어 장애? 즉시 119에 전화하세요.',
    steps: [
      'F (Face) — 웃어보라고 하세요. 한쪽 얼굴이 처지나요?',
      'A (Arm) — 양팔을 들어보라고 하세요. 한쪽이 내려가나요?',
      'S (Speech) — 간단한 문장을 말해보라고 하세요. 발음이 이상한가요?',
      'T (Time) — 위 증상이 하나라도 있으면 즉시 119 신고!',
    ],
    hasAnimation: false,
  },
  {
    id: 'bleeding',
    icon: Droplets,
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
  },
  {
    id: 'burns',
    icon: Flame,
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
  },
];

const CPRPulsingHeart = () => (
  <div className="flex flex-col items-center py-4">
    <motion.div
      animate={{ scale: [1, 1.3, 1, 1.3, 1] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      className="relative"
    >
      <Heart className="w-16 h-16 text-destructive fill-current" />
      <motion.div
        animate={{ opacity: [0, 0.3, 0, 0.3, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-24 h-24 rounded-full bg-destructive/10" />
      </motion.div>
    </motion.div>
    <p className="mt-3 text-sm font-bold text-foreground tracking-wide">
      분당 100~120회 압박
    </p>
    <div className="flex gap-1 mt-2">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ scaleY: [1, 1.8, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          className="w-2 h-4 bg-foreground/20 rounded-full"
        />
      ))}
    </div>
  </div>
);

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const }
  }),
};

const EmergencyGuidePage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SubPageHeader title="응급 행동 가이드" />

      <main className="flex-1 max-w-lg mx-auto w-full px-5 pb-28">
        {/* Title */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="pt-8 pb-6"
        >
          <h2 className="text-[1.75rem] leading-tight font-extrabold text-foreground tracking-tight mb-2">
            구급차 도착 전,<br />행동 요령
          </h2>
          <p className="text-sm text-muted-foreground">
            응급 상황 5가지 시나리오별 대처법
          </p>
        </motion.div>

        {/* Warning Banner */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          className="mb-8 p-3.5 rounded-2xl bg-secondary text-center"
        >
          <p className="text-xs font-semibold text-muted-foreground">
            ⚠️ 전문 의료 조치를 대체하지 않습니다
          </p>
        </motion.div>

        {/* Accordion Guide List */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {firstAidGuides.map((guide) => {
              const Icon = guide.icon;
              return (
                <AccordionItem
                  key={guide.id}
                  value={guide.id}
                  className="border-0 bg-secondary rounded-2xl overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-4 hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <span className="font-bold text-[14px] text-foreground">{guide.title}</span>
                        <p className="text-[11px] font-medium mt-0.5 text-muted-foreground">
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
                          className="flex items-start gap-3 p-3 rounded-xl bg-background"
                        >
                          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-foreground">
                            {idx + 1}
                          </span>
                          <p className="text-[12px] font-medium text-foreground leading-relaxed">
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
        </motion.div>

        {/* Disclaimer */}
        <div className="mt-10 py-4">
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            ※ 이 정보는 일반적인 가이드이며 의료 전문가의 진단을 대체하지 않습니다.
            <br />
            증상이 심하거나 판단이 어려우면 반드시 의사와 상담하세요.
          </p>
        </div>
      </main>

      {/* Fixed 119 Call Button */}
      <div className="fixed bottom-safe-1 left-0 right-0 z-40 px-4 pb-2 bg-gradient-to-t from-background via-background to-transparent">
        <a
          href="tel:119"
          className="flex items-center justify-center gap-2 w-full max-w-lg mx-auto py-4 rounded-2xl bg-destructive text-destructive-foreground text-base font-bold shadow-lg active:scale-[0.98] transition-transform"
        >
          <Phone className="w-5 h-5" />
          119 전화하기
        </a>
      </div>
    </div>
  );
};

export default EmergencyGuidePage;
