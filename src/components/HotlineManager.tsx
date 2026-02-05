import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Phone, X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HotlineContact {
  id: string;
  hospitalName: string;
  phone: string;
  isFavorite: boolean;
}

interface HotlineManagerProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: HotlineContact[];
  onToggleFavorite: (id: string) => void;
}

// Local storage key for hotlines
const HOTLINES_STORAGE_KEY = "medilink_hotlines";

export const useHotlines = () => {
  const [hotlines, setHotlines] = useState<HotlineContact[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(HOTLINES_STORAGE_KEY);
    if (stored) {
      setHotlines(JSON.parse(stored));
    }
  }, []);

  const saveHotlines = (newHotlines: HotlineContact[]) => {
    setHotlines(newHotlines);
    localStorage.setItem(HOTLINES_STORAGE_KEY, JSON.stringify(newHotlines));
  };

  const addHotline = (hospitalName: string, phone: string) => {
    const existing = hotlines.find((h) => h.phone === phone);
    if (existing) return;

    const newHotline: HotlineContact = {
      id: Date.now().toString(),
      hospitalName,
      phone,
      isFavorite: true,
    };
    saveHotlines([...hotlines, newHotline]);
  };

  const removeHotline = (id: string) => {
    saveHotlines(hotlines.filter((h) => h.id !== id));
  };

  const toggleFavorite = (id: string) => {
    saveHotlines(
      hotlines.map((h) =>
        h.id === id ? { ...h, isFavorite: !h.isFavorite } : h
      )
    );
  };

  const isHotline = (phone: string) => {
    return hotlines.some((h) => h.phone === phone);
  };

  return {
    hotlines,
    addHotline,
    removeHotline,
    toggleFavorite,
    isHotline,
    favoriteHotlines: hotlines.filter((h) => h.isFavorite),
  };
};

const HotlineManager = ({ isOpen, onClose, contacts, onToggleFavorite }: HotlineManagerProps) => {
  const favoriteContacts = contacts.filter((c) => c.isFavorite);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[2000]"
          />

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl z-[2001] max-h-[70vh] overflow-hidden"
          >
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-slate-700 rounded-full" />
            </div>

            <div className="px-5 pb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  My 핫라인
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {favoriteContacts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">즐겨찾기한 핫라인이 없습니다</p>
                  <p className="text-xs mt-1">병원 상세에서 ⭐를 눌러 추가하세요</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {favoriteContacts.map((contact) => (
                    <motion.div
                      key={contact.id}
                      layout
                      className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {contact.hospitalName}
                        </p>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => window.location.href = `tel:${contact.phone}`}
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                        <button
                          onClick={() => onToggleFavorite(contact.id)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full"
                        >
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HotlineManager;
