'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { tourCategoryAPI } from '@/lib/api/tour';
import { TourCategoryFormData } from '@/types/tour';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Upload, X, Plus, LayoutDashboard, ListChecks, HelpCircle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import LocalizedInput from '@/components/admin/LocalizedInput';
import LocalizedTextArea from '@/components/admin/LocalizedTextArea';
import LocalizedTagsInput from '@/components/admin/LocalizedTagsInput';
import LocalizedRichText from '@/components/admin/LocalizedRichText';
import FormErrorPanel from '@/components/admin/FormErrorPanel';
import ImageUpload, { ImageData } from '@/components/admin/ImageUpload';
import DraftBanner from '@/components/admin/DraftBanner';
import { uploadAPI } from '@/lib/api/upload';
import AdminLanguageTabs, { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
// import LocalizedField from '@/components/admin/LocalizedField';
import { useFormDraft } from '@/hooks/useFormDraft';
import { parseApiError, type FormErrorItem } from '@/lib/parseApiError';
import { useToast } from '@/hooks/use-toast';
import FaqManager from '@/components/admin/FaqManager';
import ReviewCuratedManager from '@/components/admin/ReviewCuratedManager';
import { blogAPI, destinationAPI } from '@/lib/api/blogAdmin';
import { Search, MessageSquare } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'sections', label: 'Page Sections', icon: ListChecks },
  { id: 'media', label: 'Media & Gallery', icon: ImageIcon },
  { id: 'faq-blog', label: 'FAQs & Blogs', icon: HelpCircle },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'seo', label: 'SEO & Promo', icon: Settings },
];

const INITIAL_TOUR_CATEGORY: TourCategoryFormData = {
  name: { en: '', de: '', it: '', es: '' },
  slug: { en: '', de: '', it: '', es: '' },
  description: { en: '', de: '', it: '', es: '' },
  images: [],
  gallery: [],
  seo: {
    metaTitle: { en: '', de: '', it: '', es: '' },
    metaDescription: { en: '', de: '', it: '', es: '' },
    metaKeywords: { en: [], de: [], it: [], es: [] },
    metaImage: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
  },
  sectionHeader: {
    isEnabled: true,
    title: { en: '', de: '', it: '', es: '' },
    description: { en: '', de: '', it: '', es: '' },
    button: { label: { en: '', de: '', it: '', es: '' }, href: '', newTab: false },
  },
  subcategorySectionTitle: { en: '', de: '', it: '', es: '' },
  toursSectionTitle: { en: '', de: '', it: '', es: '' },
  gallerySectionTitle: { en: '', de: '', it: '', es: '' },
  blogsSectionTitle: { en: '', de: '', it: '', es: '' },
  toursSectionSubTitle: { en: '', de: '', it: '', es: '' },
  faqsSectionTitle: { en: '', de: '', it: '', es: '' },
  reviewsSectionTitle: { en: '', de: '', it: '', es: '' },
  faqs: [],
  reviews: [],
  featuredBlogs: [],
  featuredDestinations: [],
  destinationsSectionTitle: { en: '', de: '', it: '', es: '' },
  bottomSection: {
    isEnabled: true,
    title: { en: '', de: '', it: '', es: '' },
    description: { en: '', de: '', it: '', es: '' },
    button: { label: { en: '', de: '', it: '', es: '' }, href: '', newTab: false },
    image1: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
    image2: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
  },
  isActive: true,
};

