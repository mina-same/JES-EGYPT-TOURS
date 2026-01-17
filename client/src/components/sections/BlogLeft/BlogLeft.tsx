import BlogSidebar from "@/components/common/BlogSidebar/BlogSidebar";
import Pagination from "@/components/common/Pagination/Pagination";
import { blogGridData } from "@/data/blogGridData";
import Image, { StaticImageData } from "next/image";
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import Link from "next/link";
interface BlogPost {
  id: number;
  image: StaticImageData;
  title: string;
  link: string;
  date: string;
  day: string;
  month: string;
  author: string;
  category: string;
}

// Define the interface for the blog data
interface BlogData {
  posts: BlogPost[];
}
const BlogLeft: React.FC = () => {
  const { posts }: BlogData = blogGridData;
  return (
    <section className='blog-page section-space'>
      <Container>
        <Row className='gutter-y-40'>
          <Col lg={4}>
            <BlogSidebar />
          </Col>
          <Col lg={8}>
            <Row className='gutter-y-30'>
              {posts.map((post: BlogPost) => (
                <Col md={6} key={post.id}>
                  <div
                    className='blog-card wow fadeInUp'
                    data-wow-duration='1500ms'
                    data-wow-delay={`${100 * post.id}ms`}
                  >
                    <div className='blog-card__image'>
                      <Image src={post.image} alt={post.title} />
                      <Link
                        href={post.link}
                        className='blog-card-two__image__link'
                      >
                        <span className='sr-only'>{post.title}</span>
                      </Link>
                    </div>
                    <div className='blog-card__content'>
                      <div className='blog-card__content__top'>
                        <div className='blog-card__date'>
                          <span className='blog-card__date__day'>
                            {post.day}
                          </span>
                          <span className='blog-card__date__month'>
                            {post.month}
                          </span>
                        </div>
                        <ul className='list-unstyled blog-card__meta'>
                          <li>
                            <Link href={post.link}>
                              <span className='blog-card__meta__icon'>
                                <i className='icon-user'></i>
                              </span>
                              By {post.author}
                            </Link>
                          </li>
                          <li>
                            <Link href={post.link}>
                              <span className='blog-card__meta__icon'>
                                <i className='icon-price-tag'></i>
                              </span>
                              {post.category}
                            </Link>
                          </li>
                        </ul>
                      </div>
                      <h3 className='blog-card__title'>
                        <Link href={post.link}>{post.title}</Link>
                      </h3>
                      <Link
                        href={post.link}
                        className='blog-card__content__btn'
                      >
                        Read More <i className='icon-arrow-right'></i>
                      </Link>
                    </div>
                  </div>
                </Col>
              ))}
              <Col lg={12}>
                <Pagination />
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default BlogLeft;
