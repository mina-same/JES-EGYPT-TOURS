'use client';
import ScrollTop from "@/components/common/ScrollTop/ScrollTop";
import React, { ReactNode, useEffect } from "react";

interface BoxWrapperProps {
  children: ReactNode;
}

const BoxWrapper: React.FC<BoxWrapperProps> = ({ children }) => {
  useEffect(() => {
    document.body.classList.add('box-layout');
    return () => {
      document.body.classList.remove('box-layout');
    };
  }, []);

  return (
    <div className='page-wrapper'>
      {children}
      <ScrollTop />
    </div>
  );
};

export default BoxWrapper;