import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface DriverVerification {
  id: string;
  driver_id: string;
  status: string;
  driver_name: string;
  driver_phone: string;
  license_type: string | null;
  experience_years: number | null;
  license_number: string | null;
  business_reg_number: string | null;
  vehicle_reg_number: string | null;
  license_doc_url: string | null;
  vehicle_doc_url: string | null;
  verification_notes: string | null;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationDocument {
  id: string;
  verification_id: string;
  document_type: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  uploaded_at: string;
}

const DOCUMENT_TYPES = [
  { key: "operation_permit", label: "응급환자이송업 허가증 사본" },
  { key: "qualification", label: "응급구조사 자격증 / 운전면허증" },
  { key: "vehicle_registration", label: "차량 등록증" },
] as const;

export const useDriverVerification = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: verification, isLoading } = useQuery({
    queryKey: ["driver-verification", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("driver_verifications")
        .select("*")
        .eq("driver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as DriverVerification | null;
    },
    enabled: !!user,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["driver-verification-docs", verification?.id],
    queryFn: async () => {
      if (!verification) return [];
      const { data, error } = await supabase
        .from("driver_verification_documents")
        .select("*")
        .eq("verification_id", verification.id);
      if (error) throw error;
      return data as VerificationDocument[];
    },
    enabled: !!verification,
  });

  const createVerification = useMutation({
    mutationFn: async (params: {
      name: string;
      phone: string;
      licenseType: string;
      experienceYears: number;
      licenseNumber: string;
      businessRegNumber: string;
      vehicleRegNumber: string;
    }) => {
      if (!user) throw new Error("로그인이 필요합니다");
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const { data, error } = await supabase
        .from("driver_verifications")
        .insert({
          driver_id: user.id,
          driver_name: params.name,
          driver_phone: params.phone,
          license_type: params.licenseType,
          experience_years: params.experienceYears,
          license_number: params.licenseNumber,
          business_reg_number: params.businessRegNumber,
          vehicle_reg_number: params.vehicleRegNumber,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-verification"] });
    },
  });

  const uploadDocument = async (verificationId: string, docType: string, file: File) => {
    if (!user) throw new Error("로그인이 필요합니다");

    const filePath = `${user.id}/${verificationId}/${docType}_${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("driver-documents")
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase
      .from("driver_verification_documents")
      .insert({
        verification_id: verificationId,
        document_type: docType,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
      });
    if (dbError) throw dbError;

    queryClient.invalidateQueries({ queryKey: ["driver-verification-docs"] });
  };

  return {
    verification,
    documents,
    isLoading,
    createVerification,
    uploadDocument,
    DOCUMENT_TYPES,
  };
};

// Admin hook
export const useAdminVerifications = () => {
  const queryClient = useQueryClient();

  const { data: pendingVerifications = [], isLoading } = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driver_verifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DriverVerification[];
    },
  });

  const getDocuments = async (verificationId: string) => {
    const { data, error } = await supabase
      .from("driver_verification_documents")
      .select("*")
      .eq("verification_id", verificationId);
    if (error) throw error;
    return data as VerificationDocument[];
  };

  const getDocumentUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from("driver-documents")
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl;
  };

  const approveVerification = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const { error } = await supabase
        .from("driver_verifications")
        .update({
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          verification_notes: notes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      toast({ title: "인증이 승인되었습니다" });
    },
  });

  const rejectVerification = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("driver_verifications")
        .update({
          status: "rejected",
          rejection_reason: reason,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      toast({ title: "인증이 반려되었습니다" });
    },
  });

  return {
    pendingVerifications,
    isLoading,
    getDocuments,
    getDocumentUrl,
    approveVerification,
    rejectVerification,
  };
};

// Hook to check if a driver is verified (for badges)
export const useDriverVerifiedStatus = (driverId?: string) => {
  const { data: isVerified = false } = useQuery({
    queryKey: ["driver-verified", driverId],
    queryFn: async () => {
      if (!driverId) return false;
      const { data, error } = await supabase
        .from("driver_verifications")
        .select("id, status, expires_at, license_type")
        .eq("driver_id", driverId)
        .eq("status", "approved")
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!driverId,
  });

  const { data: verificationInfo } = useQuery({
    queryKey: ["driver-verification-info", driverId],
    queryFn: async () => {
      if (!driverId) return null;
      const { data, error } = await supabase
        .from("driver_verifications")
        .select("license_type, experience_years, expires_at")
        .eq("driver_id", driverId)
        .eq("status", "approved")
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!driverId,
  });

  return { isVerified, verificationInfo };
};
