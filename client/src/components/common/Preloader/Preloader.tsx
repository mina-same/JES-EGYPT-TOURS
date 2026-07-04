// components/Preloader.tsx
"use client";

import React from "react";
import loaderImage from "@/assets/images/loader.png"; // Adjust path as needed

const Preloader: React.FC = () => {
  return (
    <div 
      className="preloader"
      style={{ backgroundColor: '#0A2B40' }}
      suppressHydrationWarning
    >
      <div
        className="preloader__image"
        style={{ 
          backgroundImage: `url(${loaderImage.src})`,
          width: '200px',
          height: '200px',
          backgroundSize: 'contain'
        }}
        suppressHydrationWarning
      ></div>
    </div>
  );
};

export default Preloader;
