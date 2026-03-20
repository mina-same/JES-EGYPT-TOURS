'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Save, Loader2, Info, Layout, 
  Type, Tag, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generalContentService } from '@/services/generalContentService';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AdminLanguageTabs, { AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedField from '@/components/admin/LocalizedField';

interface EditProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function EditGeneralContentPage({ params }: EditProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { slug } = use(params);
  
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');
  const [formData, setFormData] = useState({
    slug: '',
    title: { en: '', de: '', it: '', es: '' },
    subtitle: { en: '', de: '', it: '', es: '' },
    content: { en: '', de: '', it: '', es: '' },
    isActive: true
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setFetching(true);
        const data = await generalContentService.getBySlug(slug);
        
        // Map legacy string data to localized objects if needed
        const mapToLocalized = (val: any) => {
          if (typeof val === 'string') return { en: val, de: '', it: '', es: '' };
          return val || { en: '', de: '', it: '', es: '' };
        };

        setFormData({
          slug: data.slug,
          title: mapToLocalized(data.title),
          subtitle: mapToLocalized(data.subtitle),
          content: mapToLocalized(data.content),
          isActive: data.isActive
        });
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to fetch content',
          variant: 'destructive'
        });
        router.push('/admin/content-management/general-content');
      } finally {
        setFetching(false);
      }
    };

    fetchContent();
  }, [slug]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.en || !formData.content.en) {
      toast({
        title: 'Validation Error',
        description: 'English Title and English Content are required.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      await generalContentService.upsert(formData);
      toast({
        title: 'Success',
        description: 'Content block updated successfully',
        variant: 'success'
      });
      router.push('/admin/content-management/general-content');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update content',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-10 h-10 animate-spin text-[#b79c5c] mb-4" />
        <p className="text-gray-500 font-medium">Loading content data...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/content-management/general-content">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Block: {formData.slug}</h1>
            <p className="text-gray-500 mt-1">Update existing HTML content block</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#b79c5c] hover:bg-[#a08a50]">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Update Changes
          </Button>
        </div>
      </div>
      <AdminLanguageTabs activeLanguage={activeLanguage} onLanguageChange={setActiveLanguage} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-[#b79c5c] mb-2">
              <Type className="w-5 h-5" />
              <h3 className="font-bold">Content Details</h3>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <LocalizedField
                  label="Display Title"
                  value={formData.title}
                  globalLanguage={activeLanguage}
                  onChange={(lang, val) => handleChange('title', { ...formData.title, [lang]: val })}
                >
                  {(lang, currentValue, handleLang) => (
                    <Input 
                      placeholder={`Title in ${lang}`}
                      value={currentValue || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLang(e.target.value)}
                    />
                  )}
                </LocalizedField>
              </div>

              <div className="space-y-2">
                <LocalizedField
                  label="Subtitle (Optional)"
                  value={formData.subtitle}
                  globalLanguage={activeLanguage}
                  onChange={(lang, val) => handleChange('subtitle', { ...formData.subtitle, [lang]: val })}
                >
                  {(lang, currentValue, handleLang) => (
                    <Input 
                      placeholder={`Subtitle in ${lang}`}
                      value={currentValue || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLang(e.target.value)}
                    />
                  )}
                </LocalizedField>
              </div>

              <div className="space-y-2">
                <LocalizedField
                  label="Main Content (HTML)"
                  value={formData.content}
                  globalLanguage={activeLanguage}
                  onChange={(lang, val) => handleChange('content', { ...formData.content, [lang]: val })}
                >
                  {(lang, currentValue, handleLang) => (
                    <div className="min-h-[400px]">
                      <RichTextEditor 
                        value={currentValue || ''}
                        onChange={(val: string) => handleLang(val)}
                      />
                    </div>
                  )}
                </LocalizedField>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-[#b79c5c] mb-2">
              <Layout className="w-5 h-5" />
              <h3 className="font-bold">Settings</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug" className="flex items-center gap-2">
                  <Tag className="w-3 h-3" /> System Slug
                </Label>
                <Input 
                  id="slug"
                  value={formData.slug}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-[10px] text-gray-400">System slugs cannot be changed once created to maintain links.</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label>Active Status</Label>
                  <p className="text-xs text-gray-500">Show/hide content on the site</p>
                </div>
                <Switch 
                  checked={formData.isActive}
                  onCheckedChange={(val) => handleChange('isActive', val)}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#fcf8f0] p-6 rounded-xl border border-[#f3e5c2] space-y-3">
            <div className="flex items-center gap-2 text-[#8a6d3b]">
              <Info className="w-4 h-4" />
              <h4 className="font-bold text-sm">Deployment</h4>
            </div>
            <p className="text-xs text-[#8a6d3b] leading-relaxed">
              Updating this block will instantly reflect across the website wherever the slug 
              <strong> "{formData.slug}"</strong> is used.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}