'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { tourSubcategoryAPI, tourCategoryAPI } from '@/lib/api/tour';
import { TourSubcategoryFormData, ITourCategory } from '@/types/tour';
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
import DraftBanner from '@/components/admin/DraftBanner';
import { uploadAPI } from '@/lib/api/upload';
import { FormSkeleton } from '@/components/admin/skeletons/FormSkeleton';
import AdminLanguageTabs, { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import ImageUpload, { ImageData } from '@/components/admin/ImageUpload';
// import LocalizedField from '@/components/admin/LocalizedField';
import { useFormDraft } from '@/hooks/useFormDraft';
import { parseApiError, type FormErrorItem } from '@/lib/parseApiError';
import { useToast } from '@/hooks/use-toast';
import FaqManager from '@/components/admin/FaqManager';
import ReviewCuratedManager from '@/components/admin/ReviewCuratedManager';
import { blogAPI } from '@/lib/api/blogAdmin';
import { Search, MessageSquare } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'sections', label: 'Page Sections', icon: ListChecks },
  { id: 'media', label: 'Media & Gallery', icon: ImageIcon },
  { id: 'faq-blog', label: 'FAQs & Blogs', icon: HelpCircle },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'seo', label: 'SEO & Promo', icon: Settings },
];

const INITIAL_TOUR_SUBCAT: TourSubcategoryFormData = {
  category: '',
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
    images: [], 
    button: { label: { en: '', de: '', it: '', es: '' }, href: '', newTab: false } 
  },
  subcategorySectionTitle: { en: '', de: '', it: '', es: '' },
  toursSectionTitle: { en: '', de: '', it: '', es: '' },
  toursSectionSubTitle: { en: '', de: '', it: '', es: '' },
  gallerySectionTitle: { en: '', de: '', it: '', es: '' },
  blogsSectionTitle: { en: '', de: '', it: '', es: '' },
  faqsSectionTitle: { en: '', de: '', it: '', es: '' },
  reviewsSectionTitle: { en: '', de: '', it: '', es: '' },
  faqs: [],
  reviews: [],
  featuredBlogs: [],
  destinationsSectionTitle: { en: '', de: '', it: '', es: '' },
  featuredDestinations: [],
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

