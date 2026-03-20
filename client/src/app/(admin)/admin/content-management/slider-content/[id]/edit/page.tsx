'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Save,
  Upload,
  XCircle,
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { SliderItem } from '@/types/slider';
import { API_ENDPOINTS } from '@/config/api';
import { uploadAPI } from '@/lib/api/upload';
import AdminLanguageTabs, { AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedField from '@/components/admin/LocalizedField';

type SliderApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string | null;
};

const sliderAPI = {
  getById: async (id: string): Promise<SliderApiResponse<SliderItem>> => {
    const token = localStorage.getItem('authToken');
    if (!token) return { success: false, error: 'Missing auth token' };

    const response = await fetch(API_ENDPOINTS.SLIDER_CONTENT.ADMIN_BY_ID(id), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.success) {
      return { success: false, error: json?.message || json?.error || 'Failed to load slider item' };
    }

    return { success: true, data: json.data as SliderItem, error: null };
  },

  update: async (id: string, payload: Partial<SliderItem>): Promise<SliderApiResponse<SliderItem>> => {
    const token = localStorage.getItem('authToken');
    if (!token) return { success: false, error: 'Missing auth token' };

    const response = await fetch(API_ENDPOINTS.SLIDER_CONTENT.ADMIN_BY_ID(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.success) {
      return { success: false, error: json?.message || json?.error || 'Failed to update slider item' };
    }

    return { success: true, data: json.data as SliderItem, error: null };
  },
};

function getEmptySliderItem(id: string): SliderItem {
  const now = new Date().toISOString();
  return {
    _id: id,
    subtitle: { en: '', de: '', it: '', es: '' },
    title: { en: '', de: '', it: '', es: '' },
    titleSpan: { en: '', de: '', it: '', es: '' },
    titleEnd: { en: '', de: '', it: '', es: '' },
    image: {
      url: '',
      fileName: '',
      alt: { en: '', de: '', it: '', es: '' },
    },
    button: {
      text: { en: '', de: '', it: '', es: '' },
      link: '',
      linkDirection: '_self',
    },
    order: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

export default function EditSliderContentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const formRef = useRef<HTMLFormElement>(null);

  const id = params.id as string;

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SliderItem>(() => getEmptySliderItem(id));
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');

  const hasButton = useMemo(() => Boolean(formData.button), [formData.button]);

  useEffect(() => {
    const load = async () => {
      try {
        setInitialLoading(true);
        setError(null);

        const res = await sliderAPI.getById(id);
        if (!res.success || !res.data) {
          setError(res.error || 'Failed to load slider item');
          return;
        }

        const dbData = res.data;
        const stringToLocalized = (val: any) =>
          typeof val === 'string' ? { en: val, de: '', it: '', es: '' } : val || { en: '', de: '', it: '', es: '' };

        setFormData({
          ...dbData,
          subtitle: stringToLocalized(dbData.subtitle),
          title: stringToLocalized(dbData.title),
          titleSpan: stringToLocalized(dbData.titleSpan),
          titleEnd: stringToLocalized(dbData.titleEnd),
          button: dbData.button
            ? {
                ...dbData.button,
                text: stringToLocalized(dbData.button.text),
              }
            : undefined,
          image: {
            ...dbData.image,
            alt: stringToLocalized(dbData.image?.alt),
          },
        });
      } catch (e: any) {
        setError(e?.message || 'Failed to load slider item');
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  const updateField = (field: keyof SliderItem, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateImageField = (field: keyof SliderItem['image'], value: any) => {
    setFormData((prev) => ({
      ...prev,
      image: {
        ...prev.image,
        [field]: value,
      },
    }));
  };

  const toggleButton = (enabled: boolean) => {
    setFormData((prev) => {
      if (enabled) {
        return {
          ...prev,
          button: prev.button ?? { text: { en: '', de: '', it: '', es: '' }, link: '', linkDirection: '_self' },
        };
      }
      return { ...prev, button: undefined };
    });
  };

  const updateButtonField = (field: 'text' | 'link' | 'linkDirection', value: any) => {
    setFormData((prev) => ({
      ...prev,
      button: {
        text: prev.button?.text || { en: '', de: '', it: '', es: '' },
        link: prev.button?.link || '',
        linkDirection: prev.button?.linkDirection || '_self',
        [field]: value,
      },
    }));
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file size (max 2MB)
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const response = await uploadAPI.uploadFile(file);
      if (response.success && response.data?.url) {
        updateImageField('url', response.data.url);
        if (response.data.fileName) {
          updateImageField('fileName', response.data.fileName);
        }
        toast({
          title: 'Upload successful',
          description: 'Image uploaded successfully.',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Upload failed',
          description: response.error || 'Failed to upload image',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload error',
        description: 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    if (!formData.subtitle?.en?.trim()) return 'English Subtitle is required';
    if (!formData.title?.en?.trim()) return 'English Title is required';
    if (!formData.titleSpan?.en?.trim()) return 'English Title Span is required';
    if (!formData.titleEnd?.en?.trim()) return 'English Title End is required';
    if (!formData.image?.url?.trim()) return 'Main Image URL is required';
    if (Number.isNaN(Number(formData.order))) return 'Order must be a number';

    if (formData.button) {
      if (!formData.button.text?.en?.trim()) return 'English Button text is required (or disable the button)';
      if (!formData.button.link.trim()) return 'Button link is required (or disable the button)';
    }

    return null;
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const msg = validate();
    if (msg) {
      setError(msg);
      toast({
        title: 'Validation error',
        description: msg,
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload: Partial<SliderItem> = {
        subtitle: formData.subtitle,
        title: formData.title,
        titleSpan: formData.titleSpan,
        titleEnd: formData.titleEnd,
        order: Number(formData.order),
        isActive: Boolean(formData.isActive),
        image: {
          url: formData.image.url,
          fileName: formData.image.fileName,
          alt: formData.image.alt,
        },
        button: formData.button
          ? {
              text: formData.button.text,
              link: formData.button.link,
              linkDirection: formData.button.linkDirection,
            }
          : undefined,
      };

      const res = await sliderAPI.update(id, payload);
      if (!res.success) {
        const errMsg = res.error || 'Failed to update slider item';
        setError(errMsg);
        toast({
          title: 'Save failed',
          description: errMsg,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Saved',
        description: 'Slider item updated successfully.',
        variant: 'success',
      });

      router.push('/admin/content-management/slider-content');
    } catch (e: any) {
      const errMsg = e?.message || 'Failed to update slider item';
      setError(errMsg);
      toast({
        title: 'Save failed',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className='tailor-made-admin'>
        <div className='loading-state'>
          <Loader2 size={48} className='spinner' />
          <p>Loading slider item...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='tailor-made-admin'>
      <div className='admin-page-header'>
        <div>
          <div className='mb-2'>
          </div>
          <h1 className='admin-page-title'>Edit Slider Item</h1>
          <p className='admin-page-subtitle'>Update homepage slider content</p>
        </div>
        <div className='header-actions'>
          <button className='btn-refresh' onClick={() => router.push('/admin/content-management/slider-content')}>
            Cancel
          </button>
          <button
            className='btn-add-new'
            onClick={() => formRef.current?.requestSubmit()}
            disabled={saving}
            type='button'
          >
            {saving ? (
              <>
                <Loader2 size={18} className='spinning' />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <form ref={formRef} onSubmit={onSave} className='space-y-4'>
        <AdminLanguageTabs activeLanguage={activeLanguage} onLanguageChange={setActiveLanguage} />
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          <div className='rounded-xl border border-gray-200 bg-white p-4'>
            <div className='mb-3 text-sm font-semibold text-gray-900'>Text</div>

            <label className='block text-xs text-gray-600 mb-3'>
              <LocalizedField
                label='Subtitle'
                value={formData.subtitle}
                globalLanguage={activeLanguage}
                onChange={(lang, val) => updateField('subtitle', { ...formData.subtitle, [lang]: val })}
              >
                {(lang, currentValue, handleLang) => (
                  <input
                    className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                    value={currentValue || ''}
                    onChange={(e) => handleLang(e.target.value)}
                    placeholder={`Subtitle in ${lang}`}
                  />
                )}
              </LocalizedField>
            </label>

            <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
              <label className='block text-xs text-gray-600'>
                <LocalizedField
                  label='Title'
                  value={formData.title}
                  globalLanguage={activeLanguage}
                  onChange={(lang, val) => updateField('title', { ...formData.title, [lang]: val })}
                >
                  {(lang, currentValue, handleLang) => (
                    <input
                      className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                      value={currentValue || ''}
                      onChange={(e) => handleLang(e.target.value)}
                      placeholder={`Title in ${lang}`}
                    />
                  )}
                </LocalizedField>
              </label>
              <label className='block text-xs text-gray-600'>
                <LocalizedField
                  label='Title Span'
                  value={formData.titleSpan}
                  globalLanguage={activeLanguage}
                  onChange={(lang, val) => updateField('titleSpan', { ...formData.titleSpan, [lang]: val })}
                >
                  {(lang, currentValue, handleLang) => (
                    <input
                      className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                      value={currentValue || ''}
                      onChange={(e) => handleLang(e.target.value)}
                      placeholder={`Title Span in ${lang}`}
                    />
                  )}
                </LocalizedField>
              </label>
              <label className='block text-xs text-gray-600'>
                <LocalizedField
                  label='Title End'
                  value={formData.titleEnd}
                  globalLanguage={activeLanguage}
                  onChange={(lang, val) => updateField('titleEnd', { ...formData.titleEnd, [lang]: val })}
                >
                  {(lang, currentValue, handleLang) => (
                    <input
                      className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                      value={currentValue || ''}
                      onChange={(e) => handleLang(e.target.value)}
                      placeholder={`Title End in ${lang}`}
                    />
                  )}
                </LocalizedField>
              </label>
            </div>

            <div className='mt-3 grid grid-cols-1 gap-3 md:grid-cols-3'>
              <label className='block text-xs text-gray-600'>
                <div className='mb-1'>Order</div>
                <input
                  className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                  type='number'
                  value={formData.order}
                  onChange={(e) => updateField('order', Number(e.target.value))}
                />
              </label>

              <div className='block text-xs text-gray-600 md:col-span-2'>
                <div className='mb-1'>Status</div>
                <button
                  type='button'
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    formData.isActive
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                  onClick={() => updateField('isActive', !formData.isActive)}
                  disabled={saving}
                >
                  {formData.isActive ? (
                    <>
                      <CheckCircle size={16} /> Active
                    </>
                  ) : (
                    <>
                      <XCircle size={16} /> Inactive
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className='rounded-xl border border-gray-200 bg-white p-4'>
            <div className='mb-3 text-sm font-semibold text-gray-900'>Main Image</div>

            <div className='mb-3 h-44 w-full overflow-hidden rounded-xl border border-dashed border-gray-200 bg-gray-50'>
              {formData.image?.url ? (
                <img src={formData.image.url} alt={formData.image.alt?.en || 'Preview'} className='h-full w-full object-cover' />
              ) : (
                <div className='h-full w-full flex items-center justify-center gap-2 text-sm text-gray-500'>
                  <ImageIcon size={18} />
                  No image
                </div>
              )}
            </div>

            <label className='block text-xs text-gray-600 mb-3'>
              <div className='mb-1'>Image URL</div>
              <div className='flex gap-2'>
                <input
                  className='flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                  value={formData.image.url}
                  onChange={(e) => updateImageField('url', e.target.value)}
                />
                <label className='inline-flex items-center gap-2 rounded-lg bg-[#63ab45] px-3 py-2 text-sm font-medium text-white cursor-pointer hover:bg-[#529938] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await handleImageUpload(file);
                    }}
                  />
                  {uploading ? (
                    <Loader2 size={16} className='animate-spin' />
                  ) : (
                    <Upload size={16} />
                  )}
                  {uploading ? 'Uploading...' : 'Upload'}
                </label>
              </div>
            </label>

            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
              <label className='block text-xs text-gray-600'>
                <div className='mb-1'>File Name</div>
                <input
                  className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                  value={formData.image.fileName}
                  onChange={(e) => updateImageField('fileName', e.target.value)}
                />
              </label>
              <label className='block text-xs text-gray-600'>
                <LocalizedField
                  label='Alt'
                  value={formData.image.alt}
                  globalLanguage={activeLanguage}
                  onChange={(lang, val) => updateImageField('alt', { ...formData.image.alt, [lang]: val })}
                >
                  {(lang, currentValue, handleLang) => (
                    <input
                      className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                      value={currentValue || ''}
                      onChange={(e) => handleLang(e.target.value)}
                      placeholder={`Alt text in ${lang}`}
                    />
                  )}
                </LocalizedField>
              </label>
            </div>
          </div>

          <div className='rounded-xl border border-gray-200 bg-white p-4'>
            <div className='mb-3 text-sm font-semibold text-gray-900'>Button</div>

            <div className='mb-3'>
              <button
                type='button'
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                  hasButton ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-700'
                }`}
                onClick={() => toggleButton(!hasButton)}
                disabled={saving}
              >
                {hasButton ? (
                  <>
                    <EyeOff size={16} /> Enabled
                  </>
                ) : (
                  <>
                    <Eye size={16} /> Disabled
                  </>
                )}
              </button>
            </div>

            {formData.button && (
              <>
                <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                  <label className='block text-xs text-gray-600'>
                    <LocalizedField
                      label='Button Text'
                      value={formData.button.text}
                      globalLanguage={activeLanguage}
                      onChange={(lang, val) => updateButtonField('text', { ...formData.button!.text, [lang]: val })}
                    >
                      {(lang, currentValue, handleLang) => (
                        <input
                          className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                          value={currentValue || ''}
                          onChange={(e) => handleLang(e.target.value)}
                          placeholder={`Button Text in ${lang}`}
                        />
                      )}
                    </LocalizedField>
                  </label>
                  <label className='block text-xs text-gray-600'>
                    <div className='mb-1 mt-5'>Link</div>
                    <input
                      className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                      value={formData.button.link}
                      onChange={(e) => updateButtonField('link', e.target.value)}
                    />
                  </label>
                </div>

                <label className='block text-xs text-gray-600 mt-3'>
                  <div className='mb-1'>Link Direction</div>
                  <select
                    className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                    value={formData.button.linkDirection}
                    onChange={(e) => updateButtonField('linkDirection', e.target.value as '_blank' | '_self')}
                  >
                    <option value='_self'>Same tab</option>
                    <option value='_blank'>New tab</option>
                  </select>
                </label>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
