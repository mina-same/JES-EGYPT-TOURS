import React from "react";
import { LucideIcon } from "lucide-react";
import "./StatCard.css";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  iconVariant?: "total" | "active" | "inactive" | "pending" | "confirmed" | "completed" | "cancelled" | "subcategories" | "tours" | "featured" | "progress" | "filtered";
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  value,
  label,
  iconVariant = "total",
  className = "",
}) => {
  return (
    <div className={`stat-card ${className}`}>
      <div className={`stat-icon stat-icon-${iconVariant}`}>
        <Icon size={20} />
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
};

export default StatCard;
