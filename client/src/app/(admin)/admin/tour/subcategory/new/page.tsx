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
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Upload, X, Plus } from 'lucide-react';
import LocalizedInput from '@/components/admin/LocalizedInput';
import LocalizedTextArea from '@/components/admin/LocalizedTextArea';
import LocalizedTagsInput from '@/components/admin/LocalizedTagsInput';
import LocalizedRichText from '@/components/admin/LocalizedRichText';
import FormErrorPanel from '@/components/admin/FormErrorPanel';
import DraftBanner from '@/components/admin/DraftBanner';
import { uploadAPI } from '@/lib/api/upload';
import { FormSkeleton } from '@/components/admin/skeletons/FormSkeleton';
import AdminLanguageTabs, { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
// import LocalizedField from '@/components/admin/LocalizedField';
import { useFormDraft } from '@/hooks/useFormDraft';
import { parseApiError, type FormErrorItem } from '@/lib/parseApiError';
import { useToast } from '@/hooks/use-toast';

const INITIAL_TOUR_SUBCAT: TourSubcategoryFormData = {
  category: '',
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
  sectionHeader: { isEnabled: true, title: { en: '', de: '', it: '', es: '' }, description: { en: '', de: '', it: '', es: '' }, images: [], button: { label: { en: '', de: '', it: '', es: '' }, href: '', newTab: false } },
  isActive: true,
};

export default function NewSubcategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const subcategoryId = searchParams.get('id');
  const isEditMode = !!subcategoryId;

  const draftKey = isEditMode ? `draft_tour_subcat_edit_${subcategoryId}` : 'draft_tour_subcat_new';

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
            image: {
              url: data.image?.url || '',
              fileName: data.image?.fileName || '',
              title: typeof data.image?.title === 'object' ? data.image.title : { en: data.image?.title || '', de: '', it: '', es: '' },
              alt: typeof data.image?.alt === 'object' ? data.image.alt : { en: data.image?.alt || '', de: '', it: '', es: '' },
            },
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
  const handleChange = (field: string, value: any) => {
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
      if (field.startsWith('name.')) {
        const lang = field.split('.')[1] as AdminLanguage;
        if (!updated.slug) updated.slug = { en: '', de: '', it: '', es: '' };
        updated.slug[lang] = generateSlug(value);
        
        // Auto-populate SEO metaTitle if empty
        if (!updated.seo?.metaTitle?.en) {
          updated.seo = {
            ...updated.seo,
            metaTitle: { ...updated.seo?.metaTitle, en: value },
          };
        }
      }

      // Sync SEO metaTitle if name changes for other languages
      if (field.startsWith('name.')) {
        const lang = field.split('.')[1];
        const currentMetaTitle = updated.seo?.metaTitle || { en: '', de: '', it: '', es: '' };
        if (!currentMetaTitle[lang as AdminLanguage]) {
          updated.seo = {
            ...updated.seo,
            metaTitle: { ...currentMetaTitle, [lang]: value },
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

      // Clean up empty fields
      const cleanData = JSON.parse(JSON.stringify(formData));
      
      // Helper to check if localized string is empty
      const isLocEmpty = (obj: any) => !obj || (!obj.en && !obj.de && !obj.it && !obj.es);

      // Remove empty images
      if (isLocEmpty(cleanData.image?.url)) delete cleanData.image;
      if (isLocEmpty(cleanData.seo.metaImage?.url)) delete cleanData.seo.metaImage;
      
      if (cleanData.sectionHeader?.images) {
        cleanData.sectionHeader.images = cleanData.sectionHeader.images.filter((img: any) => img.url);
      }
      
      if (cleanData.faqs) {
        cleanData.faqs = cleanData.faqs.filter((faq: any) => faq.question?.en || faq.question?.de || faq.question?.it || faq.question?.es);
      }

      const payload = {
        ...cleanData,
        // Ensure slug is always updated from name.en if empty
        slug: cleanData.slug || generateSlug(cleanData.name.en),
      };

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
    <div className="w-full mx-auto space-y-6">
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

      {/* Draft Banner */}
      {hasDraft && !isEditMode && (
        <DraftBanner onDiscard={() => { clearDraft(); setFormData(INITIAL_TOUR_SUBCAT); }} />
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
            <div className="space-y-2">
              <Label htmlFor="category">Parent Category *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-100 dark:border-slate-800 rounded-md text-sm bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#b79c5c]/50"
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
                onChange={(val) => handleChange('name', val)}
                placeholder="Desert Safari"
              />
              <LocalizedInput
                label="URL Slug *"
                value={formData.slug}
                onChange={(val) => handleChange('slug', val)}
                placeholder="desert-safari"
              />
            </div>
            
            <LocalizedRichText
              label="Description"
              value={formData.description}
              onChange={(val) => handleChange('description', val)}
              placeholder="Describe this subcategory..."
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
            <CardTitle>Subcategory Image</CardTitle>
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
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Click to upload subcategory image</span>
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
                placeholder="adventure, desert"
              />
            </div>
            
            <LocalizedRichText
              label="Meta Description"
              value={formData.seo?.metaDescription || { en: '', de: '', it: '', es: '' }}
              onChange={(val) => handleChange('seo.metaDescription', val)}
              placeholder="Discover amazing tours..."
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
                    <span className="text-xs font-bold text-gray-900 dark:text-white text-center px-4">Upload social sharing image</span>
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
          <CardContent className="space-y-6">
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

            <LocalizedInput
              label="Header Title"
              value={formData.sectionHeader?.title || { en: '', de: '', it: '', es: '' }}
              onChange={(val) => handleChange('sectionHeader.title', val)}
              placeholder="Header Title"
            />

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