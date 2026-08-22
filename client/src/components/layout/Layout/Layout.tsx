import ScrollTop from "@/components/common/ScrollTop/ScrollTop";
import React, { ReactNode } from "react";
import { waHref } from "@/config/contact";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className='page-wrapper' suppressHydrationWarning>
      {children}
      <a
        href={waHref("Hello JES Egypt Tours, I'd like to inquire about a tour.")}
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