export default function NewCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const categoryId = searchParams.get('id');
  const isEditMode = !!categoryId;

  const draftKey = isEditMode ? `draft_tour_cat_edit_${categoryId}` : 'draft_tour_cat_new';

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [formErrors, setFormErrors] = useState<FormErrorItem[]>([]);
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');

  const { formData, setFormData, clearDraft, hasDraft } = useFormDraft<TourCategoryFormData>(
    draftKey,
    INITIAL_TOUR_CATEGORY
  );
  
  const getFieldError = (path: string) => {
    return formErrors.find(err => err.path === path || err.field === path)?.message;
  };

  // Blog Search State
  const [blogSearchQuery, setBlogSearchQuery] = useState('');
  const [blogSearchResults, setBlogSearchResults] = useState<any[]>([]);
  const [isSearchingBlogs, setIsSearchingBlogs] = useState(false);
  const [selectedBlogObjects, setSelectedBlogObjects] = useState<any[]>([]);
  const [isBlogSearchFocused, setIsBlogSearchFocused] = useState(false);
  
  // Destination Search State
  const [destSearchQuery, setDestSearchQuery] = useState('');
  const [destSearchResults, setDestSearchResults] = useState<any[]>([]);
  const [isSearchingDests, setIsSearchingDests] = useState(false);
  const [selectedDestObjects, setSelectedDestObjects] = useState<any[]>([]);
  const [isDestSearchFocused, setIsDestSearchFocused] = useState(false);

  // Fetch category data if editing
  useEffect(() => {
    if (isEditMode && categoryId) {
      fetchCategoryData(categoryId);
    }
  }, [categoryId, isEditMode]);

  const fetchCategoryData = async (id: string) => {
    try {
      setFetchingData(true);
      setFormErrors([]);
      const response = await tourCategoryAPI.getById(id);
      console.log('Fetched category data:', response);
      if (response.success && response.data) {
        const data = response.data as any;
        
        // Helper to ensure localized string/mixed structure
        const ensureLocalized = (val: any, isMixed = false) => {
          if (!val) return { en: '', de: '', it: '', es: '' };
          if (typeof val === 'string') return { en: val, de: '', it: '', es: '' };
          return {
            en: val.en || '',
            de: val.de || '',
            it: val.it || '',
            es: val.es || '',
          };
        };

        const sectionHeaderImages = Array.isArray(data.sectionHeader?.images) && data.sectionHeader.images.length
          ? data.sectionHeader.images
          : (data.sectionHeader?.image?.url ? [data.sectionHeader.image] : []);

        setFormData({
          name: ensureLocalized(data.name),
          slug: ensureLocalized(data.slug),
          description: ensureLocalized(data.description, true),
          images: Array.isArray(data.images)
            ? data.images.map((img: any) => ({
                url: img.url || '',
                fileName: img.fileName || '',
                title: ensureLocalized(img.title),
                alt: ensureLocalized(img.alt),
              }))
            : [],
          gallery: Array.isArray(data.gallery)
            ? data.gallery.map((img: any) => ({
                url: img.url || '',
                fileName: img.fileName || '',
                title: ensureLocalized(img.title),
                alt: ensureLocalized(img.alt),
              }))
            : [],
          seo: data.seo
            ? {
                metaTitle: ensureLocalized(data.seo.metaTitle),
                metaDescription: ensureLocalized(data.seo.metaDescription),
                metaKeywords: data.seo.metaKeywords || { en: [], de: [], it: [], es: [] },
                metaImage: data.seo.metaImage
                  ? {
                      url: data.seo.metaImage.url || '',
                      fileName: data.seo.metaImage.fileName || '',
                      title: ensureLocalized(data.seo.metaImage.title),
                      alt: ensureLocalized(data.seo.metaImage.alt),
                    }
                  : {
                      url: '',
                      fileName: '',
                      title: { en: '', de: '', it: '', es: '' },
                      alt: { en: '', de: '', it: '', es: '' },
                    },
              }
            : {
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
          sectionHeader: data.sectionHeader
            ? {
                isEnabled: data.sectionHeader.isEnabled !== undefined ? !!data.sectionHeader.isEnabled : true,
                images: sectionHeaderImages.map((img: any) => ({
                  ...img,
                  title: ensureLocalized(img?.title),
                  alt: ensureLocalized(img?.alt),
                })),
                title: ensureLocalized(data.sectionHeader.title),
                description: ensureLocalized(data.sectionHeader.description, true),
                button: data.sectionHeader.button
                  ? {
                      label: typeof data.sectionHeader.button.label === 'object' ? data.sectionHeader.button.label : { en: data.sectionHeader.button.label || '', de: '', it: '', es: '' },
                      href: data.sectionHeader.button.href || '',
                      newTab: !!data.sectionHeader.button.newTab,
                    }
                  : {
                      label: { en: '', de: '', it: '', es: '' },
                      href: '',
                      newTab: false,
                    },
              }
            : {
                isEnabled: true,
                title: { en: '', de: '', it: '', es: '' },
                description: { en: '', de: '', it: '', es: '' },
                button: {
                  label: { en: '', de: '', it: '', es: '' },
                  href: '',
                  newTab: false,
                },
              },
          subcategorySectionTitle: ensureLocalized(data.subcategorySectionTitle),
          toursSectionTitle: ensureLocalized(data.toursSectionTitle),
          gallerySectionTitle: ensureLocalized(data.gallerySectionTitle),
          toursSectionSubTitle: ensureLocalized(data.toursSectionSubTitle),
          blogsSectionTitle: ensureLocalized(data.blogsSectionTitle),
          faqsSectionTitle: ensureLocalized(data.faqsSectionTitle),
          reviewsSectionTitle: ensureLocalized(data.reviewsSectionTitle),
          faqs: Array.isArray(data.faqs) ? data.faqs.map((f: any) => ({
            ...f,
            question: ensureLocalized(f.question),
            answer: ensureLocalized(f.answer, true)
          })) : [],
          reviews: Array.isArray(data.reviews) ? data.reviews.map((r: any) => ({
            ...r,
            name: r.name || '',
            avatar: r.avatar || '',
            rating: typeof r.rating === 'number' ? r.rating : 5,
            comment: ensureLocalized(r.comment)
          })) : [],
          featuredBlogs: Array.isArray(data.featuredBlogs) 
            ? data.featuredBlogs.map((b: any) => typeof b === 'object' ? b._id : b) 
            : [],
          featuredDestinations: Array.isArray(data.featuredDestinations)
            ? data.featuredDestinations.map((d: any) => typeof d === 'object' ? d._id : d)
            : [],
          destinationsSectionTitle: ensureLocalized(data.destinationsSectionTitle),
          bottomSection: data.bottomSection
            ? {
                isEnabled: data.bottomSection.isEnabled !== undefined ? !!data.bottomSection.isEnabled : true,
                title: ensureLocalized(data.bottomSection.title),
                description: ensureLocalized(data.bottomSection.description, true),
                button: data.bottomSection.button
                  ? {
                      label: ensureLocalized(data.bottomSection.button.label),
                      href: data.bottomSection.button.href || '',
                      newTab: !!data.bottomSection.button.newTab,
                    }
                  : {
                      label: { en: '', de: '', it: '', es: '' },
                      href: '',
                      newTab: false,
                    },
                image1: data.bottomSection.image1 ? {
                  url: data.bottomSection.image1.url || '',
                  fileName: data.bottomSection.image1.fileName || '',
                  title: ensureLocalized(data.bottomSection.image1.title),
                  alt: ensureLocalized(data.bottomSection.image1.alt),
                } : { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
                image2: data.bottomSection.image2 ? {
                  url: data.bottomSection.image2.url || '',
                  fileName: data.bottomSection.image2.fileName || '',
                  title: ensureLocalized(data.bottomSection.image2.title),
                  alt: ensureLocalized(data.bottomSection.image2.alt),
                } : { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
              }
            : {
                isEnabled: true,
                title: { en: '', de: '', it: '', es: '' },
                description: { en: '', de: '', it: '', es: '' },
                button: {
                  label: { en: '', de: '', it: '', es: '' },
                  href: '',
                  newTab: false,
                },
                image1: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
                image2: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
              },
          isActive: data.isActive !== undefined ? !!data.isActive : true,
        });

        // Populate selected objects for display
        if (Array.isArray(data.featuredBlogs)) {
          setSelectedBlogObjects(data.featuredBlogs.filter((b: any) => typeof b === 'object'));
        }
        if (Array.isArray(data.featuredDestinations)) {
          setSelectedDestObjects(data.featuredDestinations.filter((d: any) => typeof d === 'object'));
        }
      }
    } catch (err: any) {
      setFormErrors([{ field: 'Server', message: err.response?.data?.error || 'Failed to fetch category data' }]);
      console.error('Error fetching category:', err);
    } finally {
      setFetchingData(false);
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
  const handleChange = (field: string, value: any, lang?: AdminLanguage) => {
    setFormData(prev => {
      const updated = { ...prev } as any;

      // Handle nested fields (supports deep paths like sectionHeader.button.label)
      if (field.includes('.')) {
        const keys = field.split('.');
        let cursor = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i];
          cursor[k] = typeof cursor[k] === 'object' && cursor[k] !== null ? { ...cursor[k] } : {};
          cursor = cursor[k];
        }
        cursor[keys[keys.length - 1]] = value;
      } else {
        updated[field] = value;
      }

      // Auto-generate slug when name changes for a language
      if (field === 'name' || field.startsWith('name.')) {
        let targetLang: AdminLanguage = 'en';
        if (field.startsWith('name.')) targetLang = field.split('.')[1] as AdminLanguage;
        else if (lang) targetLang = lang;

        if (!updated.slug) updated.slug = { en: '', de: '', it: '', es: '' };
        
        if (field === 'name' && typeof value === 'object') {
           updated.slug[targetLang] = generateSlug(value[targetLang] || '');
        } else {
           updated.slug[targetLang] = generateSlug(value);
        }
      }

      // Auto-populate SEO metaTitle for the active language
      if (field === 'name' || field.startsWith('name.')) {
        let targetLang: AdminLanguage = 'en';
        if (field.startsWith('name.')) targetLang = field.split('.')[1] as AdminLanguage;
        else if (lang) targetLang = lang;

        if (!updated.seo?.metaTitle?.[targetLang]) {
          updated.seo = {
            ...updated.seo,
            metaTitle: {
              ...(updated.seo?.metaTitle || { en: '', de: '', it: '', es: '' }),
              [targetLang]: typeof value === 'object' ? value[targetLang] : value
            }
          };
        }
      }

      return updated as TourCategoryFormData;
    });
  };

  useEffect(() => {
    const searchBlogs = async () => {
      if (!isBlogSearchFocused && !blogSearchQuery.trim()) {
        setBlogSearchResults([]);
        return;
      }

      setIsSearchingBlogs(true);
      try {
        const response = await blogAPI.getAllAdmin({ 
          search: blogSearchQuery.trim(), 
          limit: 8 
        });
        if (response.success && response.data) {
          setBlogSearchResults(response.data);
        }
      } catch (error) {
        console.error('Failed to search blogs:', error);
      } finally {
        setIsSearchingBlogs(false);
      }
    };

    const timeoutId = setTimeout(searchBlogs, 300);
    return () => clearTimeout(timeoutId);
  }, [blogSearchQuery, isBlogSearchFocused]);

  const addFeaturedBlog = (blog: any) => {
    const current = formData.featuredBlogs || [];
    if (!current.includes(blog._id)) {
      if (current.length >= 3) {
        toast({ title: "Limit reached", description: "You can only select up to 3 featured blogs", variant: "destructive" });
        return;
      }
      handleChange('featuredBlogs', [...current, blog._id]);
      setSelectedBlogObjects(prev => [...prev, blog]);
      setBlogSearchQuery('');
      setBlogSearchResults([]);
    }
  };

  const removeFeaturedBlog = (id: string) => {
    handleChange('featuredBlogs', (formData.featuredBlogs || []).filter((blogId: string) => blogId !== id));
    setSelectedBlogObjects(prev => prev.filter(b => b._id !== id));
  };

  // Destination Management
  useEffect(() => {
    const searchDests = async () => {
      // Fetch if focused (even with empty query) or if there's a query
      if (!isDestSearchFocused && !destSearchQuery.trim()) {
        setDestSearchResults([]);
        return;
      }

      setIsSearchingDests(true);
      try {
        const response = await destinationAPI.getAll({ 
          search: destSearchQuery.trim(), 
          limit: 50 // Increased limit to show more on focus
        });
        if (response.success && response.data) {
          setDestSearchResults(response.data);
        }
      } catch (error) {
        console.error('Failed to search destinations:', error);
      } finally {
        setIsSearchingDests(false);
      }
    };

    const timeoutId = setTimeout(searchDests, 100); // Faster response
    return () => clearTimeout(timeoutId);
  }, [destSearchQuery, isDestSearchFocused]);

  const addFeaturedDest = (dest: any) => {
    const current = formData.featuredDestinations || [];
    if (!current.includes(dest._id)) {
      handleChange('featuredDestinations', [...current, dest._id]);
      setSelectedDestObjects(prev => [...prev, dest]);
      setDestSearchQuery('');
      setDestSearchResults([]);
    }
  };

  const removeFeaturedDest = (id: string) => {
    handleChange('featuredDestinations', (formData.featuredDestinations || []).filter((destId: string) => destId !== id));
    setSelectedDestObjects(prev => prev.filter(d => d._id !== id));
  };

  // Handle keywords
  const handleKeywordsChange = (value: string[], lang: AdminLanguage = activeLanguage) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...(prev.seo || { metaTitle: { en: '', de: '', it: '', es: '' }, metaDescription: { en: '', de: '', it: '', es: '' } }),
        metaKeywords: {
          ...(prev.seo?.metaKeywords || { en: [], de: [], it: [], es: [] }),
          [lang]: value,
        },
      },
    } as TourCategoryFormData));
  };
  
  // Handle Image Upload
  const handleImageUpload = async (file: File): Promise<{ url: string, fileName: string } | null> => {
    try {
      const response = await uploadAPI.uploadFile(file);
      if (response.success) {
        return { url: response.data.url, fileName: response.data.fileName };
      } else {
        console.error('Upload failed:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setFormErrors([]);

      // Clean up empty fields and ensure correct structure for API
      const hasEn = (obj: any) => !!(obj?.en && (typeof obj.en === 'string' ? obj.en.trim() !== '' : true));
      const hasAnyLocalizedValue = (obj: any) => {
        if (!obj || typeof obj !== 'object') return false;
        return ['en', 'de', 'it', 'es'].some((lang) => {
          const localized = obj[lang];
          return typeof localized === 'string' ? localized.trim() !== '' : !!localized;
        });
      };

      const cleanLocalized = (obj: any) => {
        if (!obj) return undefined;
        if (hasAnyLocalizedValue(obj)) return obj;
        return undefined;
      };

      const cleanImage = (img: any) => {
        const cleaned: any = { 
          url: img.url, 
          fileName: img.fileName || img.url?.split('/').pop() || 'image' 
        };
        const title = cleanLocalized(img.title);
        const alt = cleanLocalized(img.alt);
        if (title) cleaned.title = title;
        if (alt) cleaned.alt = alt;
        return cleaned;
      };

      const payload: any = {
        name: formData.name,
        slug: formData.slug,
        isActive: formData.isActive,
      };
      
      if (hasEn(formData.description)) payload.description = formData.description;
      if (hasEn(formData.subcategorySectionTitle)) payload.subcategorySectionTitle = formData.subcategorySectionTitle;
      if (hasEn(formData.toursSectionTitle)) payload.toursSectionTitle = formData.toursSectionTitle;
      if (hasEn(formData.toursSectionSubTitle)) payload.toursSectionSubTitle = formData.toursSectionSubTitle;
      if (hasEn(formData.gallerySectionTitle)) payload.gallerySectionTitle = formData.gallerySectionTitle;
      if (hasEn(formData.blogsSectionTitle)) payload.blogsSectionTitle = formData.blogsSectionTitle;
      if (hasEn(formData.faqsSectionTitle)) payload.faqsSectionTitle = formData.faqsSectionTitle;
      if (hasEn(formData.reviewsSectionTitle)) payload.reviewsSectionTitle = formData.reviewsSectionTitle;
      if (hasEn(formData.destinationsSectionTitle)) payload.destinationsSectionTitle = formData.destinationsSectionTitle;
      
      if (formData.faqs && formData.faqs.length > 0) payload.faqs = formData.faqs;
      if (formData.reviews && formData.reviews.length > 0) {
        payload.reviews = formData.reviews.map((r: any) => ({
          ...r,
          comment: hasEn(r.comment) ? r.comment : undefined
        })).filter((r: any) => !!r.name && !!r.comment);
      }
      if (formData.featuredBlogs && formData.featuredBlogs.length > 0) payload.featuredBlogs = formData.featuredBlogs;
      if (formData.featuredDestinations && formData.featuredDestinations.length > 0) payload.featuredDestinations = formData.featuredDestinations;
      
      // Bottom section cleanup (SEO Rich Text)
      if (formData.bottomSection?.isEnabled) {
        payload.bottomSection = { ...formData.bottomSection };
        if (!hasEn(payload.bottomSection.title)) delete payload.bottomSection.title;
        if (!hasEn(payload.bottomSection.description)) delete payload.bottomSection.description;
        
        // Button cleanup
        if (payload.bottomSection.button) {
          if (!hasEn(payload.bottomSection.button.label) || !payload.bottomSection.button.href) {
            delete payload.bottomSection.button;
          }
        }

        // Image cleanup
        if (formData.bottomSection.image1?.url) {
          payload.bottomSection.image1 = cleanImage(formData.bottomSection.image1);
        } else {
          delete payload.bottomSection.image1;
        }

        if (formData.bottomSection.image2?.url) {
          payload.bottomSection.image2 = cleanImage(formData.bottomSection.image2);
        } else {
          delete payload.bottomSection.image2;
        }
      }
      
      // Image cleanup
      if (formData.images) {
        payload.images = formData.images
          .filter((img: any) => !!img?.url)
          .map(cleanImage);
      }
      if (formData.gallery) {
        payload.gallery = formData.gallery
          .filter((img: any) => !!img?.url)
          .map(cleanImage);
      }
      
      // SEO cleanup
      if (formData.seo) {
        const seo: any = {};
        if (hasEn(formData.seo.metaTitle)) seo.metaTitle = formData.seo.metaTitle;
        if (hasEn(formData.seo.metaDescription)) seo.metaDescription = formData.seo.metaDescription;
        
        const hasKeywords = formData.seo.metaKeywords && Object.values(formData.seo.metaKeywords).some(arr => Array.isArray(arr) && arr.length > 0);
        if (hasKeywords) seo.metaKeywords = formData.seo.metaKeywords;
        
        if (formData.seo.metaImage?.url) {
          seo.metaImage = cleanImage(formData.seo.metaImage);
        }
        
        if (Object.keys(seo).length > 0) {
          payload.seo = seo;
        }
      }

      // Section Header cleanup
      if (formData.sectionHeader) {
        const sh: any = { ...formData.sectionHeader };
        if (!hasEn(sh.title)) delete sh.title;
        if (!hasEn(sh.description)) delete sh.description;
        
        // Filter out empty images
        if (Array.isArray(sh.images)) {
          sh.images = sh.images
            .filter((img: any) => !!img?.url)
            .map(cleanImage);
        }
        if (sh.image?.url) {
          sh.image = cleanImage(sh.image);
        }

        if (sh.button) {
          if (!hasEn(sh.button.label) || !sh.button.href) delete sh.button;
        }
        
        payload.sectionHeader = sh;
      }

      let response;
      if (isEditMode && categoryId) {
        response = await tourCategoryAPI.update(categoryId, payload);
      } else {
        response = await tourCategoryAPI.create(payload);
      }
      
      if (response.success) {
        toast({ title: isEditMode ? 'Category Updated' : 'Category Created', description: `Tour category ${isEditMode ? 'updated' : 'created'} successfully.` });
        clearDraft();
        router.push('/admin/tour/category');
      } else {
        const parsed = parseApiError(response);
        setFormErrors(parsed);
        toast({ title: 'Save failed', description: `${parsed.length} issue(s) found.`, variant: 'destructive' });
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorData = err?.response?.data || { message: err.message };
      const parsed = parseApiError(errorData);
      setFormErrors(parsed);
      toast({ title: 'Error', description: errorData.message || 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading category data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit Category' : 'Create New Category'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditMode ? 'Update category information' : 'Add a new tour category to organize your tours'}
          </p>
        </div>
        <div className="ml-auto">
          <AdminLanguageTabs activeLanguage={activeLanguage} onLanguageChange={setActiveLanguage} />
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b mt-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap relative",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {hasDraft && !isEditMode && (
        <DraftBanner onDiscard={() => { clearDraft(); setFormData(INITIAL_TOUR_CATEGORY); }} />
      )}

      {/* Detailed Error Panel */}
      {formErrors.length > 0 && (
        <FormErrorPanel errors={formErrors} onDismiss={() => setFormErrors([])} />
      )}

      <form onSubmit={handleSubmit} className="space-y-8 mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <LocalizedInput
                label="Category Name *"
                value={formData.name}
                onChange={(val, lang) => handleChange('name', val, lang)}
                placeholder="e.g., Adventure Tours"
                activeLanguage={activeLanguage}
                error={!!getFieldError('name.en')}
                data-field="name.en"
              />
              <LocalizedInput
                label="URL Slug *"
                value={formData.slug}
                onChange={(val, lang) => handleChange('slug', val, lang)}
                placeholder="adventure-tours"
                activeLanguage={activeLanguage}
                error={!!getFieldError('slug.en')}
                data-field="slug.en"
              />
            </div>
            
            <LocalizedRichText
              label="Description"
              value={formData.description}
              onChange={(val, lang) => handleChange('description', val, lang)}
              placeholder="Brief description for the category page header..."
              activeLanguage={activeLanguage}
            />

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleChange('isActive', checked)}
              />
              <Label htmlFor="isActive">Active (visible to users)</Label>
            </div>
          </CardContent>
        </Card>
              </div>
            )}

            {/* SECTIONS TAB */}
            {activeTab === 'sections' && (
              <div className="space-y-6">
                {/* Section Titles */}
                <Card>
                  <CardHeader>
                    <CardTitle>Section Titles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <LocalizedInput
                      label="Subcategories Section Title"
                      value={formData.subcategorySectionTitle}
                      onChange={(val, lang) => handleChange('subcategorySectionTitle', val, lang)}
                      placeholder="e.g., Explore Our Destinations"
                      activeLanguage={activeLanguage}
                      error={!!getFieldError('subcategorySectionTitle.en')}
                    />

                    <LocalizedInput
                      label="Tours Section Title"
                      value={formData.toursSectionTitle}
                      onChange={(val, lang) => handleChange('toursSectionTitle', val, lang)}
                      placeholder="e.g., Popular Packages"
                      activeLanguage={activeLanguage}
                      error={!!getFieldError('toursSectionTitle.en')}
                    />

                    <LocalizedInput
                      label="Tours Section Subtitle"
                      value={formData.toursSectionSubTitle}
                      onChange={(val, lang) => handleChange('toursSectionSubTitle', val, lang)}
                      placeholder="e.g., Discover our most popular tours and activities"
                      activeLanguage={activeLanguage}
                    />

                    <LocalizedInput
                      label="Gallery Section Title"
                      value={formData.gallerySectionTitle}
                      onChange={(val, lang) => handleChange('gallerySectionTitle', val, lang)}
                      placeholder="e.g., Destination Highlights"
                      activeLanguage={activeLanguage}
                      error={!!getFieldError('gallerySectionTitle.en')}
                    />

                    <LocalizedInput
                      label="Blogs Section Title"
                      value={formData.blogsSectionTitle}
                      onChange={(val, lang) => handleChange('blogsSectionTitle', val, lang)}
                      placeholder="e.g., Latest Travel News"
                      activeLanguage={activeLanguage}
                      error={!!getFieldError('blogsSectionTitle.en')}
                    />

                    <LocalizedInput
                      label="FAQs Section Title"
                      value={formData.faqsSectionTitle}
                      onChange={(val, lang) => handleChange('faqsSectionTitle', val, lang)}
                      placeholder="e.g., Frequently Asked Questions"
                      activeLanguage={activeLanguage}
                      error={!!getFieldError('faqsSectionTitle.en')}
                    />
                  </CardContent>
                </Card>

        {/* Section Header */}
        <Card>
          <CardHeader>
            <CardTitle>Section Header</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="sectionHeaderEnabled"
                checked={formData.sectionHeader?.isEnabled !== false}
                onCheckedChange={(checked) => handleChange('sectionHeader.isEnabled', checked)}
              />
              <Label htmlFor="sectionHeaderEnabled">Enable section header</Label>
            </div>

            <ImageUpload
              images={(formData.sectionHeader?.images || []) as ImageData[]}
              onAdd={() => {
                setFormData(prev => ({
                  ...prev,
                  sectionHeader: { ...(prev.sectionHeader || { isEnabled: true, title: { en: '', de: '', it: '', es: '' }, description: { en: '', de: '', it: '', es: '' } }), images: [...(prev.sectionHeader?.images || []), { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } }] }
                }));
              }}
              onRemove={(index) => {
                setFormData(prev => {
                  const images = [...(prev.sectionHeader?.images || [])];
                  images.splice(index, 1);
                  return {
                    ...prev,
                    sectionHeader: { ...prev.sectionHeader, images }
                  };
                });
              }}
              onUpdate={(index, field, value, lang) => {
                setFormData(prev => {
                   const images = [...(prev.sectionHeader?.images || [])];
                   if (!images[index]) return prev;
                   const img = { ...images[index] };
                   if (lang) {
                     const currentVal = (img as any)[field] || {};
                     (img as any)[field] = { ...currentVal, [lang]: value };
                   } else {
                     (img as any)[field] = value;
                   }
                   images[index] = img;
                   return {
                     ...prev,
                     sectionHeader: { ...prev.sectionHeader, images }
                   };
                });
              }}
              onUpload={async (file) => {
                const result = await handleImageUpload(file);
                return result;
              }}
              activeLanguage={activeLanguage}
              title="Header Gallery"
              description="Upload one or more images for the header slider"
            />

            <div className="space-y-2">
              <LocalizedInput
                label="Header Title"
                value={formData.sectionHeader?.title || { en: '', de: '', it: '', es: '' }}
                onChange={(val, lang) => handleChange('sectionHeader.title', val, lang)}
                placeholder="Section title"
                activeLanguage={activeLanguage}
                error={!!getFieldError('sectionHeader.title.en')}
                data-field="sectionHeader.title.en"
              />
            </div>

            <LocalizedRichText
              label="Section Description"
              value={formData.sectionHeader?.description || { en: '', de: '', it: '', es: '' }}
              onChange={(val, lang) => handleChange('sectionHeader.description', val, lang)}
              placeholder="Section description..."
              activeLanguage={activeLanguage}
            />

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <LocalizedInput
                label="Button Label"
                value={formData.sectionHeader?.button?.label || { en: '', de: '', it: '', es: '' }}
                onChange={(val, lang) => handleChange('sectionHeader.button.label', val, lang)}
                placeholder="Button Label"
                activeLanguage={activeLanguage}
                error={!!getFieldError('sectionHeader.button.label.en')}
              />

              <div className="space-y-2">
                <Label htmlFor="sectionHeaderBtnHref">Button Link</Label>
                <Input
                  id="sectionHeaderBtnHref"
                  value={formData.sectionHeader?.button?.href || ''}
                  onChange={(e) => handleChange('sectionHeader.button.href', e.target.value)}
                  placeholder="e.g. /contact or https://..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sectionHeaderBtnNewTab"
                checked={!!formData.sectionHeader?.button?.newTab}
                onCheckedChange={(checked) => handleChange('sectionHeader.button.newTab', checked)}
              />
              <Label htmlFor="sectionHeaderBtnNewTab">Open button link in new tab</Label>
            </div>
          </CardContent>
        </Card>
        
        {/* Bottom Promo Section */}
        <Card>
          <CardHeader>
            <CardTitle>Promo Custom Images</CardTitle>
            <p className="text-sm text-gray-500">Pick two specific images for the bottom promo section</p>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ImageUpload
                images={formData.bottomSection?.image1 ? [formData.bottomSection.image1 as ImageData] : []}
                maxImages={1}
                onAdd={() => {
                  setFormData(prev => ({
                    ...prev,
                    bottomSection: {
                      ...(prev.bottomSection || { isEnabled: true }),
                      image1: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } }
                    }
                  }));
                }}
                onRemove={() => {
                  setFormData(prev => ({
                    ...prev,
                    bottomSection: {
                      ...(prev.bottomSection || { isEnabled: true }),
                      image1: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } }
                    }
                  }));
                }}
                onUpdate={(index, field, value, lang) => {
                  setFormData(prev => {
                    const image1 = prev.bottomSection?.image1 ? { ...prev.bottomSection.image1 } : { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } };
                    if (lang) {
                      const currentVal = (image1 as any)[field] || {};
                      (image1 as any)[field] = { ...currentVal, [lang]: value };
                    } else {
                      (image1 as any)[field] = value;
                    }
                    return {
                      ...prev,
                      bottomSection: {
                        ...(prev.bottomSection || { isEnabled: true }),
                        image1
                      }
                    };
                  });
                }}
                onUpload={async (file) => {
                  const result = await handleImageUpload(file);
                  return result;
                }}
                activeLanguage={activeLanguage}
                title="Promo Image 1"
                description="Main image in promo section"
              />

              <ImageUpload
                images={formData.bottomSection?.image2 ? [formData.bottomSection.image2 as ImageData] : []}
                maxImages={1}
                onAdd={() => {
                  setFormData(prev => ({
                    ...prev,
                    bottomSection: {
                      ...(prev.bottomSection || { isEnabled: true }),
                      image2: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } }
                    }
                  }));
                }}
                onRemove={() => {
                  setFormData(prev => ({
                    ...prev,
                    bottomSection: {
                      ...(prev.bottomSection || { isEnabled: true }),
                      image2: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } }
                    }
                  }));
                }}
                onUpdate={(index, field, value, lang) => {
                  setFormData(prev => {
                    const image2 = prev.bottomSection?.image2 ? { ...prev.bottomSection.image2 } : { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } };
                    if (lang) {
                      const currentVal = (image2 as any)[field] || {};
                      (image2 as any)[field] = { ...currentVal, [lang]: value };
                    } else {
                      (image2 as any)[field] = value;
                    }
                    return {
                      ...prev,
                      bottomSection: {
                        ...(prev.bottomSection || { isEnabled: true }),
                        image2
                      }
                    };
                  });
                }}
                onUpload={async (file) => {
                  const result = await handleImageUpload(file);
                  return result;
                }}
                activeLanguage={activeLanguage}
                title="Promo Image 2"
                description="Secondary image in promo section"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="bottomSectionEnabled"
                  checked={formData.bottomSection?.isEnabled !== false}
                  onCheckedChange={(checked) => handleChange('bottomSection.isEnabled', checked)}
                />
                <Label htmlFor="bottomSectionEnabled">Enable bottom promo section</Label>
              </div>

              <LocalizedInput
                label="SEO Target Title (e.g., Special Deals, Welcome)"
                value={formData.bottomSection?.title || { en: '', de: '', it: '', es: '' }}
                onChange={(val, lang) => handleChange('bottomSection.title', val, lang)}
                placeholder="e.g., Ready for your next adventure?"
                activeLanguage={activeLanguage}
                error={!!getFieldError('bottomSection.title.en')}
              />

              <LocalizedRichText
                label="SEO Content Body"
                value={formData.bottomSection?.description || { en: '', de: '', it: '', es: '' }}
                onChange={(val, lang) => handleChange('bottomSection.description', val, lang)}
                placeholder="Detailed promotional text for SEO..."
                activeLanguage={activeLanguage}
              />

              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <LocalizedInput
                  label="Promo Button Label"
                  value={formData.bottomSection?.button?.label || { en: '', de: '', it: '', es: '' }}
                  onChange={(val, lang) => handleChange('bottomSection.button.label', val, lang)}
                  placeholder="Button Label"
                  activeLanguage={activeLanguage}
                  error={!!getFieldError('bottomSection.button.label.en')}
                />

                <div className="space-y-2">
                  <Label htmlFor="bottomSectionBtnHref">Button Link</Label>
                  <Input
                    id="bottomSectionBtnHref"
                    value={formData.bottomSection?.button?.href || ''}
                    onChange={(e) => handleChange('bottomSection.button.href', e.target.value)}
                    placeholder="e.g. /contact or https://..."
                    className={cn(!!getFieldError('bottomSection.button.href') && "border-red-500")}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="bottomSectionBtnNewTab"
                  checked={!!formData.bottomSection?.button?.newTab}
                  onCheckedChange={(checked) => handleChange('bottomSection.button.newTab', checked)}
                />
                <Label htmlFor="bottomSectionBtnNewTab">Open button link in new tab</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )}

            {/* MEDIA TAB */}
            {activeTab === 'media' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Category Thumbnail</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ImageUpload
                      images={(formData.images || []) as ImageData[]}
                      onAdd={() => {
                        setFormData(prev => ({
                          ...prev,
                          images: [...(prev.images || []), { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } }]
                        }));
                      }}
                      onRemove={(index) => {
                        setFormData(prev => {
                          const images = [...(prev.images || [])];
                          images.splice(index, 1);
                          return { ...prev, images };
                        });
                      }}
                      onUpdate={(index, field, value, lang) => {
                        setFormData(prev => {
                          const images = [...(prev.images || [])];
                          if (!images[index]) return prev;
                          const img = { ...images[index] };
                          if (lang) {
                            const currentVal = (img as any)[field] || {};
                            (img as any)[field] = { ...currentVal, [lang]: value };
                          } else {
                            (img as any)[field] = value;
                          }
                          images[index] = img;
                          return { ...prev, images };
                        });
                      }}
                      onUpload={async (file) => {
                        const result = await handleImageUpload(file);
                        return result;
                      }}
                      activeLanguage={activeLanguage}
                      title="Category Image"
                      description="Upload a representative thumbnail for this category"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Page Gallery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ImageUpload
                      images={(formData.gallery || []) as ImageData[]}
                      onAdd={() => {
                        setFormData(prev => ({
                          ...prev,
                          gallery: [...(prev.gallery || []), { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } }]
                        }));
                      }}
                      onRemove={(index) => {
                        setFormData(prev => {
                          const gallery = [...(prev.gallery || [])];
                          gallery.splice(index, 1);
                          return { ...prev, gallery };
                        });
                      }}
                      onUpdate={(index, field, value, lang) => {
                        setFormData(prev => {
                          const gallery = [...(prev.gallery || [])];
                          if (!gallery[index]) return prev;
                          const img = { ...gallery[index] };
                          if (lang) {
                            const currentVal = (img as any)[field] || {};
                            (img as any)[field] = { ...currentVal, [lang]: value };
                          } else {
                            (img as any)[field] = value;
                          }
                          gallery[index] = img;
                          return { ...prev, gallery };
                        });
                      }}
                      onUpload={async (file) => {
                        const result = await handleImageUpload(file);
                        return result;
                      }}
                      activeLanguage={activeLanguage}
                      title="Media Gallery"
                      description="Upload images for the category gallery section"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Reviews Section Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LocalizedInput
                      label="Reviews Section Title"
                      value={formData.reviewsSectionTitle || { en: '', de: '', it: '', es: '' }}
                      onChange={(val, lang) => handleChange('reviewsSectionTitle', val, lang)}
                      placeholder="e.g., What Our Travelers Say"
                      activeLanguage={activeLanguage}
                    />
                  </CardContent>
                </Card>

                <ReviewCuratedManager
                  reviews={formData.reviews || []}
                  onChange={(reviews) => handleChange('reviews', reviews)}
                  onUpload={handleImageUpload}
                  activeLanguage={activeLanguage}
                />
              </div>
            )}

            {/* FAQ & BLOG TAB */}
            {activeTab === 'faq-blog' && (
              <div className="space-y-6">
        {/* Featured Blogs */}
        <Card>
          <CardHeader>
            <CardTitle>Featured Blogs</CardTitle>
            <p className="text-sm text-gray-500">Select up to 3 blogs to feature on the category page ({(formData.featuredBlogs || []).length}/3 selected)</p>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Selected blogs list */}
            {selectedBlogObjects.length > 0 && (
              <div className="space-y-2">
                {selectedBlogObjects.map((blog) => {
                  const thumbUrl = typeof blog.featuredImage === 'object' ? blog.featuredImage?.url : blog.featuredImage;
                  const title = blog.title?.en || blog.title || 'Untitled';
                  return (
                    <div key={blog._id} className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      {thumbUrl && (
                        <img src={thumbUrl} alt={title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                      )}
                      <span className="flex-1 text-sm font-medium text-blue-800 dark:text-blue-200 truncate">{title}</span>
                      <button type="button" onClick={() => removeFeaturedBlog(blog._id)} className="flex-shrink-0 text-blue-600 hover:text-red-600 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedBlogObjects.length === 0 && (
              <p className="text-sm text-gray-400 italic">No blogs selected yet. Search below to add.</p>
            )}

            {/* Search — only show if under the limit */}
            {(formData.featuredBlogs || []).length < 3 && (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search blogs by title..."
                    value={blogSearchQuery}
                    onChange={(e) => setBlogSearchQuery(e.target.value)}
                    onFocus={() => setIsBlogSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsBlogSearchFocused(false), 200)}
                    className="pl-9 pr-9"
                  />
                  {isSearchingBlogs && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Dropdown */}
                {isBlogSearchFocused && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 border rounded-lg bg-background shadow-lg max-h-64 overflow-y-auto">
                    {isSearchingBlogs ? (
                      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                      </div>
                    ) : blogSearchResults.length > 0 ? (
                      blogSearchResults
                        .filter(blog => !(formData.featuredBlogs || []).includes(blog._id))
                        .map((blog) => {
                          const thumbUrl = typeof blog.featuredImage === 'object' ? blog.featuredImage?.url : blog.featuredImage;
                          const title = blog.title?.en || blog.title || 'Untitled';
                          return (
                            <button
                              key={blog._id}
                              type="button"
                              className="w-full text-left px-3 py-2.5 hover:bg-accent flex items-center gap-3 border-b last:border-b-0 transition-colors"
                              onClick={() => addFeaturedBlog(blog)}
                            >
                              {thumbUrl && (
                                <img src={thumbUrl} alt={title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{title}</div>
                              </div>
                              <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                            </button>
                          );
                        })
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        No blogs found for &quot;{blogSearchQuery}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Featured Destinations */}
        <Card>
          <CardHeader>
            <CardTitle>Featured Destinations</CardTitle>
            <p className="text-sm text-gray-500">Select destinations to feature on the category page ({(formData.featuredDestinations || []).length} selected)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <LocalizedInput
              label="Destinations Section Title"
              value={formData.destinationsSectionTitle || { en: '', de: '', it: '', es: '' }}
              onChange={(val, lang) => handleChange('destinationsSectionTitle', val, lang)}
              placeholder="e.g., Popular Destinations"
              activeLanguage={activeLanguage}
            />

            {/* Selected destinations list */}
            {selectedDestObjects.length > 0 && (
              <div className="space-y-2 pt-2">
                {selectedDestObjects.map((dest) => {
                  const thumbUrl = dest.coverImage?.url;
                  const title = dest.name?.en || dest.name || 'Untitled';
                  return (
                    <div key={dest._id} className="flex items-center gap-3 p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                      {thumbUrl && (
                        <img src={thumbUrl} alt={title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                      )}
                      <span className="flex-1 text-sm font-medium text-emerald-800 dark:text-emerald-200 truncate">{title}</span>
                      <button type="button" onClick={() => removeFeaturedDest(dest._id)} className="flex-shrink-0 text-emerald-600 hover:text-red-600 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedDestObjects.length === 0 && (
              <p className="text-sm text-gray-400 italic">No destinations selected yet. Search below to add.</p>
            )}

            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search destinations by name..."
                  value={destSearchQuery}
                  onChange={(e) => setDestSearchQuery(e.target.value)}
                  onFocus={() => setIsDestSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsDestSearchFocused(false), 200)}
                  className="pl-9 pr-9"
                />
                {isSearchingDests && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              {isDestSearchFocused && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 border rounded-lg bg-background shadow-lg max-h-64 overflow-y-auto">
                  {isSearchingDests ? (
                    <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                    </div>
                  ) : destSearchResults.length > 0 ? (
                    destSearchResults
                      .filter(dest => !(formData.featuredDestinations || []).includes(dest._id))
                      .map((dest) => {
                        const thumbUrl = dest.coverImage?.url;
                        const title = dest.name?.en || dest.name || 'Untitled';
                        return (
                          <button
                            key={dest._id}
                            type="button"
                            className="w-full text-left px-3 py-2.5 hover:bg-accent flex items-center gap-3 border-b last:border-b-0 transition-colors"
                            onClick={() => addFeaturedDest(dest)}
                          >
                            {thumbUrl && (
                              <img src={thumbUrl} alt={title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{title}</div>
                            </div>
                            <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                          </button>
                        );
                      })
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      No destinations found for &quot;{destSearchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <FaqManager
          faqs={formData.faqs || []}
          onChange={(faqs) => handleChange('faqs', faqs)}
          activeLanguage={activeLanguage}
        />

              </div>
            )}

            {/* SEO TAB */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                {/* SEO Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>SEO Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <LocalizedInput
                      label="Meta Title"
                      value={formData.seo?.metaTitle || { en: '', de: '', it: '', es: '' }}
                      onChange={(val, lang) => handleChange('seo.metaTitle', val, lang)}
                      placeholder="SEO Meta Title"
                      activeLanguage={activeLanguage}
                    />
                    <LocalizedTextArea
                      label="Meta Description"
                      value={formData.seo?.metaDescription || { en: '', de: '', it: '', es: '' }}
                      onChange={(val, lang) => handleChange('seo.metaDescription', val, lang)}
                      placeholder="SEO Meta Description"
                      activeLanguage={activeLanguage}
                    />
                    <div className="space-y-2">
                      <Label>Meta Keywords</Label>
                      <LocalizedTagsInput
                        label="Meta Keywords"
                        value={formData.seo?.metaKeywords || { en: [], de: [], it: [], es: [] }}
                        onChange={(val, lang) => handleChange('seo.metaKeywords', val, lang)}
                        placeholder="Type and press Enter"
                        activeLanguage={activeLanguage}
                      />
                    </div>

                    <Separator />

                    <ImageUpload
                      images={formData.seo?.metaImage ? [formData.seo.metaImage as ImageData] : []}
                      maxImages={1}
                      onAdd={() => {
                        setFormData(prev => ({
                          ...prev,
                          seo: {
                            ...(prev.seo || { metaTitle: { en: '', de: '', it: '', es: '' }, metaDescription: { en: '', de: '', it: '', es: '' } }),
                            metaImage: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } }
                          }
                        }));
                      }}
                      onRemove={() => {
                        setFormData(prev => ({
                          ...prev,
                          seo: {
                            ...(prev.seo || { metaTitle: { en: '', de: '', it: '', es: '' }, metaDescription: { en: '', de: '', it: '', es: '' } }),
                            metaImage: undefined
                          }
                        }));
                      }}
                      onUpdate={(_index, field, value, lang) => {
                        setFormData(prev => {
                          const metaImage = prev.seo?.metaImage ? { ...prev.seo.metaImage } : { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } };
                          if (lang) {
                            const currentVal = (metaImage as any)[field] || {};
                            (metaImage as any)[field] = { ...currentVal, [lang]: value };
                          } else {
                            (metaImage as any)[field] = value;
                          }
                          return {
                            ...prev,
                            seo: {
                              ...(prev.seo || { metaTitle: { en: '', de: '', it: '', es: '' }, metaDescription: { en: '', de: '', it: '', es: '' } }),
                              metaImage
                            }
                          };
                        });
                      }}
                      onUpload={async (file) => {
                        const result = await handleImageUpload(file);
                        return result;
                      }}
                      activeLanguage={activeLanguage}
                      title="Social Media Image"
                      description="This image will be shown when the category is shared on social media"
                    />
                  </CardContent>
                </Card>

              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-4 border-t">
          <Link href="/admin/tour/category">
            <Button type="button" variant="outline" className="text-gray-700 dark:text-gray-300">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditMode ? 'Update Category' : 'Create Category'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
