import ScrollTop from "@/components/common/ScrollTop/ScrollTop";
import React, { ReactNode } from "react";
import FloatingWhatsApp from "./FloatingWhatsApp";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className='page-wrapper' suppressHydrationWarning>
      {children}
      <FloatingWhatsApp />
      <ScrollTop />
    </div>
  );
};

export default Layout;
