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
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Upload, X, Plus } from 'lucide-react';
import LocalizedInput from '@/components/admin/LocalizedInput';
import LocalizedTextArea from '@/components/admin/LocalizedTextArea';
import LocalizedTagsInput from '@/components/admin/LocalizedTagsInput';
import LocalizedRichText from '@/components/admin/LocalizedRichText';
import FormErrorPanel from '@/components/admin/FormErrorPanel';
import DraftBanner from '@/components/admin/DraftBanner';
import { uploadAPI } from '@/lib/api/upload';
import AdminLanguageTabs, { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
// import LocalizedField from '@/components/admin/LocalizedField';
import { useFormDraft } from '@/hooks/useFormDraft';
import { parseApiError, type FormErrorItem } from '@/lib/parseApiError';
import { useToast } from '@/hooks/use-toast';

const INITIAL_TOUR_CATEGORY: TourCategoryFormData = {
  name: { en: '', de: '', it: '', es: '' },
  slug: { en: '', de: '', it: '', es: '' },
  description: { en: '', de: '', it: '', es: '' },
  image: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
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
  isActive: true,
};

export default function NewCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const categoryId = searchParams.get('id');
  const isEditMode = !!categoryId;

  const draftKey = isEditMode ? `draft_tour_cat_edit_${categoryId}` : 'draft_tour_cat_new';

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [formErrors, setFormErrors] = useState<FormErrorItem[]>([]);
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');

  const { formData, setFormData, clearDraft, hasDraft } = useFormDraft<TourCategoryFormData>(
    draftKey,
    INITIAL_TOUR_CATEGORY
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
          image: data.image
            ? {
                url: data.image.url || '',
                fileName: data.image.fileName || '',
                title: ensureLocalized(data.image.title),
                alt: ensureLocalized(data.image.alt),
              }
            : {
                url: '',
                fileName: '',
                title: { en: '', de: '', it: '', es: '' },
                alt: { en: '', de: '', it: '', es: '' },
              },
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
        isActive: formData.isActive,
      };
      
      // Image cleanup
      if (formData.image?.url) {
        payload.image = { ...formData.image };
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

      {/* Draft Banner */}
      {hasDraft && !isEditMode && (
        <DraftBanner onDiscard={() => { clearDraft(); setFormData(INITIAL_TOUR_CATEGORY); }} />
      )}

      {/* Detailed Error Panel */}
      {formErrors.length > 0 && (
        <FormErrorPanel errors={formErrors} onDismiss={() => setFormErrors([])} />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
              />
              <LocalizedInput
                label="URL Slug *"
                value={formData.slug}
                onChange={(val) => handleChange('slug', val)}
                placeholder="adventure-tours"
              />
            </div>
            
            <LocalizedRichText
              label="Description"
              value={formData.description}
              onChange={(val) => handleChange('description', val)}
              placeholder="Describe this category..."
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
            <div className="group relative border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-4 hover:border-[#b79c5c] bg-gray-50/50 dark:bg-slate-900/50 transition-all">
              {formData.image?.url ? (
                <div className="relative aspect-video max-h-[200px] mx-auto mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                  <img
                    src={formData.image.url}
                    alt={formData.image.alt?.en || 'Preview'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const result = await handleImageUpload(file);
                            if (result) {
                              handleChange('image.url', result.url);
                              handleChange('image.fileName', result.fileName);
                            }
                          }
                        }}
                      />
                      <div className="bg-white dark:bg-slate-900 rounded-full p-2.5 shadow-xl">
                        <Upload className="h-5 w-5 text-[#b79c5c]" />
                      </div>
                    </label>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="rounded-full shadow-xl"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          image: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } }
                        }));
                      }}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-video max-h-[200px] mb-4 rounded-lg border-2 border-dashed border-gray-200 dark:border-slate-700 cursor-pointer hover:border-[#b79c5c] hover:bg-white dark:hover:bg-slate-800 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const result = await handleImageUpload(file);
                        if (result) {
                          handleChange('image.url', result.url);
                          handleChange('image.fileName', result.fileName);
                        }
                      }
                    }}
                  />
                  <ImageIcon className="h-10 w-10 text-gray-300 dark:text-slate-600 mb-2" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Click to upload category image</span>
                </label>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-gray-400">URL</Label>
                  <Input
                    value={formData.image?.url || ''}
                    onChange={(e) => handleChange('image.url', e.target.value)}
                    placeholder="https://..."
                    className="h-9 text-xs"
                  />
                </div>
                <LocalizedInput
                  label="Title"
                  value={formData.image?.title || { en: '', de: '', it: '', es: '' }}
                  onChange={(val) => handleChange('image.title', val)}
                  placeholder="Title"
                />
                <LocalizedInput
                  label="Alt Text"
                  value={formData.image?.alt || { en: '', de: '', it: '', es: '' }}
                  onChange={(val) => handleChange('image.alt', val)}
                  placeholder="Alt text"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <LocalizedInput
                label="Meta Title"
                value={formData.seo?.metaTitle || { en: '', de: '', it: '', es: '' }}
                onChange={(val) => handleChange('seo.metaTitle', val)}
                placeholder="SEO Title"
              />
              <LocalizedTagsInput
                label="Keywords"
                value={formData.seo?.metaKeywords || { en: [], de: [], it: [], es: [] }}
                onChange={(val) => handleChange('seo.metaKeywords', val)}
                placeholder="adventure, tours"
              />
            </div>
            
              <LocalizedRichText
                label="Meta Description"
                value={formData.seo?.metaDescription || { en: '', de: '', it: '', es: '' }}
                onChange={(val) => handleChange('seo.metaDescription', val)}
                placeholder="Discover amazing adventure tours..."
              />

            <Separator />
            
            <div className="space-y-4">
              <div className="group relative border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-4 hover:border-[#b79c5c] bg-gray-50/50 dark:bg-slate-900/50 transition-all">
                {formData.seo?.metaImage?.url ? (
                  <div className="relative aspect-video max-h-[160px] mx-auto mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                    <img
                      src={formData.seo.metaImage.url}
                      alt={formData.seo.metaImage.alt?.en || 'SEO Preview'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const result = await handleImageUpload(file);
                              if (result) {
                                handleChange('seo.metaImage.url', result.url);
                                handleChange('seo.metaImage.fileName', result.fileName);
                              }
                            }
                          }}
                        />
                        <div className="bg-white dark:bg-slate-900 rounded-full p-2 shadow-sm">
                          <Upload className="h-4 w-4 text-[#b79c5c]" />
                        </div>
                      </label>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => {
                          handleChange('seo.metaImage', { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video max-h-[160px] mb-4 rounded-lg border-2 border-dashed border-gray-200 dark:border-slate-700 cursor-pointer hover:border-[#b79c5c] hover:bg-white dark:hover:bg-slate-800 transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const result = await handleImageUpload(file);
                          if (result) {
                            handleChange('seo.metaImage.url', result.url);
                            handleChange('seo.metaImage.fileName', result.fileName);
                          }
                        }
                      }}
                    />
                    <ImageIcon className="h-8 w-8 text-gray-300 dark:text-slate-600 mb-2" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white text-center px-4">Upload social sharing image (1200x630px recommended)</span>
                  </label>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-gray-400">URL</Label>
                    <Input
                      value={formData.seo?.metaImage?.url || ''}
                      onChange={(e) => handleChange('seo.metaImage.url', e.target.value)}
                      placeholder="https://..."
                      className="h-8 text-xs"
                    />
                  </div>
                  <LocalizedInput
                    label="Title"
                    value={formData.seo?.metaImage?.title || { en: '', de: '', it: '', es: '' }}
                    onChange={(val) => handleChange('seo.metaImage.title', val)}
                    placeholder="Title"
                  />
                  <LocalizedInput
                    label="Alt Text"
                    value={formData.seo?.metaImage?.alt || { en: '', de: '', it: '', es: '' }}
                    onChange={(val) => handleChange('seo.metaImage.alt', val)}
                    placeholder="Alt text"
                  />
                </div>
              </div>
            </div>
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

            <div className="space-y-4">
              <Label className="text-base font-semibold">Section Header Gallery</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(formData.sectionHeader?.images || []).map((img: any, index: number) => (
                  <div key={index} className="group relative border border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-4 hover:border-[#b79c5c] bg-gray-50/50 dark:bg-slate-900/50 transition-all">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const next = [...(formData.sectionHeader?.images || [])];
                        next.splice(index, 1);
                        handleChange('sectionHeader.images', next);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>

                    {img.url ? (
                      <div className="relative aspect-video max-h-[120px] mx-auto mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                        <img src={img.url} alt={img.alt?.en || 'Gallery'} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-video max-h-[120px] mb-3 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#b79c5c] hover:bg-white dark:hover:bg-slate-800 transition-all">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const result = await handleImageUpload(file);
                              if (result) {
                                const next = [...(formData.sectionHeader?.images || [])];
                                next[index] = { ...next[index], url: result.url, fileName: result.fileName };
                                handleChange('sectionHeader.images', next);
                              }
                            }
                          }}
                        />
                        <ImageIcon className="h-8 w-8 text-gray-300 mb-1" />
                        <span className="text-[10px] font-bold text-gray-500">Upload</span>
                      </label>
                    )}

                    <div className="space-y-2">
                      <div className="space-y-0.5">
                        <Label className="text-[9px] uppercase font-medium text-gray-400">URL</Label>
                        <Input
                          value={img.url || ''}
                          onChange={(e) => {
                            const next = [...(formData.sectionHeader?.images || [])];
                            next[index] = { ...next[index], url: e.target.value };
                            handleChange('sectionHeader.images', next);
                          }}
                          className="h-7 text-[10px]"
                        />
                      </div>
                      <LocalizedInput
                        label="Title"
                        value={img.title || { en: '', de: '', it: '', es: '' }}
                        onChange={(val) => {
                          const next = [...(formData.sectionHeader?.images || [])];
                          next[index] = { ...next[index], title: val };
                          handleChange('sectionHeader.images', next);
                        }}
                        placeholder="Title"
                        className="h-7 text-[10px]"
                      />
                      <LocalizedInput
                        label="Alt Text"
                        value={img.alt || { en: '', de: '', it: '', es: '' }}
                        onChange={(val) => {
                          const next = [...(formData.sectionHeader?.images || [])];
                          next[index] = { ...next[index], alt: val };
                          handleChange('sectionHeader.images', next);
                        }}
                        placeholder="Alt text"
                        className="h-7 text-[10px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-2"
                onClick={() => {
                  const next = [...(formData.sectionHeader?.images || [])];
                  next.push({ url: '', fileName: '', title: { en: '', de: '', it: '' }, alt: { en: '', de: '', it: '' } });
                  handleChange('sectionHeader.images', next);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Gallery Image
              </Button>
            </div>

            <div className="space-y-2">
              <LocalizedInput
                label="Header Title"
                value={formData.sectionHeader?.title || { en: '', de: '', it: '', es: '' }}
                onChange={(val) => handleChange('sectionHeader.title', val)}
                placeholder="Section title"
              />
            </div>

            <LocalizedRichText
              label="Section Description"
              value={formData.sectionHeader?.description || { en: '', de: '', it: '', es: '' }}
              onChange={(val) => handleChange('sectionHeader.description', val)}
              placeholder="Section description..."
            />

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <LocalizedInput
                label="Button Label"
                value={formData.sectionHeader?.button?.label || { en: '', de: '', it: '', es: '' }}
                onChange={(val) => handleChange('sectionHeader.button.label', val)}
                placeholder="Button Label"
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

        {/* Actions */}
        <div className="flex gap-4 justify-end">
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
