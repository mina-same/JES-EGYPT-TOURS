

import blogImg1 from '@/assets/images/blog/blog-2-4.jpg';
import blogImg2 from '@/assets/images/blog/blog-2-5.jpg';
import blogImg3 from '@/assets/images/blog/blog-2-6.jpg';
import { BLOG_HUB_HREF_BY_LOCALE } from '@/data/blogHub';

export const blogTwoInfo = {
  tagline: 'Blog & News',
  title: 'Our Latest News',
  // The Egypt Blog hub, which has its own slug in each language.
  linkByLocale: BLOG_HUB_HREF_BY_LOCALE,
  linkLabel: 'See More Article',
blogData : [
    {
      title: 'The 5 best things about Touristy',
      image: blogImg1,
      day: '19',
      month: 'Feb',
      author: 'Admin',
      category: 'Travel',
      link: '/blog-details-right',
    },
    {
      title: 'Web Vitals Tools Boost Your to Sen',
      image: blogImg2,
      day: '20',
      month: 'Mar',
      author: 'Admin',
      category: 'Travel',
      link: '/blog-details-right',
    },
    {
      title: 'Get Best Advertiser In Your Side Pocket',
      image: blogImg3,
      day: '28',
      month: 'Feb',
      author: 'Admin',
      category: 'Travel',
      link: '/blog-details-right',
    },
  ]
};




