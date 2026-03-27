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
import { blogAPI } from '@/lib/api/blogAdmin';
import { Search } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'sections', label: 'Page Sections', icon: ListChecks },
  { id: 'media', label: 'Media & Gallery', icon: ImageIcon },
  { id: 'faq-blog', label: 'FAQs & Blogs', icon: HelpCircle },
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
  faqsSectionTitle: { en: '', de: '', it: '', es: '' },
  faqs: [],
  featuredBlogs: [],
  bottomSection: {
    isEnabled: true,
    title: { en: '', de: '', it: '', es: '' },
    description: { en: '', de: '', it: '', es: '' },
    button: { label: { en: '', de: '', it: '', es: '' }, href: '', newTab: false },
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
  
  // Blog Search State
  const [blogSearchQuery, setBlogSearchQuery] = useState('');
  const [blogSearchResults, setBlogSearchResults] = useState<any[]>([]);
  const [isSearchingBlogs, setIsSearchingBlogs] = useState(false);
  const [selectedBlogObjects, setSelectedBlogObjects] = useState<any[]>([]);

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
          blogsSectionTitle: ensureLocalized(data.blogsSectionTitle),
          faqsSectionTitle: ensureLocalized(data.faqsSectionTitle),
          faqs: Array.isArray(data.faqs) ? data.faqs.map((f: any) => ({
            ...f,
            question: ensureLocalized(f.question),
            answer: ensureLocalized(f.answer, true)
          })) : [],
          featuredBlogs: Array.isArray(data.featuredBlogs) 
            ? data.featuredBlogs.map((b: any) => typeof b === 'object' ? b._id : b) 
            : [],
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
          isActive: data.isActive !== undefined ? !!data.isActive : true,
        });
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
  const handleChange = (field: string, value: any) => {
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
      if (field.startsWith('name.')) {
        const lang = field.split('.')[1] as AdminLanguage;
        if (!updated.slug) updated.slug = { en: '', de: '', it: '', es: '' };
        updated.slug[lang] = generateSlug(value);
      }

      // Auto-populate SEO metaTitle for the active language
      if (field.startsWith('name.')) {
        const lang = field.split('.')[1];
        if (!updated.seo?.metaTitle?.[lang]) {
          updated.seo = {
            ...updated.seo,
            metaTitle: {
              ...(updated.seo?.metaTitle || { en: '', de: '', it: '', es: '' }),
              [lang]: value
            }
          };
        }
      }

      return updated as TourCategoryFormData;
    });
  };

  // Blog search effect
  useEffect(() => {
    const searchBlogs = async () => {
      if (!blogSearchQuery.trim()) {
        setBlogSearchResults([]);
        return;
      }
      setIsSearchingBlogs(true);
      try {
        const response = await blogAPI.getAllAdmin({ search: blogSearchQuery, limit: 8 });
        if (response.success && response.data) {
          setBlogSearchResults(response.data);
        }
      } catch (error) {
        console.error('Failed to search blogs:', error);
      } finally {
        setIsSearchingBlogs(false);
      }
    };

    const timeoutId = setTimeout(searchBlogs, 500);
    return () => clearTimeout(timeoutId);
  }, [blogSearchQuery]);

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
      const payload: any = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        subcategorySectionTitle: formData.subcategorySectionTitle,
        toursSectionTitle: formData.toursSectionTitle,
        gallerySectionTitle: formData.gallerySectionTitle,
        blogsSectionTitle: formData.blogsSectionTitle,
        faqsSectionTitle: formData.faqsSectionTitle,
        faqs: formData.faqs,
        featuredBlogs: formData.featuredBlogs,
        bottomSection: formData.bottomSection,
        isActive: formData.isActive,
      };
      
      // Image cleanup
      if (formData.images) {
        payload.images = formData.images.filter((img: any) => !!img?.url);
      }
      if (formData.gallery) {
        payload.gallery = formData.gallery.filter((img: any) => !!img?.url);
      }
      
      // SEO cleanup
      if (formData.seo) {
        const seo: any = {};
        const hasSeoTitle = formData.seo.metaTitle?.en || formData.seo.metaTitle?.de || formData.seo.metaTitle?.it || formData.seo.metaTitle?.es;
        const hasSeoDesc = formData.seo.metaDescription?.en || formData.seo.metaDescription?.de || formData.seo.metaDescription?.it || formData.seo.metaDescription?.es;
        const hasKeywords = formData.seo.metaKeywords && Object.values(formData.seo.metaKeywords).some(arr => Array.isArray(arr) && arr.length > 0);
        
        if (hasSeoTitle) seo.metaTitle = formData.seo.metaTitle;
        if (hasSeoDesc) seo.metaDescription = formData.seo.metaDescription;
        if (hasKeywords) seo.metaKeywords = formData.seo.metaKeywords;
        
        if (formData.seo.metaImage?.url) {
          seo.metaImage = { ...formData.seo.metaImage };
        }
        
        if (Object.keys(seo).length > 0) {
          payload.seo = seo;
        }
      }

      // Section Header cleanup
      if (formData.sectionHeader) {
        const sh: any = { ...formData.sectionHeader };
        
        // Filter out empty images
        if (Array.isArray(sh.images)) {
          sh.images = sh.images.filter((img: any) => !!img?.url);
        }
        
        // Remove button if incomplete
        if (sh.button && (!sh.button.label || !sh.button.href)) {
          delete sh.button;
        }
        
        payload.sectionHeader = sh;
      }

      let response;
      console.log('Submitting category payload:', payload);
      try {
        if (isEditMode && categoryId) {
          response = await tourCategoryAPI.update(categoryId, payload);
        } else {
          response = await tourCategoryAPI.create(payload);
        }
      } catch (err: any) {
        const parsed = parseApiError(err?.response?.data || { message: err.message });
        setFormErrors(parsed);
        toast({ title: 'Save failed', description: err.message || 'An error occurred', variant: 'destructive' });
        setLoading(false);
        return;
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
      const parsed = parseApiError(err?.response?.data || { message: err.message });
      setFormErrors(parsed);
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
    <div className="w-full mx-auto space-y-6">
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
                onChange={(val) => handleChange('name', val)}
                placeholder="e.g., Adventure Tours"
                activeLanguage={activeLanguage}
              />
              <LocalizedInput
                label="URL Slug *"
                value={formData.slug}
                onChange={(val) => handleChange('slug', val)}
                placeholder="adventure-tours"
                activeLanguage={activeLanguage}
              />
            </div>
            
            <LocalizedInput
              label="Description"
              value={formData.description}
              onChange={(val) => handleChange('description', val)}
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
                      onChange={(val) => handleChange('subcategorySectionTitle', val)}
                      placeholder="e.g., Explore Our Destinations"
                      activeLanguage={activeLanguage}
                    />

                    <LocalizedInput
                      label="Tours Section Title"
                      value={formData.toursSectionTitle}
                      onChange={(val) => handleChange('toursSectionTitle', val)}
                      placeholder="e.g., Popular Packages"
                      activeLanguage={activeLanguage}
                    />

                    <LocalizedInput
                      label="Gallery Section Title"
                      value={formData.gallerySectionTitle}
                      onChange={(val) => handleChange('gallerySectionTitle', val)}
                      placeholder="e.g., Destination Highlights"
                      activeLanguage={activeLanguage}
                    />

                    <LocalizedInput
                      label="Blogs Section Title"
                      value={formData.blogsSectionTitle}
                      onChange={(val) => handleChange('blogsSectionTitle', val)}
                      placeholder="e.g., Latest Travel News"
                      activeLanguage={activeLanguage}
                    />

                    <LocalizedInput
                      label="FAQs Section Title"
                      value={formData.faqsSectionTitle}
                      onChange={(val) => handleChange('faqsSectionTitle', val)}
                      placeholder="e.g., Frequently Asked Questions"
                      activeLanguage={activeLanguage}
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
                onChange={(val) => handleChange('sectionHeader.title', val)}
                placeholder="Section title"
                activeLanguage={activeLanguage}
              />
            </div>

            <LocalizedRichText
              label="Section Description"
              value={formData.sectionHeader?.description || { en: '', de: '', it: '', es: '' }}
              onChange={(val) => handleChange('sectionHeader.description', val)}
              placeholder="Section description..."
              activeLanguage={activeLanguage}
            />

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <LocalizedInput
                label="Button Label"
                value={formData.sectionHeader?.button?.label || { en: '', de: '', it: '', es: '' }}
                onChange={(val) => handleChange('sectionHeader.button.label', val)}
                placeholder="Button Label"
                activeLanguage={activeLanguage}
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
            <CardTitle>Bottom Promo Section (SEO Content)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              onChange={(val) => handleChange('bottomSection.title', val)}
              placeholder="e.g., Ready for your next adventure?"
              activeLanguage={activeLanguage}
            />

            <LocalizedRichText
              label="SEO Content Body"
              value={formData.bottomSection?.description || { en: '', de: '', it: '', es: '' }}
              onChange={(val) => handleChange('bottomSection.description', val)}
              placeholder="Detailed promotional text for SEO..."
              activeLanguage={activeLanguage}
            />
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
                    className="pl-9 pr-9"
                  />
                  {isSearchingBlogs && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Dropdown */}
                {blogSearchQuery && (
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
                      onChange={(val) => handleChange('seo.metaTitle', val)}
                      placeholder="SEO Meta Title"
                      activeLanguage={activeLanguage}
                    />
                    <LocalizedTextArea
                      label="Meta Description"
                      value={formData.seo?.metaDescription || { en: '', de: '', it: '', es: '' }}
                      onChange={(val) => handleChange('seo.metaDescription', val)}
                      placeholder="SEO Meta Description"
                      activeLanguage={activeLanguage}
                    />
                    <div className="space-y-2">
                      <Label>Meta Keywords</Label>
                      <LocalizedTagsInput
                        label="Meta Keywords"
                        value={formData.seo?.metaKeywords || { en: [], de: [], it: [], es: [] }}
                        onChange={(val) => handleChange('seo.metaKeywords', val)}
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