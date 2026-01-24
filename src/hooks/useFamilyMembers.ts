import { useState, useEffect } from "react";
import { FamilyMember } from "@/types/familyMember";

const STORAGE_KEY = "medi_link_family_members";

export const useFamilyMembers = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMembers(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load family members:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage whenever members change
  const saveMembers = (newMembers: FamilyMember[]) => {
    setMembers(newMembers);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMembers));
  };

  const addMember = (member: Omit<FamilyMember, "id" | "createdAt" | "updatedAt">) => {
    const newMember: FamilyMember = {
      ...member,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveMembers([...members, newMember]);
    return newMember;
  };

  const updateMember = (id: string, updates: Partial<Omit<FamilyMember, "id" | "createdAt">>) => {
    const updatedMembers = members.map((m) =>
      m.id === id
        ? { ...m, ...updates, updatedAt: new Date().toISOString() }
        : m
    );
    saveMembers(updatedMembers);
  };

  const deleteMember = (id: string) => {
    saveMembers(members.filter((m) => m.id !== id));
  };

  const getMember = (id: string) => {
    return members.find((m) => m.id === id);
  };

  return {
    members,
    isLoading,
    addMember,
    updateMember,
    deleteMember,
    getMember,
  };
};
