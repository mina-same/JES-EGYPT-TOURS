import { useState, useEffect } from 'react';
import { TourFormData, ITourSubcategory } from '@/types/tour';
import { tourSubcategoryAPI } from '@/lib/api/tour';
import { API_URL } from '@/config/api';

export function useTourForm(initialData?: Partial<TourFormData>) {
  const [formData, setFormData] = useState<TourFormData>({
    name: '',
    slug: '',
    description: {
      header: '',
      text: '',
    },
    subcategory: '',
    images: [],
    gallery: [],
    idExternal: '',
    heading: '',
    tourLocation: '',
    tourAvailability: '',
    pickupAndDropOff: '',
    tourType: '',
    tourStyle: '',
    isFeatured: false,
    isActive: true,
    seo: {
      metaTitle: '',
      metaDescription: '',
      metaKeywords: [],
      metaImage: {
        url: '',
        fileName: '',
        title: '',
        alt: '',
      },
    },
    tourHighlights: [],
    inclusion: [],
    exclusion: [],
    pricingPlans: [],
    notes: [],
    whatToPack: [],
    tourMapIframe: '',
    mapSchema: undefined,
    whatYouWillLoveHtml: '',
    itinerary: {
      generalDescription: '',
      days: [],
    },
    faqs: [],
    blogReferences: [],
    relatedTours: [],
    reviews: [],
    priceStartingFrom: undefined,
    duration: '',
    meetingPoint: '',
    cancellationPolicy: '',
    tags: [],
    ...initialData,
  });

  const [subcategories, setSubcategories] = useState<ITourSubcategory[]>([]);

  // Fetch subcategories
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const response = await tourSubcategoryAPI.getAll({ isActive: true });
        if (response.success && response.data) {
          setSubcategories(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch subcategories:', err);
      }
    };
    fetchSubcategories();
  }, []);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev } as any;
      
      if (field.includes('.')) {
        const keys = field.split('.');
        let current = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
      } else {
        updated[field] = value;
      }

      if (field === 'name') {
        updated.slug = generateSlug(value);
        if (!updated.seo?.metaTitle) {
          if (!updated.seo) updated.seo = {};
          updated.seo.metaTitle = value;
        }
      }

      return updated as TourFormData;
    });
  };

  // Handle keywords
  const handleKeywordsChange = (value: string) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    setFormData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        metaKeywords: keywords,
      },
    }));
  };

  // Handle array fields
  const handleArrayFieldChange = (field: string, value: string) => {
    const items = value.split(',').map(k => k.trim()).filter(k => k);
    setFormData(prev => ({
      ...prev,
      [field]: items,
    }));
  };

  // Itinerary handlers
  const addItineraryDay = () => {
    setFormData(prev => ({
      ...prev,
      itinerary: {
        generalDescription: prev.itinerary?.generalDescription || '',
        days: [
          ...(prev.itinerary?.days || []),
          { day: (prev.itinerary?.days?.length || 0) + 1, title: '', description: '', activities: [] }
        ],
      },
    }));
  };

  const removeItineraryDay = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itinerary: {
        generalDescription: prev.itinerary?.generalDescription || '',
        days: prev.itinerary?.days?.filter((_, i) => i !== index) || [],
      },
    }));
  };

  const updateItineraryDay = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      itinerary: {
        generalDescription: prev.itinerary?.generalDescription || '',
        days: prev.itinerary?.days?.map((day, i) => 
          i === index ? { ...day, [field]: value } : day
        ) || [],
      },
    }));
  };

  // Image handlers
  const addImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [
        ...(prev.images || []),
        { url: '', fileName: '', title: '', alt: '' }
      ],
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateImage = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.map((img, i) => 
        i === index ? { ...img, [field]: value } : img
      ) || [],
    }));
  };

  // Gallery handlers
  const addGalleryImage = () => {
    setFormData(prev => ({
      ...prev,
      gallery: [
        ...(prev.gallery || []),
        { url: '', fileName: '', title: '', alt: '' }
      ],
    }));
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateGalleryImage = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery?.map((img, i) => 
        i === index ? { ...img, [field]: value } : img
      ) || [],
    }));
  };

  // Note handlers
  const addTourNote = () => {
    setFormData(prev => ({
      ...prev,
      notes: [
        ...(prev.notes || []),
        { title: '', text: '' }
      ],
    }));
  };

  const removeTourNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateTourNote = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes?.map((note, i) => 
        i === index ? { ...note, [field]: value } : note
      ) || [],
    }));
  };

  // Image upload handler
  const handleImageUpload = async (file: File): Promise<{ url: string, fileName: string } | null> => {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: uploadFormData,
      });
      const data = await response.json();
      if (data.success) {
        return { url: data.data.url, fileName: data.data.fileName };
      } else {
        console.error('Upload failed:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  return {
    formData,
    setFormData,
    subcategories,
    handleChange,
    handleKeywordsChange,
    handleArrayFieldChange,
    addItineraryDay,
    removeItineraryDay,
    updateItineraryDay,
    addImage,
    removeImage,
    updateImage,
    addGalleryImage,
    removeGalleryImage,
    updateGalleryImage,
    addTourNote,
    removeTourNote,
    updateTourNote,
    handleImageUpload,
  };
}
