'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { blogCategoryAPI, blogSubcategoryAPI } from '@/lib/api/blogAdmin';
import { BlogCategory } from '@/lib/api/blog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, X } from 'lucide-react';
import LocalizedInput from '@/components/admin/LocalizedInput';
import LocalizedTextArea from '@/components/admin/LocalizedTextArea';
import LocalizedTagsInput from '@/components/admin/LocalizedTagsInput';
import LocalizedRichText from '@/components/admin/LocalizedRichText';
import AdminLanguageTabs, { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import ImageUpload from '@/components/admin/ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { uploadAPI } from '@/lib/api/upload';
import FormErrorPanel from '@/components/admin/FormErrorPanel';
import DraftBanner from '@/components/admin/DraftBanner';
import { ILocalizedString, ILocalizedMixed } from '@/types/blog';
import { FormSkeleton } from '@/components/admin/skeletons/FormSkeleton';
import { getLocalizedValue } from '@/lib/localize';
import { useFormDraft } from '@/hooks/useFormDraft';
import { parseApiError, type FormErrorItem } from '@/lib/parseApiError';

interface BlogSubCategoryFormData {
  name: ILocalizedString;
  slug: ILocalizedString;
  category: string; // ID of parent category
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

const INITIAL_BLOG_SUBCAT: BlogSubCategoryFormData = {
  name: { en: '', de: '', it: '', es: '' },
  slug: { en: '', de: '', it: '', es: '' },
  category: '',
  description: { en: '', de: '', it: '', es: '' },
  image: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
  seo: {
    metaTitle: { en: '', de: '', it: '', es: '' },
    metaDescription: { en: '', de: '', it: '', es: '' },
    metaKeywords: { en: [], de: [], it: [], es: [] },
    metaImage: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
  },
  isActive: true,
};

export default function NewBlogSubCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const subcategoryId = searchParams.get('id');
  const isEditMode = !!subcategoryId;

  const draftKey = isEditMode ? `draft_blog_subcat_edit_${subcategoryId}` : 'draft_blog_subcat_new';

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<FormErrorItem[]>([]);
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');

  const { formData, setFormData, clearDraft, hasDraft } = useFormDraft<BlogSubCategoryFormData>(
    draftKey,
    INITIAL_BLOG_SUBCAT
  );

  // Fetch categories and subcategory data (if editing)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true); // Reusing loading for the initial fetch too
      try {
        const promises: Promise<any>[] = [blogCategoryAPI.getAll({ limit: 100 })];
        if (isEditMode && subcategoryId) {
          promises.push(blogSubcategoryAPI.getById(subcategoryId));
        }

        const [categoriesRes, subcatRes] = await Promise.all(promises);

        if (categoriesRes.success && categoriesRes.data) {
          setCategories(categoriesRes.data);
        }

        if (subcatRes && subcatRes.success && subcatRes.data) {
          const data = subcatRes.data;
          
          const categoryId = typeof data.category === 'object' && data.category ? data.category._id : (data.category || '');

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
            category: categoryId,
            description: mapToLocalized(data.description),
            image: imageObj,
            seo: {
              metaTitle: mapToLocalized(data.metaTitle),
              metaDescription: mapToLocalized(data.metaDescription),
              metaKeywords: data.seo?.metaKeywords || { en: [], de: [], it: [], es: [] },
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

      } catch (error) {
        console.error("Failed to load page data", error);
        toast({
          title: "Error",
          description: "Failed to load Required data.",
          variant: "destructive"
        });
      } finally {
        setFetchingCategories(false);
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
    const targetLang = lang || activeLanguage;
    setFormData(prev => {
      const updated = { ...prev } as any;
      
      // Handle localized fields
      if (['name', 'description', 'slug'].includes(field)) {
        updated[field] = {
          ...(updated[field] || { en: '', de: '', it: '', es: '' }),
          [targetLang]: value,
        };
        
        // Auto-generate slug when name changes for the active language
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
      // Handle nested fields
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

      return updated as BlogSubCategoryFormData;
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
    } as BlogSubCategoryFormData));
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
      if (!formData.category) {
        validationErrors.push({ field: 'Parent Category', message: 'A parent category must be selected', path: 'category' });
      }
      if (!formData.name?.en?.trim()) {
        validationErrors.push({ field: 'Subcategory Name', message: 'English name is required', lang: 'en', path: 'name-en' });
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
      
      const payload: any = {
        name: cleanData.name,
        slug: cleanData.slug,
        category: cleanData.category,
        description: cleanData.description,
        isActive: cleanData.isActive,
        metaTitle: cleanData.seo?.metaTitle,
        metaDescription: cleanData.seo?.metaDescription,
        metaKeywords: cleanData.seo?.metaKeywords,
        metaImage: cleanData.seo?.metaImage?.url ? cleanData.seo.metaImage : undefined,
      };

      if (cleanData.image?.url) {
        payload.image = cleanData.image.url;
      }

      let response: any;
      if (isEditMode && subcategoryId) {
        response = await blogSubcategoryAPI.update(subcategoryId, payload);
      } else {
        response = await blogSubcategoryAPI.create(payload);
      }
      
      if (response.success) {
        toast({
            title: isEditMode ? 'Subcategory Updated' : 'Subcategory Created',
            description: `Blog subcategory ${isEditMode ? 'updated' : 'created'} successfully.`,
        });
        clearDraft();
        router.push('/admin/blogs/subcategory');
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

  if (fetchingData || fetchingCategories) {
    return <FormSkeleton />;
  }

  return (
    <div className="w-full mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/blogs/subcategory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditMode ? 'Edit Subcategory' : 'Create New Subcategory'}
            </h1>
            <p className="text-gray-500 mt-1">
              {isEditMode ? 'Update subcategory information' : 'Add a new blog subcategory'}
            </p>
          </div>
        </div>
        <AdminLanguageTabs activeLanguage={activeLanguage} onLanguageChange={setActiveLanguage} />
      </div>

      {/* Draft Banner */}
      {hasDraft && !isEditMode && (
        <DraftBanner onDiscard={() => { clearDraft(); setFormData(INITIAL_BLOG_SUBCAT); }} />
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
                <Label htmlFor="category">Parent Category *</Label>
                <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleChange('category', value)}
                    required
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category._id} value={category._id}>
                                {getLocalizedValue(category.name, 'en')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <LocalizedInput
                label="Subcategory Name *"
                value={formData.name}
                onChange={(val) => handleChange('name', val)}
                placeholder="Food & Drink"
              />
              <LocalizedInput
                label="URL Slug *"
                value={formData.slug}
                onChange={(val) => handleChange('slug', val)}
                placeholder="food-and-drink"
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
              description="Upload an image for this subcategory"
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
                <LocalizedInput
                  label="Meta Title"
                  value={formData.seo?.metaTitle || { en: '', de: '', it: '', es: '' }}
                  onChange={(val) => handleChange('seo.metaTitle', val)}
                  placeholder="SEO Title"
                />
              </div>
              <div className="space-y-2">
                <LocalizedTagsInput
                  label="Keywords"
                  value={formData.seo?.metaKeywords || { en: [], de: [], it: [], es: [] }}
                  onChange={(val) => handleKeywordsChange(activeLanguage, val)}
                  placeholder="Add keyword..."
                />
              </div>
            </div>
            
            <div className="space-y-2">
            <LocalizedRichText
              label="Meta Description"
              value={formData.seo?.metaDescription || { en: '', de: '', it: '', es: '' }}
              onChange={(val) => handleChange('seo.metaDescription', val)}
              placeholder="SEO Description..."
            />
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
          <Link href="/admin/blogs/subcategory">
            <Button type="button" variant="outline" className="!text-black">
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
                {isEditMode ? 'Update Subcategory' : 'Create Subcategory'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
