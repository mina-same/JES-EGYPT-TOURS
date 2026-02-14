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
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUpload from '@/components/admin/ImageUpload';
import { useToast } from '@/hooks/use-toast';

// Define form data type locally or reuse from types if available
interface BlogCategoryFormData {
  name: string;
  slug: string;
  description: string;
  image?: {
    url: string;
    fileName: string;
    title: string;
    alt: string;
  };
  seo?: {
    metaTitle: string;
    metaDescription: string;
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

export default function NewBlogCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const categoryId = searchParams.get('id');
  const isEditMode = !!categoryId;
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<BlogCategoryFormData>({
    name: '',
    slug: '',
    description: '',
    image: {
      url: '',
      fileName: '',
      title: '',
      alt: '',
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
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
      const response: any = await blogCategoryAPI.getById(id);
      
      if (response.success && response.data) {
        const data = response.data;
        
        // Handle image which might be a string (URL) in backend response but form expects object structure for ImageUpload
        // Ideally backend returns string for BlogCategory.image
        // We need to adapt it. If it's a string, we put it in url.
        const imageObj = typeof data.image === 'string' 
          ? { url: data.image, fileName: '', title: '', alt: '' }
          : (data.image || { url: '', fileName: '', title: '', alt: '' });

        setFormData({
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          image: imageObj,
          seo: {
            metaTitle: data.metaTitle || '',
            metaDescription: data.metaDescription || '',
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
    } catch (err: any) {
      setError(err.message || 'Failed to fetch category data');
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
      
      // Handle nested fields
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        updated[parent] = {
          ...(updated[parent] || {}),
          [child]: value,
        };
      } else {
        updated[field] = value;
      }

      // Auto-generate slug when name changes
      if (field === 'name') {
        updated.slug = generateSlug(value);
      }

      return updated as BlogCategoryFormData;
    });
  };

  // Handle keywords
  const handleKeywordsChange = (value: string) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    setFormData(prev => ({
      ...prev,
      seo: {
        ...(prev.seo || { metaTitle: '', metaDescription: '', metaKeywords: [] }),
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
    
    try {
      setLoading(true);
      setError(null);

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
        metaKeywords: cleanData.seo?.metaKeywords,
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
            variant: 'success',
        });
        router.push('/admin/blogs/category');
      } else {
        const msg = response.error || `Failed to ${isEditMode ? 'update' : 'create'} category`;
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
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Travel Guides"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="travel-guides"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value: string) => handleChange('description', value)}
                placeholder="Describe this category..."
                className="bg-white dark:bg-slate-900"
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
              description="Upload an image for this category"
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
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.seo?.metaTitle || ''}
                  onChange={(e) => handleChange('seo.metaTitle', e.target.value)}
                  placeholder="Travel Guides - JES Egypt Tours"
                  maxLength={70}
                />
                <p className="text-xs text-gray-500">
                  {(formData.seo?.metaTitle || '').length}/70 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Keywords (comma-separated)</Label>
                <Input
                  id="metaKeywords"
                  value={formData.seo?.metaKeywords?.join(', ') || ''}
                  onChange={(e) => handleKeywordsChange(e.target.value)}
                  placeholder="guides, travel, tips"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <RichTextEditor
                value={formData.seo?.metaDescription || ''}
                onChange={(value: string) => handleChange('seo.metaDescription', value)}
                placeholder="Explore our comprehensive travel guides..."
                className="bg-white dark:bg-slate-900"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Keep it concise for SEO (recommended: 150-160 characters)</p>
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
                    const currentSeo = prev.seo || { metaTitle: '', metaDescription: '', metaKeywords: [] as string[] };
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
