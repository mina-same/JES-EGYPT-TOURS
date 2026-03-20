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
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUpload from '@/components/admin/ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { uploadAPI } from '@/lib/api/upload';
import AdminLanguageTabs, { AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import { ILocalizedString, ILocalizedMixed } from '@/types/blog';
import { FormSkeleton } from '@/components/admin/skeletons/FormSkeleton';
import { getLocalizedValue } from '@/lib/localize';

interface BlogSubCategoryFormData {
  name: ILocalizedString;
  slug: string;
  category: string; // ID of parent category
  description: ILocalizedString;
  image?: {
    url: string;
    fileName: string;
    title: string;
    alt: string;
  };
  seo?: {
    metaTitle: ILocalizedString;
    metaDescription: ILocalizedString;
    metaKeywords: string[];
    metaImage?: {
      url: string;
      fileName: string;
      title: string;
      alt: string;
    };
  };
  isActive: boolean;
}

export default function NewBlogSubCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const subcategoryId = searchParams.get('id');
  const isEditMode = !!subcategoryId;
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');
  
  const [formData, setFormData] = useState<BlogSubCategoryFormData>({
    name: { en: '', de: '', it: '', es: '' },
    slug: '',
    category: '',
    description: { en: '', de: '', it: '', es: '' },
    image: {
      url: '',
      fileName: '',
      title: '',
      alt: '',
    },
    seo: {
      metaTitle: { en: '', de: '', it: '', es: '' },
      metaDescription: { en: '', de: '', it: '', es: '' },
      metaKeywords: [],
      metaImage: {
        url: '',
        fileName: '',
        title: '',
        alt: '',
      },
    },
    isActive: true,
  });

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
          const imageObj = typeof data.image === 'string'
            ? { url: data.image, fileName: '', title: '', alt: '' }
            : (data.image || { url: '', fileName: '', title: '', alt: '' });
          
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

          setFormData({
            name: mapToLocalized(data.name),
            slug: data.slug || '',
            category: categoryId,
            description: mapToLocalized(data.description),
            image: imageObj,
            seo: {
              metaTitle: mapToLocalized(data.metaTitle),
              metaDescription: mapToLocalized(data.metaDescription),
              metaKeywords: Array.isArray(data.metaKeywords) ? data.metaKeywords : [],
              metaImage: data.metaImage || {
                url: '',
                fileName: '',
                title: '',
                alt: '',
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
  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev } as any;
      
      // Handle localized fields
      if (['name', 'description'].includes(field)) {
        updated[field] = {
          ...(updated[field] || { en: '', de: '', it: '', es: '' }),
          [activeLanguage]: value,
        };
        
        // Auto-generate slug when English name changes
        if (field === 'name' && activeLanguage === 'en') {
          updated.slug = generateSlug(value);
        }
      } 
      // Handle SEO localized fields
      else if (field.startsWith('seo.')) {
        const seoField = field.split('.')[1];
        if (['metaTitle', 'metaDescription'].includes(seoField)) {
          updated.seo[seoField] = {
            ...(updated.seo[seoField] || { en: '', de: '', it: '', es: '' }),
            [activeLanguage]: value,
          };
        } else {
          updated.seo[seoField] = value;
        }
      }
      // Handle nested fields
      else if (field.includes('.')) {
        const [parent, child] = field.split('.');
        updated[parent] = {
          ...(updated[parent] || {}),
          [child]: value,
        };
      } else {
        updated[field] = value;
      }

      return updated as BlogSubCategoryFormData;
    });
  };

  // Handle keywords
  const handleKeywordsChange = (value: string) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    setFormData(prev => ({
      ...prev,
      seo: {
        ...(prev.seo || { 
          metaTitle: { en: '', de: '', it: '', es: '' }, 
          metaDescription: { en: '', de: '', it: '', es: '' }, 
          metaKeywords: [] 
        }),
        metaKeywords: keywords,
      },
    }));
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
        toast({
            title: "Validation Error",
            description: "Please select a parent category.",
            variant: "destructive"
        });
        return;
    }

    try {
      setLoading(true);
      setError(null);

      // Validation
      if (!formData.name.en) {
        toast({
          title: 'Validation Error',
          description: 'English name is required',
          variant: 'destructive',
        });
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
            variant: 'success',
        });
        router.push('/admin/blogs/subcategory');
      } else {
        const msg = response.error || `Failed to ${isEditMode ? 'update' : 'create'} subcategory`;
        setError(msg);
        toast({
            title: 'Error',
            description: msg,
            variant: 'destructive',
        });
      }
    } catch (err: any) {
      const msg = err.message || 'An error occurred';
      setError(msg);
      toast({
        title: 'Error',
        description: msg,
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
              <div className="space-y-2">
                <Label htmlFor="name">Subcategory Name ({activeLanguage.toUpperCase()}) *</Label>
                <Input
                  id="name"
                  value={formData.name[activeLanguage] || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder={`e.g., Food & Drink in ${activeLanguage}`}
                  required={activeLanguage === 'en'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug (Always EN) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="food-and-drink"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description ({activeLanguage.toUpperCase()})</Label>
              <RichTextEditor
                key={`editor-${activeLanguage}`}
                value={formData.description[activeLanguage] || ''}
                onChange={(value: string) => handleChange('description', value)}
                placeholder="Describe this subcategory..."
                className="bg-white"
              />
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
              onUpdate={(index, field, value) => {
                setFormData(prev => {
                  const currentImage = prev.image || { url: '', title: '', alt: '', fileName: '' };
                  return {
                    ...prev,
                    image: {
                      ...currentImage,
                      [field]: value,
                    },
                  };
                });
              }}
              onUpload={async (file) => {
                return await handleImageUpload(file);
              }}
              title="Category Image"
              description="Upload an image for this subcategory"
              maxImages={1}
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
                <Label htmlFor="metaTitle">Meta Title ({activeLanguage.toUpperCase()})</Label>
                <Input
                  id="metaTitle"
                  value={formData.seo?.metaTitle[activeLanguage] || ''}
                  onChange={(e) => handleChange('seo.metaTitle', e.target.value)}
                  placeholder="Food & Drink - JES Egypt Tours"
                  maxLength={70}
                />
                <p className="text-xs text-gray-500">
                  {(formData.seo?.metaTitle[activeLanguage] || '').length}/70 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Keywords (comma-separated)</Label>
                <Input
                  id="metaKeywords"
                  value={formData.seo?.metaKeywords?.join(', ') || ''}
                  onChange={(e) => handleKeywordsChange(e.target.value)}
                  placeholder="food, drink, culinary, local"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description ({activeLanguage.toUpperCase()})</Label>
              <RichTextEditor
                key={`seo-editor-${activeLanguage}`}
                value={formData.seo?.metaDescription[activeLanguage] || ''}
                onChange={(value: string) => handleChange('seo.metaDescription', value)}
                placeholder="Discover local culinary delights..."
                className="bg-white"
              />
              <p className="text-xs text-gray-500">Keep it concise for SEO (recommended: 150-160 characters)</p>
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
                onUpdate={(index, field, value) => {
                  setFormData(prev => {
                    const currentSeo = prev.seo || { 
                      metaTitle: { en: '', de: '', it: '', es: '' }, 
                      metaDescription: { en: '', de: '', it: '', es: '' }, 
                      metaKeywords: [] as string[] 
                    };
                    const currentImage = currentSeo.metaImage || { url: '', title: '', alt: '', fileName: '' };
                    return {
                      ...prev,
                      seo: {
                        ...currentSeo,
                        metaImage: {
                          ...currentImage,
                          [field]: value,
                        },
                      },
                    };
                  });
                }}
                onUpload={async (file) => {
                  return await handleImageUpload(file);
                }}
                title="SEO Image (Optional)"
                description="Image for social media sharing and SEO"
                maxImages={1}
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
