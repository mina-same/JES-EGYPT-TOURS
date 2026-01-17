// components/MasonryWrapper.tsx
"use client";
import React, { PropsWithChildren } from "react";
import Masonry from "react-responsive-masonry";

interface MasonryWrapperProps {
  columnsCount?: number;
  gutter?: string;
  className?: string;
}

const MasonryWrapper: React.FC<PropsWithChildren<MasonryWrapperProps>> = ({
  children,
  columnsCount = 3,
  gutter = "10px",
  className,
}) => {
  return (
    <Masonry columnsCount={columnsCount} gutter={gutter} className={className}>
      {children}
    </Masonry>
  );
};

export default MasonryWrapper;
