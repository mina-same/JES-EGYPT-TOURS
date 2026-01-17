# Database Seeding Guide

## Overview
This guide explains how to seed your database with sample data including categories, subcategories, and tours.

## Prerequisites

1. **MongoDB Connection**: Ensure your MongoDB is running and the connection string is set in `.env`
2. **Cloudinary Setup**: Cloudinary credentials must be configured (already done ✅)

## Quick Start

### 1. Restart the Server (IMPORTANT!)

The server needs to be restarted to pick up the Cloudinary credentials from `.env`:

```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart:
cd server
npm run dev
```

You should see this message in the console:
```
✅ Cloudinary configured: {
  cloud_name: 'dkcui067d',
  api_key: '***3864',
  api_secret: '***'
}
```

### 2. Run the Comprehensive Seed

This will create **10 diverse tours** across multiple categories:

```bash
cd server
npm run seed:all-tours
```

## What Gets Seeded

### Categories (3)
- **Egypt Tours** - Explore the wonders of ancient Egypt
- **Nile Cruises** - Luxury cruises along the Nile River
- **Desert Adventures** - Experience the Egyptian deserts

### Subcategories (5)
- **Cairo Tours** - Discover the capital city
- **Luxor Tours** - Ancient temples and tombs
- **Aswan Tours** - Nubian culture and monuments
- **Luxury Cruises** - 5-star Nile cruise experiences
- **Red Sea Tours** - Beach and diving adventures

### Tours (10)

1. **Pyramids of Giza and Sphinx Day Tour**
   - Category: Cairo Tours
   - Price: From $45
   - Duration: 8 hours
   - Featured: ✅

2. **Luxor East and West Bank Full Day Tour**
   - Category: Luxor Tours
   - Price: From $75
   - Duration: 10 hours
   - Featured: ✅

3. **5-Day Luxury Nile Cruise from Luxor to Aswan**
   - Category: Luxury Cruises
   - Price: From $349
   - Duration: 5 days / 4 nights
   - Featured: ✅

4. **Hurghada Snorkeling and Island Tour**
   - Category: Red Sea Tours
   - Price: From $29
   - Duration: 8 hours

5. **Islamic Cairo Walking Tour**
   - Category: Cairo Tours
   - Price: From $35
   - Duration: 6 hours

6. **Aswan Day Tour with Abu Simbel**
   - Category: Aswan Tours
   - Price: From $89
   - Duration: 12 hours
   - Featured: ✅

7. **White Desert Safari Overnight Tour**
   - Category: Cairo Tours
   - Price: From $99
   - Duration: 2 days / 1 night

8. **Alexandria Day Trip from Cairo**
   - Category: Cairo Tours
   - Price: From $69
   - Duration: 12 hours

9. **Memphis and Saqqara Day Tour**
   - Category: Cairo Tours
   - Price: From $45
   - Duration: 8 hours

10. **Aswan Felucca Sailing and Nubian Village**
    - Category: Aswan Tours
    - Price: From $25
    - Duration: 4 hours

## Each Tour Includes

✅ **Complete Information**:
- Main images and gallery
- Detailed descriptions
- Tour highlights
- Inclusions and exclusions
- Pricing plans with seasons
- Full itinerary with activities
- FAQs
- Tags and metadata

✅ **Real Images**: Using Unsplash for high-quality tour images

✅ **Pricing Tiers**:
- AFFORDABLE
- GOLD (5 STAR STANDARD)
- DIAMOND (5 STAR LUXURY)

✅ **Multiple Pricing Options**:
- Solo travelers
- 2-4 people
- 5-8 people
- 9-16 people

## Seeding Output

When you run the seed, you'll see:

```
🌱 COMPREHENSIVE TOUR DATABASE SEEDER

ℹ Connected to MongoDB
ℹ Clearing existing tour data...
✓ Existing tour data cleared
ℹ Seeding tour categories...
✓ Category created: Egypt Tours
✓ Category created: Nile Cruises
✓ Category created: Desert Adventures
ℹ Seeding tour subcategories...
✓ Subcategory created: Cairo Tours
✓ Subcategory created: Luxor Tours
...
ℹ Seeding tours...
✓ Tour 1/10: Pyramids of Giza and Sphinx Day Tour
✓ Tour 2/10: Luxor East and West Bank Full Day Tour
...
✓ Created 10 tours successfully

📊 SEEDING SUMMARY
  Categories:     3
  Subcategories:  5
  Tours:          10

✓ Tour seeding completed successfully!
```

## Testing the Seeded Data

### 1. View in Admin Panel
```
http://localhost:3000/admin/tour/tour
```

### 2. Edit a Tour
- Click on any tour
- Go to the "Media" tab
- You should see images properly displayed (no more black boxes!)

### 3. Test Image Upload
- Click on an image upload area
- Select an image from your computer
- It should upload to Cloudinary and display the URL

## Troubleshooting

### Issue: "Must supply api_key" Error

**Solution**: Restart the server to load Cloudinary credentials
```bash
# In the server terminal, press Ctrl+C
# Then run:
npm run dev
```

### Issue: Images Show as Black Boxes

**Solution**: This has been fixed! The MediaTab now:
- Shows placeholder images for empty URLs
- Has error handling for broken image links
- Displays a fallback image if loading fails

### Issue: Seed Fails with Connection Error

**Solution**: Check your MongoDB connection string in `.env`
```env
MONGODB_URI=your_mongodb_connection_string
```

### Issue: Duplicate Key Error

**Solution**: The seed script automatically clears existing data. If you still get errors:
```bash
# Manually clear the collections in MongoDB
# Then run the seed again
npm run seed:all-tours
```

## Image Upload Flow

1. **User selects image** → File is sent to server
2. **Server receives file** → Uploads to Cloudinary using configured credentials
3. **Cloudinary returns URL** → Server sends URL back to client
4. **Client saves URL** → URL is stored in MongoDB

## Environment Variables

Your `.env` file should have:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Cloudinary (Already configured ✅)
CLOUDINARY_CLOUD_NAME="dkcui067d"
CLOUDINARY_API_KEY="378168273153864"
CLOUDINARY_API_SECRET="WVD6FI43h62qKFjCFKxUAYEL4XE"

# JWT
JWT_SECRET=your_jwt_secret
```

## Next Steps

1. ✅ **Restart server** to load Cloudinary credentials
2. ✅ **Run seed** to populate database
3. ✅ **Test image upload** in admin panel
4. ✅ **Create new tours** with your own images

## Additional Seed Scripts

```bash
# Seed only admin user
npm run seed

# Seed only blogs
npm run seed:blogs

# Seed single tour (old seeder)
npm run seed:tours

# Seed comprehensive tours (recommended)
npm run seed:all-tours
```

## Notes

- **Images**: Tours use Unsplash images as placeholders
- **Dates**: Pricing seasons are set for 2025-2026
- **Featured Tours**: 4 tours are marked as featured
- **Active Status**: All tours are active by default
- **Slugs**: Auto-generated from tour names

---

**Created**: December 2025  
**Last Updated**: December 2025  
**Status**: Ready to use ✅
