import BlogSidebar from "@/components/common/BlogSidebar/BlogSidebar";
import Pagination from "@/components/common/Pagination/Pagination";
import Link from "next/link";
import { blogListData } from "@/data/blogListData";
import Image, { StaticImageData } from "next/image";
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
interface BlogPost {
  id: number;
  image: StaticImageData;
  title: string;
  text: string;
  link: string;
  date: string;
  day: string;
  month: string;
  author: string;
  comment: string;
}

// Define the interface for the blog data
interface BlogData {
  posts: BlogPost[];
}
const BlogListLeft: React.FC = () => {
  const { posts }: BlogData = blogListData;
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
                <Col md={12} key={post.id}>
                  <div
                    className='blog-card-two wow fadeInUp animated'
                    data-wow-duration='1500ms'
                    data-wow-delay={`${100 * post.id}ms`}
                  >
                    <div className='blog-card-two__image'>
                      <Image src={post.image} alt={post.title} />
                      <div className='blog-card-two__date'>
                        <span className='blog-card-two__date__day'>
                          {post.day}
                        </span>
                        <span className='blog-card-two__date__month'>
                          {post.month}
                        </span>
                      </div>
                      <Link
                        href={post.link}
                        className='blog-card-two__image__link'
                      >
                        <span className='sr-only'>{post.title}</span>
                      </Link>
                    </div>
                    <div className='blog-card-two__content'>
                      <ul className='list-unstyled blog-card-two__meta'>
                        <li>
                          <Link href={post.link}>
                            <span className='blog-card-two__meta__icon'>
                              <i className='icon-user'></i>
                            </span>
                            By {post.author}
                          </Link>
                        </li>
                        <li>
                          <Link href={post.link}>
                            {" "}
                            <span className='blog-card-two__meta__icon'>
                              {" "}
                              <i className='icon-massage'></i>{" "}
                            </span>
                            {post.comment} Comments
                          </Link>
                        </li>
                      </ul>
                      <h3 className='blog-card-two__title'>
                        <Link href={post.link}>{post.title}</Link>
                      </h3>
                      <p className='blog-card-two__text'>{post.text}</p>
                      <Link
                        href={post.link}
                        className='blog-card-two__btn gotur-btn'
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

export default BlogListLeft;
