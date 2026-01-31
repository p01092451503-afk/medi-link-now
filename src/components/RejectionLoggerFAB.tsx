import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ban } from 'lucide-react';
import RejectionLoggerModal from './RejectionLoggerModal';

const RejectionLoggerFAB = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl shadow-red-500/40 flex items-center justify-center hover:from-red-600 hover:to-red-700 transition-all active:scale-95"
        aria-label="거부 기록"
      >
        <Ban className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {isModalOpen && (
          <RejectionLoggerModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default RejectionLoggerFAB;
