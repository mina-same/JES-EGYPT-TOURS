'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { destinationAPI, blogAPI } from '@/lib/api/blogAdmin';
import { uploadAPI } from '@/lib/api/upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, Save, Loader2, LayoutDashboard, 
  ImageIcon, HelpCircle, Settings, MapPin, 
  Star, Globe, Share2, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import LocalizedInput from '@/components/admin/LocalizedInput';
import LocalizedTextArea from '@/components/admin/LocalizedTextArea';
import LocalizedTagsInput from '@/components/admin/LocalizedTagsInput';
import LocalizedRichText from '@/components/admin/LocalizedRichText';
import FaqManager from '@/components/admin/FaqManager';
import AdminLanguageTabs, { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import ImageUpload from '@/components/admin/ImageUpload';
import { useToast } from '@/hooks/use-toast';

const TABS = [
  { id: 'overview', label: 'Basic Info', icon: LayoutDashboard },
  { id: 'sections', label: 'Hero Section', icon: ImageIcon },
  { id: 'glance', label: 'At a Glance', icon: MapPin },
  { id: 'content', label: 'Featured Blogs', icon: Star },
  { id: 'faq', label: 'FAQs', icon: HelpCircle },
  { id: 'seo', label: 'SEO & Meta', icon: Settings },
];

const EMPTY_LOCALIZED = { en: '', de: '', it: '', es: '' };

const INITIAL_FORM = {
  name: { ...EMPTY_LOCALIZED },
  slug: { ...EMPTY_LOCALIZED },
  subheader: { ...EMPTY_LOCALIZED },
  description: { ...EMPTY_LOCALIZED },
  region: { ...EMPTY_LOCALIZED },
  coverImage: undefined as any,
  heroTitle: { ...EMPTY_LOCALIZED },
  heroDescription: { en: '', de: '', it: '', es: '' } as any,
  bestFor: { ...EMPTY_LOCALIZED },
  combinesWith: { ...EMPTY_LOCALIZED },
  timeNeeded: { ...EMPTY_LOCALIZED },
  bestSeason: { ...EMPTY_LOCALIZED },
  featuredBlogs: [] as string[],
  featuredBlogsSectionTitle: { ...EMPTY_LOCALIZED },
  faqsSectionTitle: { ...EMPTY_LOCALIZED },
  faqs: [] as any[],
  metaTitle: { ...EMPTY_LOCALIZED },
  metaDescription: { ...EMPTY_LOCALIZED },
  metaKeywords: { en: [], de: [], it: [], es: [] } as any,
  metaImage: undefined as any,
  ogTitle: { ...EMPTY_LOCALIZED },
  ogDescription: { ...EMPTY_LOCALIZED },
  ogImage: '',
  noIndex: false,
  noFollow: false,
  isActive: true,
};

export default function DestinationFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const isEditing = !!editId;

  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [allBlogs, setAllBlogs] = useState<any[]>([]);
  const [blogSearch, setBlogSearch] = useState('');
  const [formData, setFormData] = useState<typeof INITIAL_FORM>({ ...INITIAL_FORM });

  // Load for edit
  useEffect(() => {
    if (editId) {
      setLoading(true);
      destinationAPI.getById(editId).then(res => {
        if (res.success && res.data) {
          const d = res.data;
          setFormData({
            name: d.name || EMPTY_LOCALIZED,
            slug: d.slug || EMPTY_LOCALIZED,
            subheader: d.subheader || EMPTY_LOCALIZED,
            description: d.description || EMPTY_LOCALIZED,
            region: d.region || EMPTY_LOCALIZED,
            coverImage: d.coverImage || undefined,
            heroTitle: d.heroTitle || EMPTY_LOCALIZED,
            heroDescription: d.heroDescription || { en: '', de: '', it: '', es: '' },
            bestFor: d.bestFor || EMPTY_LOCALIZED,
            combinesWith: d.combinesWith || EMPTY_LOCALIZED,
            timeNeeded: d.timeNeeded || EMPTY_LOCALIZED,
            bestSeason: d.bestSeason || EMPTY_LOCALIZED,
            featuredBlogs: (d.featuredBlogs || []).map((b: any) => b._id || b),
            featuredBlogsSectionTitle: d.featuredBlogsSectionTitle || EMPTY_LOCALIZED,
            faqsSectionTitle: d.faqsSectionTitle || EMPTY_LOCALIZED,
            faqs: d.faqs || [],
            metaTitle: d.metaTitle || EMPTY_LOCALIZED,
            metaDescription: d.metaDescription || EMPTY_LOCALIZED,
            metaKeywords: d.metaKeywords || { en: [], de: [], it: [], es: [] },
            metaImage: d.metaImage || undefined,
            ogTitle: d.ogTitle || EMPTY_LOCALIZED,
            ogDescription: d.ogDescription || EMPTY_LOCALIZED,
            ogImage: d.ogImage || '',
            noIndex: d.noIndex || false,
            noFollow: d.noFollow || false,
            isActive: d.isActive ?? true,
          });
        }
      }).catch(() => toast({ title: 'Error', description: 'Failed to load destination', variant: 'destructive' }))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  // Load blogs for picker
  useEffect(() => {
    blogAPI.getAll({ limit: 200, status: 'published' }).then(res => {
      setAllBlogs(res.data || []);
    }).catch(() => {});
  }, []);

  const handleChange = (path: string, value: any, lang?: AdminLanguage) => {
    setFormData(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let obj: any = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      const lastKey = keys[keys.length - 1];
      if (lang) {
        obj[lastKey] = { ...(obj[lastKey] || {}), [lang]: value };
      } else {
        obj[lastKey] = value;
      }
      return updated;
    });
  };

  const handleUpload = async (file: File): Promise<{ url: string; fileName: string } | null> => {
    try {
      const res = await uploadAPI.uploadFile(file);
      return res.success ? { url: res.data.url, fileName: res.data.fileName || file.name } : null;
    } catch { return null; }
  };

  const autoSlug = () => {
    const name = formData.name.en;
    if (name && !formData.slug.en) {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      handleChange('slug.en', slug);
    }
  };

  const toggleBlog = (blogId: string) => {
    setFormData(prev => ({
      ...prev,
      featuredBlogs: prev.featuredBlogs.includes(blogId)
        ? prev.featuredBlogs.filter(id => id !== blogId)
        : [...prev.featuredBlogs, blogId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.en) {
      toast({ title: 'Validation Error', description: 'English name is required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // Utility to clean empty localized objects to prevent Mongoose validation errors
      const cleanData = (obj: any): any => {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
        
        // If it's a localized object, check if it's empty
        if ('en' in obj && Object.keys(obj).every(k => ['en', 'de', 'it', 'es'].includes(k))) {
          const hasContent = Object.values(obj).some(v => 
            (typeof v === 'string' && v.trim().length > 0) || 
            (Array.isArray(v) && v.length > 0) ||
            (v && typeof v === 'object' && Object.keys(v).length > 0)
          );
          return hasContent ? obj : undefined;
        }

        // Recursively clean
        const cleaned: any = {};
        Object.entries(obj).forEach(([key, value]) => {
          const cleanedVal = cleanData(value);
          if (cleanedVal !== undefined) {
            cleaned[key] = cleanedVal;
          }
        });
        return cleaned;
      };

      const dataToSubmit = cleanData({ ...formData });
      const internalFields = ['_id', '__v', 'createdAt', 'updatedAt', 'id'];
      internalFields.forEach(field => delete (dataToSubmit as any)[field]);

      // Ensure featuredBlogs only contains valid strings
      if (Array.isArray(dataToSubmit.featuredBlogs)) {
        dataToSubmit.featuredBlogs = dataToSubmit.featuredBlogs.filter((id: any) => id && typeof id === 'string');
      }

      const res = isEditing
        ? await destinationAPI.update(editId!, dataToSubmit)
        : await destinationAPI.create(dataToSubmit);

      if (res.success) {
        toast({ title: isEditing ? 'Updated!' : 'Created!', description: `Destination "${formData.name.en}" saved.` });
        router.push('/admin/destinations');
      } else {
        toast({ 
          title: 'Error', 
          description: res.message || res.error || 'Something went wrong', 
          variant: 'destructive' 
        });
      }
    } catch (err: any) {
      console.error('Save error details:', err.response?.data || err);
      const serverMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      toast({ title: 'Error', description: serverMsg || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filteredBlogs = useMemo(() => {
    return allBlogs.filter(b =>
      !blogSearch || (b.title?.en || '').toLowerCase().includes(blogSearch.toLowerCase())
    );
  }, [allBlogs, blogSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="max-full space-y-6 pb-24 px-6 pt-6">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/destinations">
              <Button type="button" variant="outline" size="icon" className="rounded-full">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isEditing ? 'Edit Destination' : 'New Destination'}
              </h1>
              <p className="text-gray-500 mt-1">
                {isEditing ? `Editing ${formData.name.en || 'Destination'}` : 'Add a new location to your travel network'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
              <Switch
                checked={formData.isActive}
                onCheckedChange={v => handleChange('isActive', v)}
                id="isActive"
              />
              <Label htmlFor="isActive" className="text-sm font-bold cursor-pointer">
                {formData.isActive ? 'Active' : 'Inactive'}
              </Label>
            </div>
            <Button type="submit" disabled={saving} className="bg-primary hover:opacity-90 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-primary/20 gap-2">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving Changes...' : 'Save Destination'}
            </Button>
          </div>
        </div>

        {/* Language & Section Tabs Container */}
        <div className="space-y-6">
          {/* Language Selector */}
          <AdminLanguageTabs
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
          />

          {/* Tabs Navigation */}
          <div className="flex overflow-x-auto gap-2 border-b border-gray-200 dark:border-slate-800">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-t-xl text-sm font-bold transition-all whitespace-nowrap relative",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-white dark:bg-slate-900 z-10"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          <AnimatePresence mode="wait">

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                  <CardContent className="space-y-5">
                    <LocalizedInput
                      label="Destination Name *"
                      value={formData.name}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('name', val)}
                      onBlur={autoSlug}
                      placeholder="e.g. Luxor"
                      required
                    />
                    <LocalizedInput
                      label="Slug (URL)"
                      value={formData.slug}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('slug', val)}
                      placeholder="e.g. luxor"
                    />
                    <LocalizedInput
                      label="Region"
                      value={formData.region}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('region', val)}
                      placeholder="e.g. Upper Egypt"
                    />
                    <LocalizedTextArea
                      label="Subheader (shown under h1 in hero)"
                      value={formData.subheader}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('subheader', val)}
                      placeholder="A brief tagline for this destination"
                      rows={2}
                    />
                    <LocalizedTextArea
                      label="Description"
                      value={formData.description}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('description', val)}
                      placeholder="Short description of the destination"
                      rows={3}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Cover Image</CardTitle></CardHeader>
                  <CardContent>
                    <ImageUpload
                      images={formData.coverImage ? [formData.coverImage] : []}
                      onAdd={() => handleChange('coverImage', { url: '', fileName: '', title: { ...EMPTY_LOCALIZED }, alt: { ...EMPTY_LOCALIZED } })}
                      onRemove={() => handleChange('coverImage', undefined)}
                      onUpdate={(_, field, value, lang) => handleChange(`coverImage.${field}`, value, lang)}
                      onUpload={async (file) => handleUpload(file)}
                      title="Cover Image"
                      description="Main hero image for this destination"
                      maxImages={1}
                      activeLanguage={activeLanguage}
                      addButtonLabel="Add Cover Image"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── PAGE SECTIONS TAB ── */}
            {activeTab === 'sections' && (
              <motion.div key="sections" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>Hero Section</CardTitle></CardHeader>
                  <CardContent className="space-y-5">
                    <LocalizedInput
                      label="Hero Title (h2)"
                      value={formData.heroTitle}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('heroTitle', val)}
                      placeholder="e.g. Discover Ancient Luxor"
                    />
                    <LocalizedRichText
                      label="Hero Description"
                      value={formData.heroDescription}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('heroDescription', val)}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── AT A GLANCE TAB ── */}
            {activeTab === 'glance' && (
              <motion.div key="glance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>At a Glance</CardTitle>
                    <p className="text-sm text-gray-500">These 4 fields appear as icon cards on the destination page.</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <LocalizedInput
                      label="🏆 Best For"
                      value={formData.bestFor}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('bestFor', val)}
                      placeholder="e.g. History lovers, Archaeology"
                    />
                    <LocalizedInput
                      label="🤝 Combines With"
                      value={formData.combinesWith}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('bestFor', val)}
                      placeholder="e.g. Aswan, Nile Cruise"
                    />
                    <LocalizedInput
                      label="⏱ Time Needed"
                      value={formData.timeNeeded}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('timeNeeded', val)}
                      placeholder="e.g. 2–3 days"
                    />
                    <LocalizedInput
                      label="🌤 Best Season"
                      value={formData.bestSeason}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('bestSeason', val)}
                      placeholder="e.g. October – April"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── CONTENT TAB ── */}
            {activeTab === 'content' && (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Featured Blogs</CardTitle>
                    <p className="text-sm text-gray-500">Select articles to feature prominently on this destination page.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <LocalizedInput
                      label="Featured Section Title"
                      value={formData.featuredBlogsSectionTitle}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('featuredBlogsSectionTitle', val)}
                      placeholder="e.g. Must-Read Luxor Articles"
                    />
                    <div className="relative">
                      <Input
                        placeholder="Search blogs..."
                        value={blogSearch}
                        onChange={e => setBlogSearch(e.target.value)}
                        className="mb-3"
                      />
                    </div>
                    <div className="border rounded-xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800">
                      {filteredBlogs.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 py-8">No published blogs found.</p>
                      ) : filteredBlogs.map(blog => (
                        <label
                          key={blog._id}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-900"
                        >
                          <input
                            type="checkbox"
                            checked={formData.featuredBlogs.includes(blog._id)}
                            onChange={() => toggleBlog(blog._id)}
                            className="accent-primary w-4 h-4"
                          />
                          <div className="w-10 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            {blog.featuredImage?.url && (
                              <img src={blog.featuredImage.url} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
                            {blog.title?.en || 'Untitled'}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">{formData.featuredBlogs.length} blog(s) selected</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── FAQ TAB ── */}
            {activeTab === 'faq' && (
              <motion.div key="faq" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>Frequently Asked Questions</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <LocalizedInput
                      label="FAQ Section Title"
                      value={formData.faqsSectionTitle}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('faqsSectionTitle', val)}
                      placeholder="e.g. Common Questions About Luxor"
                    />
                    <FaqManager
                      faqs={formData.faqs}
                      onChange={faqs => handleChange('faqs', faqs)}
                      activeLanguage={activeLanguage}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── SEO TAB ── */}
            {activeTab === 'seo' && (
              <motion.div key="seo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>SEO Meta Tags</CardTitle></CardHeader>
                  <CardContent className="space-y-5">
                    <LocalizedInput
                      label="Meta Title"
                      value={formData.metaTitle}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('metaTitle', val)}
                      placeholder="SEO page title"
                    />
                    <LocalizedTextArea
                      label="Meta Description"
                      value={formData.metaDescription}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('metaDescription', val)}
                      placeholder="SEO meta description (max 160 chars)"
                      rows={3}
                    />
                    <LocalizedTagsInput
                      label="Meta Keywords"
                      value={formData.metaKeywords}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('metaKeywords', val)}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Open Graph</CardTitle></CardHeader>
                  <CardContent className="space-y-5">
                    <LocalizedInput
                      label="OG Title"
                      value={formData.ogTitle}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('ogTitle', val)}
                    />
                    <LocalizedTextArea
                      label="OG Description"
                      value={formData.ogDescription}
                      activeLanguage={activeLanguage}
                      onChange={(val) => handleChange('ogDescription', val)}
                      rows={2}
                    />
                    <div className="space-y-2">
                      <Label>Meta / Social Image</Label>
                      <ImageUpload
                        images={formData.metaImage ? [formData.metaImage] : []}
                        onAdd={() => handleChange('metaImage', { url: '', alt: { ...EMPTY_LOCALIZED } })}
                        onRemove={() => handleChange('metaImage', undefined)}
                        onUpdate={(_, field, value, lang) => handleChange(`metaImage.${field}`, value, lang)}
                        onUpload={async (file) => handleUpload(file)}
                        title="Meta / Social Image"
                        description="Used for SEO and social sharing previews"
                        maxImages={1}
                        activeLanguage={activeLanguage}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Indexing Control</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>No Index</Label>
                        <p className="text-xs text-gray-400">Prevent search engines from indexing this page</p>
                      </div>
                      <Switch checked={formData.noIndex} onCheckedChange={v => handleChange('noIndex', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>No Follow</Label>
                        <p className="text-xs text-gray-400">Prevent search engines from following links on this page</p>
                      </div>
                      <Switch checked={formData.noFollow} onCheckedChange={v => handleChange('noFollow', v)} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </form>
    </div>
  );
}
