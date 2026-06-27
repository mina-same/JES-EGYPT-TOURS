"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List } from 'lucide-react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface BlogTOCProps {
  contentSelector: string;
  isInline?: boolean;
}

const createHeadingSlug = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

const getUniqueHeadingId = (baseId: string, usedIds: Set<string>) => {
  let id = baseId;
  let suffix = 2;

  while (usedIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(id);
  return id;
};

const BlogTOC: React.FC<BlogTOCProps> = ({ contentSelector, isInline = false }) => {
  const { t } = useTranslation('blogs');
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const suppressScrollSpyRef = useRef(false);
  const suppressScrollSpyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const content = document.querySelector(contentSelector);
    if (!content) return;

    const headers = content.querySelectorAll('h2');
    const items: TOCItem[] = [];
    const usedIds = new Set<string>();

    headers.forEach((header, index) => {
      const text = header.textContent || '';
      if (!text) return;

      const fallbackId = `blog-header-${index}`;
      const baseId = header.id.trim() || createHeadingSlug(text) || fallbackId;
      header.id = getUniqueHeadingId(baseId, usedIds);

      items.push({
        id: header.id,
        text,
        level: parseInt(header.tagName.substring(1)),
      });
    });

    setToc(items);

    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressScrollSpyRef.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -70% 0px' }
    );

    headers.forEach((header) => observer.observe(header));
    return () => {
      observer.disconnect();
      if (suppressScrollSpyTimerRef.current) {
        clearTimeout(suppressScrollSpyTimerRef.current);
      }
    };
  }, [contentSelector]);

  if (toc.length === 0) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveId(id);
    suppressScrollSpyRef.current = true;
    if (suppressScrollSpyTimerRef.current) {
      clearTimeout(suppressScrollSpyTimerRef.current);
    }
    suppressScrollSpyTimerRef.current = setTimeout(() => {
      suppressScrollSpyRef.current = false;
    }, 900);

    const element = document.getElementById(id);
    if (element) {
      const offset = 160;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <nav className="blog-toc" aria-label={t('tableOfContents') || 'Table of contents'}>
      <div className="blog-toc__header">
        <List size={15} />
        <span>{t('tableOfContents') || 'Table of Contents'}</span>
      </div>
      <ol className="blog-toc__list list-unstyled">
        {toc.map((item, idx) => (
          <li
            key={item.id}
            className={`blog-toc__item blog-toc__item--level${item.level} ${activeId === item.id ? 'is-active' : ''}`}
          >
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
            >
              <span className="blog-toc__num">{idx + 1}</span>
              <span className="blog-toc__text">{item.text}</span>
            </a>
          </li>
        ))}
      </ol>
      <style jsx>{`
        .blog-toc {
          background: #fff;
          border: 1px solid #e8e0d0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .blog-toc__header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 20px;
          background: linear-gradient(135deg, #1b4168 0%, #1d3a5f 100%);
          color: #fff;
          font-weight: 700;
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .blog-toc__list {
          margin: 0;
          padding: 10px 0;
          max-height: 68vh;
          overflow-y: auto;
        }

        .blog-toc__item a {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px 18px;
          text-decoration: none !important;
          color: #4a5568;
          font-size: 0.875rem;
          line-height: 1.5;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }

        .blog-toc__item a:hover {
          background-color: #fdfaf3;
          color: #1b4168;
          border-left-color: #b79c5c;
        }

        .blog-toc__item.is-active a {
          background-color: #fdfaf3;
          color: #b79c5c;
          border-left-color: #b79c5c;
          font-weight: 600;
        }

        .blog-toc__num {
          min-width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f0ece4;
          color: #b79c5c;
          font-size: 0.68rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
          transition: all 0.2s ease;
        }

        .blog-toc__item.is-active .blog-toc__num {
          background: #b79c5c;
          color: #fff;
        }

        .blog-toc__item--level3 a { padding-left: 28px; }
        .blog-toc__item--level4 a { padding-left: 38px; }

        .blog-toc__list::-webkit-scrollbar { width: 3px; }
        .blog-toc__list::-webkit-scrollbar-track { background: #f9f9f9; }
        .blog-toc__list::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
      `}</style>
    </nav>
  );
};

export default BlogTOC;
