export const navItems = [
  {
    id: 1,
    title: "about us",
    link: "/about",
  },
  {
    id: 2,
    title: "Destination",
    link: "#",
    subMenu: [
      {
        id: 3,
        title: "destination 01",
        link: "/destination-one",
        subMenu: [
          { id: 4, title: "destination grid", link: "/destination-one" },
          { id: 5, title: "destination Left", link: "/destination-one-left" },
          { id: 6, title: "destination Right", link: "/destination-one-right" },
          {
            id: 7,
            title: "destination Carousel",
            link: "/destination-one-carousel",
          },
        ],
      },
      {
        id: 8,
        title: "destination 02",
        link: "/destination-two",
        subMenu: [
          { id: 9, title: "destination grid", link: "/destination-two" },
          { id: 10, title: "destination Left", link: "/destination-two-left" },
          {
            id: 11,
            title: "destination Right",
            link: "/destination-two-right",
          },
          {
            id: 12,
            title: "destination Carousel",
            link: "/destination-two-carousel",
          },
        ],
      },
      { id: 13, title: "Destination Details", link: "/destination-details" },
    ],
  },
  {
    id: 14,
    title: "tours list",
    link: "#",
    subMenu: [
      {
        id: 15,
        title: "Tour Listing 01",
        link: "/tour-listing-1",
        subMenu: [
          { id: 16, title: "Tour Grid", link: "/tour-listing-1" },
          { id: 17, title: "Tour Left", link: "/tour-listing-1-left" },
          { id: 18, title: "Tour Right", link: "/tour-listing-1-right" },
          { id: 19, title: "Tour Carousel", link: "/tour-listing-1-carousel" },
        ],
      },
      {
        id: 20,
        title: "Tour Listing 02",
        link: "/tour-listing-2",
        subMenu: [
          { id: 21, title: "Tour Grid", link: "/tour-listing-2" },
          { id: 22, title: "Tour Left", link: "/tour-listing-2-left" },
          { id: 23, title: "Tour Right", link: "/tour-listing-2-right" },
          { id: 24, title: "Tour Carousel", link: "/tour-listing-2-carousel" },
        ],
      },
      {
        id: 25,
        title: "Tour Listing List",
        link: "/tour-listing-list",
        subMenu: [
          { id: 26, title: "Tour Grid", link: "/tour-listing-list" },
          { id: 27, title: "Tour Left", link: "/tour-listing-list-left" },
          { id: 28, title: "Tour Right", link: "/tour-listing-list-right" },
        ],
      },
      { id: 29, title: "Listing Details 01", link: "/tour-listing-details-1" },
      { id: 30, title: "Listing Details 02", link: "/tour-listing-details-2" },
    ],
  },
  {
    id: 31,
    title: "pages",
    link: "#",
    subMenu: [
      { id: 32, title: "Our Team", link: "/team" },
      { id: 33, title: "Team Carousel", link: "/team-carousel" },
      { id: 34, title: "Team Details", link: "/team-details" },
      { id: 35, title: "Testimonials", link: "/testimonials" },
      {
        id: 36,
        title: "Testimonials Carousel",
        link: "/testimonials-carousel",
      },
      { id: 37, title: "Pricing Plan", link: "/pricing" },
      {
        id: 38,
        title: "Gallery",
        link: "/gallery",
        subMenu: [
          { id: 39, title: "Gallery masonry", link: "/gallery" },
          { id: 40, title: "Gallery filter", link: "/gallery-filter" },
          { id: 41, title: "Gallery Grid", link: "/gallery-grid" },
        ],
      },
      { id: 42, title: "FAQS", link: "/faq" },
      { id: 43, title: "Login", link: "/login" },
      { id: 44, title: "404 Error", link: "/404" },
    ],
  },
  {
    id: 45,
    title: "Shop",
    link: "#",
    subMenu: [
      {
        id: 46,
        title: "Products",
        link: "#",
        subMenu: [
          { id: 47, title: "No sidebar", link: "/products" },
          { id: 48, title: "Left sidebar", link: "/products-left" },
          { id: 49, title: "Right sidebar", link: "/products-right" },
        ],
      },
      {
        id: 50,
        title: "Products list",
        link: "#",
        subMenu: [
          { id: 51, title: "No sidebar", link: "/products-list" },
          { id: 52, title: "Left sidebar", link: "/products-list-left" },
          { id: 53, title: "Right sidebar", link: "/products-list-right" },
        ],
      },
      { id: 54, title: "Products carousel", link: "/products-carousel" },
      { id: 55, title: "Product details", link: "/product-details" },
      { id: 56, title: "Cart", link: "/cart" },
      { id: 57, title: "Checkout", link: "/checkout" },
    ],
  },
  {
    id: 58,
    title: "news",
    link: "#",
    subMenu: [
      {
        id: 59,
        title: "news grid",
        link: "#",
        subMenu: [
          { id: 60, title: "No sidebar", link: "/blog-grid" },
          { id: 61, title: "Left sidebar", link: "/blog-grid-left" },
          { id: 62, title: "Right sidebar", link: "/blog-grid-right" },
        ],
      },
      {
        id: 63,
        title: "news list",
        link: "#",
        subMenu: [
          { id: 64, title: "No sidebar", link: "/blog-list" },
          { id: 65, title: "Left sidebar", link: "/blog-list-left" },
          { id: 66, title: "Right sidebar", link: "/blog-list-right" },
        ],
      },
      { id: 67, title: "Blog carousel", link: "/blog-carousel" },
      {
        id: 68,
        title: "news details",
        link: "#",
        subMenu: [
          { id: 69, title: "No sidebar", link: "/blog-details" },
          { id: 70, title: "Left sidebar", link: "/blog-details-left" },
          { id: 71, title: "Right sidebar", link: "/blog-details-right" },
        ],
      },
    ],
  },
  {
    id: 72,
    title: "Contact",
    link: "/contact",
  },
];

export const headerOneNavItems = [
  { id: 1, title: "About", link: "about" },
  {
    id: 2,
    title: "Destination",
    link: "destination",
  },
  {
    id: 3,
    title: "Popular Tours",
    link: "guide",
  },
  {
    id: 4,
    title: "Testimonials",
    link: "testimonials",
  },
  {
    id: 5,
    title: "Blog",
    link: "blog",
  },
];
export const headerTwoNavItems = [
  {
    id: 2,
    title: "Destination",
    link: "destination",
  },

  { id: 1, title: "About", link: "about" },
  {
    id: 3,
    title: "Trending",
    link: "trending",
  },
  {
    id: 4,
    title: "Testimonials",
    link: "testimonials",
  },
  {
    id: 5,
    title: "Blog",
    link: "blog",
  },
];
export const headerFourNavItems = [
  {
    id: 3,
    title: "Popular Tours",
    link: "popular",
  },
  { id: 1, title: "About", link: "about" },
  {
    id: 2,
    title: "Destination",
    link: "destination",
  },

  {
    id: 4,
    title: "Testimonials",
    link: "testimonials",
  },
  {
    id: 5,
    title: "Blog",
    link: "blog",
  },
];
