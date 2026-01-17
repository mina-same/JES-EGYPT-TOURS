'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { blogAPI, BlogFormData, ContentBlock } from '@/lib/api/blogAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, Save, Loader2, Plus, X, 
  LayoutDashboard, Image as ImageIcon, FileText, 
  Settings, Eye, Calendar, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ImageUpload, { ImageData } from '@/components/admin/ImageUpload';

// Tab definitions
const TABS = [
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'media', label: 'Media & SEO', icon: ImageIcon },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    slug: '',
    author: '',
    featuredImage: {
      url: '',
      fileName: '',
      title: '',
      alt: '',
    },
    excerpt: '',
    contentBlocks: [],
          tags: [],
          status: 'draft',
          isFeatured: false,
          commentsEnabled: true,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: [],
    metaImage: {
      url: '',
      fileName: '',
      title: '',
      alt: '',
    },
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    ogType: 'article',
    noIndex: false,
    noFollow: false,
    focusKeyword: '',
    breadcrumbs: [],
    relatedPosts: [],
  });

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
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
        const keys = field.split('.');
        let current = updated;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
      } else {
        updated[field] = value;
      }

      // Auto-generate slug when title changes
      if (field === 'title') {
        updated.slug = generateSlug(value);
        
        // Auto-populate SEO fields if empty
        if (!updated.metaTitle) {
          updated.metaTitle = value;
        }
        if (!updated.ogTitle) {
          updated.ogTitle = value;
        }
      }

      return updated as BlogFormData;
    });
  };

  // Handle tags
  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags,
    }));
  };

  // Handle keywords
  const handleKeywordsChange = (value: string) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    setFormData(prev => ({
      ...prev,
      metaKeywords: keywords,
    }));
  };

  // Handle content blocks
  const addContentBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      type,
      content: type === 'html' ? '' : undefined,
      images: type === 'imageRow' ? [] : undefined,
      image: type === 'image' ? '' : undefined,
      url: type === 'video' ? '' : undefined,
      alt: type === 'image' ? '' : undefined,
      caption: type === 'image' || type === 'video' ? '' : undefined,
    };

    setFormData(prev => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, newBlock],
    }));
  };

  const removeContentBlock = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter((_, i) => i !== index),
    }));
  };

  const updateContentBlock = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map((block, i) => 
        i === index ? { ...block, [field]: value } : block
      ),
    }));
  };

  // Fetch blog data
  const fetchBlog = async () => {
    try {
      setInitialLoading(true);
      setError(null);

      const response = await blogAPI.getById(blogId);
      
      if (response.success && response.data) {
        const blog = response.data;
        
        // Helper to normalize featuredImage (backward compatibility)
        const normalizeFeaturedImage = (img: any): any => {
          if (!img) {
            return { url: '', fileName: '', title: '', alt: '' };
          }
          // If it's already an object with url, use it
          if (typeof img === 'object' && img.url) {
            return {
              url: img.url || '',
              fileName: img.fileName || '',
              title: img.title || '',
              alt: img.alt || '',
            };
          }
          // If it's a string (old format), convert to new format
          if (typeof img === 'string') {
            const urlParts = img.split('/');
            return {
              url: img,
              fileName: urlParts[urlParts.length - 1] || 'image.jpg',
              title: '',
              alt: blog.featuredImageAlt || '',
            };
          }
          return { url: '', fileName: '', title: '', alt: '' };
        };
        
        // Helper to normalize metaImage
        const normalizeMetaImage = (img: any): any => {
          if (!img) {
            return undefined;
          }
          if (typeof img === 'object' && img.url) {
            return {
              url: img.url || '',
              fileName: img.fileName || '',
              title: img.title || '',
              alt: img.alt || '',
            };
          }
          return undefined;
        };
        
        // Transform the data to match form structure
        setFormData({
          title: blog.title || '',
          slug: blog.slug || '',
          author: blog.author?._id || blog.author || '',
          featuredImage: normalizeFeaturedImage(blog.featuredImage),
          excerpt: blog.excerpt || '',
          contentBlocks: blog.contentBlocks || [],
          tags: blog.tags || [],
          status: blog.status || 'draft',
          isFeatured: blog.isFeatured || false,
          publishedAt: blog.publishedAt ? new Date(blog.publishedAt) : undefined,
          scheduledAt: blog.scheduledAt ? new Date(blog.scheduledAt) : undefined,
          commentsEnabled: blog.commentsEnabled !== undefined ? blog.commentsEnabled : true,
          metaTitle: blog.metaTitle || '',
          metaDescription: blog.metaDescription || '',
          metaKeywords: blog.metaKeywords || [],
          metaImage: normalizeMetaImage(blog.metaImage),
          ogTitle: blog.ogTitle || '',
          ogDescription: blog.ogDescription || '',
          ogImage: blog.ogImage || '',
          ogType: blog.ogType || 'article',
          noIndex: blog.noIndex || false,
          noFollow: blog.noFollow || false,
          focusKeyword: blog.focusKeyword || '',
          breadcrumbs: blog.breadcrumbs || [],
          relatedPosts: blog.relatedPosts?.map((post: any) => post._id || post) || [],
        });
      } else {
        setError(response.error || 'Failed to fetch blog post');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setInitialLoading(false);
    }
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
      
      // Remove empty content blocks
      cleanData.contentBlocks = cleanData.contentBlocks.filter(block => {
        if (block.type === 'html') return block.content?.trim();
        if (block.type === 'image') return block.image?.trim();
        if (block.type === 'video') return block.url?.trim();
        if (block.type === 'imageRow') return block.images && block.images.length > 0;
        return true;
      });

      // Remove empty arrays
      if (!cleanData.tags?.length) cleanData.tags = [];
      if (!cleanData.metaKeywords?.length) cleanData.metaKeywords = [];
      if (!cleanData.breadcrumbs?.length) cleanData.breadcrumbs = [];
      if (!cleanData.relatedPosts?.length) cleanData.relatedPosts = [];

      // Remove empty optional fields
      if (!cleanData.excerpt?.trim()) delete cleanData.excerpt;
      // Ensure featuredImage has required fields
      if (cleanData.featuredImage && !cleanData.featuredImage.url) {
        cleanData.featuredImage = {
          url: '',
          fileName: '',
          title: '',
          alt: '',
        };
      } else if (cleanData.featuredImage && cleanData.featuredImage.url) {
        // Ensure fileName is set
        if (!cleanData.featuredImage.fileName) {
          const urlParts = cleanData.featuredImage.url.split('/');
          cleanData.featuredImage.fileName = urlParts[urlParts.length - 1] || 'image.jpg';
        }
      }
      if (!cleanData.metaTitle?.trim()) delete cleanData.metaTitle;
      if (!cleanData.metaDescription?.trim()) delete cleanData.metaDescription;
      if (!cleanData.ogTitle?.trim()) delete cleanData.ogTitle;
      if (!cleanData.ogDescription?.trim()) delete cleanData.ogDescription;
      if (!cleanData.ogImage?.trim()) delete cleanData.ogImage;
      if (!cleanData.focusKeyword?.trim()) delete cleanData.focusKeyword;

      // Remove empty metaImage if no URL
      if (!cleanData.metaImage?.url?.trim()) {
        delete cleanData.metaImage;
      }

      const response = await blogAPI.update(blogId, cleanData);
      
      if (response.success) {
        router.push('/admin/blogs');
      } else {
        setError(response.error || 'Failed to update blog post');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlog();
    // Load blog data
  }, [blogId]);

  if (initialLoading) {
    return (
      <div className="max-full space-y-6 pb-24 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading blog post...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-full space-y-6 pb-24 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Blog Post</h1>
            <p className="text-gray-500 mt-1">Update blog article content and settings</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap",
                isActive 
                  ? "bg-blue-700 text-white" 
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* CONTENT TAB */}
            {activeTab === 'content' && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Essential details about the blog post</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleChange('title', e.target.value)}
                          placeholder="e.g., Amazing Travel Tips for Egypt"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slug">URL Slug *</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => handleChange('slug', e.target.value)}
                          placeholder="amazing-travel-tips-for-egypt"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        value={formData.excerpt || ''}
                        onChange={(e) => handleChange('excerpt', e.target.value)}
                        placeholder="Brief description of the blog post..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags *</Label>
                      <Input
                        id="tags"
                        value={formData.tags.join(', ')}
                        onChange={(e) => handleTagsChange(e.target.value)}
                        placeholder="travel, egypt, tips (comma-separated)"
                      />
                      <p className="text-sm text-muted-foreground">Separate tags with commas. Tags are used for filtering and searching.</p>
                    </div>

                    <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label htmlFor="isFeatured" className="text-base">Featured Blog</Label>
                        <p className="text-sm text-muted-foreground">
                          Featured blogs will appear on the homepage. Non-featured blogs appear in the blog listing page.
                        </p>
                      </div>
                      <Switch
                        id="isFeatured"
                        checked={formData.isFeatured}
                        onCheckedChange={(checked) => handleChange('isFeatured', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Content Blocks</CardTitle>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => addContentBlock('html')}>
                          <Plus className="w-4 h-4 mr-2" />
                          Text
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => addContentBlock('image')}>
                          <Plus className="w-4 h-4 mr-2" />
                          Image
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => addContentBlock('video')}>
                          <Plus className="w-4 h-4 mr-2" />
                          Video
                        </Button>
                      </div>
                    </div>
                    <CardDescription>Build your blog content with different types of blocks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.contentBlocks.map((block, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium capitalize">{block.type} Block</h4>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeContentBlock(index)}
                            className="h-8 w-8"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {block.type === 'html' && (
                          <div className="space-y-2">
                            <Label>Content</Label>
                            <RichTextEditor
                              value={block.content || ''}
                              onChange={(value) => updateContentBlock(index, 'content', value)}
                              placeholder="Write your content here..."
                              className="min-h-[200px]"
                            />
                          </div>
                        )}

                        {block.type === 'image' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Image URL</Label>
                              <div className="flex gap-2">
                                <Input
                                  value={block.image || ''}
                                  onChange={(e) => updateContentBlock(index, 'image', e.target.value)}
                                  placeholder="https://example.com/image.jpg"
                                />
                                <Input
                                  type="file"
                                  className="w-[100px] text-xs"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const result = await handleImageUpload(file);
                                      if (result) {
                                        updateContentBlock(index, 'image', result.url);
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Alt Text</Label>
                                <Input
                                  value={block.alt || ''}
                                  onChange={(e) => updateContentBlock(index, 'alt', e.target.value)}
                                  placeholder="Image description"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Caption</Label>
                                <Input
                                  value={block.caption || ''}
                                  onChange={(e) => updateContentBlock(index, 'caption', e.target.value)}
                                  placeholder="Image caption"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {block.type === 'video' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Video URL</Label>
                              <Input
                                value={block.url || ''}
                                onChange={(e) => updateContentBlock(index, 'url', e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Caption</Label>
                              <Input
                                value={block.caption || ''}
                                onChange={(e) => updateContentBlock(index, 'caption', e.target.value)}
                                placeholder="Video caption"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* MEDIA & SEO TAB */}
            {activeTab === 'media' && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Featured Image</CardTitle>
                    <CardDescription>Main image for the blog post</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ImageUpload
                      images={formData.featuredImage ? [formData.featuredImage] : []}
                      onAdd={() => {
                        if (!formData.featuredImage) {
                          handleChange('featuredImage', {
                            url: '',
                            fileName: '',
                            title: '',
                            alt: '',
                          });
                        }
                      }}
                      onRemove={(index) => {
                        handleChange('featuredImage', {
                          url: '',
                          fileName: '',
                          title: '',
                          alt: '',
                        });
                      }}
                      onUpdate={(index, field, value) => {
                        handleChange('featuredImage', {
                          ...(formData.featuredImage || { url: '', fileName: '', title: '', alt: '' }),
                          [field]: value,
                        });
                      }}
                      onUpload={async (file, index) => {
                        return await handleImageUpload(file);
                      }}
                      title="Featured Image"
                      description="Main image for the blog post"
                      required={true}
                      maxImages={1}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>SEO Settings</CardTitle>
                    <CardDescription>Search engine optimization settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input
                          id="metaTitle"
                          value={formData.metaTitle || ''}
                          onChange={(e) => handleChange('metaTitle', e.target.value)}
                          placeholder="SEO title (60 characters max)"
                          maxLength={60}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="focusKeyword">Focus Keyword</Label>
                        <Input
                          id="focusKeyword"
                          value={formData.focusKeyword || ''}
                          onChange={(e) => handleChange('focusKeyword', e.target.value)}
                          placeholder="Main keyword for SEO"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Textarea
                        id="metaDescription"
                        value={formData.metaDescription || ''}
                        onChange={(e) => handleChange('metaDescription', e.target.value)}
                        placeholder="SEO description (160 characters max)"
                        maxLength={160}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metaKeywords">Meta Keywords</Label>
                      <Input
                        id="metaKeywords"
                        value={formData.metaKeywords?.join(', ') || ''}
                        onChange={(e) => handleKeywordsChange(e.target.value)}
                        placeholder="keyword1, keyword2, keyword3"
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="noIndex"
                          checked={formData.noIndex}
                          onCheckedChange={(checked) => handleChange('noIndex', checked)}
                        />
                        <Label htmlFor="noIndex">No Index</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="noFollow"
                          checked={formData.noFollow}
                          onCheckedChange={(checked) => handleChange('noFollow', checked)}
                        />
                        <Label htmlFor="noFollow">No Follow</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Publishing Settings</CardTitle>
                    <CardDescription>Control how and when this post is published</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value: any) => handleChange('status', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.status === 'scheduled' && (
                      <div className="space-y-2">
                        <Label htmlFor="scheduledAt">Scheduled Date</Label>
                        <Input
                          id="scheduledAt"
                          type="datetime-local"
                          value={formData.scheduledAt ? new Date(formData.scheduledAt).toISOString().slice(0, 16) : ''}
                          onChange={(e) => handleChange('scheduledAt', e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="commentsEnabled"
                        checked={formData.commentsEnabled}
                        onCheckedChange={(checked) => handleChange('commentsEnabled', checked)}
                      />
                      <Label htmlFor="commentsEnabled">Enable Comments</Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Link href="/admin/blogs">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Post
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
