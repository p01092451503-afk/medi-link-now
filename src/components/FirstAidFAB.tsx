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
        className="fixed bottom-36 left-4 z-40 flex items-center gap-2 px-5 py-4 min-w-[56px] min-h-[56px] rounded-full bg-foreground text-background font-bold shadow-lg hover:opacity-90 transition-all active:scale-95"
        aria-label="응급 처치 가이드"
      >
        <ShieldAlert className="w-4 h-4" />
        <span className="text-sm">응급처치</span>
      </motion.button>

      <FirstAidModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default FirstAidFAB;
