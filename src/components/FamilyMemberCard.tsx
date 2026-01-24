import { motion } from "framer-motion";
import { 
  Ambulance, 
  Droplets, 
  Heart, 
  AlertTriangle, 
  MoreVertical,
  Trash2,
  Edit,
  Baby,
  User,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FamilyMember, RELATION_LABELS, BLOOD_TYPE_LABELS } from "@/types/familyMember";

interface FamilyMemberCardProps {
  member: FamilyMember;
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string) => void;
  onCallAmbulance: (member: FamilyMember) => void;
}

const getRelationIcon = (relation: FamilyMember["relation"]) => {
  switch (relation) {
    case "child":
      return Baby;
    case "parent":
      return Users;
    default:
      return User;
  }
};

const FamilyMemberCard = ({ member, onEdit, onDelete, onCallAmbulance }: FamilyMemberCardProps) => {
  const RelationIcon = getRelationIcon(member.relation);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-lg border border-border"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <RelationIcon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{member.name}</h3>
            <p className="text-sm text-muted-foreground">
              {RELATION_LABELS[member.relation]} · {member.age}세
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(member)}>
              <Edit className="w-4 h-4 mr-2" />
              수정
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(member.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Medical Info Grid */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        {/* Blood Type */}
        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
          <Droplets className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">혈액형</p>
            <p className="font-semibold text-foreground">{BLOOD_TYPE_LABELS[member.bloodType]}</p>
          </div>
        </div>

        {/* Chronic Diseases */}
        {member.chronicDiseases.length > 0 && (
          <div className="p-3 bg-primary/5 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">기저질환</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {member.chronicDiseases.map((disease) => (
                <span
                  key={disease}
                  className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
                >
                  {disease}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Allergies */}
        {member.allergies.length > 0 && (
          <div className="p-3 bg-orange-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <p className="text-xs font-medium text-muted-foreground">알레르기</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {member.allergies.map((allergy) => (
                <span
                  key={allergy}
                  className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full"
                >
                  {allergy}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {member.notes && (
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">특이사항</p>
            <p className="text-sm text-foreground">{member.notes}</p>
          </div>
        )}
      </div>

      {/* Call Ambulance Button */}
      <Button
        onClick={() => onCallAmbulance(member)}
        className="w-full py-5 rounded-xl text-base font-semibold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
      >
        <Ambulance className="w-5 h-5 mr-2" />
        🚑 이 환자로 호출
      </Button>
    </motion.div>
  );
};

export default FamilyMemberCard;
