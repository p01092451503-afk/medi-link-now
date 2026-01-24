import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  UserPlus, 
  Users, 
  Heart,
  Shield,
  Loader2,
  LogIn,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useFamilyMembersSupabase, FamilyMemberDB } from "@/hooks/useFamilyMembersSupabase";
import { useAuth } from "@/hooks/useAuth";
import FamilyMemberCard from "@/components/FamilyMemberCard";
import FamilyMemberForm from "@/components/FamilyMemberForm";
import { FamilyMember } from "@/types/familyMember";
import { toast } from "@/hooks/use-toast";

const FamilyPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // Use Supabase if authenticated, otherwise use localStorage
  const localMembers = useFamilyMembers();
  const supabaseMembers = useFamilyMembersSupabase();
  
  const {
    members: rawMembers,
    isLoading,
    addMember,
    updateMember,
    deleteMember,
  } = isAuthenticated ? supabaseMembers : localMembers;
  
  // Normalize members to FamilyMember type
  const members: FamilyMember[] = rawMembers.map((m: FamilyMember | FamilyMemberDB) => {
    if ('chronic_diseases' in m) {
      // Supabase format
      return {
        id: m.id,
        name: m.name,
        age: m.age,
        relation: m.relation as FamilyMember["relation"],
        bloodType: m.blood_type as FamilyMember["bloodType"],
        chronicDiseases: m.chronic_diseases || [],
        allergies: m.allergies || [],
        notes: m.notes || undefined,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      };
    }
    return m as FamilyMember;
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const handleAddMember = async (data: Omit<FamilyMember, "id" | "createdAt" | "updatedAt">) => {
    if (isAuthenticated) {
      // Supabase format
      await supabaseMembers.addMember({
        name: data.name,
        age: data.age,
        relation: data.relation,
        blood_type: data.bloodType,
        chronic_diseases: data.chronicDiseases,
        allergies: data.allergies,
        notes: data.notes || null,
      });
    } else {
      localMembers.addMember(data);
      toast({ title: "✅ 가족이 추가되었습니다" });
    }
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleUpdateMember = async (data: Omit<FamilyMember, "id" | "createdAt" | "updatedAt">) => {
    if (editingMember) {
      if (isAuthenticated) {
        await supabaseMembers.updateMember(editingMember.id, {
          name: data.name,
          age: data.age,
          relation: data.relation,
          blood_type: data.bloodType,
          chronic_diseases: data.chronicDiseases,
          allergies: data.allergies,
          notes: data.notes || null,
        });
      } else {
        localMembers.updateMember(editingMember.id, data);
        toast({ title: "✅ 정보가 수정되었습니다" });
      }
      setEditingMember(null);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      if (isAuthenticated) {
        await supabaseMembers.deleteMember(id);
      } else {
        localMembers.deleteMember(id);
        toast({ title: "삭제되었습니다" });
      }
    }
  };

  const handleCallAmbulance = (member: FamilyMember) => {
    // Store selected patient info for ambulance call
    sessionStorage.setItem("selected_patient", JSON.stringify(member));
    toast({
      title: `🚑 ${member.name}님 환자 정보 선택됨`,
      description: "병원을 선택하면 자동으로 정보가 전달됩니다",
    });
    navigate("/map");
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">가족 관리</h1>
            <p className="text-xs text-muted-foreground">응급 상황시 빠른 정보 전달</p>
          </div>
          <Button
            onClick={() => {
              setEditingMember(null);
              setIsFormOpen(true);
            }}
            size="sm"
            className="rounded-xl"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            추가
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Auth Warning Banner */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 font-medium mb-1">
                  로그인하지 않으면 데이터가 기기에만 저장됩니다
                </p>
                <p className="text-xs text-yellow-700 mb-3">
                  다른 기기에서 접속하거나 브라우저 캐시를 삭제하면 데이터가 사라질 수 있습니다.
                </p>
                <Button
                  onClick={() => navigate("/login?mode=guardian&returnTo=/family")}
                  size="sm"
                  variant="outline"
                  className="border-yellow-400 text-yellow-800 hover:bg-yellow-100"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  로그인하고 안전하게 저장하기
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-5 text-white"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">가족 의료 카드</h3>
              <p className="text-sm opacity-90">
                가족의 혈액형, 기저질환, 알레르기 정보를 미리 저장해두면 응급 상황에서 빠르게 전달할 수 있습니다.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && members.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              등록된 가족이 없습니다
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              가족을 추가하여 응급 상황에서 빠르게 정보를 전달하세요
            </p>
            <Button
              onClick={() => setIsFormOpen(true)}
              size="lg"
              className="rounded-xl text-base py-6 px-8"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              첫 번째 가족 추가하기
            </Button>
          </motion.div>
        )}

        {/* Family Member Cards */}
        {!isLoading && members.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="w-4 h-4 text-primary" />
              <span>등록된 가족 {members.length}명</span>
              {isAuthenticated && (
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  ☁️ 클라우드 저장
                </span>
              )}
            </div>
            {members.map((member) => (
              <FamilyMemberCard
                key={member.id}
                member={member}
                onEdit={handleEditMember}
                onDelete={handleDeleteMember}
                onCallAmbulance={handleCallAmbulance}
              />
            ))}
          </div>
        )}
      </main>

      {/* Form Modal */}
      <FamilyMemberForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMember(null);
        }}
        onSave={editingMember ? handleUpdateMember : handleAddMember}
        initialData={editingMember || undefined}
      />
    </div>
  );
};

export default FamilyPage;
