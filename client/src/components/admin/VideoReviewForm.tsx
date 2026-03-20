'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, Loader2, Save, Youtube, Info, 
  MapPin, Hash, CheckCircle2, Play 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { videoReviewService, VideoReviewItem } from '@/services/videoReviewService';
import Link from 'next/link';
import Image from 'next/image';
import AdminLanguageTabs, { AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedField from '@/components/admin/LocalizedField';

interface VideoReviewFormProps {
  initialData?: VideoReviewItem;
  isEdit?: boolean;
}

export default function VideoReviewForm({ initialData, isEdit }: VideoReviewFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');
  
  // Map legacy string data to localized objects if needed
  const mapToLocalized = (val: any) => {
    if (typeof val === 'string') return { en: val, de: '', it: '', es: '' };
    return val || { en: '', de: '', it: '', es: '' };
  };

  const [formData, setFormData] = useState({
    title: mapToLocalized(initialData?.title),
    url: initialData?.url || '',
    tourName: mapToLocalized(initialData?.tourName),
    order: initialData?.order || 0,
    isActive: initialData?.isActive ?? true,
  });

  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    // Extract video ID for preview
    const extractId = (url: string) => {
      if (!url) return null;
      const trimmed = url.trim();
      const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
      if (shortMatch?.[1]) return shortMatch[1];
      const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
      if (watchMatch?.[1]) return watchMatch[1];
      const embedMatch = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{6,})/);
      if (embedMatch?.[1]) return embedMatch[1];
      const shortsMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/);
      if (shortsMatch?.[1]) return shortsMatch[1];
      return null;
    };
    setPreviewId(extractId(formData.url));
  }, [formData.url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.en || !formData.url || !formData.tourName.en) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in English Title, URL, and English Tour Name.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await videoReviewService.upsert({
        ...formData,
        id: initialData?._id
      });

      toast({
        title: 'Success',
        description: `Video review ${isEdit ? 'updated' : 'created'} successfully`,
        variant: 'success',
      });
      router.push('/admin/content-management/video-management');
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save video review',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-4xl mx-auto pb-20'>
      <div className='flex items-center justify-between mb-8'>
        <div className='flex items-center gap-4'>
          <Link 
            href='/admin/content-management/video-management'
            className='h-10 w-10 flex border rounded-xl items-center justify-center text-gray-500 hover:text-[#b79c5c] hover:border-[#b79c5c] bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 transition-all font-medium text-sm'
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className='text-3xl font-black text-gray-900 dark:text-white'>
              {isEdit ? 'Edit Video Review' : 'Add New Video Review'}
            </h1>
            <p className='text-gray-500 dark:text-gray-400 font-medium'>
              Configure traveler testimonials for the "Reflective Reviews" section
            </p>
          </div>
        </div>
        <div className="mb-6">
          <AdminLanguageTabs activeLanguage={activeLanguage} onLanguageChange={setActiveLanguage} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Content */}
        <div className='lg:col-span-2 space-y-6'>
          <div className='bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm'>
            <div className='flex items-center gap-3 mb-6'>
               <div className='w-10 h-10 rounded-xl bg-[#b79c5c]/10 flex items-center justify-center'>
                  <Info className='text-[#b79c5c]' size={20} />
               </div>
               <h3 className='text-lg font-bold text-gray-900 dark:text-gray-100'>General Information</h3>
            </div>

            <div className='space-y-6'>
              <div>
                <LocalizedField
                  label="Review Title"
                  value={formData.title}
                  globalLanguage={activeLanguage}
                  onChange={(lang, val) => setFormData({ ...formData, title: { ...formData.title, [lang]: val } })}
                >
                  {(lang, currentValue, handleLang) => (
                    <input 
                      type='text'
                      value={currentValue || ''}
                      onChange={e => handleLang(e.target.value)}
                      className='w-full px-5 py-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-slate-900 focus:border-[#b79c5c] outline-none transition-all font-medium'
                      placeholder={`Title in ${lang}`}
                    />
                  )}
                </LocalizedField>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <LocalizedField
                    label="Tour Name"
                    value={formData.tourName}
                    globalLanguage={activeLanguage}
                    onChange={(lang, val) => setFormData({ ...formData, tourName: { ...formData.tourName, [lang]: val } })}
                  >
                    {(lang, currentValue, handleLang) => (
                      <div className='relative'>
                        <MapPin className='absolute left-4 top-3.5 text-gray-300' size={18} />
                        <input 
                          type='text'
                          value={currentValue || ''}
                          onChange={e => handleLang(e.target.value)}
                          className='w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-slate-900 focus:border-[#b79c5c] outline-none transition-all font-medium text-sm'
                          placeholder={`Tour Name in ${lang}`}
                        />
                      </div>
                    )}
                  </LocalizedField>
                </div>

                <div>
                  <label className='block text-xs font-black uppercase tracking-widest text-gray-400 mb-2'>
                    Display Order
                  </label>
                  <div className='relative'>
                    <Hash className='absolute left-4 top-3.5 text-gray-300' size={18} />
                    <input 
                      type='number'
                      value={formData.order}
                      onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                      className='w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-slate-900 focus:border-[#b79c5c] outline-none transition-all font-medium text-sm'
                      placeholder='0'
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className='block text-xs font-black uppercase tracking-widest text-gray-400 mb-2'>
                  YouTube URL <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                   <Youtube className='absolute left-4 top-3.5 text-red-500/50' size={18} />
                   <input 
                    type='text'
                    value={formData.url}
                    onChange={e => setFormData({...formData, url: e.target.value})}
                    className='w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-slate-900 focus:border-[#b79c5c] outline-none transition-all font-medium text-sm'
                    placeholder='https://www.youtube.com/watch?v=...'
                    required
                  />
                </div>
                <p className='mt-2 text-[11px] text-gray-400 font-medium italic'>Supports watch links, shorts, and youtu.be short links.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Status Card */}
          <div className='bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm'>
            <label className='flex items-center gap-3 cursor-pointer group'>
              <input 
                type='checkbox'
                className='hidden'
                checked={formData.isActive}
                onChange={e => setFormData({...formData, isActive: e.target.checked})}
              />
              <div className={`w-14 h-7 rounded-full transition-all relative ${formData.isActive ? 'bg-[#b79c5c]' : 'bg-gray-200 dark:bg-slate-700'}`}>
                 <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.isActive ? 'left-8' : 'left-1'}`}></div>
              </div>
              <span className='font-bold text-sm text-gray-700 dark:text-gray-300'>
                {formData.isActive ? 'Enabled' : 'Disabled'}
              </span>
            </label>
            <p className='mt-3 text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed'>
              When enabled, this video will appear automatically in the "Reflective Reviews" sections of the website.
            </p>
          </div>

          {/* Preview Card */}
          <div className='bg-[#1a1a1a] rounded-[2rem] border border-gray-800 p-6 shadow-xl relative overflow-hidden'>
             <div className='absolute top-0 right-0 p-4 opacity-10'>
                <Youtube size={60} color='white' />
             </div>
             <h4 className='text-white/40 uppercase text-[10px] font-black tracking-widest mb-4'>Live Preview</h4>
             
             {previewId ? (
               <div className='aspect-video rounded-2xl overflow-hidden border border-white/10 relative'>
                 <Image 
                   src={`https://img.youtube.com/vi/${previewId}/maxresdefault.jpg`}
                   alt='Preview'
                   fill
                   className='object-cover'
                 />
                 <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30'>
                       <Play fill='white' size={18} />
                    </div>
                 </div>
               </div>
             ) : (
               <div className='aspect-video rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center p-4'>
                 <Youtube className='text-white/20 mb-2' size={32} />
                 <p className='text-white/30 text-xs font-medium'>Enter a valid YouTube URL to see preview</p>
               </div>
             )}

             <div className='mt-5'>
                <p className='text-white font-bold text-sm truncate'>
                  {typeof formData.title === 'string' ? formData.title : (formData.title[activeLanguage] || formData.title.en || 'Review Title Here')}
                </p>
                <p className='text-[#b79c5c] text-[10px] font-black uppercase tracking-widest mt-1'>
                  {typeof formData.tourName === 'string' ? formData.tourName : (formData.tourName[activeLanguage] || formData.tourName.en || 'Tour Location')}
                </p>
              </div>
          </div>

          <button 
            type='submit'
            disabled={loading}
            className='w-full py-4 rounded-[1.5rem] bg-[#1a1a1a] text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-[#b79c5c] transition-all disabled:opacity-50 shadow-lg'
          >
            {loading ? <Loader2 className='animate-spin' size={18} /> : <Save size={18} />}
            {isEdit ? 'Update Review' : 'Publish Review'}
          </button>
        </div>
      </form>

      <style jsx global>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
