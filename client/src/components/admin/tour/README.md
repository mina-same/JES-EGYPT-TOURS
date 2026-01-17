# Tour Admin Modularization

This directory contains modularized components for the tour admin pages, breaking down the large monolithic tour forms into smaller, reusable components.

## Structure

```
src/
├── components/admin/tour/
│   ├── OverviewTab.tsx          # Basic tour information
│   ├── MediaTab.tsx              # Images and media management
│   ├── ItineraryTab.tsx          # Day-by-day itinerary (TODO)
│   ├── DetailsTab.tsx            # Tour details, inclusions, exclusions (TODO)
│   ├── PricingTab.tsx            # Pricing plans management (TODO)
│   ├── ResourcesTab.tsx          # FAQs, related tours, blogs (TODO)
│   ├── SEOTab.tsx                # SEO settings and metadata (TODO)
│   └── index.ts                  # Export all components
├── hooks/
│   └── useTourForm.ts            # Custom hook for tour form logic
└── app/admin/tour/tour/
    ├── new/page.tsx              # New tour page (refactored)
    └── [id]/edit/page.tsx        # Edit tour page (refactored)
```

## Components

### Tab Components

Each tab component is responsible for rendering a specific section of the tour form:

#### OverviewTab
- **Purpose**: Basic tour information and description
- **Props**:
  - `formData`: Current form state
  - `subcategories`: Available subcategories
  - `handleChange`: Function to update form fields
- **Sections**:
  - Basic Information (name, slug, ID, heading, subcategory)
  - Description (header and rich text)
  - Tour Details (location, duration, availability, etc.)

#### MediaTab
- **Purpose**: Manage tour images and media
- **Props**:
  - `formData`: Current form state
  - `handleChange`: Function to update form fields
  - Image management functions (add, remove, update)
  - `handleImageUpload`: Function to upload images
- **Sections**:
  - Main Images (required)
  - Gallery Images (optional)
  - Tour Map (iframe embed)

### Custom Hooks

#### useTourForm
- **Purpose**: Centralize all tour form logic
- **Returns**:
  - `formData`: Current form state
  - `setFormData`: Direct state setter
  - `subcategories`: Loaded subcategories
  - Handler functions for all form operations
- **Features**:
  - Auto-generates slug from tour name
  - Auto-populates SEO fields
  - Manages nested form data
  - Handles image uploads
  - Manages arrays (images, gallery, notes, etc.)

## Usage Example

### In new/page.tsx or edit/page.tsx:

```tsx
'use client';

import { useState } from 'react';
import { useTourForm } from '@/hooks/useTourForm';
import { OverviewTab, MediaTab } from '@/components/admin/tour';
import { motion, AnimatePresence } from 'framer-motion';

export default function TourPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const tourForm = useTourForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic using tourForm.formData
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Tab Navigation */}
      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'active' : ''}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview">
            <OverviewTab
              formData={tourForm.formData}
              subcategories={tourForm.subcategories}
              handleChange={tourForm.handleChange}
            />
          </motion.div>
        )}
        {activeTab === 'media' && (
          <motion.div key="media">
            <MediaTab
              formData={tourForm.formData}
              handleChange={tourForm.handleChange}
              addImage={tourForm.addImage}
              removeImage={tourForm.removeImage}
              updateImage={tourForm.updateImage}
              addGalleryImage={tourForm.addGalleryImage}
              removeGalleryImage={tourForm.removeGalleryImage}
              updateGalleryImage={tourForm.updateGalleryImage}
              handleImageUpload={tourForm.handleImageUpload}
            />
          </motion.div>
        )}
        {/* Add other tabs... */}
      </AnimatePresence>

      {/* Submit Button */}
      <button type="submit">Save Tour</button>
    </form>
  );
}
```

## Benefits

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be used in both new and edit pages
3. **Testability**: Smaller components are easier to test
4. **Performance**: Can lazy-load tabs as needed
5. **Collaboration**: Multiple developers can work on different tabs
6. **Code Organization**: Logic is separated from UI

## TODO

The following tab components still need to be created:

- [ ] ItineraryTab - Day-by-day itinerary management
- [ ] DetailsTab - Highlights, inclusions, exclusions, notes
- [ ] PricingTab - Pricing plans with seasons
- [ ] ResourcesTab - FAQs, related tours, related blogs
- [ ] SEOTab - SEO metadata and settings

Each should follow the same pattern as OverviewTab and MediaTab.

## Migration Guide

To migrate existing tour pages:

1. Import the `useTourForm` hook
2. Replace inline state management with hook
3. Import and use tab components
4. Remove duplicate code
5. Test thoroughly

The refactored pages should be significantly smaller (< 500 lines vs 1700+ lines).
