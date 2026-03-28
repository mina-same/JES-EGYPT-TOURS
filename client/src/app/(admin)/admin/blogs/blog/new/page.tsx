'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { blogAPI, blogCategoryAPI, blogSubcategoryAPI, BlogFormData, ContentBlock } from '@/lib/api/blogAdmin';
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
import LocalizedInput from '@/components/admin/LocalizedInput';
import LocalizedTextArea from '@/components/admin/LocalizedTextArea';
import LocalizedTagsInput from '@/components/admin/LocalizedTagsInput';
import LocalizedRichText from '@/components/admin/LocalizedRichText';
import ContentBlockEditor from '@/components/admin/ContentBlockEditor';
import FormErrorPanel from '@/components/admin/FormErrorPanel';
import DraftBanner from '@/components/admin/DraftBanner';
import { useToast } from '@/hooks/use-toast';
import { uploadAPI } from '@/lib/api/upload';
import AdminLanguageTabs, { AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import { ILocalizedString, ILocalizedMixed } from '@/types/blog';
import { getLocalizedValue } from '@/lib/localize';
import { useFormDraft } from '@/hooks/useFormDraft';
import { parseApiError, type FormErrorItem } from '@/lib/parseApiError';

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

const INITIAL_BLOG_POST = {
  title: { en: '', de: '', it: '', es: '' },
  slug: { en: '', de: '', it: '', es: '' },
  author: '',
  featuredImage: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
  excerpt: { en: '', de: '', it: '', es: '' },
  contentBlocks: [{ id: 'initial-block', type: 'html', content: { en: '', de: '', it: '', es: '' } }],
  tags: { en: [], de: [], it: [], es: [] },
  status: 'draft',
  isFeatured: false,
  metaTitle: { en: '', de: '', it: '', es: '' },
  metaDescription: { en: '', de: '', it: '', es: '' },
  metaKeywords: { en: [], de: [], it: [], es: [] },
  metaImage: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
  ogTitle: { en: '', de: '', it: '', es: '' },
  ogDescription: { en: '', de: '', it: '', es: '' },
  ogImage: '',
  ogType: 'article',
  noIndex: false,
  noFollow: false,
  focusKeyword: { en: '', de: '', it: '', es: '' },
  breadcrumbs: [],
  relatedPosts: [],
  category: '',
  subCategory: '',
};

export default function NewBlogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrorItem[]>([]);
  const [activeTab, setActiveTab] = useState('content');
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [fetchingOptions, setFetchingOptions] = useState(false);

  const { formData, setFormData, clearDraft, hasDraft } = useFormDraft<any>(
    'draft_blog_new',
    INITIAL_BLOG_POST
  );

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const getFieldError = (path: string) => {
    return formErrors.find(e => e.path === path || e.field === path)?.message;
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

        // Auto-generate slug and SEO titles when title changes for the active language
        if (field === 'title') {
          updated.slug = {
            ...updated.slug,
            [activeLanguage]: generateSlug(value),
          };
          if (!updated.metaTitle?.[activeLanguage]) updated.metaTitle = { ...updated.metaTitle, [activeLanguage]: value };
          if (!updated.ogTitle?.[activeLanguage]) updated.ogTitle = { ...updated.ogTitle, [activeLanguage]: value };
        }
      }
      else if (localizedMixedFields.includes(field)) {
        updated[field] = value;
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
      setFormErrors([]);

      // ── Client-side validation ──────────────────────
      const validationErrors: FormErrorItem[] = [];
      if (!formData.title?.en?.trim()) {
        validationErrors.push({ field: 'Blog Title', message: 'English title is required', lang: 'en', path: 'title-en' });
      }
      if (!formData.slug?.en?.trim()) {
        validationErrors.push({ field: 'URL Slug', message: 'English slug is required', lang: 'en', path: 'slug-en' });
      }
      if (!formData.author?.trim()) {
        validationErrors.push({ field: 'Author', message: 'An author must be selected', path: 'author' });
      }
      if (!formData.featuredImage?.url?.trim()) {
        validationErrors.push({ field: 'Featured Image', message: 'A featured image is required', path: 'featuredImage-url' });
      }
      if (validationErrors.length > 0) {
        setFormErrors(validationErrors);
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
        const cleanedBlock = { ...block };
        // Mongoose maps 'id' to '_id' for subdocuments, so sending 'block-xxx' causes CastError.
        delete cleanedBlock.id;
        if (cleanedBlock._id && !/^[a-f\d]{24}$/i.test(String(cleanedBlock._id))) {
          delete cleanedBlock._id;
        }

        if (cleanedBlock?.type !== 'imageRow') return cleanedBlock;

        const images = Array.isArray(cleanedBlock.images) ? cleanedBlock.images : [];
        const normalizedImages = images
          .filter((img: any) => img?.url?.trim())
          .map((img: any) => ({
            ...img,
            url: String(img.url).trim(),
            fileName: img.fileName || String(img.url).split('/').pop() || 'image.jpg',
            alt: (img.alt && Object.values(img.alt).some(v => v)) ? img.alt : cleanData.title || 'Image',
          }));

        return {
          ...block,
          images: normalizedImages,
        };
      });

      // Process localized tags and meta keywords
      const processLocalizedMixed = (val: any) => {
        if (!val || typeof val !== 'object') return { en: [], de: [], it: [], es: [] };
        const result: any = {};
        for (const lang in val) {
          if (Array.isArray(val[lang])) {
            result[lang] = val[lang].map((item: any) => String(item).trim()).filter(Boolean);
          } else {
            result[lang] = [];
          }
        }
        return result;
      };

      cleanData.tags = processLocalizedMixed(cleanData.tags);
      cleanData.metaKeywords = processLocalizedMixed(cleanData.metaKeywords);

      if (!cleanData.breadcrumbs?.length) cleanData.breadcrumbs = [];
      if (!cleanData.relatedPosts?.length) cleanData.relatedPosts = [];

      // Clean up category/subcategory IDs (must be valid Mongo IDs or removed)
      if (!cleanData.category || cleanData.category === '') delete cleanData.category;
      if (!cleanData.subCategory || cleanData.subCategory === '') delete cleanData.subCategory;

      // Helper to check if localized string is empty
      const isLocalizedStringEmpty = (val: any) => {
        if (!val || typeof val !== 'object') return true;
        return !Object.values(val).some(v => typeof v === 'string' && v.trim() !== '');
      };

      // Remove empty optional fields (localized)
      if (isLocalizedStringEmpty(cleanData.excerpt)) delete cleanData.excerpt;
      if (isLocalizedStringEmpty(cleanData.metaTitle)) delete cleanData.metaTitle;
      if (isLocalizedStringEmpty(cleanData.metaDescription)) delete cleanData.metaDescription;
      if (isLocalizedStringEmpty(cleanData.ogTitle)) delete cleanData.ogTitle;
      if (isLocalizedStringEmpty(cleanData.ogDescription)) delete cleanData.ogDescription;
      if (isLocalizedStringEmpty(cleanData.focusKeyword)) delete cleanData.focusKeyword;

      // Handle ogImage (plain string)
      if (typeof cleanData.ogImage === 'string' && !cleanData.ogImage.trim()) delete cleanData.ogImage;

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
        toast({ title: "Blog post created", description: 'Blog post published successfully.' });
        clearDraft();
        router.push('/admin/blogs/blog');
      } else {
        const parsed = parseApiError(response);
        setFormErrors(parsed);
        toast({ title: 'Save failed', description: `${parsed.length} issue(s) found. See error panel.`, variant: 'destructive' });
      }
    } catch (err: any) {
      const parsed = parseApiError(err?.response?.data || { message: err.message });
      setFormErrors(parsed);
      toast({ title: 'Error', description: err.message || 'An error occurred', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setFetchingOptions(true);
        const response = await blogCategoryAPI.getAll({ isActive: true });
        if (response.success && response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch blog categories:', error);
      } finally {
        setFetchingOptions(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!formData.category) {
        setSubCategories([]);
        return;
      }
      try {
        const response = await blogSubcategoryAPI.getByCategory(formData.category, { isActive: true });
        if (response.success && response.data) {
          setSubCategories(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch subcategories:', error);
      }
    };
    fetchSubCategories();
  }, [formData.category]);

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

      {/* Draft Banner */}
      {hasDraft && (
        <DraftBanner onDiscard={() => { clearDraft(); setFormData(INITIAL_BLOG_POST); }} />
      )}

      {/* Detailed Error Panel */}
      {formErrors.length > 0 && (
        <FormErrorPanel errors={formErrors} onDismiss={() => setFormErrors([])} />
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
                        <LocalizedInput
                          label="Title"
                          value={formData.title}
                          onChange={(val) => handleChange('title', val)}
                          placeholder="e.g., Amazing Travel Tips for Egypt"
                        />
                        <LocalizedInput
                          label="URL Slug"
                          value={formData.slug}
                          onChange={(val) => handleChange('slug', val)}
                          placeholder="amazing-travel-tips"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                       <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select 
                          value={formData.category || "none"} 
                          onValueChange={(value) => handleChange('category', value === "none" ? "" : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat._id} value={cat._id}>
                                {cat.name?.en || cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subCategory">Subcategory</Label>
                        <Select 
                          value={formData.subCategory || "none"} 
                          onValueChange={(value) => handleChange('subCategory', value === "none" ? "" : value)}
                          disabled={!formData.category}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {subCategories.map((sub) => (
                              <SelectItem key={sub._id} value={sub._id}>
                                {sub.name?.en || sub.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <LocalizedTextArea
                        label="Excerpt"
                        value={formData.excerpt}
                        onChange={(val) => handleChange('excerpt', val)}
                        placeholder="Brief description of the blog post..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <LocalizedTagsInput
                        label="Tags"
                        value={formData.tags}
                        onChange={(val) => handleChange('tags', val)}
                        placeholder="Add a tag..."
                      />
                      <p className="text-sm text-muted-foreground italic">Type and press Enter to add tags. Tags are localized.</p>
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
                      activeLanguage={activeLanguage}
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
                        <LocalizedInput
                          label="Meta Title"
                          value={formData.metaTitle}
                          onChange={(val) => handleChange('metaTitle', val)}
                          placeholder="SEO title"
                        />
                      </div>
                      <div className="space-y-2">
                        <LocalizedInput
                          label="Focus Keyword"
                          value={formData.focusKeyword}
                          onChange={(val) => handleChange('focusKeyword', val)}
                          placeholder="Main keyword"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <LocalizedTextArea
                        label="Meta Description"
                        value={formData.metaDescription}
                        onChange={(val) => handleChange('metaDescription', val)}
                        placeholder="SEO description..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <LocalizedTagsInput
                        label="Meta Keywords"
                        value={formData.metaKeywords}
                        onChange={(val) => handleChange('metaKeywords', val)}
                        placeholder="Add a keyword..."
                      />
                      <p className="text-sm text-muted-foreground italic">Type and press Enter to add keywords for SEO.</p>
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
                        activeLanguage={activeLanguage}
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