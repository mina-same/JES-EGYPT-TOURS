import ScrollTop from "@/components/common/ScrollTop/ScrollTop";
import React, { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className='page-wrapper' suppressHydrationWarning>
      {children}
      <a
        href="https://wa.me/201007437271?text=Hello%20JES%20Egypt%20Tours%2C%20I%27d%20like%20to%20inquire%20about%20a%20tour."
        target="_blank"
        rel="noreferrer noopener"
        aria-label="Contact us on WhatsApp"
        className="floating-whatsapp-button"
      >
        <i className="fab fa-whatsapp floating-whatsapp-icon" />
      </a>
      <ScrollTop />
    </div>
  );
};

export default Layout;
