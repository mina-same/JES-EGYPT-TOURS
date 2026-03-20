'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { blogAPI, BlogFormData, ContentBlock } from '@/lib/api/blogAdmin';
import { API_URL } from '@/config/api';
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
import LocalizedField from '@/components/admin/LocalizedField';
import ContentBlockEditor, { ContentBlock as EditorContentBlock } from '@/components/admin/ContentBlockEditor';
import TagInput from '@/components/admin/TagInput';
import { useToast } from '@/hooks/use-toast';
import { uploadAPI } from '@/lib/api/upload';
import AdminLanguageTabs, { AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import { ILocalizedString, ILocalizedMixed } from '@/types/blog';
import { getLocalizedValue } from '@/lib/localize';

// Tab definitions
const TABS = [
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'media', label: 'Media & SEO', icon: ImageIcon },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// Predefined tag suggestions
const TAG_SUGGESTIONS = [
  'Travel', 'Egypt', 'Pyramids', 'Luxor', 'Cairo', 'Giza', 'Ancient Egypt', 'History',
  'UNESCO', 'Culture', 'Adventure', 'Tours', 'Safari', 'Desert', 'Nile', 'Red Sea',
  'Diving', 'Snorkeling', 'Beach', 'Resort', 'Hotel', 'Luxury', 'Budget', 'Family',
  'Solo Travel', 'Honeymoon', 'Photography', 'Food', 'Shopping', 'Museums', 'Temples',
  'Valley of the Kings', 'Abu Simbel', 'Aswan', 'Alexandria', 'Sharm El Sheikh',
  'Hurghada', 'Dahab', 'Marsa Alam', 'Siwa', 'Oasis', 'Egyptian Museum',
  'Islamic Cairo', 'Coptic Cairo', 'Khan el-Khalili', 'Egyptian Cuisine',
  'Hieroglyphics', 'Pharaohs', 'Mummies', 'Archaeology', 'Antiquities'
];

export default function NewBlogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');
  
  const [formData, setFormData] = useState<any>({
    title: { en: '', de: '', it: '', es: '' },
    slug: '',
    author: '',
    featuredImage: {
      url: '',
      fileName: '',
      title: { en: '', de: '', it: '', es: '' },
      alt: { en: '', de: '', it: '', es: '' },
    },
    excerpt: { en: '', de: '', it: '', es: '' },
    contentBlocks: [
      {
        id: 'initial-block',
        type: 'html',
        content: { en: '', de: '', it: '', es: '' },
      }
    ],
    tags: { en: [], de: [], it: [], es: [] },
    status: 'draft',
    isFeatured: false,
    metaTitle: { en: '', de: '', it: '', es: '' },
    metaDescription: { en: '', de: '', it: '', es: '' },
    metaKeywords: { en: [], de: [], it: [], es: [] },
    metaImage: {
      url: '',
      fileName: '',
      title: { en: '', de: '', it: '', es: '' },
      alt: { en: '', de: '', it: '', es: '' },
    },
    ogTitle: { en: '', de: '', it: '', es: '' },
    ogDescription: { en: '', de: '', it: '', es: '' },
    ogImage: '',
    ogType: 'article',
    noIndex: false,
    noFollow: false,
    focusKeyword: { en: '', de: '', it: '', es: '' },
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
    setFormData((prev: any) => {
      const updated = { ...prev } as any;
      
      // Handle localized fields
      const localizedFields = ['title', 'excerpt', 'metaTitle', 'metaDescription', 'ogTitle', 'ogDescription', 'focusKeyword'];
      const localizedMixedFields = ['tags', 'metaKeywords'];

      if (localizedFields.includes(field)) {
        updated[field] = {
          ...(updated[field] || { en: '', de: '', it: '', es: '' }),
          [activeLanguage]: value,
        };
        
        // Auto-generate slug and SEO titles when English title changes
        if (field === 'title' && activeLanguage === 'en') {
          updated.slug = generateSlug(value);
          if (!updated.metaTitle?.en) updated.metaTitle = { ...updated.metaTitle, en: value };
          if (!updated.ogTitle?.en) updated.ogTitle = { ...updated.ogTitle, en: value };
        }
      } 
      else if (localizedMixedFields.includes(field)) {
        updated[field] = {
          ...(updated[field] || { en: [], de: [], it: [], es: [] }),
          [activeLanguage]: value,
        };
      }
      // Handle nested fields
      else if (field.includes('.')) {
        const keys = field.split('.');
        let current = updated;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        
        const lastKey = keys[keys.length - 1];
        // Special case for localized image fields like featuredImage.alt
        if (['alt', 'title'].includes(lastKey) && (keys[0] === 'featuredImage' || keys[0] === 'metaImage')) {
            current[lastKey] = {
                ...(current[lastKey] || { en: '', de: '', it: '', es: '' }),
                [activeLanguage]: value,
            };
        } else {
            current[lastKey] = value;
        }
      } else {
        updated[field] = value;
      }

      return updated;
    });
  };

  // Handle Image Upload
  const handleImageUpload = async (file: File, index?: number) => {
    try {
      const response = await uploadAPI.uploadFile(file);
      if (response.success && response.data && response.data.url) {
        return { url: response.data.url, fileName: response.data.fileName || '' };
      } else {
        console.error('Upload failed:', response.error || 'No URL in response');
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

      // Validation
      if (!formData.title?.en) {
        toast({
          title: "Validation Error",
          description: "English title is required",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Clean up empty fields
      const cleanData = { ...formData };
      
      // Remove empty content blocks
      cleanData.contentBlocks = cleanData.contentBlocks.filter((block: any) => {
        if (block.type === 'html') return block.content?.en?.trim() || block.content?.de?.trim() || block.content?.it?.trim() || block.content?.es?.trim();
        if (block.type === 'blockquote') return block.content?.en?.trim() || block.content?.de?.trim() || block.content?.it?.trim() || block.content?.es?.trim();
        if (block.type === 'image') return block.image?.trim();
        if (block.type === 'video') return block.url?.trim();
        if (block.type === 'imageRow') return block.images && block.images.length > 0 && block.images.some((img: any) => img.url?.trim());
        return true;
      });

      // Normalize imageRow images to satisfy backend validators (url + alt required)
      cleanData.contentBlocks = cleanData.contentBlocks.map((block: any) => {
        if (block?.type !== 'imageRow') return block;

        const images = Array.isArray(block.images) ? block.images : [];
        const normalizedImages = images
          .filter((img: any) => img?.url?.trim())
          .map((img: any) => ({
            ...img,
            url: String(img.url).trim(),
            alt: (img.alt && String(img.alt).trim()) || cleanData.title || 'Image',
          }));

        return {
          ...block,
          images: normalizedImages,
        };
      });

      // Remove empty arrays
      cleanData.tags = Array.isArray(cleanData.tags)
        ? cleanData.tags.map((t: any) => String(t).trim()).filter(Boolean)
        : [];

      cleanData.metaKeywords = Array.isArray(cleanData.metaKeywords)
        ? cleanData.metaKeywords.map((k: any) => String(k).trim()).filter(Boolean)
        : [];

      if (!cleanData.breadcrumbs?.length) cleanData.breadcrumbs = [];
      if (!cleanData.relatedPosts?.length) cleanData.relatedPosts = [];

      // Remove empty optional fields
      if (!cleanData.excerpt?.trim()) delete cleanData.excerpt;
      
      // Ensure featuredImage has required fields
      if (cleanData.featuredImage) {
        if (!cleanData.featuredImage.url && !cleanData.featuredImage.fileName) {
          // Remove empty featuredImage - it will be required but can be empty initially
          cleanData.featuredImage = {
            url: '',
            fileName: '',
            title: '',
            alt: '',
          };
        } else if (cleanData.featuredImage.url) {
          // Ensure fileName is set
          if (!cleanData.featuredImage.fileName) {
            const urlParts = cleanData.featuredImage.url.split('/');
            cleanData.featuredImage.fileName = urlParts[urlParts.length - 1] || 'image.jpg';
          }
        }
      } else {
        // Ensure featuredImage exists (even if empty)
        cleanData.featuredImage = {
          url: '',
          fileName: '',
          title: '',
          alt: '',
        };
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
      } else if (!cleanData.metaImage.fileName?.trim()) {
        const urlParts = cleanData.metaImage.url.split('/');
        cleanData.metaImage.fileName = urlParts[urlParts.length - 1] || 'image.jpg';
      }

      // Set author to current user (this should come from auth context)
      // For now, using a placeholder
      cleanData.author = '507f1f77bcf86cd799439011'; // Replace with actual user ID

      const response = await blogAPI.create(cleanData);
      
      if (response.success) {
        toast({
          title: "Blog post created",
          description: `"${cleanData.title}" has been created successfully.`,
        });
        router.push('/admin/blogs/blog');
      } else {
        setError(response.error || 'Failed to create blog post');
        toast({
          title: "Creation failed",
          description: response.error || 'Failed to create blog post',
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      toast({
        title: "Error",
        description: err.message || 'An error occurred while creating the blog post',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch current user for author field if needed
    // This should come from auth context
  }, []);

  return (
    <div className="max-full space-y-6 pb-24 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Blog Post</h1>
            <p className="text-gray-500 mt-1">Write and publish a new blog article</p>
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
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-foreground"
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
                        <LocalizedField
                          label="Title"
                          value={formData.title}
                          onChange={(lang, val) => handleChange('title', val)}
                          globalLanguage={activeLanguage}
                        >
                          {(lang, value, onChange) => (
                            <Input
                              id="title"
                              value={value}
                              onChange={(e) => onChange(e.target.value)}
                              placeholder={`e.g., Amazing Travel Tips for Egypt in ${lang.toUpperCase()}`}
                              required={lang === 'en'}
                            />
                          )}
                        </LocalizedField>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slug">URL Slug (Always EN) *</Label>
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
                      <LocalizedField
                        label="Excerpt"
                        value={formData.excerpt}
                        onChange={(lang, val) => handleChange('excerpt', val)}
                        globalLanguage={activeLanguage}
                      >
                        {(lang, value, onChange) => (
                          <Textarea
                            id="excerpt"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={`Brief description of the blog post in ${lang.toUpperCase()}...`}
                            rows={3}
                          />
                        )}
                      </LocalizedField>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags ({activeLanguage.toUpperCase()}) *</Label>
                      <TagInput
                        tags={formData.tags[activeLanguage] || []}
                        onChange={(tags) => handleChange('tags', tags)}
                        placeholder="Add a tag and press Enter..."
                        suggestions={TAG_SUGGESTIONS}
                        maxTags={15}
                      />
                      <p className="text-sm text-muted-foreground">Type and press Enter to add tags. Tags are used for filtering and searching.</p>
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
                <ContentBlockEditor
                  blocks={formData.contentBlocks}
                  onChange={(updatedBlocks) => {
                    handleChange('contentBlocks', updatedBlocks);
                  }}
                  onImageUpload={handleImageUpload}
                  activeLanguage={activeLanguage}
                />
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
                        handleChange(`featuredImage.${field}`, value);
                      }}
                      onUpload={async (file, index) => {
                        return await handleImageUpload(file, index);
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
                        <LocalizedField
                          label="Meta Title"
                          value={formData.metaTitle}
                          onChange={(lang, val) => handleChange('metaTitle', val)}
                          globalLanguage={activeLanguage}
                        >
                          {(lang, value, onChange) => (
                            <Input
                              id="metaTitle"
                              value={value}
                              onChange={(e) => onChange(e.target.value)}
                              placeholder="SEO title (60 characters max)"
                              maxLength={60}
                            />
                          )}
                        </LocalizedField>
                      </div>
                      <div className="space-y-2">
                        <LocalizedField
                          label="Focus Keyword"
                          value={formData.focusKeyword}
                          onChange={(lang, val) => handleChange('focusKeyword', val)}
                          globalLanguage={activeLanguage}
                        >
                          {(lang, value, onChange) => (
                            <Input
                              id="focusKeyword"
                              value={value}
                              onChange={(e) => onChange(e.target.value)}
                              placeholder={`Main keyword for SEO in ${lang.toUpperCase()}`}
                            />
                          )}
                        </LocalizedField>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <LocalizedField
                        label="Meta Description"
                        value={formData.metaDescription}
                        onChange={(lang, val) => handleChange('metaDescription', val)}
                        globalLanguage={activeLanguage}
                      >
                        {(lang, value, onChange) => (
                          <Textarea
                            id="metaDescription"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={`SEO description in ${lang.toUpperCase()} (160 characters max)`}
                            maxLength={160}
                            rows={3}
                          />
                        )}
                      </LocalizedField>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metaKeywords">Meta Keywords ({activeLanguage.toUpperCase()})</Label>
                      <TagInput
                        tags={formData.metaKeywords[activeLanguage] || []}
                        onChange={(tags) => handleChange('metaKeywords', tags)}
                        placeholder="Add a keyword and press Enter..."
                        suggestions={TAG_SUGGESTIONS}
                        maxTags={10}
                      />
                      <p className="text-sm text-muted-foreground">Type and press Enter to add keywords for SEO.</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Meta / Social Image</Label>
                      <ImageUpload
                        images={formData.metaImage ? [formData.metaImage as ImageData] : []}
                        onAdd={() => {
                          if (!formData.metaImage) {
                            handleChange('metaImage', {
                              url: '',
                              fileName: '',
                              title: '',
                              alt: '',
                            });
                          }
                        }}
                        onRemove={() => {
                          handleChange('metaImage', {
                            url: '',
                            fileName: '',
                            title: '',
                            alt: '',
                          });
                        }}
                        onUpdate={(index, field, value) => {
                          handleChange(`metaImage.${field}`, value);
                        }}
                        onUpload={async (file, index) => {
                          return await handleImageUpload(file, index);
                        }}
                        title="Meta / Social Image"
                        description="Used for SEO and social sharing previews"
                        maxImages={1}
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
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Post
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}