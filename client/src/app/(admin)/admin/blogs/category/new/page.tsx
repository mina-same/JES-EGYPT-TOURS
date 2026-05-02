'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { blogCategoryAPI, blogAPI } from '@/lib/api/blogAdmin';
import { uploadAPI } from '@/lib/api/upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Loader2, Image as ImageIcon, X, Search, LayoutDashboard, ListChecks, HelpCircle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import LocalizedInput from '@/components/admin/LocalizedInput';
import LocalizedTextArea from '@/components/admin/LocalizedTextArea';
import LocalizedTagsInput from '@/components/admin/LocalizedTagsInput';
import LocalizedRichText from '@/components/admin/LocalizedRichText';
import FaqManager from '@/components/admin/FaqManager';
import AdminLanguageTabs, { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import ImageUpload from '@/components/admin/ImageUpload';
import FormErrorPanel from '@/components/admin/FormErrorPanel';
import DraftBanner from '@/components/admin/DraftBanner';
import { ILocalizedString } from '@/types/blog';
import { useToast } from '@/hooks/use-toast';
import { useFormDraft } from '@/hooks/useFormDraft';
import { parseApiError, type FormErrorItem } from '@/lib/parseApiError';

// Define form data type locally or reuse from types if available
interface ILocalizedMixed {
  en?: string[];
  de?: string[];
  it?: string[];
  es?: string[];
}

interface BlogCategoryFormData {
  name: ILocalizedString;
  slug: ILocalizedString;
  description: ILocalizedString;
  image?: {
    url: string;
    fileName: string;
    title: ILocalizedString;
    alt: ILocalizedString;
  };
  seo?: {
    metaTitle: ILocalizedString;
    metaDescription: ILocalizedString;
    metaKeywords: ILocalizedMixed;
    metaImage?: {
      url: string;
      fileName: string;
      title: ILocalizedString;
      alt: ILocalizedString;
    };
  };
  heroTitle?: ILocalizedString;
  heroDescription?: ILocalizedString;
  sideImage?: {
    url: string;
    fileName: string;
    title: ILocalizedString;
    alt: ILocalizedString;
  };
  featuredBlogs?: string[];
  featuredBlogsSectionTitle?: ILocalizedString;
  blogsSectionTitle?: ILocalizedString;
  faqsSectionTitle?: ILocalizedString;
  destinationsSectionTitle?: ILocalizedString;
  featuredDestinations?: string[];
  faqs?: any[];
  isActive: boolean;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'sections', label: 'Page Sections', icon: ListChecks },
  { id: 'faq-blog', label: 'FAQs & Blogs', icon: HelpCircle },
  { id: 'seo', label: 'SEO Settings', icon: Settings },
];

const INITIAL_BLOG_CATEGORY: BlogCategoryFormData = {
  name: { en: '', de: '', it: '', es: '' },
  slug: { en: '', de: '', it: '', es: '' },
  description: { en: '', de: '', it: '', es: '' },
  image: {
    url: '',
    fileName: '',
    title: { en: '', de: '', it: '', es: '' },
    alt: { en: '', de: '', it: '', es: '' },
  },
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
  heroTitle: { en: '', de: '', it: '', es: '' },
  heroDescription: { en: '', de: '', it: '', es: '' },
  sideImage: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
  featuredBlogs: [],
  featuredBlogsSectionTitle: { en: '', de: '', it: '', es: '' },
  blogsSectionTitle: { en: '', de: '', it: '', es: '' },
  faqsSectionTitle: { en: '', de: '', it: '', es: '' },
  destinationsSectionTitle: { en: '', de: '', it: '', es: '' },
  featuredDestinations: [],
  faqs: [],
  isActive: true,
};

