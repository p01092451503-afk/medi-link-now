import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Clean hospital name by removing foundation/organization prefixes
 * e.g., "재단법인아산사회복지재단서울아산병원" → "서울아산병원"
 */
export function cleanHospitalName(name: string): string {
  let cleaned = name
    // Remove common foundation/organization prefixes (at start)
    .replace(/^(재단법인|의료법인|학교법인|사회복지법인)/g, '')
    // Remove foundation names anywhere in the name
    .replace(/의료재단/g, '')
    .replace(/아산사회복지재단/g, '')
    .replace(/가톨릭학원/g, '')
    .replace(/삼성의료재단/g, '')
    .replace(/연세의료원/g, '')
    .replace(/고려중앙학원/g, '')
    .replace(/이화학당/g, '')
    .replace(/건국대학교의료원/g, '건국대학교')
    .replace(/울산대학교의과대학/g, '')
    .replace(/의과대학부속/g, '')
    .replace(/의과대학/g, '')
    .replace(/부속병원$/g, '병원')
    // Remove other common organization suffixes
    .replace(/사회복지재단/g, '')
    .replace(/학교법인/g, '')
    .replace(/의료법인/g, '')
    .trim();
  
  // Handle duplicate prefix patterns (e.g., "성애성애병원" → "성애병원")
  // This happens when foundation name contains the hospital name
  const duplicateMatch = cleaned.match(/^(.{2,4})\1(병원|의료원)$/);
  if (duplicateMatch) {
    cleaned = duplicateMatch[1] + duplicateMatch[2];
  }
  
  return cleaned;
}
