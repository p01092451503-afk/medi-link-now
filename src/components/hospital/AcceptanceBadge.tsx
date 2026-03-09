interface AcceptanceBadgeProps {
  label: string;
  available: boolean;
  icon: React.ElementType;
}

const AcceptanceBadge = ({ label, available, icon: Icon }: AcceptanceBadgeProps) => (
  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium ${
    available
      ? "bg-secondary text-foreground"
      : "bg-secondary text-muted-foreground/40"
  }`}>
    <Icon className="w-4 h-4" />
    <span>{label}</span>
    <span className="ml-auto text-[11px]">{available ? "가능" : "불가"}</span>
  </div>
);

export default AcceptanceBadge;
