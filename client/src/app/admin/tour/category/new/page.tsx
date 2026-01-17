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
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUpload from '@/components/admin/ImageUpload';

export default function NewCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('id');
  const isEditMode = !!categoryId;
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<TourCategoryFormData>({
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
      const response = await tourCategoryAPI.getById(id);
      console.log('Fetched category data:', response);
      if (response.success && response.data) {
        setFormData(response.data);
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
        
        // Auto-populate SEO fields if empty
        if (!updated.seo?.metaTitle) {
          updated.seo = {
            ...updated.seo,
            metaTitle: value,
          };
        }
      }

      return updated as TourCategoryFormData;
    });
  };

  // Handle keywords
  const handleKeywordsChange = (value: string) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    setFormData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        metaKeywords: keywords,
      },
    }));
  };

  // Handle Image Upload
  const handleImageUpload = async (file: File): Promise<{ url: string, fileName: string } | null> => {
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await fetch('http://localhost:5001/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      const data = await response.json();
      if (data.success) {
        return { url: data.data.url, fileName: data.data.fileName };
      } else {
        console.error('Upload failed:', data.error);
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
      
      // Remove empty image if no URL
      if (!cleanData.image?.url) {
        delete cleanData.image;
      }
      
      // Remove empty SEO fields
      if (cleanData.seo) {
        if (!cleanData.seo.metaTitle && !cleanData.seo.metaDescription && 
            (!cleanData.seo.metaKeywords || cleanData.seo.metaKeywords.length === 0)) {
          delete cleanData.seo;
        } else {
          // Remove empty metaImage if no URL
          if (!cleanData.seo.metaImage?.url) {
            delete cleanData.seo.metaImage;
          }
        }
      }

      let response;
      if (isEditMode && categoryId) {
        response = await tourCategoryAPI.update(categoryId, cleanData);
      } else {
        response = await tourCategoryAPI.create(cleanData);
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
                  placeholder="e.g., Adventure Tours"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="adventure-tours"
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
                if (!formData.image?.url) {
                  handleChange('image', { url: '', title: '', alt: '', fileName: '' });
                }
              }}
              onRemove={() => {
                handleChange('image', { url: '', title: '', alt: '', fileName: '' });
              }}
              onUpdate={(index, field, value) => {
                const currentImage = formData.image || { url: '', title: '', alt: '', fileName: '' };
                handleChange('image', {
                  ...currentImage,
                  [field]: value,
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
                  placeholder="Adventure Tours - Exciting Experiences"
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
                  placeholder="adventure, tours, travel, outdoor"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <RichTextEditor
                value={formData.seo?.metaDescription || ''}
                onChange={(value: string) => handleChange('seo.metaDescription', value)}
                placeholder="Discover amazing adventure tours..."
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
                  if (!formData.seo?.metaImage?.url) {
                    handleChange('seo.metaImage', { url: '', title: '', alt: '', fileName: '' });
                  }
                }}
                onRemove={() => {
                  handleChange('seo.metaImage', { url: '', title: '', alt: '', fileName: '' });
                }}
                onUpdate={(index, field, value) => {
                  const currentImage = formData.seo?.metaImage || { url: '', title: '', alt: '', fileName: '' };
                  handleChange('seo.metaImage', {
                    ...currentImage,
                    [field]: value,
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
          <Link href="/admin/tour/category">
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
                {isEditMode ? 'Update Category' : 'Create Category'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
