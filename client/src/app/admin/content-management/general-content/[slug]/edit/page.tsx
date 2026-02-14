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
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    subtitle: '',
    content: '',
    isActive: true
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setFetching(true);
        const data = await generalContentService.getBySlug(slug);
        setFormData({
          slug: data.slug,
          title: data.title,
          subtitle: data.subtitle || '',
          content: data.content,
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
                <Label htmlFor="title">Display Title</Label>
                <Input 
                  id="title"
                  placeholder="e.g. Egypt Day Tours Introduction"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                <Input 
                  id="subtitle"
                  placeholder="e.g. Experience the magic of ancient Egypt"
                  value={formData.subtitle}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Main Content (HTML)</Label>
                <div className="min-h-[400px]">
                  <RichTextEditor 
                    value={formData.content}
                    onChange={(val) => handleChange('content', val)}
                  />
                </div>
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
