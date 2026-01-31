export interface FamilyMember {
  id: string;
  name: string;
  age: number;
  relation: "child" | "parent" | "spouse" | "sibling" | "self" | "other";
  bloodType: "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-" | "unknown";
  chronicDiseases: string[];
  allergies: string[];
  notes?: string;
  // New fields for Medical Passport
  birthDate?: string;
  weightKg?: number;
  medications?: string[];
  guardianContact?: string;
  createdAt: string;
  updatedAt: string;
}

export const RELATION_LABELS: Record<FamilyMember["relation"], string> = {
  child: "자녀",
  parent: "부모님",
  spouse: "배우자",
  sibling: "형제자매",
  self: "본인",
  other: "기타",
};

export const BLOOD_TYPE_LABELS: Record<FamilyMember["bloodType"], string> = {
  "A+": "A형 Rh+",
  "A-": "A형 Rh-",
  "B+": "B형 Rh+",
  "B-": "B형 Rh-",
  "O+": "O형 Rh+",
  "O-": "O형 Rh-",
  "AB+": "AB형 Rh+",
  "AB-": "AB형 Rh-",
  unknown: "모름",
};

export const COMMON_CHRONIC_DISEASES = [
  "고혈압",
  "당뇨병",
  "심장질환",
  "천식",
  "뇌졸중",
  "간질환",
  "신장질환",
  "암",
];

export const COMMON_ALLERGIES = [
  "페니실린",
  "아스피린",
  "해산물",
  "땅콩",
  "계란",
  "우유",
  "조영제",
  "라텍스",
];

export const COMMON_MEDICATIONS = [
  "아스피린",
  "혈압약",
  "당뇨약",
  "혈전용해제",
  "스테로이드",
  "항생제",
  "진통제",
  "수면제",
];
