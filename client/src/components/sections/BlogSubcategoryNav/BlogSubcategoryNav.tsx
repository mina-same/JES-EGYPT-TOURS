'use client';
import React from 'react';
import Link from 'next/link';
import { getLocalizedValue } from '@/lib/localize';
import { motion } from 'framer-motion';

interface BlogSubcategoryNavProps {
  subcategories: any[];
  currentSlug: string;
  locale: string;
}

const BlogSubcategoryNav: React.FC<BlogSubcategoryNavProps> = ({ subcategories, currentSlug, locale }) => {
  if (!subcategories || subcategories.length <= 1) return null;

  return (
    <div className="blog-subnav py-6 border-b border-gray-100 bg-white sticky top-[80px] z-30 shadow-sm overflow-hidden">
      <div className="container">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          {subcategories.map((sub, index) => {
            // Strict localized slug: only the current-locale slug, never a
            // cross-locale fallback. Omit the chip when no localized slug exists.
            // Legacy plain-string slugs are only valid for English; for de/it/es
            // a plain string must NOT produce a link (would be a fake localized URL).
            const slug =
              typeof sub.slug === 'string'
                ? (locale === 'en' ? sub.slug.trim() : '')
                : (sub.slug && typeof sub.slug === 'object' && typeof sub.slug[locale] === 'string'
                    ? sub.slug[locale].trim()
                    : '');
            if (!slug) return null;
            const isActive = slug === currentSlug;

            return (
              <motion.div
                key={sub._id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/${locale}/${slug}`}
                  className={`px-6 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all duration-300 border ${
                    isActive 
                      ? 'bg-[#b79c5c] border-[#b79c5c] text-white shadow-md' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-[#b79c5c] hover:text-[#b79c5c]'
                  }`}
                >
                  {getLocalizedValue(sub.name, locale)}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default BlogSubcategoryNav;
