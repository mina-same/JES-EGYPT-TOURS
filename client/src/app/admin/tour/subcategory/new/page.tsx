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
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUpload from '@/components/admin/ImageUpload';
import { uploadAPI } from '@/lib/api/upload';
import { FormSkeleton } from '@/components/admin/skeletons/FormSkeleton';

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
    sectionHeader: {
      isEnabled: true,
      title: '',
      description: '',
      button: {
        label: '',
        href: '',
        newTab: false,
      },
    },
    isActive: true,
  });

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
          setError('Failed to load categories');
        }

        if (subcatRes && subcatRes.success && subcatRes.data) {
          const data = subcatRes.data as any;
          const sectionHeaderImages = Array.isArray(data.sectionHeader?.images) && data.sectionHeader.images.length
            ? data.sectionHeader.images
            : (data.sectionHeader?.image?.url ? [data.sectionHeader.image] : []);
          const categoryValue =
            data.category && typeof data.category === 'object' && data.category._id
              ? data.category._id
              : data.category || '';

          setFormData({
            category: categoryValue,
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            image: data.image
              ? {
                  url: data.image.url || '',
                  fileName: data.image.fileName || '',
                  title: data.image.title || '',
                  alt: data.image.alt || '',
                }
              : {
                  url: '',
                  fileName: '',
                  title: '',
                  alt: '',
                },
            seo: data.seo
              ? {
                  metaTitle: data.seo.metaTitle || '',
                  metaDescription: data.seo.metaDescription || '',
                  metaKeywords: Array.isArray(data.seo.metaKeywords) ? data.seo.metaKeywords : [],
                  metaImage: data.seo.metaImage
                    ? {
                        url: data.seo.metaImage.url || '',
                        fileName: data.seo.metaImage.fileName || '',
                        title: data.seo.metaImage.title || '',
                        alt: data.seo.metaImage.alt || '',
                      }
                    : {
                        url: '',
                        fileName: '',
                        title: '',
                        alt: '',
                      },
                }
              : {
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
            sectionHeader: data.sectionHeader
              ? {
                  isEnabled: data.sectionHeader.isEnabled !== undefined ? !!data.sectionHeader.isEnabled : true,
                  images: sectionHeaderImages,
                  title: data.sectionHeader.title || '',
                  description: data.sectionHeader.description || '',
                  button: data.sectionHeader.button
                    ? {
                        label: data.sectionHeader.button.label || '',
                        href: data.sectionHeader.button.href || '',
                        newTab: data.sectionHeader.button.newTab !== undefined ? !!data.sectionHeader.button.newTab : false,
                      }
                    : {
                        label: '',
                        href: '',
                        newTab: false,
                      },
                }
              : {
                  isEnabled: true,
                  title: '',
                  description: '',
                  button: {
                    label: '',
                    href: '',
                    newTab: false,
                  },
                },
            isActive: data.isActive !== undefined ? !!data.isActive : true,
          });
        } else if (isEditMode && !subcatRes?.success) {
          setError(subcatRes?.error || 'Failed to fetch subcategory data');
        }
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load required data');
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
      
      // Handle nested fields (supports deep paths like sectionHeader.button.label)
      if (field.includes('.')) {
        const keys = field.split('.');
        let cursor: any = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i];
          cursor[k] = typeof cursor[k] === 'object' && cursor[k] !== null ? cursor[k] : {};
          cursor = cursor[k];
        }
        cursor[keys[keys.length - 1]] = value;
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

      // Remove empty section header fields
      if (cleanData.sectionHeader) {
        const sh: any = { ...cleanData.sectionHeader };

        if (Array.isArray(sh.images)) {
          sh.images = sh.images
            .filter((img: any) => !!img?.url)
            .map((img: any) => {
              const next = { ...img };
              if (!next.fileName) next.fileName = String(next.url).split('/').pop() || 'image';
              return next;
            });
          if (sh.images.length === 0) delete sh.images;
        }

        // Backward compatibility: keep sectionHeader.image as the first image
        if (!sh.image && Array.isArray(sh.images) && sh.images[0]?.url) {
          sh.image = sh.images[0];
        }

        // If image exists, ensure fileName
        if (sh.image?.url && !sh.image.fileName) {
          sh.image.fileName = sh.image.url.split('/').pop() || 'image';
        }

        if (sh.image && !sh.image.url) {
          delete sh.image;
        }

        if (sh.button && (!sh.button.label || !sh.button.href)) {
          delete sh.button;
        }

        const hasSectionHeaderData =
          sh.isEnabled === false ||
          !!sh.title ||
          !!sh.description ||
          !!sh.image?.url ||
          (Array.isArray(sh.images) && sh.images.length > 0) ||
          !!sh.button;

        if (hasSectionHeaderData) {
          cleanData.sectionHeader = sh;
        } else {
          delete cleanData.sectionHeader;
        }
      }

      // Build a clean payload (avoid sending _id/createdAt/etc from fetched data)
      const payload: TourSubcategoryFormData = {
        category: cleanData.category,
        name: cleanData.name,
        slug: cleanData.slug,
        description: cleanData.description,
        isActive: cleanData.isActive,
      };

      if (cleanData.image?.url) {
        payload.image = cleanData.image;
      }

      if (cleanData.seo) {
        const hasSeoData =
          !!cleanData.seo.metaTitle ||
          !!cleanData.seo.metaDescription ||
          (Array.isArray(cleanData.seo.metaKeywords) && cleanData.seo.metaKeywords.length > 0) ||
          !!cleanData.seo.metaImage?.url;

        if (hasSeoData) {
          const seoPayload: any = {};
          if (cleanData.seo.metaTitle?.trim()) seoPayload.metaTitle = cleanData.seo.metaTitle;
          if (cleanData.seo.metaDescription?.trim()) seoPayload.metaDescription = cleanData.seo.metaDescription;
          if (Array.isArray(cleanData.seo.metaKeywords) && cleanData.seo.metaKeywords.length > 0) {
            seoPayload.metaKeywords = cleanData.seo.metaKeywords;
          }
          if (cleanData.seo.metaImage?.url) seoPayload.metaImage = cleanData.seo.metaImage;

          payload.seo = seoPayload;
        }
      }

      if (cleanData.sectionHeader) {
        payload.sectionHeader = cleanData.sectionHeader;
      }

      let response;
      if (isEditMode && subcategoryId) {
        response = await tourSubcategoryAPI.update(subcategoryId, payload);
      } else {
        response = await tourSubcategoryAPI.create(payload);
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
    return <FormSkeleton />;
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
                  className="w-full px-3 py-2 border border-gray-100 dark:border-slate-800 rounded-md text-sm bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#b79c5c]/50"
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
              <CardTitle>Subcategory Image</CardTitle>
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
                  if (!formData.image) handleChange('image', { url: '', title: '', alt: '', fileName: '' });
                }}
                onRemove={() => {
                  handleChange('image', undefined);
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
                  className="bg-white dark:bg-slate-900"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Keep it concise for SEO (recommended: 150-160 characters)</p>
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
                    if (!formData.seo?.metaImage) handleChange('seo.metaImage', { url: '', title: '', alt: '', fileName: '' });
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

              <div className="space-y-2">
                <Label>Section Header Images</Label>
                <ImageUpload
                  images={Array.isArray(formData.sectionHeader?.images) ? formData.sectionHeader!.images!.map((img: any) => ({
                    url: img?.url || '',
                    title: img?.title || '',
                    alt: img?.alt || '',
                    fileName: img?.fileName || '',
                  })) : []}
                  onAdd={() => {
                    const next = Array.isArray(formData.sectionHeader?.images) ? [...(formData.sectionHeader!.images as any[])] : [];
                    next.push({ url: '', title: '', alt: '', fileName: '' });
                    handleChange('sectionHeader.images', next);
                  }}
                  onRemove={(index) => {
                    const next = Array.isArray(formData.sectionHeader?.images) ? [...(formData.sectionHeader!.images as any[])] : [];
                    next.splice(index, 1);
                    handleChange('sectionHeader.images', next);
                  }}
                  onUpdate={(index, field, value) => {
                    setFormData(prev => {
                      const currentSH = (prev.sectionHeader || { isEnabled: true }) as any;
                      const currentImages = Array.isArray(currentSH.images) ? [...currentSH.images] : [];
                      const currentImage = currentImages[index] || { url: '', title: '', alt: '', fileName: '' };
                      currentImages[index] = { ...currentImage, [field]: value };
                      return {
                        ...prev,
                        sectionHeader: {
                          ...currentSH,
                          images: currentImages,
                        },
                      };
                    });
                  }}
                  onUpload={async (file, index) => {
                    const result = await handleImageUpload(file);
                    if (result) {
                      setFormData(prev => {
                        const currentSH = (prev.sectionHeader || { isEnabled: true }) as any;
                        const currentImages = Array.isArray(currentSH.images) ? [...currentSH.images] : [];
                        const current = currentImages[index] || { url: '', title: '', alt: '', fileName: '' };
                        currentImages[index] = { ...current, url: result.url, fileName: result.fileName };
                        return {
                          ...prev,
                          sectionHeader: {
                            ...currentSH,
                            images: currentImages,
                          },
                        };
                      });
                    }
                    return result;
                  }}
                  title="Section Header Image"
                  description="Optional image shown in the section header"
                  maxImages={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sectionHeaderTitle">Header Title</Label>
                <Input
                  id="sectionHeaderTitle"
                  value={formData.sectionHeader?.title || ''}
                  onChange={(e) => handleChange('sectionHeader.title', e.target.value)}
                  placeholder="Section title"
                />
              </div>

              <div className="space-y-2">
                <Label>Section Description</Label>
                <RichTextEditor
                  value={formData.sectionHeader?.description || ''}
                  onChange={(value: string) => handleChange('sectionHeader.description', value)}
                  placeholder="Section description..."
                  className="bg-white dark:bg-slate-900"
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sectionHeaderBtnLabel">Button Label</Label>
                  <Input
                    id="sectionHeaderBtnLabel"
                    value={formData.sectionHeader?.button?.label || ''}
                    onChange={(e) => handleChange('sectionHeader.button.label', e.target.value)}
                    placeholder="e.g. Contact Us"
                  />
                </div>
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
