import React from "react";
import Image, { StaticImageData } from "next/image";
import blogThreeData from "@/data/blogThreeData";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import Link from "next/link";
interface BlogThreeData {
  tagline: string;
  title: string;
  buttonText: string;
  buttonUrl: string;
  blogPosts: BlogPost[];
}
interface BlogPost {
  id: number;
  title: string;
  date: string;
  category: string;
  imageSrc: StaticImageData;
  imageAlt: string;
  authorName: string;
  authorDesc: string;
  authorImage: StaticImageData;
  link: string;
}

const BlogThree: React.FC = () => {
  const { tagline, title, buttonText, buttonUrl, blogPosts }: BlogThreeData =
    blogThreeData;
  return (
    <section className='blog-three section-space' id='blog'>
      <div className='container'>
        <div className='sec-title text-center'>
          <h6 className='sec-title__tagline bw-split-in-right'>
            <TextAnimation text={tagline} animationType='right' />
          </h6>
          <h3
            className='sec-title__title bw-split-in-left '
            style={{ maxWidth: "560px", margin: "0 auto" }}
          >
            <TextAnimation text={title} animationType='left' />
          </h3>
        </div>

        <div className='row gutter-y-30'>
          {blogPosts.map((post: BlogPost) => (
            <div key={post.id} className='col-lg-4 col-md-6'>
              <div
                className='blog-card-three wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='100ms'
              >
                <div className='blog-card-three__image'>
                  <Image src={post.imageSrc} alt={post.imageAlt} />
                  <Link
                    href={post.link}
                    className='blog-card-three__image__link'
                  >
                    <span className='sr-only'>{post.imageAlt}</span>
                  </Link>
                </div>

                <div className='blog-card-three__content'>
                  <ul className='blog-card-three__meta list-unstyled'>
                    <li>
                      <div className='blog-card-three__cetagory'>
                        <span>{post.category}</span>
                      </div>
                    </li>
                    <li>
                      <p className='blog-card-three__date'>{post.date}</p>
                    </li>
                  </ul>

                  <h3 className='blog-card-three__title'>
                    <Link href={post.link}>{post.title}</Link>
                  </h3>

                  <div className='blog-card-three__bottom'>
                    <div className='blog-card-three__author'>
                      <div className='blog-card-three__author__thumb'>
                        <Image
                          src={post.authorImage}
                          alt={post.authorName}
                          width={40}
                          height={40}
                        />
                      </div>
                      <div className='blog-card-three__author__content'>
                        <h6 className='blog-card-three__author__name'>
                          {post.authorName}
                        </h6>
                        <span className='blog-card-three__author__dec'>
                          {post.authorDesc}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={post.link}
                      className='gotur-btn gotur-btn--primary'
                    >
                      <i className='fas fa-arrow-right'></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogThree;
