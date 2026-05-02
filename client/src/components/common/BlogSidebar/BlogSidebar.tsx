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
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([]);
  const [relatedTours, setRelatedTours] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);


  useEffect(() => {
    let isMounted = true;

    const loadSidebarData = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: "1",
          limit: "50",
        });

        const [blogsRes, popularRes] = await Promise.all([
          fetch(`${API_URL}/blog/posts?${queryParams.toString()}`),
          fetch(`${API_URL}/blog/posts/popular`)
        ]);

        if (blogsRes.ok) {
          const blogsResponse: BlogResponse = await blogsRes.json();
          if (isMounted) {
            const posts = blogsResponse.data || [];
            setRecentPosts(posts.slice(0, 3));
            
            const allLocalizedTags = posts.flatMap((p) => {
              const localizedTags = getLocalizedValue(p.tags, currentLocale);
              return Array.isArray(localizedTags) ? localizedTags : [];
            });
            const uniqueTags = Array.from(new Set(allLocalizedTags)).slice(0, 20);
            setTags(uniqueTags);
          }
        }

        if (popularRes.ok) {
          const popularResponse = await popularRes.json();
          if (isMounted) {
            setPopularPosts(popularResponse.data?.slice(0, 3) || []);
          }
        }

        // Fetch related tours if currentBlog exists
        if (currentBlog && isMounted) {
          try {
            const catId = typeof currentBlog.subCategory?.category === 'string' 
              ? currentBlog.subCategory.category 
              : (currentBlog.subCategory?.category as any)?._id;
            
            if (catId) {
              const toursRes = await tourAPI.getByCategory(catId);
              if (toursRes.success && isMounted) {
                setRelatedTours(toursRes.data?.slice(0, 3) || []);
              }
            }
          } catch (err) {
            console.error("Error fetching related tours for sidebar:", err);
          }
        }

      } catch (error) {
        console.error("Failed to load blog sidebar data:", error);
      }
    };

    loadSidebarData();

    return () => {
      isMounted = false;
    };
  }, []);

  const recentPostsViewModel = useMemo(() => {
    return recentPosts.map((post) => {
      const dateSource = post.publishedAt || post.createdAt;
      const dateLabel = new Date(dateSource).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
      const image =
        typeof post.featuredImage === "string"
          ? post.featuredImage
          : post.featuredImage?.url || "https://placehold.co/600x400?text=Image";
      const imageAlt =
        typeof post.featuredImage === "object" && post.featuredImage?.alt
          ? getLocalizedValue(post.featuredImage.alt, currentLocale)
          : getLocalizedValue(post.title, currentLocale);


      return {
        id: post._id,
        title: getLocalizedValue(post.title, currentLocale),

        date: dateLabel,
        image,
        imageAlt,
        link: `/${currentLocale}/${getLocalizedValue(post.slug, currentLocale)}`,
      };
    });
  }, [recentPosts, currentLocale]);

  const popularPostsViewModel = useMemo(() => {
    return popularPosts.map((post) => {
      const dateSource = post.publishedAt || post.createdAt;
      const dateLabel = new Date(dateSource).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
      const image = typeof post.featuredImage === "string" ? post.featuredImage : post.featuredImage?.url || "https://placehold.co/600x400?text=Image";
      return {
        id: post._id,
        title: getLocalizedValue(post.title, currentLocale),
        date: dateLabel,
        image,
        link: `/${currentLocale}/${getLocalizedValue(post.slug, currentLocale)}`,
      };
    });
  }, [popularPosts, currentLocale]);

  return (
    <div className='sidebar'>
      <aside className='widget-area'>
        {/* Recent Posts Widget */}
        <div
          className='sidebar__posts-wrapper sidebar__single wow fadeInUp animated'
          data-wow-duration='1500ms'
          data-wow-delay='500ms'
        >
          <h4 className='sidebar__title'>{t('recentPosts')}</h4>
          <ul className='sidebar__posts list-unstyled'>
            {recentPostsViewModel.length > 0 ? (
              recentPostsViewModel.map((post, index) => (
                <li key={index} className='sidebar__posts__item' style={{ display: "block" }}>
                  <div
                    className='sidebar__posts__image'
                    style={{ width: "100%", height: "auto", marginRight: 0 }}
                  >
                    <Image
                      src={post.image}
                      alt={post.imageAlt || post.title || "Blog post image"}
                      width={600}
                      height={400}
                      style={{ width: "100%", height: "auto", objectFit: "cover" }}
                    />
                  </div>
                  <div className='sidebar__posts__content' style={{ marginTop: 10 }}>
                    <div className='sidebar__posts__meta'>
                      <Link href={post.link}>
                        <span className='sidebar__posts__meta__icon'>
                          <i className='icon-calendar'></i>
                        </span>
                        {post.date}
                      </Link>
                    </div>
                    <h4 className='sidebar__posts__title'>
                      <Link href={post.link}>{post.title}</Link>
                    </h4>
                  </div>
                </li>
              ))
            ) : (
              <li className='sidebar__posts__item'>
                <p className='text-gray-500 text-sm'>{t('noRecentPosts')}</p>
              </li>
            )}
          </ul>
        </div>

        {/* Popular Posts Widget */}
        {popularPostsViewModel.length > 0 && (
          <div
            className='sidebar__posts-wrapper sidebar__single wow fadeInUp animated'
            data-wow-duration='1500ms'
            data-wow-delay='500ms'
          >
            <h4 className='sidebar__title'>{t('popularArticles')}</h4>
            <ul className='sidebar__posts list-unstyled'>
              {popularPostsViewModel.map((post, index) => (
                <li key={index} className='sidebar__posts__item' style={{ display: "block" }}>
                  <div className='sidebar__posts__image' style={{ width: "100%", height: "auto", marginRight: 0 }}>
                    <Image
                      src={post.image}
                      alt={post.title}
                      width={600}
                      height={400}
                      style={{ width: "100%", height: "auto", objectFit: "cover" }}
                    />
                  </div>
                  <div className='sidebar__posts__content' style={{ marginTop: 10 }}>
                    <div className='sidebar__posts__meta'>
                      <Link href={post.link}>
                        <span className='sidebar__posts__meta__icon'>
                          <i className='icon-calendar'></i>
                        </span>
                        {post.date}
                      </Link>
                    </div>
                    <h4 className='sidebar__posts__title'>
                      <Link href={post.link}>{post.title}</Link>
                    </h4>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Related Tours Widget */}
        {relatedTours.length > 0 && (
          <div
            className='sidebar__posts-wrapper sidebar__single wow fadeInUp animated'
            data-wow-duration='1500ms'
            data-wow-delay='500ms'
          >
            <h4 className='sidebar__title'>{t('relatedTours')}</h4>
            <ul className='sidebar__posts list-unstyled'>
              {relatedTours.map((tour, index) => {
                const tourTitle = getLocalizedValue(tour.name, currentLocale);
                const tourLink = `/${currentLocale}/${getLocalizedValue(tour.slug, currentLocale)}`;
                const tourImage = tour.featuredImage?.url || tour.images?.[0]?.url || "https://placehold.co/600x400?text=Tour";
                
                return (
                  <li key={index} className='sidebar__posts__item' style={{ display: "block" }}>
                    <div className='sidebar__posts__image' style={{ width: "100%", height: "auto", marginRight: 0 }}>
                      <Image
                        src={tourImage}
                        alt={tourTitle}
                        width={600}
                        height={400}
                        style={{ width: "100%", height: "auto", objectFit: "cover" }}
                      />
                    </div>
                    <div className='sidebar__posts__content' style={{ marginTop: 10 }}>
                      <h4 className='sidebar__posts__title'>
                        <Link href={tourLink}>{tourTitle}</Link>
                      </h4>
                      <div className="sidebar__posts__meta mt-1">
                        <span className="text-primary fw-bold">${tour.price}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Tags Widget */}
        {tags.length > 0 && (
          <div
            className='sidebar__tags-wrapper sidebar__single wow fadeInUp animated'
            data-wow-duration='1500ms'
            data-wow-delay='500ms'
          >
            <h4 className='sidebar__title'>{t('tags')}</h4>
            <div className='sidebar__tags'>
              {tags.map((tag, index) => (
                <Link
                  key={index}
                  href={`/blogs?tag=${encodeURIComponent(tag)}`}
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
