"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { BlogPost, BlogResponse } from "@/lib/api/blog";
import { API_URL } from "@/config/api";

const BlogSidebar: React.FC = () => {
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadSidebarData = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: "1",
          limit: "50",
        });

        const res = await fetch(`${API_URL}/blog/posts?${queryParams.toString()}`);

        if (!res.ok) {
          throw new Error("Failed to fetch blogs");
        }

        const blogsResponse: BlogResponse = await res.json();

        if (!isMounted) {
          return;
        }

        const posts = blogsResponse.data || [];
        setRecentPosts(posts.slice(0, 3));

        const uniqueTags = Array.from(
          new Set(posts.flatMap((p) => (p.tags ? p.tags : [])))
        ).slice(0, 20);

        setTags(uniqueTags);
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
          ? post.featuredImage.alt
          : post.title;

      return {
        id: post._id,
        title: post.title,
        date: dateLabel,
        image,
        imageAlt,
        link: `/blogs/${post.slug}`,
      };
    });
  }, [recentPosts]);

  return (
    <div className='sidebar'>
      <aside className='widget-area'>
        {/* Recent Posts Widget */}
        <div
          className='sidebar__posts-wrapper sidebar__single wow fadeInUp animated'
          data-wow-duration='1500ms'
          data-wow-delay='500ms'
        >
          <h4 className='sidebar__title'>Recent Posts</h4>
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
                <p className='text-gray-500 text-sm'>No recent posts yet.</p>
              </li>
            )}
          </ul>
        </div>

        {/* Tags Widget */}
        {tags.length > 0 && (
          <div
            className='sidebar__tags-wrapper sidebar__single wow fadeInUp animated'
            data-wow-duration='1500ms'
            data-wow-delay='500ms'
          >
            <h4 className='sidebar__title'>Tags</h4>
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
