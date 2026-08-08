import { useState, useEffect, useRef } from 'react';
import { TourFormData, ITourSubcategory } from '@/types/tour';
import { tourSubcategoryAPI } from '@/lib/api/tour';
import { uploadAPI } from '@/lib/api/upload';
import { toast } from '@/hooks/use-toast';

import { AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import type { UploadResult } from '@/components/admin/ImageUpload';

const createInitialTourFormData = (initialData?: Partial<TourFormData>): TourFormData => ({
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
  headingDescription: { en: '', de: '', it: '', es: '' },
  cardDescription: { en: '', de: '', it: '', es: '' },
  tourLocation: { en: '', de: '', it: '', es: '' },
  tourAvailability: { en: '', de: '', it: '', es: '' },
  pickupAndDropOff: { en: '', de: '', it: '', es: '' },
  tourType: { en: '', de: '', it: '', es: '' },
  tourStyle: { en: '', de: '', it: '', es: '' },
  isFeatured: false,
  isActive: true,
  scheduledAt: null,
  isSpecialOffer: false,
  specialOfferDiscount: 0,
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
  tourHighlights: { en: '', de: '', it: '', es: '' },
  inclusion: { en: [], de: [], it: [], es: [] },
  exclusion: { en: [], de: [], it: [], es: [] },
  pricingPlans: [],
  notes: [],
  whatToPack: { en: '', de: '', it: '', es: '' },
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
});

export function useTourForm(initialData?: Partial<TourFormData>, draftKey?: string) {
  const [hasDraft, setHasDraft] = useState(() => {
    if (typeof window !== 'undefined' && draftKey) {
      return !!localStorage.getItem(draftKey);
    }
    return false;
  });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);
  const suppressNextSave = useRef(false);

  const [formData, setFormData] = useState<TourFormData>(() => {
    if (typeof window !== 'undefined' && draftKey) {
      try {
        const stored = localStorage.getItem(draftKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Normalize: if draft was saved with capital 'Description' (from API rename), convert to lowercase
          if (parsed.Description && !parsed.description) {
            parsed.description = parsed.Description;
            delete parsed.Description;
          }
          return {
            ...parsed,
            ...initialData // Still allow overriding with initialData if needed
          };
        }
      } catch (e) {
        console.error('Failed to parse tour draft:', e);
      }
    }
    return createInitialTourFormData(initialData);
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

    if (suppressNextSave.current) {
      suppressNextSave.current = false;
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

  const clearDraft = (options?: { suppressNextSave?: boolean }) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    if (options?.suppressNextSave) {
      suppressNextSave.current = true;
    }

    if (draftKey && typeof window !== 'undefined') {
      localStorage.removeItem(draftKey);
      setHasDraft(false);
    }
  };

  const getInitialFormData = () => createInitialTourFormData(initialData);

  const resetFormData = () => {
    setFormData(getInitialFormData());
  };

  // Handle form field changes
  const handleChange = (field: string, value: any, lang?: AdminLanguage) => {
    setFormData(prev => {
      const updated = { ...prev } as any;
      
      if (field.includes('.')) {
        const keys = field.split('.');
        let current = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          // Clone every level on the way down. `updated` is only a shallow copy,
          // so descending into it and assigning would write straight into the
          // PREVIOUS state object — the nested value would change identity-free,
          // which breaks any memoised child and double-renders under StrictMode.
          const level = current[keys[i]];
          current[keys[i]] = Array.isArray(level) ? [...level] : { ...(level || {}) };
          current = current[keys[i]];
        }

        const lastKey = keys[keys.length - 1];
        const targetVal = current[lastKey];
        
        if (lang && typeof value === 'string' && typeof targetVal === 'object' && targetVal !== null && !Array.isArray(targetVal)) {
          current[lastKey] = {
            ...targetVal,
            [lang]: value
          };
        } else {
          current[lastKey] = value;
        }
      } else if (lang && typeof value === 'string' && typeof updated[field] === 'object' && updated[field] !== null && !Array.isArray(updated[field])) {
        // Only update the specific language IF value is a string (primitive)
        // because our Localized components already pass the full object as 'value'
        updated[field] = {
          ...updated[field],
          [lang]: value
        };
      } else {
        updated[field] = value;
      }

      // Auto-update SEO metaTitle if heading changes
      if (field === 'heading' || field.startsWith('heading.')) {
        let targetLang: AdminLanguage = 'en';
        
        if (field.startsWith('heading.')) targetLang = field.split('.')[1] as AdminLanguage;
        else if (lang) targetLang = lang;

        if (!updated.seo) updated.seo = {};
        if (!updated.seo.metaTitle) updated.seo.metaTitle = { en: '', de: '', it: '', es: '' };
        
        // If passing an object
        if (field === 'heading' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
           Object.keys(value).forEach((l) => {
             if (!updated.seo.metaTitle[l as AdminLanguage]) {
               updated.seo.metaTitle[l as AdminLanguage] = value[l as AdminLanguage];
             }
           });
        } else {
           if (!updated.seo.metaTitle[targetLang]) {
             updated.seo.metaTitle[targetLang] = value;
           }
        }
      }

      return updated as TourFormData;
    });
  };

  // Handle keywords
  const handleKeywordsChange = (value: any, lang?: AdminLanguage) => {
    handleChange('seo.metaKeywords', value, lang);
  };

  // Handle array fields (Highlights, inclusions, exclusions, what to pack)
  const handleArrayFieldChange = (field: string, value: string[], lang: AdminLanguage = 'en') => {
    setFormData(prev => {
      const updated = { ...prev } as any;
      
      // Handle nested fields like 'seo.someField' — cloning each level so the
      // walk never writes through into the previous state object.
      let target = updated;
      const keys = field.split('.');
      for (let i = 0; i < keys.length - 1; i++) {
        const level = target[keys[i]];
        target[keys[i]] = Array.isArray(level) ? [...level] : { ...(level || {}) };
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
        
        if (lang && field === 'title') {
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
      // Clone the array too — `updated` is shallow, so writing into it directly
      // would edit the previous state's array in place.
      updated.images = [...(updated.images || [])];
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
      updated.gallery = [...(updated.gallery || [])];
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
  const handleImageUpload = async (file: File): Promise<UploadResult | null> => {
    try {
      // Every other admin form uploads through uploadAPI, which carries the
      // admin's token. This one posted with a bare fetch, so once /api/upload
      // required authentication it answered 401 and the picture simply never
      // appeared — no error, nothing.
      const data = await uploadAPI.uploadFile(file);
      if (data?.success && data?.data?.url) {
        return {
          url: data.data.url,
          fileName: data.data.fileName,
          width: data.data.width,
          height: data.data.height,
        };
      }
      throw new Error(data?.error || 'The server did not return an image URL.');
    } catch (error: any) {
      const status = error?.response?.status;
      const reason =
        status === 401 || status === 403
          ? 'Your session has expired — sign in again and retry.'
          : error?.response?.data?.error || error?.message || 'Unknown error.';
      console.error('Upload error:', error);
      // Failing silently is what made this hard to spot in the first place.
      toast({ title: 'Image upload failed', description: reason, variant: 'destructive' });
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
    getInitialFormData,
    resetFormData,
    hasDraft,
  };
}
