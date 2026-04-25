'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';

interface LucideIconProps extends LucideIcons.LucideProps {
  name: string;
}

const LucideIcon: React.FC<LucideIconProps> = ({ name, ...props }) => {
  // Convert kebab-case (triangle-alert) to PascalCase (TriangleAlert)
  const pascalName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');

  // @ts-ignore
  const IconComponent = LucideIcons[pascalName] || LucideIcons[name];

  if (!IconComponent) {
    return null;
  }

  return <IconComponent {...props} />;
};

export default LucideIcon;
