import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Clean hospital name by removing foundation/organization prefixes
 * e.g., "재단법인아산사회복지재단서울아산병원" → "서울아산병원"
 * e.g., "의료법인녹십자의료재단녹십자병원" → "녹십자병원"
 */
export function cleanHospitalName(name: string): string {
  if (!name) return "";

  let cleaned = name
    // Remove common legal entity types (법인 types)
    .replace(/재단법인/g, "")
    .replace(/의료법인/g, "")
    .replace(/학교법인/g, "")
    .replace(/사회복지법인/g, "")
    .replace(/사단법인/g, "")
    .replace(/특수법인/g, "")
    // Remove generic foundation/organization suffixes with preceding names
    .replace(/[가-힣A-Za-z0-9·]+의료재단/g, "")
    .replace(/[가-힣A-Za-z0-9·]+사회복지재단/g, "")
    .replace(/[가-힣A-Za-z0-9·]+학술재단/g, "")
    .replace(/[가-힣A-Za-z0-9·]+장학재단/g, "")
    .replace(/[가-힣A-Za-z0-9·]+복지재단/g, "")
    // Remove known foundation/organization names
    .replace(/아산사회복지재단/g, "")
    .replace(/삼성의료재단/g, "")
    .replace(/연세의료원/g, "")
    .replace(/고려중앙학원/g, "")
    .replace(/가톨릭학원/g, "")
    .replace(/이화학당/g, "")
    // Generic "...재단/학원" fragments frequently embedded in names
    .replace(/[가-힣A-Za-z0-9·]+재단/g, "")
    .replace(/[가-힣A-Za-z0-9·]+학원/g, "")
    // Medical school / affiliation cleanup
    .replace(/건국대학교의료원/g, "건국대학교")
    .replace(/울산대학교의과대학/g, "")
    .replace(/의과대학부속/g, "")
    .replace(/의과대학/g, "")
    .replace(/부속병원$/g, "병원")
    .trim();
  
  // Handle duplicate prefix patterns (e.g., "성애성애병원" → "성애병원")
  // This happens when foundation name contains the hospital name
  const duplicateMatch = cleaned.match(/^(.{2,6})\1(병원|의료원|대학교병원|대학병원)$/);
  if (duplicateMatch) cleaned = duplicateMatch[1] + duplicateMatch[2];

  // Handle repeated prefix cases like "건양건양대학교병원" → "건양대학교병원" (after stripping foundations)
  for (let len = 2; len <= 6; len++) {
    const prefix = cleaned.slice(0, len);
    if (!prefix) continue;
    if (cleaned.startsWith(prefix + prefix)) {
      const after = cleaned.slice(len * 2);
      if (after && (after.includes("병원") || after.includes("의료원"))) {
        cleaned = prefix + after;
        break;
      }
    }
  }
  
  return cleaned;
}
