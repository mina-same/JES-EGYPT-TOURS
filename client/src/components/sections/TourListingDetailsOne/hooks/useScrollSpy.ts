import { useState, useEffect, useCallback } from 'react';

interface UseScrollSpyOptions {
  offset?: number;
  throttle?: number;
}

/**
 * Custom hook for scroll spy functionality
 * Tracks which section is currently in view and provides smooth scrolling
 */
export const useScrollSpy = (
  sections: string[],
  options: UseScrollSpyOptions = {}
) => {
  const { offset = 150, throttle = 100 } = options;
  const [activeSection, setActiveSection] = useState(sections[0] || '');

  // Throttled scroll handler for better performance
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let lastRun = 0;

    const handleScroll = () => {
      const now = Date.now();
      
      if (now - lastRun < throttle) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          handleScroll();
        }, throttle);
        return;
      }

      lastRun = now;

      // Find the current active section
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Check if section is in viewport (considering header offset)
          if (rect.top <= offset && rect.bottom >= offset) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [sections, offset, throttle]);

  // Smooth scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 130;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Immediately set active section
      setActiveSection(sectionId);
    }
  }, []);

  return { activeSection, scrollToSection };
};