export default function NewBlogCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const categoryId = searchParams.get('id');
  const isEditMode = !!categoryId;

  const draftKey = isEditMode ? `draft_blog_cat_edit_${categoryId}` : 'draft_blog_cat_new';

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [formErrors, setFormErrors] = useState<FormErrorItem[]>([]);
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');

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

  const { formData, setFormData, clearDraft, hasDraft } = useFormDraft<BlogCategoryFormData>(
    draftKey,
    INITIAL_BLOG_CATEGORY
  );

  // Fetch category data if editing
  useEffect(() => {
    if (isEditMode && categoryId) {
      fetchCategoryData(categoryId);
    }
  }, [categoryId, isEditMode]);

  const fetchCategoryData = async (id: string) => {
    try {
      setFetchingData(true);
      // Clear errors when reloading data
      setFormErrors([]);
      const response: any = await blogCategoryAPI.getById(id);
      
      if (response.success && response.data) {
        const data = response.data;
        
        const mapToLocalized = (val: any): ILocalizedString => {
          if (!val) return { en: '', de: '', it: '', es: '' };
          if (typeof val === 'string') return { en: val, de: '', it: '', es: '' };
          return {
            en: val.en || '',
            de: val.de || '',
            it: val.it || '',
            es: val.es || '',
          };
        };

        const mapToLocalizedMixed = (val: any): ILocalizedMixed => {
          if (!val) return { en: [], de: [], it: [], es: [] };
          return {
            en: val.en || [],
            de: val.de || [],
            it: val.it || [],
            es: val.es || [],
          };
        };

        const imageObj = typeof data.image === 'string' 
          ? { url: data.image, fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } }
          : {
              url: data.image?.url || '',
              fileName: data.image?.fileName || '',
              title: mapToLocalized(data.image?.title),
              alt: mapToLocalized(data.image?.alt),
            };

        setFormData({
          name: mapToLocalized(data.name),
          slug: mapToLocalized(data.slug),
          description: mapToLocalized(data.description),
          image: imageObj,
          seo: {
            metaTitle: mapToLocalized(data.metaTitle),
            metaDescription: mapToLocalized(data.metaDescription),
            metaKeywords: mapToLocalizedMixed(data.metaKeywords),
            metaImage: {
              url: data.metaImage?.url || '',
              fileName: data.metaImage?.fileName || '',
              title: mapToLocalized(data.metaImage?.title),
              alt: mapToLocalized(data.metaImage?.alt),
            },
          },
          heroTitle: mapToLocalized(data.heroTitle),
          heroDescription: mapToLocalized(data.heroDescription),
          sideImage: data.sideImage ? {
            url: data.sideImage.url || '',
            fileName: data.sideImage.fileName || '',
            title: mapToLocalized(data.sideImage.title),
            alt: mapToLocalized(data.sideImage.alt),
          } : { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
          featuredBlogsSectionTitle: mapToLocalized(data.featuredBlogsSectionTitle),
          blogsSectionTitle: mapToLocalized(data.blogsSectionTitle),
          faqsSectionTitle: mapToLocalized(data.faqsSectionTitle),
          destinationsSectionTitle: mapToLocalized(data.destinationsSectionTitle),
          featuredBlogs: Array.isArray(data.featuredBlogs) ? data.featuredBlogs.map((b: any) => typeof b === 'object' ? b._id : b) : [],
          featuredDestinations: Array.isArray(data.featuredDestinations) ? data.featuredDestinations.map((d: any) => typeof d === 'object' ? d._id : d) : [],
          faqs: Array.isArray(data.faqs) ? data.faqs : [],
          isActive: data.isActive !== undefined ? !!data.isActive : true,
        });

        if (Array.isArray(data.featuredBlogs)) {
          setSelectedBlogObjects(data.featuredBlogs.filter((b: any) => typeof b === 'object'));
        }
        if (Array.isArray(data.featuredDestinations)) {
          setSelectedDestObjects(data.featuredDestinations.filter((d: any) => typeof d === 'object'));
        }
      }

    } catch (err: any) {
      setFormErrors([{ field: 'Server', message: err.message || 'Failed to fetch category data' }]);
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
    const targetLang = lang || activeLanguage;
    setFormData(prev => {
      const updated = { ...prev } as any;
      
      // 1. Handle localized fields that might receive a whole object OR a single value
      const isLocalizedObj = typeof value === 'object' && value !== null && !Array.isArray(value);

      if (['name', 'description', 'slug'].includes(field)) {
        if (isLocalizedObj) {
          updated[field] = value;
        } else {
          updated[field] = {
            ...(updated[field] || { en: '', de: '', it: '', es: '' }),
            [targetLang]: value,
          };
        }
        
        if (field === 'name') {
           const nameVal = isLocalizedObj ? value[targetLang] : value;
           updated.slug = {
             ...(updated.slug || { en: '', de: '', it: '', es: '' }),
             [targetLang]: generateSlug(nameVal || ''),
           };
        }
        return updated as BlogCategoryFormData;
      }

      // 2. Handle nested fields (e.g. seo.metaTitle, seo.metaImage.alt)
      if (field.includes('.')) {
        const keys = field.split('.');
        let current = updated;
        
        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i];
          current[k] = typeof current[k] === 'object' && current[k] !== null ? { ...current[k] } : {};
          current = current[k];
        }
        
        const lastKey = keys[keys.length - 1];
        
        // Special handling for localized sub-fields
        if (['metaTitle', 'metaDescription', 'alt', 'title', 'label'].includes(lastKey)) {
           if (isLocalizedObj) {
             current[lastKey] = value;
           } else {
             current[lastKey] = {
               ...(current[lastKey] || { en: '', de: '', it: '', es: '' }),
               [targetLang]: value,
             };
           }
        } else {
          current[lastKey] = value;
        }
      } else {
        updated[field] = value;
      }

      return updated as BlogCategoryFormData;
    });
  };


  // Handle keywords directly via handleChange

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

  const addFeaturedBlog = (blog: any) => {
    const current = formData.featuredBlogs || [];
    if (!current.includes(blog._id)) {
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

      // ── Client-side validation ──────────────────────
      const validationErrors: FormErrorItem[] = [];
      if (!formData.name?.en?.trim()) {
        validationErrors.push({ field: 'Category Name', message: 'English name is required', lang: 'en', path: 'name-en' });
      }
      if (!formData.slug?.en?.trim()) {
        validationErrors.push({ field: 'URL Slug', message: 'English slug is required', lang: 'en', path: 'slug-en' });
      }
      if (formData.slug?.en && !/^[a-z0-9-]+$/.test(formData.slug.en)) {
        validationErrors.push({ field: 'URL Slug', message: 'Only lowercase letters, numbers, and hyphens allowed', lang: 'en', path: 'slug-en' });
      }
      if (validationErrors.length > 0) {
        setFormErrors(validationErrors);
        setLoading(false);
        return;
      }

      // Clean up empty fields
      const cleanData = { ...formData };
      
      const hasEn = (obj: any) => !!(obj?.en && (typeof obj.en === 'string' ? obj.en.trim() !== '' : true));
      const hasAnyLocalizedValue = (obj: any) => {
        if (!obj || typeof obj !== 'object') return false;
        return ['en', 'de', 'it', 'es'].some((lang) => {
          const localized = obj[lang];
          return typeof localized === 'string' ? localized.trim() !== '' : !!localized;
        });
      };
      const cleanLocalized = (obj: any) => hasAnyLocalizedValue(obj) ? obj : undefined;
      const cleanImage = (img: any) => {
        if (!img?.url) return undefined;
        const cleaned: any = {
          url: img.url,
          fileName: img.fileName || img.url.split('?')[0].split('/').filter(Boolean).pop() || 'image',
        };
        const title = cleanLocalized(img.title);
        const alt = cleanLocalized(img.alt);
        if (title) cleaned.title = title;
        if (alt) cleaned.alt = alt;
        return cleaned;
      };

      const payload: any = {
        name: cleanData.name,
        slug: cleanData.slug,
        description: cleanData.description,
        isActive: cleanData.isActive,
        // Backend BlogCategory model has flat SEO fields
        metaTitle: cleanData.seo?.metaTitle,
        metaDescription: cleanData.seo?.metaDescription,
        metaKeywords: cleanData.seo?.metaKeywords, // Now ILocalizedMixed
        metaImage: cleanImage(cleanData.seo?.metaImage),
      };

      if (hasEn(cleanData.heroTitle)) payload.heroTitle = cleanData.heroTitle;
      if (hasEn(cleanData.heroDescription)) payload.heroDescription = cleanData.heroDescription;
      if (cleanData.sideImage?.url) payload.sideImage = cleanImage(cleanData.sideImage);
      if (hasEn(cleanData.featuredBlogsSectionTitle)) payload.featuredBlogsSectionTitle = cleanData.featuredBlogsSectionTitle;
      if (hasEn(cleanData.blogsSectionTitle)) payload.blogsSectionTitle = cleanData.blogsSectionTitle;
      if (hasEn(cleanData.faqsSectionTitle)) payload.faqsSectionTitle = cleanData.faqsSectionTitle;
      if (hasEn(cleanData.destinationsSectionTitle)) payload.destinationsSectionTitle = cleanData.destinationsSectionTitle;
      
      if (cleanData.faqs && cleanData.faqs.length > 0) payload.faqs = cleanData.faqs;
      if (cleanData.featuredBlogs && cleanData.featuredBlogs.length > 0) payload.featuredBlogs = cleanData.featuredBlogs;
      if (cleanData.featuredDestinations && cleanData.featuredDestinations.length > 0) payload.featuredDestinations = cleanData.featuredDestinations;


      if (cleanData.image?.url) {
        payload.image = cleanImage(cleanData.image);
      }

      let response: any;
      if (isEditMode && categoryId) {
        response = await blogCategoryAPI.update(categoryId, payload);
      } else {
        response = await blogCategoryAPI.create(payload);
      }
      
      if (response.success) {
        toast({
            title: isEditMode ? 'Category Updated' : 'Category Created',
            description: `Blog category ${isEditMode ? 'updated' : 'created'} successfully.`,
        });
        clearDraft();
        router.push('/admin/blogs/category');
      } else {
        const parsed = parseApiError(response);
        setFormErrors(parsed);
        toast({
            title: 'Save failed',
            description: `${parsed.length} issue(s) found. See the error panel for details.`,
            variant: 'destructive',
        });
      }
    } catch (err: any) {
      const parsed = parseApiError(err?.response?.data || { message: err.message });
      setFormErrors(parsed);
      toast({
        title: 'Error',
        description: err.message || 'An error occurred',
        variant: 'destructive',
      });
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
      {/* Language Selection */}
      <AdminLanguageTabs
        activeLanguage={activeLanguage}
        onLanguageChange={setActiveLanguage}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit Blog Category' : 'Create New Blog Category'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditMode ? 'Update blog category information' : 'Add a new blog category'}
          </p>
        </div>
        <Link href="/admin/blogs/category">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
        </Link>
      </div>

      {/* Draft Banner */}
      {hasDraft && !isEditMode && (
        <DraftBanner onDiscard={() => { clearDraft(); setFormData(INITIAL_BLOG_CATEGORY); }} />
      )}

      {/* Detailed Error Panel */}
      {formErrors.length > 0 && (
        <FormErrorPanel errors={formErrors} onDismiss={() => setFormErrors([])} />
      )}

      
      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b mt-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap relative",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
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
                placeholder="Travel Guides"
                activeLanguage={activeLanguage}
              />
              <LocalizedInput
                label="URL Slug *"
                value={formData.slug}
                onChange={(val, lang) => handleChange('slug', val, lang)}
                placeholder="travel-guides"
                activeLanguage={activeLanguage}
              />
            </div>
            
            <LocalizedRichText
              label="Description"
              value={formData.description}
              onChange={(val) => handleChange('description', val)}
              placeholder="Describe this category..."
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

        {/* Image */}
        <Card>
          <CardHeader>
            <CardTitle>Category Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUpload
              images={formData.image ? [{
                url: formData.image.url || '',
                title: formData.image.title || '',
                alt: formData.image.alt || '',
                fileName: formData.image.fileName || '',
              }] : []}
              onAdd={() => {
                handleChange('image', { url: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' }, fileName: '' });
              }}
              onRemove={() => {
                handleChange('image', undefined);
              }}
              onUpdate={(index, field, value, lang) => {
                handleChange(`image.${field}`, value, lang);
              }}
              onUpload={async (file) => {
                return await handleImageUpload(file);
              }}
              title="Category Image"
              description="Upload an image for this category"
              maxImages={1}
              activeLanguage={activeLanguage}
            />

          </CardContent>
        </Card>
              </div>
            )}

            {activeTab === 'sections' && (
              <div className="space-y-6">
                        {/* Hero Section */}
        <Card>
          <CardHeader>
            <CardTitle>Hero Section (Top of Page)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <LocalizedInput
                  label="Hero Title"
                  value={formData.heroTitle || { en: '', de: '', it: '', es: '' }}
                  onChange={(val, lang) => handleChange('heroTitle', val, lang)}
                  placeholder="E.g. Explore our best articles"
                  activeLanguage={activeLanguage}
                />
                <LocalizedRichText
                  label="Hero Description"
                  value={formData.heroDescription || { en: '', de: '', it: '', es: '' }}
                  onChange={(val) => handleChange('heroDescription', val)}
                  placeholder="Hero paragraph..."
                  activeLanguage={activeLanguage}
                />
              </div>
              <div className="space-y-4">
                <Label>Section Side Image</Label>
                <ImageUpload
                  images={formData.sideImage ? [formData.sideImage] : []}
                  onAdd={() => handleChange('sideImage', { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } })}
                  onRemove={() => handleChange('sideImage', undefined)}
                  onUpdate={(index, field, value, lang) => handleChange(`sideImage.${field}`, value, lang)}
                  onUpload={handleImageUpload}
                  maxImages={1}
                  activeLanguage={activeLanguage}
                />
              </div>
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
              label="Featured Blogs Section Title"
              value={formData.featuredBlogsSectionTitle || { en: '', de: '', it: '', es: '' }}
              onChange={(val, lang) => handleChange('featuredBlogsSectionTitle', val, lang)}
              placeholder="Featured Articles"
              activeLanguage={activeLanguage}
            />
            <LocalizedInput
              label="All Blogs Section Title"
              value={formData.blogsSectionTitle || { en: '', de: '', it: '', es: '' }}
              onChange={(val, lang) => handleChange('blogsSectionTitle', val, lang)}
              placeholder="All Articles"
              activeLanguage={activeLanguage}
            />
            <LocalizedInput
              label="FAQs Section Title"
              value={formData.faqsSectionTitle || { en: '', de: '', it: '', es: '' }}
              onChange={(val, lang) => handleChange('faqsSectionTitle', val, lang)}
              placeholder="Frequently Asked Questions"
              activeLanguage={activeLanguage}
            />
          </CardContent>
        </Card>
              </div>
            )}

            {activeTab === 'faq-blog' && (
              <div className="space-y-6">
                        {/* Featured Blogs */}
        <Card>
          <CardHeader>
            <CardTitle>Featured Blogs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Search & Select Blogs</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search blogs by name..."
                  value={blogSearchQuery}
                  onChange={(e) => setBlogSearchQuery(e.target.value)}
                  onFocus={() => setIsBlogSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsBlogSearchFocused(false), 200)}
                  className="pl-9"
                />
                
                {isSearchingBlogs && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}

                {isBlogSearchFocused && blogSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {blogSearchResults.map((blog) => (
                      <div
                        key={blog._id}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addFeaturedBlog(blog);
                        }}
                      >
                        <div className="truncate pr-4">
                          {typeof blog.title === 'object' ? blog.title.en : blog.title}
                        </div>
                        {formData.featuredBlogs?.includes(blog._id) && (
                          <span className="text-xs bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-gray-500">Selected</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Blogs List */}
            {formData.featuredBlogs && formData.featuredBlogs.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Featured Blogs</Label>
                <div className="grid gap-2">
                  {formData.featuredBlogs.map((blogId) => {
                    const blogObj = selectedBlogObjects.find(b => b._id === blogId);
                    return (
                      <div key={blogId} className="flex items-center justify-between p-3 border rounded-md bg-gray-50 dark:bg-slate-900/50">
                        <span className="truncate mr-4">
                          {blogObj ? (typeof blogObj.title === 'object' ? blogObj.title.en : blogObj.title) : blogId}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeaturedBlog(blogId)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
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

            {activeTab === 'seo' && (
              <div className="space-y-6">
                        {/* SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <LocalizedInput
                  label="Meta Title"
                  value={formData.seo?.metaTitle || { en: '', de: '', it: '', es: '' }}
                  onChange={(val) => handleChange('seo.metaTitle', val)}
                  placeholder="SEO Title"
                  activeLanguage={activeLanguage}
                />
              </div>
              <div className="space-y-2">
                <LocalizedTagsInput
                  label="Keywords"
                  value={formData.seo?.metaKeywords || { en: [], de: [], it: [], es: [] }}
                  onChange={(val) => handleChange('seo.metaKeywords', val)}
                  placeholder="Add keyword..."
                  activeLanguage={activeLanguage}
                />
              </div>
            </div>
            
            <div className="space-y-2">
            <LocalizedRichText
              label="Meta Description"
              value={formData.seo?.metaDescription || { en: '', de: '', it: '', es: '' }}
              onChange={(val) => handleChange('seo.metaDescription', val)}
              placeholder="SEO Description..."
              activeLanguage={activeLanguage}
            />
            </div>

            <Separator />
            
            <div className="space-y-4">
              <ImageUpload
                images={formData.seo?.metaImage ? [{
                  url: formData.seo.metaImage.url || '',
                  title: formData.seo.metaImage.title || '',
                  alt: formData.seo.metaImage.alt || '',
                  fileName: formData.seo.metaImage.fileName || '',
                }] : []}
                onAdd={() => {
                  handleChange('seo.metaImage', { url: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' }, fileName: '' });
                }}
                onRemove={() => {
                  handleChange('seo.metaImage', undefined);
                }}
                onUpdate={(index, field, value, lang) => {
                  handleChange(`seo.metaImage.${field}`, value, lang);
                }}
                onUpload={async (file) => {
                  return await handleImageUpload(file);
                }}
                title="SEO Image (Optional)"
                description="Image for social media sharing and SEO"
                maxImages={1}
                activeLanguage={activeLanguage}
              />

            </div>
          </CardContent>
        </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-6 border-t">
          <Link href="/admin/blogs/category">
            <Button type="button" variant="outline" className="!text-black">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="min-w-[140px]">
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
