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
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUpload from '@/components/admin/ImageUpload';
import { uploadAPI } from '@/lib/api/upload';
import AdminLanguageTabs, { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedField from '@/components/admin/LocalizedField';

export default function NewCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('id');
  const isEditMode = !!categoryId;
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');
  
  const [formData, setFormData] = useState<TourCategoryFormData>({
    name: { en: '', de: '', it: '', es: '' },
    slug: '',
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
      metaKeywords: [],
      metaImage: {
        url: '',
        fileName: '',
        title: { en: '', de: '', it: '', es: '' },
        alt: { en: '', de: '', it: '', es: '' },
      },
    },
    sectionHeader: {
      isEnabled: true,
      title: { en: '', de: '', it: '', es: '' },
      description: { en: '', de: '', it: '', es: '' },
      button: {
        label: { en: '', de: '', it: '', es: '' },
        href: '',
        newTab: false,
      },
    },
    isActive: true,
  });

  // Fetch category data if editing
  useEffect(() => {
    if (isEditMode && categoryId) {
      fetchCategoryData(categoryId);
    }
  }, [categoryId, isEditMode]);

  const fetchCategoryData = async (id: string) => {
    try {
      setFetchingData(true);
      setError(null);
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
          slug: data.slug || '',
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
                metaKeywords: Array.isArray(data.seo.metaKeywords) ? data.seo.metaKeywords : [],
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
                metaKeywords: [],
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
      setError(err.response?.data?.error || 'Failed to fetch category data');
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

      // Auto-generate slug when English name changes
      if (field === 'name.en') {
        updated.slug = generateSlug(value);
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
  const handleKeywordsChange = (value: string, lang: AdminLanguage = activeLanguage) => {
    const items = value.split(',').map(k => k.trim()).filter(k => k);
    
    setFormData(prev => {
      const currentList = prev.seo?.metaKeywords || [];
      const updatedKeywords = items.map((text, idx) => {
        const existing = currentList[idx] || { en: '', de: '', it: '', es: '' };
        return { ...existing, [lang]: text };
      });
      
      return {
        ...prev,
        seo: {
          ...prev.seo,
          metaKeywords: updatedKeywords,
        },
      };
    });
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
      setError(null);

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
        const hasKeywords = formData.seo.metaKeywords && formData.seo.metaKeywords.length > 0;
        
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
        console.error('Submit error:', err.response?.data || err);
        const errMsg = err.response?.data?.messages ? err.response.data.messages.join('; ') : (err.response?.data?.error || err.message);
        setError(errMsg || `Failed to ${isEditMode ? 'update' : 'create'} category`);
        return;
      }
      
      if (response.success) {
        router.push('/admin/tour/category');
      } else {
        setError(response.error || `Failed to ${isEditMode ? 'update' : 'create'} category`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <LocalizedField
                label="Category Name *"
                value={formData.name}
                globalLanguage={activeLanguage}
                onChange={(lang, val) => handleChange(`name.${lang}`, val)}
              >
                {(lang, currentValue, handleLang) => (
                  <Input
                    id={`name-${lang}`}
                    value={currentValue}
                    onChange={(e) => handleLang(e.target.value)}
                    placeholder={`e.g., Adventure Tours (${lang})`}
                    required={lang === 'en'}
                  />
                )}
              </LocalizedField>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="adventure-tours"
                    required
                  />
                </div>
              </div>
            </div>
            
            <LocalizedField
              label="Description"
              value={formData.description}
              globalLanguage={activeLanguage}
              onChange={(lang, val) => handleChange(`description.${lang}`, val)}
            >
              {(lang, currentValue, handleLang) => (
                <RichTextEditor
                  value={currentValue}
                  onChange={handleLang}
                  placeholder={`Describe this category in ${lang}...`}
                  className="bg-white dark:bg-slate-900"
                />
              )}
            </LocalizedField>

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
                <LocalizedField
                  label="Title"
                  value={formData.image?.title}
                  globalLanguage={activeLanguage}
                  onChange={(lang, val) => handleChange(`image.title.${lang}`, val)}
                >
                  {(lang, currentValue, handleLang) => (
                    <Input
                      value={currentValue}
                      onChange={(e) => handleLang(e.target.value)}
                      placeholder={`Title in ${lang}`}
                      className="h-9 text-xs"
                    />
                  )}
                </LocalizedField>
                <LocalizedField
                  label="Alt Text"
                  value={formData.image?.alt}
                  globalLanguage={activeLanguage}
                  onChange={(lang, val) => handleChange(`image.alt.${lang}`, val)}
                >
                  {(lang, currentValue, handleLang) => (
                    <Input
                      value={currentValue}
                      onChange={(e) => handleLang(e.target.value)}
                      placeholder={`Alt in ${lang}`}
                      className="h-9 text-xs"
                    />
                  )}
                </LocalizedField>
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
              <LocalizedField
                label="Meta Title"
                value={formData.seo?.metaTitle}
                globalLanguage={activeLanguage}
                onChange={(lang, val) => handleChange(`seo.metaTitle.${lang}`, val)}
              >
                {(lang, currentValue, handleLang) => (
                  <div className="space-y-1">
                    <Input
                      id={`metaTitle-${lang}`}
                      value={currentValue}
                      onChange={(e) => handleLang(e.target.value)}
                      placeholder={`SEO Title in ${lang}...`}
                      maxLength={70}
                    />
                    <p className="text-[10px] text-gray-500 text-right">
                      {currentValue.length}/70
                    </p>
                  </div>
                )}
              </LocalizedField>
              <LocalizedField
                label="Keywords (comma-separated)"
                value={formData.seo?.metaKeywords}
                globalLanguage={activeLanguage}
                onChange={(lang, val) => handleKeywordsChange(val, lang)}
              >
                {(lang, currentValue, handleLang) => {
                  const keywords = (formData.seo?.metaKeywords || [])
                    .map(k => (k as any)[lang] || '')
                    .filter(k => k)
                    .join(', ');
                  return (
                    <Input
                      id={`metaKeywords-${lang}`}
                      value={keywords}
                      onChange={(e) => handleLang(e.target.value)}
                      placeholder={`adventure, tours (${lang})`}
                    />
                  );
                }}
              </LocalizedField>
            </div>
            
            <LocalizedField
              label="Meta Description"
              value={formData.seo?.metaDescription}
              globalLanguage={activeLanguage}
              onChange={(lang, val) => handleChange(`seo.metaDescription.${lang}`, val)}
            >
              {(lang, currentValue, handleLang) => (
                <div className="space-y-1">
                  <RichTextEditor
                    value={currentValue}
                    onChange={handleLang}
                    placeholder={`Discover amazing adventure tours (${lang})...`}
                    className="bg-white dark:bg-slate-900"
                  />
                  <p className="text-[10px] text-gray-500 text-right">Recommended: 150-160 characters</p>
                </div>
              )}
            </LocalizedField>

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
                  <LocalizedField
                    label="Title"
                    value={formData.seo?.metaImage?.title}
                    globalLanguage={activeLanguage}
                    onChange={(lang, val) => handleChange(`seo.metaImage.title.${lang}`, val)}
                  >
                    {(lang, currentValue, handleLang) => (
                      <Input
                        value={currentValue}
                        onChange={(e) => handleLang(e.target.value)}
                        placeholder={`Title in ${lang}`}
                        className="h-8 text-xs"
                      />
                    )}
                  </LocalizedField>
                  <LocalizedField
                    label="Alt Text"
                    value={formData.seo?.metaImage?.alt}
                    globalLanguage={activeLanguage}
                    onChange={(lang, val) => handleChange(`seo.metaImage.alt.${lang}`, val)}
                  >
                    {(lang, currentValue, handleLang) => (
                      <Input
                        value={currentValue}
                        onChange={(e) => handleLang(e.target.value)}
                        placeholder={`Alt in ${lang}`}
                        className="h-8 text-xs"
                      />
                    )}
                  </LocalizedField>
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
                      <LocalizedField
                        label="Title"
                        value={img.title}
                        globalLanguage={activeLanguage}
                        onChange={(lang, val) => {
                          const next = [...(formData.sectionHeader?.images || [])];
                          next[index] = { ...next[index], title: { ...(next[index].title || { en: '', de: '', it: '' }), [lang]: val } };
                          handleChange('sectionHeader.images', next);
                        }}
                      >
                        {(lang, currentValue, handleLang) => (
                          <Input
                            value={currentValue}
                            onChange={(e) => handleLang(e.target.value)}
                            className="h-7 text-[10px]"
                            placeholder={`Title in ${lang}`}
                          />
                        )}
                      </LocalizedField>
                      <LocalizedField
                        label="Alt Text"
                        value={img.alt}
                        globalLanguage={activeLanguage}
                        onChange={(lang, val) => {
                          const next = [...(formData.sectionHeader?.images || [])];
                          next[index] = { ...next[index], alt: { ...(next[index].alt || { en: '', de: '', it: '' }), [lang]: val } };
                          handleChange('sectionHeader.images', next);
                        }}
                      >
                        {(lang, currentValue, handleLang) => (
                          <Input
                            value={currentValue}
                            onChange={(e) => handleLang(e.target.value)}
                            className="h-7 text-[10px]"
                            placeholder={`Alt in ${lang}`}
                          />
                        )}
                      </LocalizedField>
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
              <LocalizedField
                label="Header Title"
                value={formData.sectionHeader?.title}
                globalLanguage={activeLanguage}
                onChange={(lang, val) => handleChange(`sectionHeader.title.${lang}`, val)}
              >
                {(lang, currentValue, handleLang) => (
                  <Input
                    id={`sectionHeaderTitle-${lang}`}
                    value={currentValue}
                    onChange={(e) => handleLang(e.target.value)}
                    placeholder={`Section title in ${lang}`}
                  />
                )}
              </LocalizedField>
            </div>

            <LocalizedField
              label="Section Description"
              value={formData.sectionHeader?.description}
              globalLanguage={activeLanguage}
              onChange={(lang, val) => handleChange(`sectionHeader.description.${lang}`, val)}
            >
              {(lang, currentValue, handleLang) => (
                <RichTextEditor
                  value={currentValue}
                  onChange={handleLang}
                  placeholder={`Section description in ${lang}...`}
                  className="bg-white dark:bg-slate-900"
                />
              )}
            </LocalizedField>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <LocalizedField
                label="Button Label"
                value={formData.sectionHeader?.button?.label}
                globalLanguage={activeLanguage}
                onChange={(lang, val) => handleChange(`sectionHeader.button.label.${lang}`, val)}
              >
                {(lang, currentValue, handleLang) => (
                  <Input
                    value={currentValue}
                    onChange={(e) => handleLang(e.target.value)}
                    placeholder={`Label in ${lang}`}
                  />
                )}
              </LocalizedField>

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
