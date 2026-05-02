'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, BookOpen, Clock } from 'lucide-react';

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
  return (
    <section className="relative h-[60vh] min-h-[500px] flex items-center overflow-hidden">
      {/* Background with Zoom Effect */}
      <motion.div 
        className="absolute inset-0 -z-10"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <Image
          src={bgImage || "/assets/images/backgrounds/page-header-bg-1-1.jpg"}
          alt={imageAlt || title}
          title={imageTitle || imageAlt || title}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent"></div>
      </motion.div>

      <div className="container relative z-10">
        <div className="max-w-4xl">
          {/* Glassmorphism Breadcrumbs */}
          <motion.nav 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 max-w-full overflow-hidden whitespace-nowrap"
          >
            <Link href="/" className="text-white/80 hover:text-white text-sm transition-colors flex-shrink-0">Home</Link>
            {breadcrumbs.map((item, idx) => (
              <React.Fragment key={idx}>
                <span className="text-white/40 flex-shrink-0">/</span>
                {item.href ? (
                  <Link href={item.href} className="text-white/80 hover:text-white text-sm transition-colors flex-shrink-0">{item.label}</Link>
                ) : (
                  <span 
                    className="text-[#b79c5c] text-sm font-bold truncate block max-w-[150px] md:max-w-[350px]"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </motion.nav>

          <motion.h1 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg"
          >
            {title}
          </motion.h1>

          {subTitle && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/90 text-lg md:text-xl font-light max-w-2xl mb-8 leading-relaxed line-clamp-3"
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
                  <span className="text-sm font-medium">{stats.articles} Articles</span>
                </div>
              )}
              {stats.updatedAt && (
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-[#b79c5c]" />
                  <span className="text-sm font-medium">Updated Recently</span>
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
