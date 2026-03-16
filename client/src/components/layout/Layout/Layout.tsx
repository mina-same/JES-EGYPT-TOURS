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
        style={{
          position: "fixed",
          right: 40,
          bottom: 110,
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: "#25D366",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
          zIndex: 9999,
          textDecoration: "none",
        }}
      >
        <i className="fab fa-whatsapp" style={{ fontSize: 28, lineHeight: 1 }} />
      </a>
      <ScrollTop />
    </div>
  );
};

export default Layout;