export default function NewSubcategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const subcategoryId = searchParams.get('id');
  const isEditMode = !!subcategoryId;

  const draftKey = isEditMode ? `draft_tour_subcat_edit_${subcategoryId}` : 'draft_tour_subcat_new';

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<FormErrorItem[]>([]);
  const [categories, setCategories] = useState<ITourCategory[]>([]);
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');

  const { formData, setFormData, clearDraft, hasDraft } = useFormDraft<TourSubcategoryFormData>(
    draftKey,
    INITIAL_TOUR_SUBCAT
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

  // Parallel data fetching on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const promises: Promise<any>[] = [tourCategoryAPI.getAll({ limit: 100, isActive: true })];
        if (isEditMode && subcategoryId) {
          promises.push(tourSubcategoryAPI.getById(subcategoryId));
        }

        const [categoriesRes, subcatRes] = await Promise.all(promises);

        if (categoriesRes.success && categoriesRes.data) {
          setCategories(categoriesRes.data);
        } else {
          setFormErrors([{ field: 'Categories', message: 'Failed to load categories' }]);
        }

        if (subcatRes && subcatRes.success && subcatRes.data) {
          const data = subcatRes.data as any;
          
          const sectionHeaderImages = Array.isArray(data.sectionHeader?.images)
            ? data.sectionHeader.images.map((img: any) => ({
                url: img?.url || '',
                fileName: img?.fileName || '',
                title: typeof img?.title === 'object' ? img.title : { en: img?.title || '', de: '', it: '', es: '' },
                alt: typeof img?.alt === 'object' ? img.alt : { en: img?.alt || '', de: '', it: '', es: '' },
              }))
            : [];

          const categoryValue =
            data.category && typeof data.category === 'object' && data.category._id
              ? data.category._id
              : data.category || '';

          setFormData({
            category: categoryValue,
            name: typeof data.name === 'object' ? data.name : { en: data.name || '', de: '', it: '', es: '' },
            slug: typeof data.slug === 'object' ? data.slug : { en: data.slug || '', de: '', it: '', es: '' },
            description: typeof data.description === 'object' ? data.description : { en: data.description || '', de: '', it: '', es: '' },
            images: Array.isArray(data.images) 
              ? data.images.map((img: any) => ({
                  url: img?.url || '',
                  fileName: img?.fileName || '',
                  title: typeof img?.title === 'object' ? img.title : { en: img?.title || '', de: '', it: '', es: '' },
                  alt: typeof img?.alt === 'object' ? img.alt : { en: img?.alt || '', de: '', it: '', es: '' },
                }))
              : [],
            gallery: Array.isArray(data.gallery)
              ? data.gallery.map((img: any) => ({
                  url: img?.url || '',
                  fileName: img?.fileName || '',
                  title: typeof img?.title === 'object' ? img.title : { en: img?.title || '', de: '', it: '', es: '' },
                  alt: typeof img?.alt === 'object' ? img.alt : { en: img?.alt || '', de: '', it: '', es: '' },
                }))
              : [],
            seo: {
              metaTitle: typeof data.seo?.metaTitle === 'object' ? data.seo.metaTitle : { en: data.seo?.metaTitle || '', de: '', it: '', es: '' },
              metaDescription: typeof data.seo?.metaDescription === 'object' ? data.seo.metaDescription : { en: data.seo?.metaDescription || '', de: '', it: '', es: '' },
              metaKeywords: data.seo?.metaKeywords || { en: [], de: [], it: [], es: [] },
              metaImage: {
                url: data.seo?.metaImage?.url || '',
                fileName: data.seo?.metaImage?.fileName || '',
                title: typeof data.seo?.metaImage?.title === 'object' ? data.seo.metaImage.title : { en: data.seo?.metaImage?.title || '', de: '', it: '', es: '' },
                alt: typeof data.seo?.metaImage?.alt === 'object' ? data.seo.metaImage.alt : { en: data.seo?.metaImage?.alt || '', de: '', it: '', es: '' },
              },
            },
            sectionHeader: {
              isEnabled: data.sectionHeader?.isEnabled !== undefined ? !!data.sectionHeader.isEnabled : true,
              images: sectionHeaderImages,
              title: typeof data.sectionHeader?.title === 'object' ? data.sectionHeader.title : { en: data.sectionHeader?.title || '', de: '', it: '', es: '' },
              description: typeof data.sectionHeader?.description === 'object' ? data.sectionHeader.description : { en: data.sectionHeader?.description || '', de: '', it: '', es: '' },
              button: {
                label: typeof data.sectionHeader?.button?.label === 'object' ? data.sectionHeader.button.label : { en: data.sectionHeader?.button?.label || '', de: '', it: '', es: '' },
                href: data.sectionHeader?.button?.href || '',
                newTab: !!data.sectionHeader?.button?.newTab,
              },
            },
            subcategorySectionTitle: typeof data.subcategorySectionTitle === 'object' ? data.subcategorySectionTitle : { en: data.subcategorySectionTitle || '', de: '', it: '', es: '' },
            toursSectionTitle: typeof data.toursSectionTitle === 'object' ? data.toursSectionTitle : { en: data.toursSectionTitle || '', de: '', it: '', es: '' },
            toursSectionSubTitle: typeof data.toursSectionSubTitle === 'object' ? data.toursSectionSubTitle : { en: data.toursSectionSubTitle || '', de: '', it: '', es: '' },
            gallerySectionTitle: typeof data.gallerySectionTitle === 'object' ? data.gallerySectionTitle : { en: data.gallerySectionTitle || '', de: '', it: '', es: '' },
            blogsSectionTitle: typeof data.blogsSectionTitle === 'object' ? data.blogsSectionTitle : { en: data.blogsSectionTitle || '', de: '', it: '', es: '' },
            faqsSectionTitle: typeof data.faqsSectionTitle === 'object' ? data.faqsSectionTitle : { en: data.faqsSectionTitle || '', de: '', it: '', es: '' },
            reviewsSectionTitle: typeof data.reviewsSectionTitle === 'object' ? data.reviewsSectionTitle : { en: data.reviewsSectionTitle || '', de: '', it: '', es: '' },
            faqs: Array.isArray(data.faqs) ? data.faqs : [],
            reviews: Array.isArray(data.reviews) ? data.reviews.map((r: any) => ({
              ...r,
              name: r.name || '',
              avatar: r.avatar || '',
              rating: typeof r.rating === 'number' ? r.rating : 5,
              comment: typeof r.comment === 'object' ? r.comment : { en: r.comment || '', de: '', it: '', es: '' }
            })) : [],
            featuredBlogs: Array.isArray(data.featuredBlogs)
              ? data.featuredBlogs.map((b: any) => typeof b === 'object' ? b._id : b)
              : [],
            destinationsSectionTitle: typeof data.destinationsSectionTitle === 'object' ? data.destinationsSectionTitle : { en: data.destinationsSectionTitle || '', de: '', it: '', es: '' },
            featuredDestinations: Array.isArray(data.featuredDestinations)
              ? data.featuredDestinations.map((d: any) => typeof d === 'object' ? d._id : d)
              : [],
            bottomSection: data.bottomSection
              ? {
                  isEnabled: data.bottomSection.isEnabled !== undefined ? !!data.bottomSection.isEnabled : true,
                  title: typeof data.bottomSection.title === 'object' ? data.bottomSection.title : { en: data.bottomSection.title || '', de: '', it: '', es: '' },
                  description: typeof data.bottomSection.description === 'object' ? data.bottomSection.description : { en: data.bottomSection.description || '', de: '', it: '', es: '' },
                  button: {
                    label: typeof data.bottomSection.button?.label === 'object' ? data.bottomSection.button.label : { en: data.bottomSection.button?.label || '', de: '', it: '', es: '' },
                    href: data.bottomSection.button?.href || '',
                    newTab: !!data.bottomSection.button?.newTab,
                  },
                  image1: data.bottomSection.image1 ? {
                    url: data.bottomSection.image1.url || '',
                    fileName: data.bottomSection.image1.fileName || '',
                    title: typeof data.bottomSection.image1.title === 'object' ? data.bottomSection.image1.title : { en: data.bottomSection.image1.title || '', de: '', it: '', es: '' },
                    alt: typeof data.bottomSection.image1.alt === 'object' ? data.bottomSection.image1.alt : { en: data.bottomSection.image1.alt || '', de: '', it: '', es: '' },
                  } : { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
                  image2: data.bottomSection.image2 ? {
                    url: data.bottomSection.image2.url || '',
                    fileName: data.bottomSection.image2.fileName || '',
                    title: typeof data.bottomSection.image2.title === 'object' ? data.bottomSection.image2.title : { en: data.bottomSection.image2.title || '', de: '', it: '', es: '' },
                    alt: typeof data.bottomSection.image2.alt === 'object' ? data.bottomSection.image2.alt : { en: data.bottomSection.image2.alt || '', de: '', it: '', es: '' },
                  } : { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
                }
              : INITIAL_TOUR_SUBCAT.bottomSection,
            isActive: data.isActive !== undefined ? !!data.isActive : true,
          });
        } else if (isEditMode && !subcatRes?.success) {
          setFormErrors([{ field: 'Subcategory', message: subcatRes?.error || 'Failed to fetch subcategory data' }]);
        }
      } catch (err: any) {
        console.error('Error loading data:', err);
        setFormErrors([{ field: 'General', message: err.message || 'Failed to load required data' }]);
      } finally {
        setCategoriesLoading(false);
        setFetchingData(false);
        setLoading(false);
      }
    };

    loadData();
  }, [subcategoryId, isEditMode]);

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
      const updated = { ...prev };
      
      // Handle nested fields (supports deep paths like sectionHeader.button.label.en)
      if (field.includes('.')) {
        const keys = field.split('.');
        let cursor: any = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i];
          // Special handling for keywords array and other localized objects
          cursor[k] = typeof cursor[k] === 'object' && cursor[k] !== null ? { ...cursor[k] } : {};
          cursor = cursor[k];
        }
        cursor[keys[keys.length - 1]] = value;
      } else {
        (updated as any)[field] = value;
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
        
        // Auto-populate SEO metaTitle if empty
        if (!updated.seo?.metaTitle?.[targetLang]) {
          updated.seo = {
            ...updated.seo,
            metaTitle: { 
              ...(updated.seo?.metaTitle || { en: '', de: '', it: '', es: '' }), 
              [targetLang]: typeof value === 'object' ? value[targetLang] : value
            },
          };
        }
      }

      return updated;
    });
  };

  // Handle keywords
  const handleKeywordsChange = (lang: AdminLanguage, value: string[]) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...(prev.seo || { metaTitle: { en: '', de: '', it: '', es: '' }, metaDescription: { en: '', de: '', it: '', es: '' } }),
        metaKeywords: {
          ...(prev.seo?.metaKeywords || { en: [], de: [], it: [], es: [] }),
          [lang]: value,
        },
      },
    } as TourSubcategoryFormData));
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
        toast({ title: 'Limit reached', description: 'You can only select up to 3 featured blogs', variant: 'destructive' });
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

  // Destination Search logic
  useEffect(() => {
    const searchDests = async () => {
      if (!isDestSearchFocused && !destSearchQuery.trim()) {
        setDestSearchResults([]);
        return;
      }

      setIsSearchingDests(true);
      try {
        const { destinationAPI } = await import('@/lib/api/blogAdmin');
        const response = await destinationAPI.getAll({ 
          search: destSearchQuery.trim(), 
          limit: 50
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

    const timeoutId = setTimeout(searchDests, 100);
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
    
    if (!formData.category) {
      setFormErrors([{ field: 'Category', message: 'Please select a category' }]);
      return;
    }
    
    try {
      setLoading(true);
      setFormErrors([]);

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
        category: formData.category,
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
      
      if (formData.faqs && formData.faqs.length > 0) payload.faqs = formData.faqs;
      if (formData.reviews && formData.reviews.length > 0) {
        payload.reviews = formData.reviews.map((r: any) => ({
          ...r,
          comment: hasEn(r.comment) ? r.comment : undefined
        })).filter((r: any) => !!r.name && !!r.comment);
      }
      if (formData.featuredBlogs && formData.featuredBlogs.length > 0) {
        payload.featuredBlogs = formData.featuredBlogs;
      }
      
      if (hasEn(formData.destinationsSectionTitle)) payload.destinationsSectionTitle = formData.destinationsSectionTitle;
      if (formData.featuredDestinations && formData.featuredDestinations.length > 0) {
        payload.featuredDestinations = formData.featuredDestinations;
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

      // Section Header cleanup
      if (formData.sectionHeader) {
        const sh: any = { ...formData.sectionHeader };
        if (!hasEn(sh.title)) delete sh.title;
        if (!hasEn(sh.description)) delete sh.description;
        
        if (Array.isArray(sh.images)) {
          sh.images = sh.images.filter((img: any) => !!img?.url).map(cleanImage);
        }
        if (sh.image?.url) {
          sh.image = cleanImage(sh.image);
        }
        if (sh.button) {
          if (!hasEn(sh.button.label) || !sh.button.href) delete sh.button;
        }
        payload.sectionHeader = sh;
      }
      
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

      let response;
      if (isEditMode && subcategoryId) {
        response = await tourSubcategoryAPI.update(subcategoryId, payload);
      } else {
        response = await tourSubcategoryAPI.create(payload);
      }
      
      if (response.success) {
        toast({ title: isEditMode ? 'Subcategory Updated' : 'Subcategory Created', description: `Tour subcategory ${isEditMode ? 'updated' : 'created'} successfully.` });
        clearDraft();
        router.push('/admin/tour/subcategory');
      } else {
        const parsed = parseApiError(response);
        setFormErrors(parsed);
        toast({ title: 'Save failed', description: `${parsed.length} issue(s) found.`, variant: 'destructive' });
      }
    } catch (err: any) {
      const parsed = parseApiError(err?.response?.data || { message: err.message });
      setFormErrors(parsed);
    } finally {
      setLoading(false);
    }
  };

  // Get selected category name
  const getSelectedCategoryName = () => {
    const category = categories.find(c => c._id === formData.category);
    const name = category?.name;
    return typeof name === 'object' ? name.en : name || '';
  };

  if (fetchingData || categoriesLoading) {
    return <FormSkeleton />;
  }

  return (
    <div className="w-full mx-auto space-y-6" suppressHydrationWarning>
      {/* Language Selection */}
      <AdminLanguageTabs
        activeLanguage={activeLanguage}
        onLanguageChange={setActiveLanguage}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit Subcategory' : 'Create New Subcategory'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditMode ? 'Update subcategory information' : 'Add a new tour subcategory to organize your tours'}
          </p>
        </div>
        <Link href="/admin/tour/subcategory">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
        </Link>
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
        <DraftBanner onDiscard={() => { clearDraft(); setFormData(INITIAL_TOUR_SUBCAT); }} />
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
            <div className="space-y-2">
              <Label htmlFor="category">Parent Category *</Label>
                <select
                id="category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border border-gray-100 dark:border-slate-800 rounded-md text-sm bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#b79c5c]/50",
                  getFieldError('category') && "border-red-500 ring-red-500"
                )}
                required
              >
                <option value="">Select a category...</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {typeof category.name === 'object' ? category.name.en : category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <LocalizedInput
                label="Subcategory Name *"
                value={formData.name}
                onChange={(val, lang) => handleChange('name', val, lang)}
                placeholder="Desert Safari"
                activeLanguage={activeLanguage}
                error={!!getFieldError('name.en')}
              />
              <LocalizedInput
                label="URL Slug *"
                value={formData.slug}
                onChange={(val, lang) => handleChange('slug', val, lang)}
                placeholder="desert-safari"
                activeLanguage={activeLanguage}
                error={!!getFieldError('slug.en')}
              />
            </div>
            
            <LocalizedRichText
              label="Description"
              value={formData.description}
              onChange={(val, lang) => handleChange('description', val, lang)}
              placeholder="Describe this subcategory..."
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
                {/* Section Header */}
                <Card>
                  <CardHeader>
                    <CardTitle>Section Header</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                        setFormData(prev => {
                          const images = [...(prev.sectionHeader?.images || []), { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } }];
                          return {
                            ...prev,
                            sectionHeader: { ...(prev.sectionHeader || { isEnabled: true, title: { en: '', de: '', it: '', es: '' }, description: { en: '', de: '', it: '', es: '' } }), images }
                          };
                        });
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
                            sectionHeader: {
                              ...(prev.sectionHeader || { isEnabled: true, title: { en: '', de: '', it: '', es: '' }, description: { en: '', de: '', it: '', es: '' } }),
                              images
                            }
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

                    <LocalizedInput
                      label="Header Title"
                      value={formData.sectionHeader?.title || { en: '', de: '', it: '', es: '' }}
                      onChange={(val, lang) => handleChange('sectionHeader.title', val, lang)}
                      placeholder="Header Title"
                      activeLanguage={activeLanguage}
                      error={!!getFieldError('sectionHeader.title.en')}
                    />

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

                {/* Section Titles */}
                <Card>
                  <CardHeader>
                    <CardTitle>Section Titles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <LocalizedInput
                      label="Subcategories Section Title"
                      value={formData.subcategorySectionTitle}
                      onChange={(val) => handleChange('subcategorySectionTitle', val)}
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
                      onChange={(val) => handleChange('gallerySectionTitle', val)}
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
                        onRemove={(index) => {
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
                        addButtonLabel="Upload Promo Image 1"
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
                        onRemove={(index) => {
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
                        addButtonLabel="Upload Promo Image 2"
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
                    <CardTitle>Subcategory Thumbnail</CardTitle>
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
                      title="Subcategory Image"
                      description="Upload a representative thumbnail for this subcategory"
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
                      description="Upload images for the subcategory gallery section"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* FAQ & BLOG TAB */}
            {activeTab === 'faq-blog' && (
              <div className="space-y-6">
        {/* Featured Blogs */}
        <Card>
          <CardHeader>
            <CardTitle>Featured Blogs</CardTitle>
            <p className="text-sm text-gray-500">Select up to 3 blogs to feature on this subcategory page ({(formData.featuredBlogs || []).length}/3 selected)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedBlogObjects.length > 0 && (
              <div className="space-y-2">
                {selectedBlogObjects.map((blog) => {
                  const thumbUrl = typeof blog.featuredImage === 'object' ? blog.featuredImage?.url : blog.featuredImage;
                  const title = blog.title?.en || blog.title || 'Untitled';
                  return (
                    <div key={blog._id} className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      {thumbUrl && <img src={thumbUrl} alt={title} className="w-10 h-10 rounded object-cover flex-shrink-0" />}
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
                              {thumbUrl && <img src={thumbUrl} alt={title} className="w-10 h-10 rounded object-cover flex-shrink-0" />}
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
          </CardHeader>
          <CardContent className="space-y-6">
            <LocalizedInput
              label="Destinations Section Title"
              value={formData.destinationsSectionTitle || { en: '', de: '', it: '', es: '' }}
              onChange={(val, lang) => handleChange('destinationsSectionTitle', val, lang)}
              placeholder="Popular Destinations"
              activeLanguage={activeLanguage}
            />
 
            <div className="space-y-4">
              <Label>Search & Select Destinations</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search destinations by name..."
                  value={destSearchQuery}
                  onChange={(e) => setDestSearchQuery(e.target.value)}
                  onFocus={() => setIsDestSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsDestSearchFocused(false), 200)}
                  className="pl-9"
                />
                
                {isSearchingDests && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
 
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
            </div>
 
            {/* Selected Destinations List */}
            {formData.featuredDestinations && formData.featuredDestinations.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Featured Destinations</Label>
                <div className="grid gap-2">
                  {formData.featuredDestinations.map((destId) => {
                    const destObj = selectedDestObjects.find(d => d._id === destId);
                    const thumbUrl = destObj?.coverImage?.url;
                    const title = destObj ? (typeof destObj.name === 'object' ? destObj.name.en : destObj.name) : destId;

                    return (
                      <div key={destId} className="flex items-center gap-3 p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                        {thumbUrl && (
                          <img src={thumbUrl} alt={title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                        )}
                        <span className="flex-1 text-sm font-medium text-emerald-800 dark:text-emerald-200 truncate">{title}</span>
                        <button type="button" onClick={() => removeFeaturedDest(destId)} className="flex-shrink-0 text-emerald-600 hover:text-red-600 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                      error={!!getFieldError('seo.metaTitle.en')}
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
                      onRemove={(index) => {
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
                      description="This image will be shown when the subcategory is shared on social media"
                    />
                  </CardContent>
                </Card>

              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-4 border-t">
          <Link href="/admin/tour/subcategory">
            <Button type="button" variant="outline" className="text-gray-700 dark:text-gray-300">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading || !formData.category}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditMode ? 'Update Subcategory' : 'Save Subcategory'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
