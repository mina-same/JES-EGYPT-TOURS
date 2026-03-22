import { useState, useEffect, useRef } from 'react';
import { TourFormData, ITourSubcategory } from '@/types/tour';
import { tourSubcategoryAPI } from '@/lib/api/tour';
import { API_URL } from '@/config/api';
import { AdminLanguage } from '@/components/admin/AdminLanguageTabs';

export function useTourForm(initialData?: Partial<TourFormData>, draftKey?: string) {
  const [hasDraft, setHasDraft] = useState(() => {
    if (typeof window !== 'undefined' && draftKey) {
      return !!localStorage.getItem(draftKey);
    }
    return false;
  });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);

  const [formData, setFormData] = useState<TourFormData>(() => {
    if (typeof window !== 'undefined' && draftKey) {
      try {
        const stored = localStorage.getItem(draftKey);
        if (stored) {
          return {
            ...JSON.parse(stored),
            ...initialData // Still allow overriding with initialData if needed
          };
        }
      } catch (e) {
        console.error('Failed to parse tour draft:', e);
      }
    }
    return {
      name: '',
      slug: { en: '', de: '', it: '', es: '' },
      description: {
        header: { en: '', de: '', it: '', es: '' },
        text: { en: '', de: '', it: '', es: '' },
      },
      subcategory: '',
      images: [],
      gallery: [],
      idExternal: '',
      heading: { en: '', de: '', it: '', es: '' },
      tourLocation: { en: '', de: '', it: '', es: '' },
      tourAvailability: { en: '', de: '', it: '', es: '' },
      pickupAndDropOff: { en: '', de: '', it: '', es: '' },
      tourType: { en: '', de: '', it: '', es: '' },
      tourStyle: { en: '', de: '', it: '', es: '' },
      isFeatured: false,
      isActive: true,
      seo: {
        metaTitle: { en: '', de: '', it: '', es: '' },
        metaDescription: { en: '', de: '', it: '', es: '' },
        metaKeywords: { en: [], de: [], it: [], es: [] },
        metaImage: {
          url: '',
          fileName: '',
          title: { en: '', de: '', it: '', es: '' },
          alt: { en: '', de: '', it: '', es: '' },
        },
      },
      tourHighlights: { en: [], de: [], it: [], es: [] },
      inclusion: { en: [], de: [], it: [], es: [] },
      exclusion: { en: [], de: [], it: [], es: [] },
      pricingPlans: [],
      notes: [],
      whatToPack: { en: [], de: [], it: [], es: [] },
      tourMapIframe: '',
      mapSchema: undefined,
      whatYouWillLoveHtml: { en: '', de: '', it: '', es: '' },
      itinerary: {
        generalDescription: { en: '', de: '', it: '', es: '' },
        days: [],
      },
      faqs: [],
      blogReferences: [],
      relatedTours: [],
      reviews: [],
      priceStartingFrom: undefined,
      duration: { en: '', de: '', it: '', es: '' },
      meetingPoint: { en: '', de: '', it: '', es: '' },
      cancellationPolicy: { en: '', de: '', it: '', es: '' },
      tags: { en: [], de: [], it: [], es: [] },
      ...initialData,
    };
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

  // Save to localStorage on change (debounced)
  useEffect(() => {
    if (!draftKey || typeof window === 'undefined') return;
    
    // Skip the very first render to avoid overwriting a restored draft with initialValue
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      } catch (e) {
        // Fail silently
      }
    }, 1000);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [draftKey, formData]);

  const clearDraft = () => {
    if (draftKey && typeof window !== 'undefined') {
      localStorage.removeItem(draftKey);
      setHasDraft(false);
    }
  };

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

      // Auto-update slug and SEO metaTitle if name (English) changes
      if (field === 'name' || field.startsWith('heading.')) {
        const lang = field.startsWith('heading.') ? field.split('.')[1] as any : 'en';
        const val = value;
        
        if (field === 'name' || field === 'heading.en') updated.name = value;
        
        if (!updated.slug) updated.slug = { en: '', de: '', it: '', es: '' };
        updated.slug[lang] = generateSlug(value);

        if (!updated.seo) updated.seo = {};
        if (!updated.seo.metaTitle) updated.seo.metaTitle = { en: '', de: '', it: '', es: '' };
        if (!updated.seo.metaTitle[lang]) {
          updated.seo.metaTitle[lang] = value;
        }
      }

      return updated as TourFormData;
    });
  };

  // Handle keywords
  const handleKeywordsChange = (value: any) => {
    handleChange('seo.metaKeywords', value);
  };

  // Handle array fields (Highlights, inclusions, exclusions, what to pack)
  const handleArrayFieldChange = (field: string, value: string[], lang: AdminLanguage = 'en') => {
    setFormData(prev => {
      const updated = { ...prev } as any;
      
      // Handle nested fields like 'seo.someField'
      let target = updated;
      const keys = field.split('.');
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) target[keys[i]] = {};
        target = target[keys[i]];
      }
      
      const lastKey = keys[keys.length - 1];
      if (!target[lastKey]) target[lastKey] = { en: [], de: [], it: [], es: [] };
      
      target[lastKey] = {
        ...target[lastKey],
        [lang]: value
      };
      
      return updated as TourFormData;
    });
  };

  // Itinerary handlers
  const addItineraryDay = () => {
    setFormData(prev => ({
      ...prev,
      itinerary: {
        generalDescription: prev.itinerary?.generalDescription || { en: '', de: '', it: '', es: '' },
        days: [
          ...(prev.itinerary?.days || []),
          { 
            day: (prev.itinerary?.days?.length || 0) + 1, 
            title: { en: '', de: '', it: '', es: '' }, 
            description: { en: '', de: '', it: '', es: '' }, 
            activities: [] 
          }
        ],
      },
    }));
  };

  const removeItineraryDay = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itinerary: {
        generalDescription: prev.itinerary?.generalDescription || { en: '', de: '', it: '', es: '' },
        days: prev.itinerary?.days?.filter((_, i) => i !== index) || [],
      },
    }));
  };

  const updateItineraryDay = (index: number, field: string, value: any, lang?: AdminLanguage) => {
    setFormData(prev => {
      const updatedDays = (prev.itinerary?.days || []).map((day, i) => {
        if (i !== index) return day;
        
        if (lang && (field === 'title' || field === 'description')) {
          return {
            ...day,
            [field]: {
              ...((day as any)[field] || { en: '', de: '', it: '', es: '' }),
              [lang]: value
            }
          };
        }
        return { ...day, [field]: value };
      });

      return {
        ...prev,
        itinerary: {
          generalDescription: prev.itinerary?.generalDescription || { en: '', de: '', it: '', es: '' },
          days: updatedDays,
        },
      };
    });
  };

  // Image handlers
  const addImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [
        ...(prev.images || []),
        { 
          url: '', 
          fileName: '', 
          title: { en: '', de: '', it: '', es: '' }, 
          alt: { en: '', de: '', it: '', es: '' } 
        }
      ],
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateImage = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev } as any;
      if (!updated.images) updated.images = [];
      const image = { ...updated.images[index] };
      image[field] = value;
      updated.images[index] = image;
      return updated;
    });
  };



  // Gallery handlers
  const addGalleryImage = () => {
    setFormData(prev => ({
      ...prev,
      gallery: [
        ...(prev.gallery || []),
        { 
          url: '', 
          fileName: '', 
          title: { en: '', de: '', it: '', es: '' }, 
          alt: { en: '', de: '', it: '', es: '' } 
        }
      ],
    }));
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateGalleryImage = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev } as any;
      if (!updated.gallery) updated.gallery = [];
      const image = { ...updated.gallery[index] };
      image[field] = value;
      updated.gallery[index] = image;
      return updated;
    });
  };

  // Note handlers
  const addTourNote = () => {
    setFormData(prev => ({
      ...prev,
      notes: [
        ...(prev.notes || []),
        { 
          title: { en: '', de: '', it: '', es: '' }, 
          text: { en: '', de: '', it: '', es: '' } 
        }
      ],
    }));
  };

  const removeTourNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateTourNote = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev } as any;
      if (!updated.notes) updated.notes = [];
      const note = { ...updated.notes[index] };
      note[field] = value;
      updated.notes[index] = note;
      return updated;
    });
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
    clearDraft,
    hasDraft,
  };
}
