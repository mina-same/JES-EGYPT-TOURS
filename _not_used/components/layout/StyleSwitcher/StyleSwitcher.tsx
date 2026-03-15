// components/StyleSwitcher.tsx
"use client";

import { useEffect } from "react";

const StyleSwitcher: React.FC = () => {
  useEffect(() => {
    // Determine which stylesheet to use based on the pathname
    const newHref = "/css/gotur.css";

    // Look for an existing dynamically injected stylesheet
    const currentLink = document.getElementById(
      "dynamic-stylesheet"
    ) as HTMLLinkElement | null;

    // If the current link exists and already points to the right stylesheet, do nothing.
    if (currentLink && currentLink.href.includes(newHref)) {
      return;
    }

    // If there is a current link and it's different, remove it.
    if (currentLink) {
      currentLink.remove();
    }

    // Create a new link element
    const link = document.createElement("link");
    link.id = "dynamic-stylesheet";
    link.rel = "stylesheet";
    link.href = newHref;

    document.head.appendChild(link);
  }, []);

  return null;
};

export default StyleSwitcher;
