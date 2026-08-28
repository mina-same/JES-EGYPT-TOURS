'use client';
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, BookOpen, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import { normalizeLocale } from '@/lib/url';
import Breadcrumb from '@/components/common/Breadcrumb/Breadcrumb';

interface BlogHeroProps {
  title: string;
  subTitle?: string;
  bgImage?: string;
  imageAlt?: string;
  imageTitle?: string;
  breadcrumbs: { label: string; href?: string }[];
  stats?: {
    articles?: number;
    updatedAt?: string;
  };
}

const BlogHero: React.FC<BlogHeroProps> = ({ title, subTitle, bgImage, imageAlt, imageTitle, breadcrumbs, stats }) => {
  const { t } = useTranslation('common');
  const params = useParams();
  const locale = normalizeLocale(params?.locale);

  return (
    <section className="relative min-h-[500px] flex items-center overflow-hidden py-36 md:py-40">
      {/* Background with Zoom Effect */}
      <motion.div 
        className="absolute inset-0 -z-10"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        {/* Files in public/ are served from the site root — there is no
            /assets segment, so the old fallback 400'd through the optimizer. */}
        <Image
          src={bgImage || "/images/backgrounds/page-header-bg-1-1.jpg"}
          alt={imageAlt || title}
          title={imageTitle || imageAlt || title}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/30"></div>
      </motion.div>

      <div className="container relative z-10">
        <div className="max-w-4xl">
          {/* The shared trail, in its `pill` skin.

              This markup used to live here — a third hand-written breadcrumb
              after PageHeader's and the author page's — and it carried a bug
              the others had already been fixed for: Home linked to a bare "/",
              which 307s through the middleware and resolves the language from
              a cookie, so a German reader clicking Home could land on the
              English homepage. The shared component builds `/${locale}`.

              `jsonLd={false}` because the route above publishes the page's
              BreadcrumbList already; this keeps the document at exactly one.

              The motion wrapper is a <div>, not the <nav>, so the landmark
              stays inside the component that owns it. */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Breadcrumb
              locale={locale}
              homeLabel={t('home')}
              ariaLabel={t('breadcrumb')}
              items={breadcrumbs}
              variant="pill"
              jsonLd={false}
            />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg"
          >
            {title}
          </motion.h1>

          {subTitle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="html-content text-white/95 text-lg md:text-xl font-light max-w-3xl mb-8 leading-8 md:leading-9 whitespace-pre-line break-words [&_p]:mb-3 [&_p:last-child]:mb-0 px-4 py-3 rounded-xl bg-gradient-to-br from-black/25 to-black/10 border-l-[3px] border-[#d4af37] backdrop-blur-sm"
              dangerouslySetInnerHTML={{ __html: subTitle }}
            />
          )}

          {stats && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-6 text-white/80"
            >
              {stats.articles !== undefined && (
                <div className="flex items-center gap-2">
                  <BookOpen size={20} className="text-[#b79c5c]" />
                  <span className="text-sm font-medium">{t('articlesCount', { count: stats.articles })}</span>
                </div>
              )}
              {stats.updatedAt && (
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-[#b79c5c]" />
                  <span className="text-sm font-medium">{t('updatedRecently')}</span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Decorative Wave Divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] transform rotate-180">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[60px] fill-white">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default BlogHero;
