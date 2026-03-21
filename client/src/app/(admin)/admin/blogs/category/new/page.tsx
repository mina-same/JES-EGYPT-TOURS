'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { blogCategoryAPI } from '@/lib/api/blogAdmin';
import { uploadAPI } from '@/lib/api/upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Loader2, Image as ImageIcon, X } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUpload from '@/components/admin/ImageUpload';
import LocalizedField from '@/components/admin/LocalizedField';
import AdminLanguageTabs, { AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import TagInput from '@/components/admin/TagInput';
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
  isActive: boolean;
}

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
  isActive: true,
};

export default function NewBlogCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const categoryId = searchParams.get('id');
  const isEditMode = !!categoryId;

  const draftKey = isEditMode ? `draft_blog_cat_edit_${categoryId}` : 'draft_blog_cat_new';

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [formErrors, setFormErrors] = useState<FormErrorItem[]>([]);
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');

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
          isActive: data.isActive !== undefined ? !!data.isActive : true,
        });
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
      
      // Handle localized fields
      if (['name', 'description', 'slug'].includes(field)) {
        updated[field] = {
          ...(updated[field] || { en: '', de: '', it: '', es: '' }),
          [targetLang]: value,
        };
        
        // Auto-generate slug when name changes
        if (field === 'name') {
          updated.slug = {
            ...updated.slug,
            [targetLang]: generateSlug(value),
          };
        }
      } 
      // Handle SEO localized fields
      else if (field.startsWith('seo.')) {
        const seoField = field.split('.')[1];
        if (['metaTitle', 'metaDescription'].includes(seoField)) {
          updated.seo[seoField] = {
            ...(updated.seo[seoField] || { en: '', de: '', it: '', es: '' }),
            [targetLang]: value,
          };
        } else {
          updated.seo[seoField] = value;
        }
      }
      // Handle nested fields (e.g. image.url)
      else if (field.includes('.')) {
        const [parent, child] = field.split('.');
        const lastKey = child;
        
        if (['alt', 'title'].includes(lastKey)) {
             if (!updated[parent]) updated[parent] = {};
             updated[parent][lastKey] = {
                 ...(updated[parent][lastKey] || { en: '', de: '', it: '', es: '' }),
                 [targetLang]: value,
             };
        } else {
            updated[parent] = {
              ...(updated[parent] || {}),
              [child]: value,
            };
        }
      } else {
        updated[field] = value;
      }

      return updated as BlogCategoryFormData;
    });
  };


  // Handle keywords
  const handleKeywordsChange = (lang: AdminLanguage, value: string[]) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...(prev.seo || { 
          metaTitle: { en: '', de: '', it: '', es: '' }, 
          metaDescription: { en: '', de: '', it: '', es: '' }, 
          metaKeywords: { en: [], de: [], it: [], es: [] } 
        }),
        metaKeywords: {
          ...(prev.seo?.metaKeywords || { en: [], de: [], it: [], es: [] }),
          [lang]: value,
        },
      },
    } as BlogCategoryFormData));
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
      
      // Convert image object to string URL for backend if needed
      // The backend expects `image: string` for BlogCategory
      const payload: any = {
        name: cleanData.name,
        slug: cleanData.slug,
        description: cleanData.description,
        isActive: cleanData.isActive,
        // Backend BlogCategory model has flat SEO fields
        metaTitle: cleanData.seo?.metaTitle,
        metaDescription: cleanData.seo?.metaDescription,
        metaKeywords: cleanData.seo?.metaKeywords, // Now ILocalizedMixed
        metaImage: cleanData.seo?.metaImage?.url ? cleanData.seo.metaImage : undefined,
      };

      if (cleanData.image?.url) {
        payload.image = cleanData.image.url;
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
    <div className="w-full mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/blogs/category">
              <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
              </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditMode ? 'Edit Category' : 'Create New Category'}
            </h1>
            <p className="text-gray-500 mt-1">
              {isEditMode ? 'Update category information' : 'Add a new blog category to organize your posts'}
            </p>
          </div>
        </div>
        <AdminLanguageTabs activeLanguage={activeLanguage} onLanguageChange={setActiveLanguage} />
      </div>

      {/* Draft Banner */}
      {hasDraft && !isEditMode && (
        <DraftBanner onDiscard={() => { clearDraft(); setFormData(INITIAL_BLOG_CATEGORY); }} />
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
              <div className="space-y-2">
                <LocalizedField
                  label="Category Name"
                  value={formData.name}
                  onChange={(lang, val) => handleChange('name', val)}
                  globalLanguage={activeLanguage}
                >
                  {(lang, value, onChange) => (
                    <Input
                      id="name"
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      placeholder={`e.g., Travel Guides in ${lang.toUpperCase()}`}
                      required={lang === 'en'}
                    />
                  )}
                </LocalizedField>
              </div>
              <div className="space-y-2">
                <LocalizedField
                  label="URL Slug"
                  value={formData.slug}
                  onChange={(lang, val) => handleChange('slug', val)}
                  globalLanguage={activeLanguage}
                >
                  {(lang, value, onChange) => (
                    <Input
                      id="slug"
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      placeholder={`e.g., travel-guides-in-${lang}`}
                      required={lang === 'en'}
                    />
                  )}
                </LocalizedField>
              </div>
            </div>
            
            <div className="space-y-2">
              <LocalizedField
                label="Description"
                value={formData.description}
                onChange={(lang, val) => handleChange('description', val)}
                globalLanguage={activeLanguage}
              >
                {(lang, value, onChange) => (
                  <RichTextEditor
                    key={`editor-${lang}`}
                    value={value}
                    onChange={onChange}
                    placeholder={`Describe this category in ${lang.toUpperCase()}...`}
                    className="bg-white dark:bg-slate-900"
                  />
                )}
              </LocalizedField>
            </div>

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
              images={formData.image?.url ? [{
                url: formData.image.url || '',
                title: formData.image.title || '',
                alt: formData.image.alt || '',
                fileName: formData.image.fileName || '',
              }] : []}
              onAdd={() => {
                if (!formData.image?.url) handleChange('image', { url: '', title: '', alt: '', fileName: '' });
              }}
              onRemove={() => {
                handleChange('image', { url: '', title: '', alt: '', fileName: '' });
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

        {/* SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <LocalizedField
                  label="Meta Title"
                  value={formData.seo?.metaTitle}
                  onChange={(lang, val) => handleChange('seo.metaTitle', val)}
                  globalLanguage={activeLanguage}
                >
                  {(lang, value, onChange) => (
                    <>
                      <Input
                        id="metaTitle"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Travel Guides - JES Egypt Tours"
                        maxLength={70}
                      />
                      <p className="text-xs text-gray-500">
                        {value.length}/70 characters
                      </p>
                    </>
                  )}
                </LocalizedField>
              </div>
              <div className="space-y-2">
                <LocalizedField
                  label="Keywords"
                  value={formData.seo?.metaKeywords}
                  globalLanguage={activeLanguage}
                  onChange={(lang, val) => handleKeywordsChange(lang, val)}
                >
                  {(lang, currentValue, handleLang) => (
                    <TagInput
                      tags={currentValue || []}
                      onChange={handleLang}
                      placeholder={`Keywords in ${lang}`}
                    />
                  )}
                </LocalizedField>
              </div>
            </div>
            
            <div className="space-y-2">
              <LocalizedField
                label="Meta Description"
                value={formData.seo?.metaDescription}
                onChange={(lang, val) => handleChange('seo.metaDescription', val)}
                globalLanguage={activeLanguage}
              >
                {(lang, value, onChange) => (
                  <>
                    <RichTextEditor
                      key={`seo-editor-${lang}`}
                      value={value}
                      onChange={onChange}
                      placeholder="Explore our comprehensive travel guides..."
                      className="bg-white dark:bg-slate-900"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Keep it concise for SEO (recommended: 150-160 characters)</p>
                  </>
                )}
              </LocalizedField>
            </div>

            <Separator />
            
            <div className="space-y-4">
              <ImageUpload
                images={formData.seo?.metaImage?.url ? [{
                  url: formData.seo.metaImage.url || '',
                  title: formData.seo.metaImage.title || '',
                  alt: formData.seo.metaImage.alt || '',
                  fileName: formData.seo.metaImage.fileName || '',
                }] : []}
                onAdd={() => {
                  if (!formData.seo?.metaImage?.url) handleChange('seo.metaImage', { url: '', title: '', alt: '', fileName: '' });
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

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Link href="/admin/blogs/category">
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
