import React from "react";
import { FileX, Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: "file" | "inbox" | "none";
  size?: "small" | "medium" | "large";
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title = "No content available", 
  description = "There is currently no content to display in this section.",
  icon = "inbox",
  size = "medium"
}) => {
  const sizeConfig = {
    small: { iconSize: 32, titleSize: "16px", descSize: "14px" },
    medium: { iconSize: 48, titleSize: "18px", descSize: "16px" },
    large: { iconSize: 64, titleSize: "20px", descSize: "18px" }
  };

  const config = sizeConfig[size];

  const renderIcon = () => {
    if (icon === "none") return null;
    
    const IconComponent = icon === "file" ? FileX : Inbox;
    return (
      <IconComponent 
        size={config.iconSize} 
        color="#b79c5c" 
        style={{ marginBottom: '16px' }}
      />
    );
  };

  return (
    <div 
      className="empty-state d-flex flex-column align-items-center justify-content-center text-center py-5"
      style={{
        minHeight: '200px',
        padding: '40px 20px'
      }}
    >
      {renderIcon()}
      <h3 
        className="empty-state-title mb-3"
        style={{
          fontSize: config.titleSize,
          fontWeight: '600',
          color: '#1a1a1a',
          margin: '0 0 8px 0'
        }}
      >
        {title}
      </h3>
      <p 
        className="empty-state-description mb-0"
        style={{
          fontSize: config.descSize,
          color: '#666',
          margin: '0',
          maxWidth: '400px',
          lineHeight: '1.5'
        }}
      >
        {description}
      </p>
    </div>
  );
};

export default EmptyState;
