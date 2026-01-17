import ScrollTop from "@/components/common/ScrollTop/ScrollTop";
import React, { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className='page-wrapper' suppressHydrationWarning>
      {children}
      <ScrollTop />
    </div>
  );
};

export default Layout;
