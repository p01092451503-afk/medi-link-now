import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import FirstAidModal from './FirstAidModal';

const FirstAidFAB = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-safe-1 left-2 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground/90 text-background text-[11px] font-semibold shadow-md backdrop-blur-sm hover:opacity-90 transition-all active:scale-95"
        aria-label="응급 처치 가이드"
      >
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>응급처치</span>
      </motion.button>

      <FirstAidModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default FirstAidFAB;
