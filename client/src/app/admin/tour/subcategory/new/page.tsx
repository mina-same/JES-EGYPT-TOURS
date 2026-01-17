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
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUpload from '@/components/admin/ImageUpload';

export default function NewSubcategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subcategoryId = searchParams.get('id');
  const isEditMode = !!subcategoryId;
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ITourCategory[]>([]);
  
  const [formData, setFormData] = useState<TourSubcategoryFormData>({
    category: '',
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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await tourCategoryAPI.getAll({ limit: 100, isActive: true });
      
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setError('Failed to load categories');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    if (isEditMode && subcategoryId) {
      fetchSubcategoryData(subcategoryId);
    }
  }, [subcategoryId, isEditMode]);

  const fetchSubcategoryData = async (id: string) => {
    try {
      setFetchingData(true);
      setError(null);
      const response = await tourSubcategoryAPI.getById(id);
      console.log('Fetched subcategory data:', response);
      if (response.success && response.data) {
        const data = { ...response.data };
        // If category is populated (object), extract the ID
        if (data.category && typeof data.category === 'object' && (data.category as any)._id) {
          data.category = (data.category as any)._id;
        }
        setFormData(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch subcategory data');
      console.error('Error fetching subcategory:', err);
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
      const updated = { ...prev };
      
      // Handle nested fields
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        const parentKey = parent as keyof TourSubcategoryFormData;
        const currentValue = updated[parentKey];
        
        // Type-safe nested object update
        if (typeof currentValue === 'object' && currentValue !== null) {
          (updated as any)[parentKey] = {
            ...currentValue,
            [child]: value,
          };
        }
      } else {
        (updated as any)[field] = value;
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

      return updated;
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
    
    if (!formData.category) {
      setError('Please select a category');
      return;
    }
    
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
      if (isEditMode && subcategoryId) {
        response = await tourSubcategoryAPI.update(subcategoryId, cleanData);
      } else {
        response = await tourSubcategoryAPI.create(cleanData);
      }
      
      if (response.success) {
        router.push('/admin/tour/subcategory');
      } else {
        setError(response.error || `Failed to ${isEditMode ? 'update' : 'create'} subcategory`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get selected category name
  const getSelectedCategoryName = () => {
    const category = categories.find(c => c._id === formData.category);
    return category?.name || '';
  };

  if (fetchingData || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{fetchingData ? 'Loading subcategory data...' : 'Loading categories...'}</p>
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
            {isEditMode ? 'Edit Subcategory' : 'Create New Subcategory'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditMode ? 'Update subcategory information' : 'Add a new tour subcategory to organize your tours'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {(
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  required
                >
                  <option value="">Select a category...</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {formData.category && (
                  <p className="text-sm text-gray-500">
                    Selected: {getSelectedCategoryName()}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Subcategory Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Desert Safari"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="desert-safari"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <RichTextEditor
                  value={formData.description}
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
                title="Subcategory Image"
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
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={formData.seo?.metaTitle || ''}
                    onChange={(e) => handleChange('seo.metaTitle', e.target.value)}
                    placeholder="Desert Safari Tours - Premium Experiences"
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
                    placeholder="desert safari, dune bashing, camel ride"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <RichTextEditor
                  value={formData.seo?.metaDescription || ''}
                  onChange={(value: string) => handleChange('seo.metaDescription', value)}
                  placeholder="Book exciting desert safari experiences..."
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
            <Link href="/admin/tour/subcategory">
              <Button type="button" variant="outline">
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
                  {isEditMode ? 'Update Subcategory' : 'Create Subcategory'}
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
