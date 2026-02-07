import { useState } from 'react';
import { motion } from 'framer-motion';
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
        className="fixed bottom-24 left-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold shadow-lg shadow-red-500/30 hover:from-red-700 hover:to-orange-600 transition-all active:scale-95"
        aria-label="응급 처치 가이드"
      >
        <span className="text-xl leading-none">🆘</span>
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
