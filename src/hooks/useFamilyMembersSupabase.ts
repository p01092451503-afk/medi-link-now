import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface FamilyMemberDB {
  id: string;
  user_id: string;
  name: string;
  age: number;
  relation: string;
  blood_type: string;
  chronic_diseases: string[];
  allergies: string[];
  notes: string | null;
  // New fields for Medical Passport
  birth_date: string | null;
  weight_kg: number | null;
  medications: string[] | null;
  guardian_contact: string | null;
  created_at: string;
  updated_at: string;
}

export type FamilyMemberInsert = Omit<FamilyMemberDB, "id" | "user_id" | "created_at" | "updated_at">;
export type FamilyMemberUpdate = Partial<FamilyMemberInsert>;

export const useFamilyMembersSupabase = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch family members
  const {
    data: members = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["family_members", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as FamilyMemberDB[];
    },
    enabled: isAuthenticated && !!user?.id,
  });

  // Add family member
  const addMutation = useMutation({
    mutationFn: async (member: FamilyMemberInsert) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("family_members")
        .insert({
          ...member,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family_members", user?.id] });
      toast({
        title: "가족 구성원 추가됨",
        description: "새로운 가족 구성원이 추가되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update family member
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: FamilyMemberUpdate }) => {
      const { data, error } = await supabase
        .from("family_members")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family_members", user?.id] });
      toast({
        title: "정보 수정됨",
        description: "가족 구성원 정보가 수정되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete family member
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family_members", user?.id] });
      toast({
        title: "삭제됨",
        description: "가족 구성원이 삭제되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addMember = (member: FamilyMemberInsert) => {
    return addMutation.mutateAsync(member);
  };

  const updateMember = (id: string, updates: FamilyMemberUpdate) => {
    return updateMutation.mutateAsync({ id, updates });
  };

  const deleteMember = (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const getMember = (id: string) => {
    return members.find((m) => m.id === id);
  };

  return {
    members,
    isLoading,
    error,
    isAuthenticated,
    addMember,
    updateMember,
    deleteMember,
    getMember,
    refetch,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
