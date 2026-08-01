"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { BlogPost, BlogResponse } from "@/lib/api/blog";
import { API_URL } from "@/config/api";
import { getLocalizedValue } from "@/lib/localize";
import { useTranslation } from "react-i18next";


import { tourAPI } from "@/lib/api/tour";

interface BlogSidebarProps {
  currentBlog?: BlogPost;
}

const BlogSidebar: React.FC<BlogSidebarProps> = ({ currentBlog }) => {
  const { t, i18n } = useTranslation("blogs");
  const currentLocale = i18n.language || 'en';
  const blogsPath = `/${currentLocale}/blogs`;
  const [tags, setTags] = useState<string[]>([]);
  useEffect(() => {
    let isMounted = true;

    const loadSidebarData = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: "1",
          limit: "50",
        });

        // The API localizes this response, so without the locale the tag list
        // would come back in English on /de, /it and /es.
        const blogsRes = await fetch(`${API_URL}/blog/posts?${queryParams.toString()}`, {
          headers: { "X-Locale": currentLocale },
        });

        if (blogsRes.ok) {
          const blogsResponse: BlogResponse = await blogsRes.json();
          if (isMounted) {
            const posts = blogsResponse.data || [];
            
            const allLocalizedTags = posts.flatMap((p) => {
              const localizedTags = getLocalizedValue(p.tags, currentLocale);
              return Array.isArray(localizedTags) ? localizedTags : [];
            });
            const uniqueTags = Array.from(new Set(allLocalizedTags)).slice(0, 20);
            setTags(uniqueTags);
          }
        }
      } catch (error) {
        console.error("Failed to load blog sidebar tags:", error);
      }
    };

    loadSidebarData();

    return () => {
      isMounted = false;
    };
  }, [currentLocale]);

  return (
    <div className='sidebar'>
      <aside className='widget-area'>
        {/* Tags Widget */}
        {tags.length > 0 && (
          <div
            className='sidebar__tags-wrapper sidebar__single'
          >
            <h4 className='sidebar__title'>{t('tags')}</h4>
            <div className='sidebar__tags'>
              {tags.map((tag, index) => (
                <Link
                  key={index}
                  // /blogs ignores ?tag= — /blogs/all is the filtering route.
                  href={`${blogsPath}/all?tag=${encodeURIComponent(tag)}`}
                  className='gotur-btn'
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default BlogSidebar;
