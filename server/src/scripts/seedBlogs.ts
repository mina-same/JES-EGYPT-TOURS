import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Blog from '../models/Blog';
import User from '../models/User';

// Load environment variables
dotenv.config();

const seedBlogs = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB');

    // Get admin user for blog author
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ Admin user not found. Please run seedAdmin first.');
      process.exit(1);
    }

    // Clear existing blog data (but keep categories/subcategories for now if they exist)
    await Blog.deleteMany({});
    console.log('🗑️  Cleared existing blog data');

    // ===== CREATE BLOG POSTS =====
    
    // Featured Blog 1
    const blog1 = await Blog.create({
      title: 'Get Best Advertiser in Your Side Pocket',
      slug: 'get-best-advertiser-in-your-side-pocket',
      author: admin._id,
      featuredImage: {
        url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop',
        fileName: 'travel-advertiser.jpg',
        title: 'Travel Advertiser and Marketing',
        alt: 'Travel advertiser and marketing',
      },
      excerpt: 'Consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore of magna aliqua. Ut enim ad minim veniam.',
      contentBlocks: [
        {
          type: 'html',
          content: '<p>Consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore of magna aliqua. Ut enim ad minim veniam, made of owl the quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea dolor commodo consequat. Duis aute irure and dolor in reprehenderit.</p>',
        },
        {
          type: 'imageRow',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop',
              alt: 'Travel destination',
              caption: 'Beautiful travel destination',
              width: 800,
              height: 600,
            },
            {
              url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
              alt: 'Travel experience',
              caption: 'Amazing travel experience',
              width: 800,
              height: 600,
            },
          ],
        },
        {
          type: 'html',
          content: '<p>The is ipsum dolor sit amet consectetur adipiscing elit. Fusce eleifend porta arcu In hac habitasse the is platea augue thelorem turpoi dictumst. In lacus libero faucibus at malesuada sagittis placerat eros sed istincidunt augue ac ante rutrum sed the is sodales augue consequat.</p>',
        },
        {
          type: 'blockquote',
          content: 'Pellentesque sollicitudin congue dolor non aliquam. Morbi volutpat, nisi vel ultricies urna condimentum, sapien neque lobortis tortor, quis efficitur mi ipsum eu metus. Praesent eleifend orci sit amet est vehicula.',
          image: '/images/shapes/quote-Icon.png',
        },
        {
          type: 'html',
          content: '<p>Consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore of magna aliqua. Ut enim ad minim veniam, made of owl the quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea dolor commodo consequat.</p>',
        },
      ],
      metaTitle: 'Best Travel Advertiser - Marketing Guide',
      metaDescription: 'Learn how to get the best advertiser for your travel business and boost your marketing strategy with proven techniques.',
      metaKeywords: ['advertiser', 'travel marketing', 'business strategy', 'promotion'],
      tags: ['Travel', 'Services', 'Agency'],
      status: 'published',
      isFeatured: true,
      publishedAt: new Date('2024-02-20'),
      focusKeyword: 'travel advertiser',
      commentsEnabled: true,
      viewCount: 1250,
      comments: [
        {
          name: 'Leslie Alexander',
          email: 'leslie@example.com',
          text: 'Great article! Very helpful insights on travel marketing strategies.',
          avatar: 'https://ui-avatars.com/api/?name=Leslie+Alexander',
          isApproved: true,
          createdAt: new Date('2024-02-21'),
        } as any,
        {
          name: 'John Smith',
          email: 'john@example.com',
          text: 'Thanks for sharing these valuable tips. I will definitely implement them.',
          avatar: 'https://ui-avatars.com/api/?name=John+Smith',
          isApproved: true,
          createdAt: new Date('2024-02-22'),
        } as any,
      ],
    });

    // Featured Blog 2 - Pyramids
    const blog2 = await Blog.create({
      title: 'Discover the Wonders of the Great Pyramids of Giza',
      slug: 'discover-great-pyramids-giza',
      author: admin._id,
      featuredImage: {
        url: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73b6e?w=1200&h=600&fit=crop',
        fileName: 'pyramids-giza.jpg',
        title: 'Great Pyramids of Giza at Sunset',
        alt: 'Great Pyramids of Giza at sunset',
      },
      excerpt: 'Explore the last remaining wonder of the ancient world and uncover the mysteries of the Great Pyramids of Giza.',
      contentBlocks: [
        {
          type: 'html',
          content: '<p>The Great Pyramids of Giza stand as a testament to ancient Egyptian engineering and ambition. Built over 4,500 years ago, these magnificent structures continue to captivate visitors from around the world.</p><p>Consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore of magna aliqua. Ut enim ad minim veniam, made of owl the quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea dolor commodo consequat.</p>',
        },
        {
          type: 'imageRow',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73b6e?w=800&h=600&fit=crop',
              alt: 'Close-up of pyramid stones',
              caption: 'Ancient limestone blocks',
              width: 800,
              height: 600,
            },
            {
              url: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800&h=600&fit=crop',
              alt: 'Sphinx and pyramid',
              caption: 'The Great Sphinx guards the pyramids',
              width: 800,
              height: 600,
            },
          ],
        },
        {
          type: 'html',
          content: '<p>The is ipsum dolor sit amet consectetur adipiscing elit. Fusce eleifend porta arcu In hac habitasse the is platea augue thelorem turpoi dictumst. In lacus libero faucibus at malesuada sagittis placerat eros sed istincidunt augue ac ante rutrum sed the is sodales augue consequat.</p>',
        },
        {
          type: 'blockquote',
          content: 'Standing before the pyramids, you realize that some achievements transcend time itself. These monuments remind us of humanity\'s eternal quest for greatness.',
          image: '/images/shapes/quote-Icon.png',
        },
        {
          type: 'html',
          content: '<h3>Planning Your Visit</h3><p>The best time to visit the pyramids is early morning or late afternoon to avoid the heat. Don\'t forget to bring water, sunscreen, and comfortable walking shoes.</p>',
        },
      ],
      metaTitle: 'Great Pyramids of Giza: Complete Travel Guide 2024',
      metaDescription: 'Discover everything you need to know about visiting the Great Pyramids of Giza, including tips, history, and best times to visit.',
      metaKeywords: ['pyramids', 'giza', 'egypt', 'ancient wonders', 'travel guide'],
      tags: ['Pyramids', 'Giza', 'Ancient Egypt', 'UNESCO', 'History'],
      status: 'published',
      isFeatured: true,
      publishedAt: new Date('2024-02-15'),
      focusKeyword: 'great pyramids giza',
      commentsEnabled: true,
      viewCount: 2100,
    });

    // Featured Blog 3 - Red Sea Diving
    const blog3 = await Blog.create({
      title: 'Red Sea Diving: Top 10 Dive Sites You Must Explore',
      slug: 'red-sea-diving-top-sites',
      author: admin._id,
      featuredImage: {
        url: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1200&h=600&fit=crop',
        fileName: 'red-sea-coral.jpg',
        title: 'Colorful Coral Reef in the Red Sea',
        alt: 'Colorful coral reef in the Red Sea',
      },
      excerpt: 'Dive into crystal-clear waters and discover the vibrant marine life of the Red Sea\'s best diving spots.',
      contentBlocks: [
        {
          type: 'html',
          content: '<p>The Red Sea is renowned worldwide for its exceptional diving conditions, stunning coral reefs, and diverse marine life. Whether you\'re a beginner or experienced diver, these waters offer unforgettable underwater adventures.</p>',
        },
        {
          type: 'html',
          content: '<h3>1. Ras Mohammed National Park</h3><p>Located at the southern tip of the Sinai Peninsula, Ras Mohammed features dramatic drop-offs, strong currents, and an abundance of marine species including sharks, rays, and turtles.</p>',
        },
        {
          type: 'imageRow',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&h=600&fit=crop',
              alt: 'Diver exploring coral reef',
              caption: 'Vibrant coral gardens',
              width: 800,
              height: 600,
            },
            {
              url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
              alt: 'School of tropical fish',
              caption: 'Abundant marine life',
              width: 800,
              height: 600,
            },
          ],
        },
        {
          type: 'blockquote',
          content: 'The Red Sea is not just a dive destination; it\'s an underwater paradise that will leave you breathless with every descent.',
          image: '/images/shapes/quote-Icon.png',
        },
        {
          type: 'html',
          content: '<h3>Best Time to Dive</h3><p>The Red Sea offers year-round diving, but the best conditions are from March to May and September to November when water temperatures are comfortable and visibility is excellent.</p>',
        },
      ],
      metaTitle: 'Red Sea Diving Guide: 10 Best Dive Sites in Egypt',
      metaDescription: 'Explore the top diving sites in the Red Sea with our comprehensive guide. Perfect for both beginners and experienced divers.',
      metaKeywords: ['red sea diving', 'egypt diving', 'scuba diving', 'coral reefs'],
      tags: ['Diving', 'Red Sea', 'Underwater', 'Marine Life', 'Adventure'],
      status: 'published',
      isFeatured: true,
      publishedAt: new Date('2024-02-20'),
      focusKeyword: 'red sea diving',
      commentsEnabled: true,
      viewCount: 1780,
    });

    // Non-featured Blog 4 - Desert Safari
    const blog4 = await Blog.create({
      title: 'Sahara Desert Safari: An Unforgettable Adventure',
      slug: 'sahara-desert-safari-adventure',
      author: admin._id,
      featuredImage: {
        url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&h=600&fit=crop',
        fileName: 'sahara-desert.jpg',
        title: 'Sunset over Sahara Desert Dunes',
        alt: 'Sunset over Sahara desert dunes',
      },
      excerpt: 'Experience the magic of the Sahara with camel rides, starlit camping, and Bedouin hospitality in one of the world\'s most majestic landscapes.',
      contentBlocks: [
        {
          type: 'html',
          content: '<p>The Sahara Desert offers one of the most unique and memorable travel experiences. From golden sand dunes to ancient oases, this vast landscape holds countless wonders waiting to be discovered.</p>',
        },
        {
          type: 'imageRow',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=600&fit=crop',
              alt: 'Camel caravan in desert',
              caption: 'Traditional camel safari',
              width: 800,
              height: 600,
            },
            {
              url: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&h=600&fit=crop',
              alt: 'Desert camp at night',
              caption: 'Stargazing in the Sahara',
              width: 800,
              height: 600,
            },
          ],
        },
        {
          type: 'html',
          content: '<p>A typical desert safari includes camel trekking, 4x4 dune bashing, sandboarding, and spending the night in a traditional Bedouin camp under a blanket of stars.</p>',
        },
        {
          type: 'blockquote',
          content: 'In the silence of the desert, you find a peace that modern life rarely offers. The Sahara teaches you to appreciate the simple beauty of nature.',
          image: '/images/shapes/quote-Icon.png',
        },
        {
          type: 'html',
          content: '<h3>What to Pack</h3><p>Essential items include sunscreen, sunglasses, light clothing for day, warm layers for night, comfortable shoes, and plenty of water.</p>',
        },
      ],
      metaTitle: 'Sahara Desert Safari: Complete Adventure Guide',
      metaDescription: 'Plan your perfect Sahara desert safari with our guide covering activities, best times to visit, and essential tips.',
      metaKeywords: ['sahara desert', 'desert safari', 'egypt adventure', 'bedouin camp'],
      tags: ['Desert', 'Safari', 'Adventure', 'Sahara', 'Bedouin'],
      status: 'published',
      isFeatured: false,
      publishedAt: new Date('2024-02-18'),
      focusKeyword: 'sahara desert safari',
      commentsEnabled: true,
      viewCount: 950,
    });

    // Non-featured Blog 5 - Nile Cruise
    const blog5 = await Blog.create({
      title: 'Nile River Cruise: A Journey Through Ancient History',
      slug: 'nile-river-cruise-journey',
      author: admin._id,
      featuredImage: {
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=600&fit=crop',
        fileName: 'nile-cruise.jpg',
        title: 'Nile River Cruise Ship',
        alt: 'Nile River cruise ship',
      },
      excerpt: 'Embark on a luxurious journey down the Nile River, visiting ancient temples and experiencing the timeless beauty of Egypt\'s lifeline.',
      contentBlocks: [
        {
          type: 'html',
          content: '<p>A Nile River cruise is one of the most romantic and educational ways to explore Egypt. As you glide along the world\'s longest river, you\'ll witness scenes that have changed little since pharaonic times.</p>',
        },
        {
          type: 'imageRow',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
              alt: 'Nile cruise ship',
              caption: 'Luxury Nile cruise',
              width: 800,
              height: 600,
            },
            {
              url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&h=600&fit=crop',
              alt: 'Temple on Nile',
              caption: 'Ancient temples along the Nile',
              width: 800,
              height: 600,
            },
          ],
        },
        {
          type: 'html',
          content: '<p>Most cruises travel between Luxor and Aswan, allowing you to visit incredible sites like the Valley of the Kings, Karnak Temple, and the temples of Edfu and Kom Ombo.</p>',
        },
        {
          type: 'blockquote',
          content: 'The Nile is more than a river; it\'s the heartbeat of Egypt, carrying with it thousands of years of history and culture.',
          image: '/images/shapes/quote-Icon.png',
        },
      ],
      metaTitle: 'Nile River Cruise Guide: Complete Travel Experience',
      metaDescription: 'Discover everything about Nile River cruises including itineraries, best ships, and must-see temples along the way.',
      metaKeywords: ['nile cruise', 'egypt cruise', 'luxor aswan', 'nile river'],
      tags: ['Nile', 'Cruise', 'Luxor', 'Aswan', 'Temples'],
      status: 'published',
      isFeatured: false,
      publishedAt: new Date('2024-02-10'),
      focusKeyword: 'nile river cruise',
      commentsEnabled: true,
      viewCount: 1100,
    });

    // Non-featured Blog 6 - Egyptian Museum
    const blog6 = await Blog.create({
      title: 'The Egyptian Museum: Treasures of the Pharaohs',
      slug: 'egyptian-museum-treasures-pharaohs',
      author: admin._id,
      featuredImage: {
        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=600&fit=crop',
        fileName: 'egyptian-museum.jpg',
        title: 'Egyptian Museum Artifacts',
        alt: 'Egyptian Museum artifacts',
      },
      excerpt: 'Explore the world\'s greatest collection of ancient Egyptian artifacts, including the treasures of Tutankhamun.',
      contentBlocks: [
        {
          type: 'html',
          content: '<p>The Egyptian Museum in Cairo houses over 120,000 artifacts, making it one of the world\'s most important archaeological museums. From golden masks to mummies, this is where ancient Egypt comes alive.</p>',
        },
        {
          type: 'html',
          content: '<h3>Highlights Not to Miss</h3><p>The treasures of Tutankhamun are the museum\'s crown jewels, but don\'t miss the Royal Mummy Room, the Narmer Palette, and the statues of Khafre and Menkaure.</p>',
        },
        {
          type: 'imageRow',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
              alt: 'Museum artifacts',
              caption: 'Ancient Egyptian artifacts',
              width: 800,
              height: 600,
            },
          ],
        },
        {
          type: 'blockquote',
          content: 'Walking through the Egyptian Museum is like stepping back in time. Each artifact tells a story of a civilization that shaped human history.',
          image: '/images/shapes/quote-Icon.png',
        },
      ],
      metaTitle: 'Egyptian Museum Guide: Must-See Treasures and Tips',
      metaDescription: 'Your complete guide to visiting the Egyptian Museum in Cairo, including must-see exhibits and practical visiting tips.',
      metaKeywords: ['egyptian museum', 'cairo museum', 'tutankhamun', 'ancient artifacts'],
      tags: ['Museum', 'Cairo', 'History', 'Artifacts', 'Culture'],
      status: 'published',
      isFeatured: false,
      publishedAt: new Date('2024-02-05'),
      focusKeyword: 'egyptian museum',
      commentsEnabled: true,
      viewCount: 890,
    });

    console.log('✅ Created 6 blog posts (3 featured, 3 regular)');

    // Set related posts
    blog1.relatedPosts = [blog2._id, blog3._id];
    await blog1.save();

    blog2.relatedPosts = [blog1._id, blog3._id];
    await blog2.save();

    blog3.relatedPosts = [blog1._id, blog2._id];
    await blog3.save();

    blog4.relatedPosts = [blog5._id, blog6._id];
    await blog4.save();

    blog5.relatedPosts = [blog4._id, blog6._id];
    await blog5.save();

    blog6.relatedPosts = [blog4._id, blog5._id];
    await blog6.save();

    console.log('✅ Set related posts');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Blog seeding completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log(`   - Featured Blogs: 3`);
    console.log(`   - Regular Blogs: 3`);
    console.log(`   - Total Blog Posts: 6`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding blogs:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedBlogs();
