import React from 'react';
import Image from 'next/image';

interface ReviewAvatarProps {
  src?: string;
  name?: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  unoptimized?: boolean;
}

/**
 * Shared component for review avatars to ensure consistent SEO attributes (title and alt).
 * 
 * Logic:
 * - title: reviewer name or "Customer review"
 * - alt: "Customer review avatar for [name]" or "Customer review avatar"
 */
const ReviewAvatar: React.FC<ReviewAvatarProps> = ({ 
  src, 
  name, 
  width = 60, 
  height = 60, 
  className = "",
  fill = false,
  unoptimized = false
}) => {
  // Logic for attributes as requested
  const titleAttr = name && name !== 'User' && name !== 'Traveler' && name !== 'Anonymous' 
    ? name 
    : "Customer review";
    
  const altAttr = name && name !== 'User' && name !== 'Traveler' && name !== 'Anonymous'
    ? `Customer review avatar for ${name}` 
    : "Customer review avatar";
  
  // Default fallback image if src is missing
  const avatarSrc = src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=b79c5c&color=fff&bold=true`;

  return (
    <Image
      src={avatarSrc}
      alt={altAttr}
      title={titleAttr}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      fill={fill}
      className={className}
      unoptimized={unoptimized}
    />
  );
};

export default ReviewAvatar;
