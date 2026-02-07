import { useState } from 'react';
import { X, Heart, Wind, Brain, Droplets, Flame, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

interface FirstAidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const guides = [
  {
    id: 'cpr',
    icon: Heart,
    emoji: '❤️',
    title: '심정지 (심폐소생술)',
    titleEn: 'Cardiac Arrest (CPR)',
    instruction: '가슴 중앙을 세고 빠르게 누르세요 (분당 100~120회).',
    instructionEn: 'Push hard & fast in the center of the chest (100-120 times/min).',
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
    titleEn: 'Choking (Heimlich)',
    instruction: '환자 뒤에 서서, 배꼽 위에 주먹을 대고 위로 강하게 당기세요.',
    instructionEn: 'Stand behind, fist above navel, pull Upward & Inward.',
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
    titleEn: 'Stroke (FAST)',
    instruction: '얼굴 처짐? 팔 무력? 언어 장애? 즉시 119에 전화하세요.',
    instructionEn: 'Face drooping? Arm weakness? Speech difficulty? Call 119 immediately.',
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
    titleEn: 'Severe Bleeding',
    instruction: '깨끗한 천으로 직접 압박하세요. 부상 부위를 높이 올리세요.',
    instructionEn: 'Apply direct pressure with a clean cloth. Elevate the injury.',
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
    titleEn: 'Burns',
    instruction: '15분간 흐르는 물로 식히세요. 얼음은 사용하지 마세요!',
    instructionEn: 'Cool with running water for 15 mins. Do NOT use ice.',
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
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
          className="w-2 h-4 bg-red-400 rounded-full"
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
          className="fixed inset-0 z-[100] flex flex-col bg-background"
        >
          {/* Red Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-4 flex items-center justify-between shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🆘</span>
              <div>
                <h1 className="text-lg font-bold leading-tight">응급 행동 가이드</h1>
                <p className="text-xs text-red-100 mt-0.5">구급차 도착 전 행동 요령</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
            <div className="max-w-lg mx-auto">
              {/* Warning Banner */}
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  ⚠️ 전문 의료 조치를 대체하지 않습니다
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  119 구급대원이 도착하기 전까지의 응급 행동 요령입니다
                </p>
              </div>

              <Accordion type="single" collapsible className="space-y-3">
                {guides.map((guide) => {
                  const Icon = guide.icon;
                  return (
                    <AccordionItem
                      key={guide.id}
                      value={guide.id}
                      className={`border rounded-xl overflow-hidden ${guide.borderColor} ${guide.bgColor}`}
                    >
                      <AccordionTrigger className="px-4 py-4 hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <div className={`w-10 h-10 rounded-full ${guide.bgColor} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-5 h-5 ${guide.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{guide.emoji}</span>
                              <span className="font-bold text-base text-foreground">{guide.title}</span>
                            </div>
                            <p className={`text-sm font-semibold mt-1 ${guide.color}`}>
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
                              <p className="text-sm font-medium text-foreground leading-relaxed">
                                {step}
                              </p>
                            </div>
                          ))}
                        </div>

                        <p className="mt-3 text-xs text-muted-foreground italic text-center">
                          {guide.instructionEn}
                        </p>
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
              <Button
                onClick={handleCall119}
                className="w-full py-6 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white text-lg font-bold shadow-xl shadow-red-500/30"
              >
                <Phone className="w-6 h-6 mr-2" />
                📞 119 전화하기
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FirstAidModal;
