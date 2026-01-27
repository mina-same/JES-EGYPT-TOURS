# FAQ Section - Premium Design Documentation

## Design Overview
The FAQ accordion has been completely redesigned to match your premium website theme with luxury aesthetics and smooth interactions.

## Key Features

### 🎨 **Visual Design**
1. **Modern Card Layout**
   - Rounded corners (16px border-radius)
   - Subtle shadows that intensify on hover
   - Clean white background
   - 16px gap between items

2. **Gold Gradient Active State**
   - Closed: Light gradient background (#fafafa to #ffffff)
   - Open: Premium gold gradient (#b79c5c to #d4af37)
   - Text color changes to white when active

3. **Custom Icons**
   - Small gold dot (6px) before each question
   - Circular white button with gold chevron icon
   - Icon rotates 180° when expanded
   - Dot glows white with shadow when active

### ✨ **Interactive Effects**

1. **Hover States**
   - Cards lift up 2px on hover
   - Shadow intensifies (0 2px 12px → 0 8px 24px)
   - Smooth cubic-bezier transitions
   - Background gradient shifts on hover

2. **Active State**
   - Gold gradient background
   - White text color
   - Enhanced shadow with gold tint
   - Glowing white dot indicator
   - Rotated chevron icon

3. **Animations**
   - Smooth expand/collapse (0.35s cubic-bezier)
   - Fade-in-down animation for content
   - All transitions use premium easing curves

### 📝 **Typography & Spacing**

1. **Question (Header)**
   - Font: Plus Jakarta Sans (heading font)
   - Size: 17px (16px on mobile)
   - Weight: 700 (bold)
   - Letter spacing: -0.2px
   - Padding: 24px 28px

2. **Answer (Body)**
   - Font size: 16px (15px on mobile)
   - Line height: 1.8 (comfortable reading)
   - Color: #595959
   - Padding: 0 28px 28px 28px
   - Supports HTML content

3. **Content Styling**
   - Paragraphs: 12px bottom margin
   - Lists: 24px left padding
   - List items: 8px spacing
   - Links: Gold color with underline on hover
   - Strong text: Dark color (#1a1a1a)

### 📱 **Responsive Design**

**Desktop (default)**
- Padding: 24px 28px
- Font size: 17px
- Icon size: 28px
- Dot size: 6px

**Mobile (< 768px)**
- Padding: 20px 22px
- Font size: 16px
- Icon size: 24px
- Dot size: 5px

### 🎯 **Premium Details**

1. **Focus States**
   - Gold ring appears on keyboard focus
   - 4px outline with 15% opacity
   - Accessible and visible

2. **Shadow Hierarchy**
   - Default: 0 2px 12px rgba(0,0,0,0.06)
   - Hover: 0 8px 24px rgba(0,0,0,0.1)
   - Active: 0 4px 16px rgba(183,156,92,0.3)

3. **Color Palette**
   - Primary Gold: #b79c5c
   - Light Gold: #d4af37
   - Dark Text: #1a1a1a
   - Body Text: #595959
   - White: #fff
   - Light Gray: #fafafa

## Technical Implementation

### CSS Classes
- `.tour-listing-details__faqs-accordion` - Main container
- `.accordion-item` - Individual FAQ item
- `.accordion-button` - Question/header
- `.accordion-body` - Answer/content
- `.accordion-collapse` - Collapsible wrapper

### Animations
- `fadeInDown` - Content reveal animation
- Cubic-bezier easing for premium feel
- 0.3s transitions for interactions
- 0.35s for expand/collapse

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox
- CSS Variables for theming
- Smooth animations with GPU acceleration

## User Experience

1. **First FAQ is open by default** - Immediate value
2. **Smooth transitions** - Professional feel
3. **Clear visual feedback** - Users know what's clickable
4. **Accessible** - Keyboard navigation supported
5. **Mobile optimized** - Touch-friendly targets

## Brand Consistency

✅ Matches gold color scheme (#b79c5c)
✅ Uses Plus Jakarta Sans font
✅ Consistent with amenities cards design
✅ Premium shadows and gradients
✅ Smooth, luxury animations
✅ Professional spacing and typography
