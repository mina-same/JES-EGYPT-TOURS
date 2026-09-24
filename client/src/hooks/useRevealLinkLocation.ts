'use client';

import { useEffect } from 'react';
import type { AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import { REVEAL_LINK_LOCATION } from '@/lib/duplicateLinkFeedback';

export function useRevealLinkLocation(setLanguage: (locale: AdminLanguage) => void, setTab?: (tab: string) => void) {
  useEffect(() => {
    const reveal = (event: Event) => {
      const { locale, path } = (event as CustomEvent<{ locale: AdminLanguage; path: string }>).detail;
      if (!['en', 'de', 'it', 'es'].includes(locale)) return;
      setLanguage(locale);
      if (!setTab) return;
      const page = window.location.pathname;
      const root = path.split('.')[0];
      let tab = 'overview';
      if (page.includes('/articles/')) tab = 'content';
      else if (page.includes('/tour/tour/')) {
        if (['tourHighlights', 'inclusion', 'exclusion', 'whatToPack', 'notes', 'whatYouWillLoveHtml'].includes(root)) tab = 'details';
        else if (root === 'itinerary') tab = 'itinerary';
        else if (['pricingPlans', 'cancellationPolicy'].includes(root)) tab = 'pricing';
        else if (root === 'faqs') tab = 'resources';
      } else if (root === 'faqs') tab = page.includes('/destinations/') ? 'faq' : 'faq-blog';
      else if (root.startsWith('hero') || root.endsWith('SectionTitle') || ['bottomSection', 'middleSection', 'introSection'].includes(root)) tab = 'sections';
      else if (root === 'atAGlance') tab = 'glance';
      setTab(tab);
    };
    window.addEventListener(REVEAL_LINK_LOCATION, reveal);
    return () => window.removeEventListener(REVEAL_LINK_LOCATION, reveal);
  }, [setLanguage, setTab]);
}
