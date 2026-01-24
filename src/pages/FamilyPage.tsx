import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  UserPlus, 
  Users, 
  Heart,
  Shield,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import FamilyMemberCard from "@/components/FamilyMemberCard";
import FamilyMemberForm from "@/components/FamilyMemberForm";
import { FamilyMember } from "@/types/familyMember";
import { toast } from "@/hooks/use-toast";

const FamilyPage = () => {
  const navigate = useNavigate();
  const { members, isLoading, addMember, updateMember, deleteMember } = useFamilyMembers();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const handleAddMember = (data: Omit<FamilyMember, "id" | "createdAt" | "updatedAt">) => {
    addMember(data);
    toast({ title: "✅ 가족이 추가되었습니다" });
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleUpdateMember = (data: Omit<FamilyMember, "id" | "createdAt" | "updatedAt">) => {
    if (editingMember) {
      updateMember(editingMember.id, data);
      toast({ title: "✅ 정보가 수정되었습니다" });
      setEditingMember(null);
    }
  };

  const handleDeleteMember = (id: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      deleteMember(id);
      toast({ title: "삭제되었습니다" });
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
