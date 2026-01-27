import { motion } from "framer-motion";

// Partner configuration - Add your partner logos here
// To add a new partner:
// 1. Import the logo: import partnerLogo from "@/assets/partners/partner-logo.png"
// 2. Add to the PARTNERS array below
export interface Partner {
  id: string;
  name: string;
  logo?: string;        // URL or imported image path
  placeholder?: string; // Placeholder text if no logo
  url?: string;         // Optional link to partner website
}

// Default partners - Replace with actual partner data
const PARTNERS: Partner[] = [
  {
    id: "partner-1",
    name: "파트너사 1",
    placeholder: "로고",
    // logo: "/partners/partner1.png", // Uncomment and add actual logo
    // url: "https://partner1.com",
  },
  {
    id: "partner-2",
    name: "파트너사 2",
    placeholder: "로고",
    // logo: "/partners/partner2.png",
    // url: "https://partner2.com",
  },
  {
    id: "partner-3",
    name: "파트너사 3",
    placeholder: "로고",
    // logo: "/partners/partner3.png",
    // url: "https://partner3.com",
  },
];

interface PartnerSectionProps {
  partners?: Partner[];
  className?: string;
}

const PartnerSection = ({ partners = PARTNERS, className = "" }: PartnerSectionProps) => {
  if (partners.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className={`w-full max-w-sm mt-6 ${className}`}
    >
      <div className="border border-dashed border-gray-200 rounded-xl p-3 bg-gray-50/50">
        <p className="text-[9px] text-muted-foreground text-center mb-2 uppercase tracking-wider">
          파트너
        </p>
        <div 
          className="grid gap-2"
          style={{ 
            gridTemplateColumns: `repeat(${Math.min(partners.length, 4)}, 1fr)` 
          }}
        >
          {partners.map((partner) => {
            const content = (
              <div
                className={`bg-white rounded-lg p-2.5 shadow-sm flex flex-col items-center justify-center gap-1 min-h-[60px] transition-all ${
                  partner.url ? "hover:shadow-md hover:scale-105 cursor-pointer" : ""
                }`}
              >
                {partner.logo ? (
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="h-6 w-auto max-w-full object-contain"
                  />
                ) : (
                  <div className="w-10 h-6 rounded bg-gray-100 flex items-center justify-center">
                    <span className="text-[8px] text-gray-400 font-medium">
                      {partner.placeholder || "LOGO"}
                    </span>
                  </div>
                )}
                <p className="text-[8px] text-muted-foreground text-center leading-tight truncate w-full">
                  {partner.name}
                </p>
              </div>
            );

            return partner.url ? (
              <a
                key={partner.id}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {content}
              </a>
            ) : (
              <div key={partner.id}>{content}</div>
            );
          })}
        </div>
        
        {/* Add partner CTA - Remove in production if not needed */}
        <p className="text-[8px] text-center text-muted-foreground/70 mt-2">
          파트너 문의: partner@medi-link.kr
        </p>
      </div>
    </motion.div>
  );
};

export default PartnerSection;
