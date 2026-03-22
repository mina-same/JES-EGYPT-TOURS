"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BlogPost, formatBlogDate } from "@/lib/api/blog";
import { Col, Container, Row } from "react-bootstrap";
import BlogSidebar from "@/components/common/BlogSidebar/BlogSidebar";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { getLocalizedValue } from "@/lib/localize";


interface DynamicBlogDetailsProps {
  blog: BlogPost;
  showSidebar?: 'left' | 'right' | 'none';
}

const DynamicBlogDetails: React.FC<DynamicBlogDetailsProps> = ({ 
  blog, 
  showSidebar = 'right' 
}) => {
  const { t, i18n } = useTranslation("blogs");
  const locale = (i18n.language || 'en');

  const [commentForm, setCommentForm] = useState({
    name: '',
    email: '',
    message: ''
  });



  const { day, month } = formatBlogDate(blog.publishedAt || blog.createdAt);
  const author =
    blog.author && typeof blog.author === 'object'
      ? (blog.author as any).name || 'Admin'
      : 'Admin';
  
  const title = getLocalizedValue(blog.title, locale);
  const featuredImageUrl = typeof blog.featuredImage === 'string' ? blog.featuredImage : blog.featuredImage?.url;
  const featuredImageAlt = getLocalizedValue(typeof blog.featuredImage === 'object' ? blog.featuredImage?.alt : undefined, locale) || title;

  
  const approvedComments = blog.comments?.filter(c => c.isApproved) || [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      // TODO: Implement comment submission to API
      console.log("Comment submitted:", commentForm);
      alert("Comment submitted successfully! It will be visible after approval.");
      setCommentForm({ name: '', email: '', message: '' });
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Failed to submit comment. Please try again.");
    }
  };

  const renderContentBlock = (block: any, index: number) => {
    const content = getLocalizedValue(block.content, locale);

    switch (block.type) {
      case 'html':
        return (
          <div 
            key={index}
            className='blog-details-card__text wow fadeInUp'
            data-wow-delay='300ms'
            data-wow-duration='1500ms'
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      
      case 'imageRow':
        // Check if next block is html or blockquote to include in inner content
        const nextBlock = blog.contentBlocks[index + 1];
        const isNextBlockContent = nextBlock && (nextBlock.type === 'html' || nextBlock.type === 'blockquote');
        
        // Dynamic column classes based on number of images
        const getImageColumnClass = () => {
          const imageCount = block.images?.length || 0;
          if (imageCount === 1) return 'col-md-12';
          return 'col-md-6'; // 2 or more images
        };
        
        return (
          <div key={index} className='blog-details__inner'>
            <div className='row gutter-y-30'>
              {block.images?.map((img: any, imgIndex: number) => (
                <div
                  className={`${getImageColumnClass()} wow fadeInLeft`}
                  data-wow-delay={`${100 * imgIndex}ms`}
                  key={imgIndex}
                >
                  <div className='blog-details__inner__image'>
                    <div style={{ height: '250px', overflow: 'hidden' }}>
                      <Image 
                        src={img.url} 
                        alt={getLocalizedValue(img.alt, locale) || 'Blog image'}

                        width={img.width || 800}
                        height={300}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {content && (
              <div className='blog-details__inner__content'>
                <p
                  className='blog-details__inner__text wow fadeInUp animated'
                  data-wow-delay='300ms'
                  data-wow-duration='1500ms'
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            )}
          </div>
        );

      
      case 'blockquote':
        // Check if this blockquote should be inside blog-details__inner__content (after imageRow)
        const prevBlock = index > 0 ? blog.contentBlocks[index - 1] : null;
        const isAfterImageRow = prevBlock?.type === 'imageRow';
        
        if (isAfterImageRow) {
          return (
            <div key={index} className='blog-details__inner__content'>
              <blockquote
                className='blog-details__inner__text-one wow fadeInUp animated'
                data-wow-delay='300ms'
                data-wow-duration='1500ms'
              >
                {content}
                {block.image && (
                  <Image
                    className='blog-details__inner__image'
                    src={block.image}
                    alt='Quote'
                    width={50}
                    height={50}
                  />
                )}
              </blockquote>
            </div>
          );
        }
        
        return (
          <blockquote
            key={index}
            className='blog-details__inner__text-one wow fadeInUp animated'
            data-wow-delay='300ms'
            data-wow-duration='1500ms'
          >
            {content}
            {block.image && (
              <Image
                className='blog-details__inner__image'
                src={block.image}
                alt='Quote'
                width={50}
                height={50}
              />
            )}
          </blockquote>
        );

      
      case 'image':
        return (
          <div key={index} className='blog-details__inner__image wow fadeInUp'>
            <Image 
              src={block.url || ''} 
              alt={getLocalizedValue(block.alt, locale) || 'Blog image'}

              width={1200}
              height={800}
              style={{ width: '100%', height: 'auto' }}
            />
            {block.caption && (
              <p className='blog-details__inner__caption'>{getLocalizedValue(block.caption, locale)}</p>

            )}
          </div>
        );

      
      default:
        return null;
    }
  };

  return (
    <section className='blog-details-page section-space'>
      <Container>
        <Row className='justify-content-center'>
          {showSidebar === 'left' && (
            <Col lg={4}>
              <BlogSidebar />
            </Col>
          )}
          
          <Col lg={8}>
            <div className='blog-details'>
              {/* Blog Image */}
              <div
                className='blog-details-card wow fadeInUp'
                data-wow-delay='300ms'
                data-wow-duration='1500ms'
              >
                <div className='blog-details-card__image'>
                  <Image 
                    src={featuredImageUrl || "https://placehold.co/1200x600?text=Image"} 
                    alt={featuredImageAlt}
                    width={1200}
                    height={600}
                    style={{ width: '100%', height: 'auto' }}
                    priority
                  />
                  <div className='blog-details-card__date'>
                    <span className='blog-details-card__date__day'>{day}</span>
                    <span className='blog-details-card__date__month'>{month}</span>
                  </div>
                </div>

                {/* Blog Content */}
                <div className='blog-details-card__content'>
                  <ul
                    className='list-unstyled blog-details-card__meta wow fadeInUp'
                    data-wow-delay='300ms'
                    data-wow-duration='1500ms'
                  >
                    <li>
                      <Link href='#'>
                        <span className='blog-card__meta__icon'>
                          <i className='icon-user'></i>
                        </span>
                        {t('by')} {author}
                      </Link>
                    </li>
                    <li>
                      <Link href='#'>
                        <span className='blog-details-card__meta__icon'>
                          <i className='icon-massage'></i>
                        </span>
                        {approvedComments.length} {t('comments')}
                      </Link>
                    </li>
                    {getLocalizedValue(blog.tags) && (getLocalizedValue(blog.tags) as any).length > 0 && (
                      <li>
                        <Link href='#'>
                          <span className='blog-card__meta__icon'>
                            <i className='icon-price-tag'></i>
                          </span>
                          {(getLocalizedValue(blog.tags) as any)[0]}
                        </Link>
                      </li>
                    )}

                  </ul>

                  <h3
                    className='blog-details-card__title wow fadeInUp'
                    data-wow-delay='300ms'
                    data-wow-duration='1500ms'
                  >
                    {title}
                  </h3>


                  {/* Render Content Blocks */}
                  <div className='blog-details-card__content__inner'>
                    {blog.contentBlocks.map((block, index) => renderContentBlock(block, index))}
                  </div>
                </div>
              </div>

              {/* Blog Tags */}
              {getLocalizedValue(blog.tags) && (getLocalizedValue(blog.tags) as any).length > 0 && (
                <div className='blog-details__meta'>
                  <div
                    className='blog-details__categories wow fadeInUp'
                    data-wow-delay='300ms'
                    data-wow-duration='1500ms'
                  >
                    <h4 className='blog-details__meta__title'>{t('tags')}</h4>
                    <div className='blog-details__categories__box'>
                      {(getLocalizedValue(blog.tags) as string[]).map((tag, index) => (
                        <Link
                          href={`/blogs?tag=${encodeURIComponent(tag)}`}
                          key={index}
                          className='blog-details__categories__btn gotur-btn'
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>


                  {/* Social Share Links */}
                  <div
                    className='blog-details__social wow fadeInUp'
                    data-wow-delay='300ms'
                    data-wow-duration='1500ms'
                  >
                    <h4 className='blog-details__meta__title'>
                      {t('shareFriends')}
                    </h4>
                    <div className='blog-details__social__box'>
                      <Link href='https://facebook.com'>
                        <i className='icon-facebook' aria-hidden='true'></i>
                      </Link>
                      <Link href='https://twitter.com'>
                        <i className='icon-twitter' aria-hidden='true'></i>
                      </Link>
                      <Link href='https://instagram.com'>
                        <i className='icon-linkedin' aria-hidden='true'></i>
                      </Link>
                      <Link href='https://youtube.com'>
                        <i className='icon-youtube' aria-hidden='true'></i>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments */}
              {blog.commentsEnabled && approvedComments.length > 0 && (
                <div className='comments-one'>
                  <h3 className='comments-one__title'>{t('comments')}</h3>
                  <ul className='list-unstyled comments-one__list'>
                    {approvedComments.map((comment, index) => (
                      <li
                        key={comment._id}
                        className='comments-one__card wow fadeInUp'
                        data-wow-delay='100ms'
                        data-wow-duration='1500ms'
                      >
                        <div className='comments-one__card__image'>
                          {comment.avatar ? (
                            <Image 
                              src={comment.avatar} 
                              alt={comment.name}
                              width={80}
                              height={80}
                            />
                          ) : (
                            <div className='comments-one__card__avatar-placeholder'>
                              {comment.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className='comments-one__card__content'>
                          <div className='comments-one__card__top'>
                            <div className='comments-one__card__info'>
                              <h3 className='comments-one__card__title'>
                                {comment.name}
                              </h3>
                              <p className='comments-one__card__date'>
                                {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <p className='comments-one__card__text'>
                            {comment.text}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Comment Form */}
              {/* {blog.commentsEnabled && (
                <div className='comments-form'>
                  <h3 className='comments-form__title'>Leave a Comment</h3>
                  <form
                    className='comments-form__form contact-form-validated form-one'
                    onSubmit={handleSubmit}
                  >
                    <div className='form-one__group'>
                      <div
                        className='form-one__control wow fadeInUp'
                        data-wow-duration='1500ms'
                        data-wow-delay='100ms'
                      >
                        <label htmlFor='name'>Your Name*</label>
                        <input
                          type='text'
                          id='name'
                          name='name'
                          placeholder='Your Name'
                          value={commentForm.name}
                          onChange={(e) => setCommentForm({...commentForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div
                        className='form-one__control wow fadeInUp'
                        data-wow-duration='1500ms'
                        data-wow-delay='200ms'
                      >
                        <label htmlFor='email'>Your Email*</label>
                        <input
                          type='email'
                          id='email'
                          name='email'
                          placeholder='Your Email'
                          value={commentForm.email}
                          onChange={(e) => setCommentForm({...commentForm, email: e.target.value})}
                          required
                        />
                      </div>
                      <div
                        className='form-one__control form-one__control--full wow fadeInUp'
                        data-wow-duration='1500ms'
                        data-wow-delay='300ms'
                      >
                        <label htmlFor='message'>Message*</label>
                        <textarea
                          name='message'
                          id='message'
                          placeholder='Write Message'
                          value={commentForm.message}
                          onChange={(e) => setCommentForm({...commentForm, message: e.target.value})}
                          required
                        ></textarea>
                      </div>
                      <div
                        className='form-one__control form-one__control--full wow fadeInUp'
                        data-wow-duration='1500ms'
                        data-wow-delay='350ms'
                      >
                        <button type='submit' className='gotur-btn'>
                          Post a Comment
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )} */}
            </div>
          </Col>
          
          {showSidebar === 'right' && (
            <Col lg={4}>
              <BlogSidebar />
            </Col>
          )}
        </Row>
      </Container>
    </section>
  );
};

export default DynamicBlogDetails;
