"use client";
import React from 'react';
import { Construction, Clock } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface NotFoundYetProps {
  title: string;
  description?: string;
  icon?: string;
}

const NotFoundYet: React.FC<NotFoundYetProps> = ({ 
  title, 
  description = "This feature is coming soon. Stay tuned for updates!",
  icon
}) => {
  return (
    <div className="not-found-container">
      <div className="not-found-icon-wrapper">
        <Construction size={64} strokeWidth={1.5} />
      </div>
      <h2 className="not-found-title">{title}</h2>
      <p className="not-found-message">{description}</p>
      <div className="not-found-badge">
        <Clock size={16} />
        <span>Coming Soon</span>
      </div>
    </div>
  );
};

export default NotFoundYet;
