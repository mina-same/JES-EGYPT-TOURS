"use client";

import Image, { StaticImageData } from "next/image";
import React, { useEffect, useMemo, useState } from "react";

import { Container, Row, Col } from "react-bootstrap";

import { blogTwoInfo } from "@/data/blogTwoTwoData";
import Link from "next/link";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { API_URL } from "@/config/api";
import { BlogPost, BlogResponse, formatBlogDate } from "@/lib/api/blog";
interface BlogData {
  tagline: string;
  title: string;
  link: string;
  linkLabel: string;
  shape: StaticImageData;
  blogData: unknown[];
}
const BlogTwoTwo = () => {
  const { tagline, title, link, linkLabel, shape }: BlogData = blogTwoInfo;
  const [featuredBlogs, setFeaturedBlogs] = useState<BlogPost[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadFeatured = async () => {
      try {
        const res = await fetch(`${API_URL}/blog/posts/featured?limit=3`);
        if (!res.ok) {
          throw new Error("Failed to fetch featured blogs");
        }

        const json: BlogResponse = await res.json();
        if (!isMounted) {
          return;
        }

        setFeaturedBlogs(json.data || []);
      } catch (error) {
        console.error("Failed to load featured blogs:", error);
      }
    };

    loadFeatured();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredViewModel = useMemo(() => {
    return featuredBlogs.map((post) => {
      const { day, month } = formatBlogDate(post.publishedAt || post.createdAt);
      const image =
        typeof post.featuredImage === "string"
          ? post.featuredImage
          : post.featuredImage?.url || "https://placehold.co/600x400?text=Image";
      const imageAlt =
        typeof post.featuredImage === "object" && post.featuredImage?.alt
          ? post.featuredImage.alt
          : post.title;

      const authorName =
        post.author && typeof post.author === "object"
          ? (post.author as any).name || "Admin"
          : "Admin";

      return {
        id: post._id,
        title: post.title,
        image,
        imageAlt,
        day,
        month,
        author: authorName,
        category: post.tags && post.tags.length > 0 ? post.tags[0] : "",
        link: `/blogs/${post.slug}`,
      };
    });
  }, [featuredBlogs]);

  return (
    <section className='blog-two section-space-bottom' id='blog'>
      <Container>
        <div className='blog-two__top'>
          <Row className='align-items-end gutter-y-20'>
            <Col lg={8}>
              <div className='sec-title'>
                <h6 className='sec-title__tagline bw-split-in-right'>
                  <TextAnimation text={tagline} animationType='right' />
                </h6>
                <h3 className='sec-title__title bw-split-in-left'>
                  <TextAnimation text={title} animationType='left' />
                </h3>
              </div>
            </Col>
            <Col lg={4}>
              <div className='blog-two__top__btn'>
                <Link href={link} className='gotur-btn gotur-btn--base'>
                  {linkLabel}{" "}
                  <span className='icon'>
                    <i className='icon-right'></i>
                  </span>
                </Link>
              </div>
            </Col>
          </Row>
        </div>

        <Row className='gutter-y-30'>
          {featuredViewModel.map((post, index: number) => (
            <Col lg={4} md={6} key={index}>
              <div
                className='blog-card-two blog-card-two--one wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay={`${100 * (index + 1)}ms`}
              >
                <div className='blog-card-two__image'>
                  <Image
                    src={post.image}
                    alt={post.imageAlt || post.title}
                    className='img-fluid'
                    width={600}
                    height={450}
                    style={{ width: "100%", height: "260px", objectFit: "cover" }}
                  />
                  <div className='blog-card-two__date'>
                    <span className='blog-card-two__date__day'>{post.day}</span>
                    <span className='blog-card-two__date__month'>
                      {post.month}
                    </span>
                  </div>
                  <Link href={post.link} className='blog-card-two__image__link'>
                    <span className='sr-only'>{post.title}</span>
                  </Link>
                </div>
                <div className='blog-card-two__content'>
                  <ul className='list-unstyled blog-card-two__meta'>
                    <li>
                      <Link href={post.link}>
                        <span className='blog-card-two__meta__icon'>
                          <i className='icon-user'></i>
                        </span>{" "}
                        By {post.author}
                      </Link>
                    </li>
                    <li>
                      <Link href={post.link}>
                        <span className='blog-card-two__meta__icon'>
                          <i className='icon-price-tag'></i>
                        </span>{" "}
                        {post.category}
                      </Link>
                    </li>
                  </ul>
                  <h3 className='blog-card-two__title'>
                    <Link href={post.link}>{post.title}</Link>
                  </h3>
                  <Link
                    href={post.link}
                    className='blog-card-two__content__btn'
                  >
                    Read More <i className='icon-arrow-right'></i>
                  </Link>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>

      <div className='blog-two__element'>
        <Image src={shape} alt='' />
      </div>
    </section>
  );
};

export default BlogTwoTwo;
