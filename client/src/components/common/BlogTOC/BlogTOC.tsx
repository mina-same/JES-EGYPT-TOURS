"use client";
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

import { List } from 'lucide-react';

interface BlogTOCProps {
  contentSelector: string; // CSS selector for the blog content container
  isInline?: boolean;
}

const BlogTOC: React.FC<BlogTOCProps> = ({ contentSelector, isInline = false }) => {
  const { t } = useTranslation('blogs');
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const content = document.querySelector(contentSelector);
    if (!content) return;

    const headers = content.querySelectorAll('h2, h3, h4');
    const items: TOCItem[] = [];

    headers.forEach((header, index) => {
      const text = header.textContent || '';
      if (!text) return;

      // Ensure header has an ID for scrolling
      if (!header.id) {
        header.id = `blog-header-${index}`;
      }

      items.push({
        id: header.id,
        text,
        level: parseInt(header.tagName.substring(1)),
      });
    });

    setToc(items);

    // Intersection Observer for active state
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -70% 0px' }
    );

    headers.forEach((header) => observer.observe(header));

    return () => observer.disconnect();
  }, [contentSelector]);

  if (toc.length === 0) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Adjust for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={`blog-toc wow fadeInUp animated ${isInline ? 'inline-toc' : 'sidebar__single'}`} data-wow-duration="1500ms" data-wow-delay="500ms">
      <h4 className={isInline ? "inline-toc-title" : "sidebar__title"}>
        {isInline && <List size={20} color="#1b4168" />}
        {t('tableOfContents')}
      </h4>
      <ul className={isInline ? "inline-toc-list list-unstyled" : "sidebar__toc-list list-unstyled"}>
        {toc.map((item) => (
          <li 
            key={item.id} 
            className={`toc-item toc-level-${item.level} ${activeId === item.id ? 'active' : ''}`}
            style={{ marginLeft: isInline ? '0' : `${(item.level - 2) * 15}px` }}
          >
            <a 
              href={`#${item.id}`} 
              onClick={(e) => handleClick(e, item.id)}
              className={activeId === item.id ? (isInline ? 'active-link' : 'text-primary fw-bold') : ''}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
      <style jsx>{`
        /* Sidebar styles */
        .sidebar__toc-list {
          max-height: 400px;
          overflow-y: auto;
          padding-right: 10px;
        }
        .toc-item {
          margin-bottom: 8px;
          line-height: 1.4;
        }
        .toc-item a {
          color: #666;
          font-size: 14px;
          transition: all 0.3s ease;
          text-decoration: none;
        }
        .toc-item a:hover {
          color: #b79c5c;
        }
        .toc-item.active a {
          color: #b79c5c;
        }

        /* Inline styles */
        .inline-toc {
          background-color: #f9f9f9;
          border-radius: 4px;
          padding: 24px;
          height: 100%;
        }
        .inline-toc-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1b4168;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }
        .inline-toc-list {
          margin: 0;
          padding: 0;
        }
        .inline-toc-list .toc-item {
          margin-bottom: 0;
        }
        .inline-toc-list .toc-item a {
          display: block;
          padding: 12px 16px;
          color: #555;
          font-size: 0.95rem;
          text-decoration: none;
          transition: all 0.2s ease;
          border-left: 4px solid transparent;
        }
        .inline-toc-list .toc-item a:hover {
          background-color: #f0f0f0;
          color: #1b4168;
        }
        .inline-toc-list .toc-item.active a,
        .inline-toc-list .toc-item a.active-link {
          background-color: #f0f0f0;
          color: #1b4168;
          border-left-color: #1b4168;
          font-weight: 600;
        }

        /* Scrollbar */
        .sidebar__toc-list::-webkit-scrollbar,
        .inline-toc-list::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar__toc-list::-webkit-scrollbar-thumb,
        .inline-toc-list::-webkit-scrollbar-thumb {
          background: #e0e0e0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default BlogTOC;
