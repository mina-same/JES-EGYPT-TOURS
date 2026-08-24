"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { getBlogTags } from "@/lib/api/blog";
import { useTranslation } from "react-i18next";


/** As many tags as the widget can show without becoming a wall of buttons. */
const TAG_LIMIT = 20;

const BlogSidebar: React.FC = () => {
  const { t, i18n } = useTranslation("blogs");
  const currentLocale = i18n.language || 'en';
  const blogsPath = `/${currentLocale}/blogs`;
  const [tags, setTags] = useState<string[]>([]);
  // The tag list comes from the API already counted and ordered. This widget
  // used to fetch fifty published posts and reduce them in the browser, which
  // shipped fifty article records to draw twenty words AND could not see a tag
  // that appears only on an older post.
  useEffect(() => {
    let isMounted = true;

    const loadTags = async () => {
      try {
        const rows = await getBlogTags(TAG_LIMIT, currentLocale);
        if (isMounted) {
          setTags(rows.map((row) => row.tag));
        }
      } catch (error) {
        console.error("Failed to load blog sidebar tags:", error);
      }
    };

    loadTags();

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
