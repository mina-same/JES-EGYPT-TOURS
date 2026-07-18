'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { blogAPI, blogCategoryAPI, blogSubcategoryAPI, destinationAPI, BlogFormData, ContentBlock } from '@/lib/api/blogAdmin';
import { tourAPI } from '@/lib/api/tour';
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
import LocalizedInput from '@/components/admin/LocalizedInput';
import LocalizedTagsInput from '@/components/admin/LocalizedTagsInput';
import ContentBlockEditor, { ContentBlock as EditorContentBlock } from '@/components/admin/ContentBlockEditor';
import TagInput from '@/components/admin/TagInput';
import FormErrorPanel from '@/components/admin/FormErrorPanel';
import DraftBanner from '@/components/admin/DraftBanner';
import { useToast } from '@/hooks/use-toast';
import { uploadAPI } from '@/lib/api/upload';
import AdminLanguageTabs, { AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import FaqManager from '@/components/admin/FaqManager';
import { ILocalizedString, ILocalizedMixed, IImage } from '@/types/shared';
import { getLocalizedValue } from '@/lib/localize';
import { useFormDraft } from '@/hooks/useFormDraft';
import { userAPI, User as AuthUser } from '@/lib/api/auth';
import { parseApiError, type FormErrorItem } from '@/lib/parseApiError';
import { normalizeFaqsForSave } from '@/lib/faqCleanup';

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

const INITIAL_BLOG_EDIT: any = {
  title: { en: '', de: '', it: '', es: '' },
  slug: { en: '', de: '', it: '', es: '' },
  author: '',
  editorialAuthor: '',
  featuredImage: { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
  excerpt: { en: '', de: '', it: '', es: '' },
  contentBlocks: [],
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
  relatedTours: [],
  category: '',
  subCategory: '',
  destination: '',
  summary: { en: '', de: '', it: '', es: '' },
  keyTakeaways: { en: [], de: [], it: [], es: [] },
  faqs: [],
};

export default function EditBlogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams();
  const blogId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<FormErrorItem[]>([]);
  const [activeTab, setActiveTab] = useState('content');
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [relatedPostOptions, setRelatedPostOptions] = useState<any[]>([]);
  const [relatedTourOptions, setRelatedTourOptions] = useState<any[]>([]);
  const [fetchingOptions, setFetchingOptions] = useState(false);
  const [authors, setAuthors] = useState<AuthUser[]>([]);
  const [editorialAuthors, setEditorialAuthors] = useState<any[]>([]);
  const [originalFormData, setOriginalFormData] = useState<any | null>(null);
  const [knownEditVersion, setKnownEditVersion] = useState<number>(0);
  const [draftStatus, setDraftStatus] = useState<'none' | 'safe' | 'stale-no-version' | 'stale-version-mismatch'>('none');

  const { formData, setFormData, clearDraft, hasDraft } = useFormDraft<any>(
    `draft_blog_edit_${blogId}`,
    INITIAL_BLOG_EDIT
  );

  const cloneFormData = (data: any) => JSON.parse(JSON.stringify(data));

  // Draft version tracking — stored separately from the draft form data so it
  // survives clearDraft() and can be compared against the server's editVersion.
  const draftVersionKey = `draft_blog_edit_${blogId}_version`;
  const getDraftVersion = (): number | undefined => {
    try {
      const raw = localStorage.getItem(draftVersionKey);
      return raw !== null ? Number(raw) : undefined;
    } catch { return undefined; }
  };
  const setStoredDraftVersion = (v: number): void => {
    try { localStorage.setItem(draftVersionKey, String(v)); } catch {}
  };
  const clearStoredDraftVersion = (): void => {
    try { localStorage.removeItem(draftVersionKey); } catch {}
  };

  const handleDiscardDraft = () => {
    clearStoredDraftVersion();
    if (originalFormData) {
      clearDraft({ suppressNextSave: true });
      setFormData(cloneFormData(originalFormData));
      setStoredDraftVersion(knownEditVersion);
    } else {
      clearDraft();
    }
    setDraftStatus('none');
  };

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
  const handleChange = (field: string, value: any, langOverride?: AdminLanguage) => {
    setFormData((prev: any) => {
      const updated = { ...prev } as any;
      
      const lang = langOverride || activeLanguage;
      
      // Handle localized fields
      const localizedFields = ['title', 'excerpt', 'metaTitle', 'metaDescription', 'ogTitle', 'ogDescription', 'focusKeyword'];
      const localizedMixedFields = ['tags', 'keyTakeaways', 'metaKeywords', 'summary'];

      if (localizedFields.includes(field)) {
        updated[field] = {
          ...(updated[field] || { en: '', de: '', it: '', es: '' }),
          [lang]: value,
        };
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
                [lang]: value,
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

  const selectedRelatedPosts: string[] = Array.from(
    new Set<string>((Array.isArray(formData.relatedPosts) ? formData.relatedPosts : []).filter((postId: string) => postId && postId !== 'none'))
  );

  const handleRelatedPostChange = (index: number, value: string) => {
    const nextPosts = [...selectedRelatedPosts];
    nextPosts[index] = value;

    handleChange(
      'relatedPosts',
      Array.from(new Set(nextPosts.filter((postId) => postId && postId !== 'none')))
    );
  };

  const handleAddRelatedPost = () => {
    const nextPost = relatedPostOptions.find((post) => {
      const postId = post._id || post.id;
      return postId && !selectedRelatedPosts.includes(postId);
    });

    if (!nextPost) return;

    handleChange('relatedPosts', [...selectedRelatedPosts, nextPost._id || nextPost.id]);
  };

  const handleRemoveRelatedPost = (index: number) => {
    handleChange('relatedPosts', selectedRelatedPosts.filter((_, currentIndex) => currentIndex !== index));
  };

  const selectedRelatedTours: string[] = Array.from(
    new Set<string>((Array.isArray(formData.relatedTours) ? formData.relatedTours : []).filter((tourId: string) => tourId && tourId !== 'none'))
  );

  const handleRelatedTourChange = (index: number, value: string) => {
    const nextTours = [...selectedRelatedTours];
    nextTours[index] = value;

    handleChange(
      'relatedTours',
      Array.from(new Set(nextTours.filter((tourId) => tourId && tourId !== 'none')))
    );
  };

  const handleAddRelatedTour = () => {
    const nextTour = relatedTourOptions.find((tour) => {
      const tourId = tour._id || tour.id;
      return tourId && !selectedRelatedTours.includes(tourId);
    });

    if (!nextTour) return;

    handleChange('relatedTours', [...selectedRelatedTours, nextTour._id || nextTour.id]);
  };

  const handleRemoveRelatedTour = (index: number) => {
    handleChange('relatedTours', selectedRelatedTours.filter((_, currentIndex) => currentIndex !== index));
  };

  // Handle Image Upload
  const handleImageUpload = async (file: File, index?: number): Promise<{ url: string, fileName: string } | null> => {
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

  // Fetch blog data
  const fetchBlog = async () => {
    try {
      setInitialLoading(true);
      setFormErrors([]);

      const response = await blogAPI.getById(blogId);
      
      if (response.success && response.data) {
        const blog = response.data;
        
        // Helper to normalize localized strings
        const normalizeLocalizedString = (val: any): ILocalizedString => {
          if (typeof val === 'string') return { en: val, de: val, it: val, es: val };
          if (typeof val === 'object' && val !== null) {
            return {
              en: val.en || '',
              de: val.de || '',
              it: val.it || '',
              es: val.es || '',
            };
          }
          return { en: '', de: '', it: '', es: '' };
        };

        // Helper to normalize localized mixed (tags, keywords)
        const normalizeLocalizedMixed = (val: any): ILocalizedMixed => {
          if (Array.isArray(val)) return { en: val, de: val, it: val, es: val };
          if (typeof val === 'object' && val !== null) {
            return {
              en: Array.isArray(val.en) ? val.en : [],
              de: Array.isArray(val.de) ? val.de : [],
              it: Array.isArray(val.it) ? val.it : [],
              es: Array.isArray(val.es) ? val.es : [],
            };
          }
          return { en: [], de: [], it: [], es: [] };
        };

        // Helper to normalize images
        const normalizeImage = (img: any): IImage => {
            if (!img) return { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } };
            if (typeof img === 'string') return { url: img, fileName: img.split('/').pop() || '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } };
            return {
                url: img.url || '',
                fileName: img.fileName || '',
                title: normalizeLocalizedString(img.title),
                alt: normalizeLocalizedString(img.alt),
            };
        };

        // Transform the data to match form structure
        const loadedFormData = {
          title: normalizeLocalizedString(blog.title),
          slug: normalizeLocalizedString(blog.slug),
          author: blog.author?._id || blog.author || '',
          editorialAuthor: blog.editorialAuthor?._id || blog.editorialAuthor || '',
          featuredImage: normalizeImage(blog.featuredImage),
          excerpt: normalizeLocalizedString(blog.excerpt),
          contentBlocks: (() => {
            const usedIds = new Set<string>();
            return (blog.contentBlocks || []).map((block: any) => {
              let blockId = block._id && /^[a-f\d]{24}$/i.test(String(block._id)) ? String(block._id) : '';
              
              // If ID is missing or already used, generate a fresh one
              if (!blockId || usedIds.has(blockId)) {
                blockId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              }
              usedIds.add(blockId);

              const normalizedBlock: any = {
                ...block,
                id: blockId,
              };
              
              // Only normalize content/title if block type uses them
              if (block.type === 'html') {
                normalizedBlock.content = normalizeLocalizedString(block.content);
                normalizedBlock.title = normalizeLocalizedString(block.title);
              } else if (block.type === 'blockquote') {
                normalizedBlock.content = normalizeLocalizedString(block.content);
                delete normalizedBlock.title;
              } else {
                delete normalizedBlock.content;
                delete normalizedBlock.title;
              }

              normalizedBlock.images = (block.images || []).map((img: any) => ({
                  ...img,
                  title: normalizeLocalizedString(img.title),
                  alt: normalizeLocalizedString(img.alt),
              }));

              return normalizedBlock;
            });
          })(),
          tags: normalizeLocalizedMixed(blog.tags),
          status: blog.status || 'draft',
          isFeatured: blog.isFeatured || false,
          publishedAt: blog.publishedAt ? new Date(blog.publishedAt) : undefined,
          scheduledAt: blog.scheduledAt ? new Date(blog.scheduledAt) : undefined,
          metaTitle: normalizeLocalizedString(blog.metaTitle),
          metaDescription: normalizeLocalizedString(blog.metaDescription),
          metaKeywords: normalizeLocalizedMixed(blog.metaKeywords),
          metaImage: normalizeImage(blog.metaImage),
          ogTitle: normalizeLocalizedString(blog.ogTitle),
          ogDescription: normalizeLocalizedString(blog.ogDescription),
          ogImage: blog.ogImage || '',
          ogType: blog.ogType || 'article',
          noIndex: blog.noIndex || false,
          noFollow: blog.noFollow || false,
          focusKeyword: normalizeLocalizedString(blog.focusKeyword),
          breadcrumbs: (blog.breadcrumbs || []).map((b: any) => ({
            ...b,
            name: normalizeLocalizedString(b.name)
          })),
          relatedPosts: blog.relatedPosts?.map((post: any) => post._id || post) || [],
          relatedTours: blog.relatedTours?.map((tour: any) => tour._id || tour) || [],
          category: blog.category?._id || blog.category || '',
          subCategory: blog.subCategory?._id || blog.subCategory || '',
          destination: blog.destination?._id || blog.destination || '',
          summary: normalizeLocalizedMixed(blog.summary),
          keyTakeaways: normalizeLocalizedMixed(blog.keyTakeaways),
          faqs: (blog.faqs || []).map((faq: any) => ({
            question: normalizeLocalizedString(faq.question),
            answer: normalizeLocalizedString(faq.answer),
          })),
        };

        const serverVersion: number = blog.editVersion ?? 0;
        setKnownEditVersion(serverVersion);
        setOriginalFormData(cloneFormData(loadedFormData));

        if (hasDraft) {
          const storedVersion = getDraftVersion();
          if (storedVersion === undefined) {
            // Case C: draft has no version marker — predates protection.
            // Leave the draft untouched so the user can copy unsaved work.
            // Saving is blocked until the user explicitly discards and loads latest.
            setDraftStatus('stale-no-version');
          } else if (storedVersion !== serverVersion) {
            // Case D: draft is from an older version than the server.
            // Leave the draft untouched so the user can copy unsaved work.
            // Saving is blocked until the user explicitly discards and loads latest.
            setDraftStatus('stale-version-mismatch');
          } else {
            // Case B: version matches — draft is safe to restore and save
            setDraftStatus('safe');
          }
          return;
        }

        // Case A: no draft — load fresh server data without creating a draft
        setStoredDraftVersion(serverVersion);
        clearDraft({ suppressNextSave: true });
        setFormData(loadedFormData);
      } else {
        setFormErrors([{ field: 'Server', message: response.error || 'Failed to fetch blog post' }]);
      }
    } catch (err: any) {
      setFormErrors([{ field: 'Server', message: err.message || 'An error occurred' }]);
    } finally {
      setInitialLoading(false);
    }
  };


  // Submit form
  const performUpdate = async (stayOnPage = false) => {
    // Frontend safety guard: block saving when a stale draft is active.
    // The backend 409 is a second line of defence, but we catch it here first
    // so the user gets a clear message without the API call firing.
    if (draftStatus === 'stale-no-version' || draftStatus === 'stale-version-mismatch') {
      toast({
        title: 'Saving blocked — stale draft',
        description: 'This draft may be older than the current article. Copy any important content, then click "Discard draft & load latest" before saving.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      setFormErrors([]);

      // ── Client-side validation ──────────────────────
      const validationErrors: FormErrorItem[] = [];
      if (!formData.title?.en?.trim()) {
        validationErrors.push({ field: 'Blog Title', message: 'English title is required', lang: 'en', path: 'title-en' });
      }
      if (validationErrors.length > 0) {
        setFormErrors(validationErrors);
        setLoading(false);
        return;
      }

      // Helper to check if localized string is empty
      const isLocalizedStringEmpty = (val: any) => {
        if (!val || typeof val !== 'object') return true;
        return !Object.values(val).some(v => typeof v === 'string' && v.trim() !== '');
      };

      const ensureEnglish = (val: any) => {
        if (!val || typeof val !== 'object') return val;
        if (!val.en?.trim()) {
          val.en = val.de?.trim() || val.it?.trim() || val.es?.trim() || '';
        }
        return val;
      };

      // Clean up empty fields
      const cleanData = { ...formData };
      
      // Remove empty content blocks
      cleanData.contentBlocks = cleanData.contentBlocks.filter((block: any) => {
        if (block.type === 'html') return block.content?.en?.trim() || block.content?.de?.trim() || block.content?.it?.trim() || block.content?.es?.trim();
        if (block.type === 'blockquote') return block.content?.en?.trim() || block.content?.de?.trim() || block.content?.it?.trim() || block.content?.es?.trim();
        if (block.type === 'image') return block.url?.trim() || block.image?.trim();
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

        if (cleanedBlock.type === 'html') {
          // Keep content and title for html blocks
          cleanedBlock.content = ensureEnglish(cleanedBlock.content);
          if (isLocalizedStringEmpty(cleanedBlock.title)) {
            delete cleanedBlock.title;
          } else {
            ensureEnglish(cleanedBlock.title);
          }
        } else if (cleanedBlock.type === 'blockquote') {
          // blockquote only uses content
          cleanedBlock.content = ensureEnglish(cleanedBlock.content);
          delete cleanedBlock.title;
        } else {
          // Others don't use top-level content/title
          delete cleanedBlock.content;
          delete cleanedBlock.title;
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
          ...cleanedBlock,
          images: normalizedImages,
        };
      });

      // Process localized tags and meta keywords
      const processLocalizedMixed = (val: any) => {
        if (!val || typeof val !== 'object') return { en: [], de: [], it: [], es: [] };
        const result: any = {};
        const langs = ['en', 'de', 'it', 'es'];
        langs.forEach(lang => {
          if (Array.isArray((val as any)[lang])) {
            result[lang] = (val as any)[lang].map((item: any) => String(item).trim()).filter(Boolean);
          } else {
            result[lang] = [];
          }
        });
        return result;
      };

      cleanData.tags = processLocalizedMixed(cleanData.tags);
      cleanData.keyTakeaways = processLocalizedMixed(cleanData.keyTakeaways);
      cleanData.metaKeywords = processLocalizedMixed(cleanData.metaKeywords);
      cleanData.summary = processLocalizedMixed(cleanData.summary);

      if (!cleanData.breadcrumbs?.length) cleanData.breadcrumbs = [];
      cleanData.relatedPosts = Array.from(
        new Set((cleanData.relatedPosts || []).filter((postId: string) => postId && postId !== 'none'))
      );
      cleanData.relatedTours = Array.from(
        new Set((cleanData.relatedTours || []).filter((tourId: string) => tourId && tourId !== 'none'))
      );

      // Clean up category/subcategory IDs (must be valid Mongo IDs or removed)
      if (!cleanData.category || cleanData.category === '' || cleanData.category === 'none') {
        cleanData.category = null;
      }
      if (!cleanData.subCategory || cleanData.subCategory === '' || cleanData.subCategory === 'none') {
        cleanData.subCategory = null;
      }
      if (!cleanData.destination || cleanData.destination === '' || cleanData.destination === 'none') {
        cleanData.destination = null;
      }



      // Apply English safety fallback to all required localized fields being sent
      ensureEnglish(cleanData.title);
      ensureEnglish(cleanData.slug);

      // Helper to check if localized mixed (array) is empty
      const isLocalizedMixedEmpty = (val: any) => {
        if (!val || typeof val !== 'object') return true;
        return !Object.values(val).some(v => Array.isArray(v) && v.length > 0);
      };

      // Prune empty optional localized fields to avoid backend validation on 'en' requirement
      const optionalStringFields = ['excerpt', 'metaTitle', 'metaDescription', 'ogTitle', 'ogDescription', 'focusKeyword'];
      optionalStringFields.forEach(field => {
        if (isLocalizedStringEmpty((cleanData as any)[field])) {
          delete (cleanData as any)[field];
        } else {
          ensureEnglish((cleanData as any)[field]);
        }
      });

      const optionalMixedFields = ['metaKeywords', 'tags', 'keyTakeaways', 'summary'];
      optionalMixedFields.forEach(field => {
        if (isLocalizedMixedEmpty((cleanData as any)[field])) {
          delete (cleanData as any)[field];
        }
      });

      // Helper to prune image title/alt
      const pruneImage = (img: any) => {
        if (!img || typeof img !== 'object') return;
        if (img.title && isLocalizedStringEmpty(img.title)) delete img.title;
        else if (img.title) ensureEnglish(img.title);
        
        if (img.alt && isLocalizedStringEmpty(img.alt)) delete img.alt;
        else if (img.alt) ensureEnglish(img.alt);
      };

      if (cleanData.featuredImage) pruneImage(cleanData.featuredImage);
      if (cleanData.metaImage) pruneImage(cleanData.metaImage);
      
      cleanData.contentBlocks?.forEach((block: any) => {
        if (block.images) {
          block.images.forEach((img: any) => pruneImage(img));
        }
        // Handle block-level alt/caption for image type blocks
        if (block.type === 'image') {
          if (block.alt && isLocalizedStringEmpty(block.alt)) delete block.alt;
          else if (block.alt) ensureEnglish(block.alt);
          
          if (block.caption && isLocalizedStringEmpty(block.caption)) delete block.caption;
          else if (block.caption) ensureEnglish(block.caption);
        }
      });

      // IMPORTANT: avoid sending invalid author (causes CastError). If missing/invalid, keep existing author.
      if (typeof (cleanData as any).author !== 'string' || !/^[a-f\d]{24}$/i.test((cleanData as any).author.trim())) {
        delete (cleanData as any).author;
      }

      // IMPORTANT: Don't send an empty featuredImage (backend requires url + fileName)
      if (!cleanData.featuredImage?.url?.trim()) {
        delete (cleanData as any).featuredImage;
      } else {
        if (!cleanData.featuredImage.fileName?.trim()) {
          const urlParts = cleanData.featuredImage.url.split('/');
          cleanData.featuredImage.fileName = urlParts[urlParts.length - 1] || 'image.jpg';
        }
        // Ensure image alt/title also have English if present
        if (cleanData.featuredImage.alt) ensureEnglish(cleanData.featuredImage.alt);
        if (cleanData.featuredImage.title) ensureEnglish(cleanData.featuredImage.title);
      }

      // Note: summary is now handled via processLocalizedMixed as an array.

      if (isLocalizedStringEmpty(cleanData.metaTitle)) {
        delete cleanData.metaTitle;
      } else {
        ensureEnglish(cleanData.metaTitle);
      }

      if (isLocalizedStringEmpty(cleanData.metaDescription)) {
        delete cleanData.metaDescription;
      } else {
        ensureEnglish(cleanData.metaDescription);
      }

      if (isLocalizedStringEmpty(cleanData.ogTitle)) {
        delete cleanData.ogTitle;
      } else {
        ensureEnglish(cleanData.ogTitle);
      }

      if (isLocalizedStringEmpty(cleanData.ogDescription)) {
        delete cleanData.ogDescription;
      } else {
        ensureEnglish(cleanData.ogDescription);
      }

      if (isLocalizedStringEmpty(cleanData.focusKeyword)) {
        delete cleanData.focusKeyword;
      } else {
        ensureEnglish(cleanData.focusKeyword);
      }

      // Handle ogImage (plain string)
      if (typeof cleanData.ogImage === 'string' && !cleanData.ogImage.trim()) delete cleanData.ogImage;
      
      // Remove empty metaImage if no URL
      if (!cleanData.metaImage?.url?.trim()) {
        delete cleanData.metaImage;
      } else {
        if (!cleanData.metaImage.fileName?.trim()) {
          const urlParts = cleanData.metaImage.url.split('/');
          cleanData.metaImage.fileName = urlParts[urlParts.length - 1] || 'image.jpg';
        }
        if (cleanData.metaImage.alt) ensureEnglish(cleanData.metaImage.alt);
        if (cleanData.metaImage.title) ensureEnglish(cleanData.metaImage.title);
      }

      cleanData.faqs = normalizeFaqsForSave(cleanData.faqs);

      // Attach the conflict token — the server rejects saves that don't match the current version
      cleanData._editVersion = knownEditVersion;

      const response = await blogAPI.update(blogId, cleanData);

      if (response.success) {
        const newVersion: number = response.data?.editVersion ?? (knownEditVersion + 1);
        setKnownEditVersion(newVersion);
        setStoredDraftVersion(newVersion);
        setDraftStatus('none');
        toast({ title: 'Blog post updated', description: 'Blog post saved successfully.' });
        clearDraft();
        setOriginalFormData(cloneFormData(formData));
        if (!stayOnPage) {
          router.push('/admin/blogs/blog');
        }
      } else {
        const parsed = parseApiError(response);
        setFormErrors(parsed);
        toast({ title: 'Save failed', description: `${parsed.length} issue(s) found. See error panel.`, variant: 'destructive' });
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast({
          title: 'Save blocked — article was modified elsewhere',
          description: 'This article was updated elsewhere since you opened it. Reload the latest version before saving. Your local draft has been preserved.',
          variant: 'destructive',
        });
        return; // do not clear draft, do not navigate away
      }
      const parsed = parseApiError(err?.response?.data || { message: err.message });
      setFormErrors(parsed);
      toast({ title: 'Error', description: err.message || 'An error occurred', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void performUpdate(false);
  };

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setFetchingOptions(true);
        const [catRes, userRes, editorialAuthorRes, destRes, relatedPostsRes, relatedToursRes] = await Promise.all([
          blogCategoryAPI.getAll({ isActive: true }),
          userAPI.getAllUsers(),
          blogAPI.getEditorialAuthors(),
          destinationAPI.getAll({ isActive: true }),
          blogAPI.getAll({ limit: 100, status: 'published' }),
          tourAPI.getAll({ limit: 100, isActive: true })
        ]);
        
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }

        if (userRes.success && userRes.data?.users) {
          setAuthors(userRes.data.users);
        }

        if (editorialAuthorRes.success && editorialAuthorRes.data) {
          setEditorialAuthors(editorialAuthorRes.data);
        }

        if (destRes.success && destRes.data) {
          setDestinations(destRes.data);
        }

        if (relatedPostsRes.success && relatedPostsRes.data) {
          const publishedPostsData = relatedPostsRes.data as any;
          const publishedPosts = Array.isArray(publishedPostsData) ? publishedPostsData : publishedPostsData.blogs || [];
          setRelatedPostOptions(
            publishedPosts.filter((post: any) => (post._id || post.id) !== blogId)
          );
        }

        if (relatedToursRes.success && relatedToursRes.data) {
          const activeToursData = relatedToursRes.data as any;
          setRelatedTourOptions(
            Array.isArray(activeToursData) ? activeToursData : activeToursData.tours || []
          );
        }
      } catch (error) {
        console.error('Failed to fetch blog options:', error);
      } finally {
        setFetchingOptions(false);
      }
    };
    fetchOptions();
    fetchBlog();
  }, [blogId]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Blog Post</h1>
            <p className="text-gray-500 mt-1">Update blog article content and settings</p>
          </div>
        </div>
        <AdminLanguageTabs activeLanguage={activeLanguage} onLanguageChange={setActiveLanguage} />
      </div>

      {hasDraft && draftStatus === 'safe' && (
        <DraftBanner
          draftStatus="safe"
          onDiscard={handleDiscardDraft}
        />
      )}
      {(draftStatus === 'stale-no-version' || draftStatus === 'stale-version-mismatch') && (
        <DraftBanner
          draftStatus={draftStatus}
          onDiscard={handleDiscardDraft}
        />
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
                      <div className="space-y-2">
                        <LocalizedField
                          label="Title"
                          value={formData.title}
                          onChange={(lang, val) => handleChange('title', val, lang)}
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
                        <LocalizedInput
                          label="URL Slug"
                          value={formData.slug}
                          onChange={(val) => handleChange('slug', val)}
                          placeholder="amazing-travel-tips-for-egypt"
                          activeLanguage={activeLanguage}
                        />
                      </div>
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
                        <Label htmlFor="destination">Destination</Label>
                        <Select 
                          value={formData.destination || "none"} 
                          onValueChange={(value) => handleChange('destination', value === "none" ? "" : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Destination" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {destinations.map((dest) => (
                              <SelectItem key={dest._id} value={dest._id}>
                                {dest.name?.en || dest.name}
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
                      <LocalizedField
                        label="Intro"
                        value={formData.excerpt}
                        onChange={(lang, val) => handleChange('excerpt', val, lang)}
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

                <Card>
                  <CardHeader>
                    <CardTitle>Summary & Key Takeaways</CardTitle>
                    <CardDescription>Provide a quick overview and a final summary of the article</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <LocalizedField
                        label="Final Summary"
                        value={formData.summary}
                        onChange={(lang, val) => handleChange('summary', { ...(formData.summary || {}), [lang]: val })}
                        globalLanguage={activeLanguage}
                      >
                        {(lang, value, onChange) => (
                          <TagInput
                            tags={Array.isArray(value) ? value : (typeof value === 'string' ? value.split('\n').filter(Boolean) : [])}
                            onChange={onChange}
                            placeholder={`Add a summary bullet point in ${lang.toUpperCase()} and press Enter...`}
                            maxTags={20}
                          />
                        )}
                      </LocalizedField>
                      <p className="text-sm text-muted-foreground italic">Add final summary points for the article.</p>
                    </div>

                    <div className="space-y-2">
                      <LocalizedField
                        label="Key Takeaways"
                        value={formData.keyTakeaways}
                        onChange={(lang, val) => handleChange('keyTakeaways', { ...(formData.keyTakeaways || {}), [lang]: val })}
                        globalLanguage={activeLanguage}
                      >
                        {(lang, value, onChange) => (
                          <TagInput
                            tags={Array.isArray(value) ? value : (typeof value === 'string' ? value.split('\n').filter(Boolean) : [])}
                            onChange={onChange}
                            placeholder={`Add a key takeaway in ${lang.toUpperCase()} and press Enter...`}
                            maxTags={10}
                          />
                        )}
                      </LocalizedField>
                      <p className="text-sm text-muted-foreground italic">Add main points that readers should remember.</p>
                    </div>
                  </CardContent>
                </Card>

                <ContentBlockEditor
                  blocks={formData.contentBlocks}
                  onChange={(updatedBlocks: any[]) => {
                    handleChange('contentBlocks', updatedBlocks);
                  }}
                  onImageUpload={handleImageUpload}
                  activeLanguage={activeLanguage}
                />

                <FaqManager
                  faqs={formData.faqs || []}
                  onChange={(faqs) => handleChange('faqs', faqs)}
                  activeLanguage={activeLanguage}
                />

                <Card>
                  <CardHeader>
                    <CardTitle>Related Articles</CardTitle>
                    <CardDescription>Recommended: 3-8 highly relevant articles.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedRelatedPosts.map((selectedPostId, index) => (
                      <div key={`${selectedPostId}-${index}`} className="flex flex-col gap-2 md:flex-row md:items-end">
                        <div className="flex-1 space-y-2">
                          <Label>Related Article {index + 1}</Label>
                          <Select
                            value={selectedPostId}
                            onValueChange={(value) => handleRelatedPostChange(index, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select article" />
                            </SelectTrigger>
                            <SelectContent>
                              {relatedPostOptions
                                .filter((post) => post._id || post.id)
                                .map((post) => {
                                  const postId = post._id || post.id;
                                  const isSelectedInAnotherRow = selectedRelatedPosts.some(
                                    (selectedId, selectedIndex) =>
                                      selectedIndex !== index && selectedId === postId
                                  );

                                  return (
                                    <SelectItem
                                      key={postId}
                                      value={postId}
                                      disabled={isSelectedInAnotherRow}
                                    >
                                      {getLocalizedValue(post.title, activeLanguage) ||
                                        getLocalizedValue(post.title, 'en') ||
                                        'Untitled blog'}
                                    </SelectItem>
                                  );
                                })}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleRemoveRelatedPost(index)}
                          className="shrink-0"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ))}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddRelatedPost}
                        disabled={!relatedPostOptions.some((post) => {
                          const postId = post._id || post.id;
                          return postId && !selectedRelatedPosts.includes(postId);
                        })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Related Article
                      </Button>
                      {selectedRelatedPosts.length > 8 && (
                        <p className="text-sm text-amber-700">
                          You can add more, but 3-8 highly relevant articles is usually best.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Related Tours</CardTitle>
                    <CardDescription>Recommended: 3-8 highly relevant tours.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedRelatedTours.map((selectedTourId, index) => (
                      <div key={`${selectedTourId}-${index}`} className="flex flex-col gap-2 md:flex-row md:items-end">
                        <div className="flex-1 space-y-2">
                          <Label>Related Tour {index + 1}</Label>
                          <Select
                            value={selectedTourId}
                            onValueChange={(value) => handleRelatedTourChange(index, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select tour" />
                            </SelectTrigger>
                            <SelectContent>
                              {relatedTourOptions
                                .filter((tour) => tour._id || tour.id)
                                .map((tour) => {
                                  const tourId = tour._id || tour.id;
                                  const isSelectedInAnotherRow = selectedRelatedTours.some(
                                    (selectedId, selectedIndex) =>
                                      selectedIndex !== index && selectedId === tourId
                                  );

                                  return (
                                    <SelectItem
                                      key={tourId}
                                      value={tourId}
                                      disabled={isSelectedInAnotherRow}
                                    >
                                      {getLocalizedValue(tour.heading || tour.name, activeLanguage) ||
                                        getLocalizedValue(tour.heading || tour.name, 'en') ||
                                        'Untitled tour'}
                                    </SelectItem>
                                  );
                                })}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleRemoveRelatedTour(index)}
                          className="shrink-0"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ))}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddRelatedTour}
                        disabled={!relatedTourOptions.some((tour) => {
                          const tourId = tour._id || tour.id;
                          return tourId && !selectedRelatedTours.includes(tourId);
                        })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Related Tour
                      </Button>
                      {selectedRelatedTours.length > 8 && (
                        <p className="text-sm text-amber-700">
                          You can add more, but 3-8 highly relevant tours is usually best.
                        </p>
                      )}
                    </div>
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
                            title: { en: '', de: '', it: '', es: '' },
                            alt:   { en: '', de: '', it: '', es: '' },
                          });
                        }
                      }}
                      onRemove={(index) => {
                        handleChange('featuredImage', {
                          url: '',
                          fileName: '',
                          title: { en: '', de: '', it: '', es: '' },
                          alt:   { en: '', de: '', it: '', es: '' },
                        });
                      }}
                      onUpdate={(index, field, value, lang) => {
                        handleChange(`featuredImage.${field}`, value, lang);
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
                        <LocalizedField
                          label="Meta Title"
                          value={formData.metaTitle}
                          onChange={(lang, val) => handleChange('metaTitle', val, lang)}
                          globalLanguage={activeLanguage}
                        >
                          {(lang, value, onChange) => (
                            <Input
                              id="metaTitle"
                              value={value}
                              onChange={(e) => onChange(e.target.value)}
                              placeholder="SEO title"
                            />
                          )}
                        </LocalizedField>
                      </div>
                      <div className="space-y-2">
                        <LocalizedTagsInput
                          label="Meta Keywords"
                          value={formData.metaKeywords}
                          onChange={(val) => handleChange('metaKeywords', val)}
                          placeholder="Add a keyword and press Enter..."
                          activeLanguage={activeLanguage}
                        />
                        <p className="text-sm text-muted-foreground italic">Type and press Enter to add keywords.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <LocalizedField
                        label="Meta Description"
                        value={formData.metaDescription}
                        onChange={(lang, val) => handleChange('metaDescription', val, lang)}
                        globalLanguage={activeLanguage}
                      >
                        {(lang, value, onChange) => (
                            <Textarea
                              id="metaDescription"
                              value={value}
                              onChange={(e) => onChange(e.target.value)}
                              placeholder={`SEO description in ${lang.toUpperCase()}`}
                              rows={3}
                            />
                        )}
                      </LocalizedField>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <LocalizedField
                          label="OG Title (social sharing)"
                          value={formData.ogTitle}
                          onChange={(lang, val) => handleChange('ogTitle', val, lang)}
                          globalLanguage={activeLanguage}
                        >
                          {(lang, value, onChange) => (
                            <Input
                              id="ogTitle"
                              value={value}
                              onChange={(e) => onChange(e.target.value)}
                              placeholder={`Empty = inherits Meta Title (${lang.toUpperCase()})`}
                            />
                          )}
                        </LocalizedField>
                        <p className="text-sm text-muted-foreground italic">Shown when shared on Facebook/WhatsApp. Each language inherits its own Meta Title when left empty.</p>
                      </div>
                      <div className="space-y-2">
                        <LocalizedField
                          label="OG Description (social sharing)"
                          value={formData.ogDescription}
                          onChange={(lang, val) => handleChange('ogDescription', val, lang)}
                          globalLanguage={activeLanguage}
                        >
                          {(lang, value, onChange) => (
                            <Textarea
                              id="ogDescription"
                              value={value}
                              onChange={(e) => onChange(e.target.value)}
                              placeholder={`Empty = inherits Meta Description (${lang.toUpperCase()})`}
                              rows={3}
                            />
                          )}
                        </LocalizedField>
                      </div>
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
                              title: { en: '', de: '', it: '', es: '' },
                              alt:   { en: '', de: '', it: '', es: '' },
                            });
                          }
                        }}
                        onRemove={() => {
                          handleChange('metaImage', {
                            url: '',
                            fileName: '',
                            title: { en: '', de: '', it: '', es: '' },
                            alt:   { en: '', de: '', it: '', es: '' },
                          });
                        }}
                        onUpdate={(index, field, value, lang) => {
                          handleChange(`metaImage.${field}`, value, lang);
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

                    <div className="space-y-2">
                        <Label htmlFor="author">Author</Label>
                        <Select 
                          value={formData.author || ""} 
                          onValueChange={(value) => handleChange('author', value)}
                        >
                          <SelectTrigger id="author">
                            <SelectValue placeholder="Select Author" />
                          </SelectTrigger>
                          <SelectContent>
                            {authors.map((author) => (
                              <SelectItem key={author.id} value={author.id}>
                                {author.name} ({author.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {getFieldError('author') && (
                          <p className="text-sm text-destructive mt-1">{getFieldError('author')}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editorialAuthor">Editorial Author (public)</Label>
                        <Select
                          value={formData.editorialAuthor || ""}
                          onValueChange={(value) => handleChange('editorialAuthor', value)}
                        >
                          <SelectTrigger id="editorialAuthor">
                            <SelectValue placeholder="Select the public article author" />
                          </SelectTrigger>
                          <SelectContent>
                            {editorialAuthors.map((author) => (
                              <SelectItem key={author._id} value={author._id}>
                                {author.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Controls the linked name and the author box shown to visitors.</p>
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
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void performUpdate(true)}
          >
            <Save className="w-4 h-4 mr-2" />
            Update & Continue
          </Button>
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
