import { motion } from "framer-motion";
import { 
  Droplets, 
  Heart, 
  AlertTriangle, 
  MoreVertical,
  Trash2,
  Edit,
  Baby,
  User,
  Users,
  Weight,
  Pill,
  Phone,
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FamilyMember, RELATION_LABELS, BLOOD_TYPE_LABELS } from "@/types/familyMember";

interface MedicalPassportCardProps {
  member: FamilyMember;
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string) => void;
  onViewDetail: (member: FamilyMember) => void;
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

// Credit card style gradient based on gender (primary) and blood type (secondary)
const getCardGradient = (gender: FamilyMember["gender"], bloodType: FamilyMember["bloodType"]) => {
  // Gender-based primary colors
  if (gender === "male") {
    return "from-blue-600 via-blue-500 to-cyan-400";
  } else if (gender === "female") {
    return "from-pink-400 via-pink-500 to-fuchsia-400";
  }
  
  // Default/unknown: use blood type colors as fallback
  switch (bloodType) {
    case "A+":
    case "A-":
      return "from-blue-600 via-blue-500 to-cyan-400";
    case "B+":
    case "B-":
      return "from-emerald-600 via-emerald-500 to-teal-400";
    case "O+":
    case "O-":
      return "from-red-600 via-red-500 to-orange-400";
    case "AB+":
    case "AB-":
      return "from-purple-600 via-purple-500 to-pink-400";
    default:
      return "from-slate-600 via-slate-500 to-slate-400";
  }
};

const MedicalPassportCard = ({ member, onEdit, onDelete, onViewDetail }: MedicalPassportCardProps) => {
  const RelationIcon = getRelationIcon(member.relation);
  const cardGradient = getCardGradient(member.gender, member.bloodType);
  
  // Calculate age from birth date if available
  const displayAge = member.birthDate 
    ? Math.floor((new Date().getTime() - new Date(member.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : member.age;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onViewDetail(member)}
      className="cursor-pointer"
    >
      {/* Credit Card Style Container */}
      <div className={`relative bg-gradient-to-br ${cardGradient} rounded-2xl p-5 shadow-xl overflow-hidden`}>
        {/* Card Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 border-2 border-white rounded-full" />
          <div className="absolute top-8 right-8 w-24 h-24 border-2 border-white rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 border border-white rounded-full" />
        </div>

        {/* Card Header */}
        <div className="relative flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <RelationIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{member.name}</h3>
              <p className="text-sm text-white/80">
                {RELATION_LABELS[member.relation]} · {displayAge}세
                {member.weightKg && ` · ${member.weightKg}kg`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Edit Button - More Visible */}
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(member); }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <Edit className="w-4 h-4 text-white" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetail(member); }}>
                  <Eye className="w-4 h-4 mr-2" />
                  상세 보기
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(member); }}>
                  <Edit className="w-4 h-4 mr-2" />
                  수정
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(member.id); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Blood Type Badge - Large */}
        <div className="relative mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl">
            <Droplets className="w-5 h-5 text-white" />
            <span className="text-lg font-bold text-white">
              {BLOOD_TYPE_LABELS[member.bloodType]}
            </span>
          </div>
        </div>

        {/* Quick Info Tags */}
        <div className="relative flex flex-wrap gap-2 mb-3">
          {member.chronicDiseases.slice(0, 2).map((disease) => (
            <span
              key={disease}
              className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full flex items-center gap-1"
            >
              <Heart className="w-3 h-3" />
              {disease}
            </span>
          ))}
          {member.chronicDiseases.length > 2 && (
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
              +{member.chronicDiseases.length - 2}
            </span>
          )}
          {member.allergies.slice(0, 2).map((allergy) => (
            <span
              key={allergy}
              className="px-3 py-1 bg-orange-400/30 backdrop-blur-sm text-white text-xs font-medium rounded-full flex items-center gap-1"
            >
              <AlertTriangle className="w-3 h-3" />
              {allergy}
            </span>
          ))}
          {member.allergies.length > 2 && (
            <span className="px-3 py-1 bg-orange-400/30 backdrop-blur-sm text-white text-xs font-medium rounded-full">
              +{member.allergies.length - 2}
            </span>
          )}
        </div>

        {/* Bottom Row - Medications & Contact */}
        <div className="relative flex items-center justify-between pt-2 border-t border-white/20">
          <div className="flex items-center gap-4 text-white/80 text-xs">
            {member.medications && member.medications.length > 0 && (
              <span className="flex items-center gap-1">
                <Pill className="w-3 h-3" />
                {member.medications.length}개 복용약
              </span>
            )}
            {member.guardianContact && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                연락처 있음
              </span>
            )}
          </div>
          <div className="text-white/60 text-xs font-mono">
            MEDICAL PASSPORT
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MedicalPassportCard;
