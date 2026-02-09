import { useState } from 'react';
import { X, Heart, Wind, Brain, Droplets, Flame, Phone, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FirstAidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const guides = [
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
  <div className="flex flex-col items-center py-5">
    <motion.div
      animate={{
        scale: [1, 1.3, 1, 1.3, 1],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="relative"
    >
      <Heart className="w-14 h-14 text-foreground fill-foreground" />
      <motion.div
        animate={{ opacity: [0, 0.3, 0, 0.3, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-20 h-20 rounded-full bg-foreground/10" />
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
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
          className="w-2 h-4 bg-muted-foreground/40 rounded-full"
        />
      ))}
    </div>
  </div>
);

const FirstAidModal = ({ isOpen, onClose }: FirstAidModalProps) => {
  const handleCall119 = () => {
    window.location.href = 'tel:119';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col bg-background"
        >
          {/* Header - Toss style */}
          <div className="bg-background border-b border-border px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">응급 행동 가이드</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">구급차 도착 전 행동 요령</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="닫기"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 py-5 pb-28">
            <div className="max-w-lg mx-auto">
              {/* Warning Banner */}
              <div className="mb-5 p-4 rounded-2xl bg-secondary text-center">
                <p className="text-[13px] font-semibold text-foreground">
                  전문 의료 조치를 대체하지 않습니다
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  119 구급대원이 도착하기 전까지의 응급 행동 요령입니다
                </p>
              </div>

              <Accordion type="single" collapsible className="space-y-2">
                {guides.map((guide) => {
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
                            <span className="font-bold text-[15px] text-foreground">{guide.title}</span>
                            <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug">
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
                              className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border"
                            >
                              <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 text-xs font-bold text-foreground">
                                {idx + 1}
                              </span>
                              <p className="text-[13px] font-medium text-foreground leading-relaxed">
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
            </div>
          </div>

          {/* Sticky 119 Call Button */}
          <div className="fixed bottom-0 left-0 right-0 z-[101] p-4 bg-gradient-to-t from-background via-background to-transparent">
            <div className="max-w-lg mx-auto">
              <button
                onClick={handleCall119}
                className="w-full py-4 rounded-2xl bg-destructive text-destructive-foreground text-[15px] font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <Phone className="w-5 h-5" />
                119 전화하기
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FirstAidModal;
