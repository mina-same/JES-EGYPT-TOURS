'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Save,
  XCircle,
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { SliderItem } from '@/types/slider';
import { API_ENDPOINTS } from '@/config/api';

type SliderApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string | null;
  message?: string;
};

const sliderAPI = {
  create: async (payload: Partial<SliderItem>): Promise<SliderApiResponse<SliderItem>> => {
    const token = localStorage.getItem('authToken');
    if (!token) return { success: false, error: 'Missing auth token' };

    const response = await fetch(API_ENDPOINTS.SLIDER_CONTENT.ADMIN_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.success) {
      return { success: false, error: json?.message || json?.error || 'Failed to create slider item' };
    }

    return { success: true, data: json.data as SliderItem, error: null, message: json.message };
  },
};

function getEmptySliderItem(): SliderItem {
  const now = new Date().toISOString();
  return {
    _id: 'new',
    subtitle: '',
    title: '',
    titleSpan: '',
    titleEnd: '',
    image: {
      url: '',
      fileName: '',
      alt: '',
    },
    button: {
      text: '',
      link: '',
      linkDirection: '_self',
    },
    order: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

export default function NewSliderContentPage() {
  const router = useRouter();
  const { toast } = useToast();

  const formRef = useRef<HTMLFormElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SliderItem>(() => getEmptySliderItem());

  const hasButton = useMemo(() => Boolean(formData.button), [formData.button]);

  const updateField = (field: keyof SliderItem, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateImageField = (field: keyof SliderItem['image'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      image: {
        ...prev.image,
        [field]: value,
      },
    }));
  };

  const updateButtonField = (field: 'text' | 'link' | 'linkDirection', value: any) => {
    setFormData((prev) => ({
      ...prev,
      button: {
        text: prev.button?.text || '',
        link: prev.button?.link || '',
        linkDirection: prev.button?.linkDirection || '_self',
        [field]: value,
      },
    }));
  };

  const toggleButton = (enabled: boolean) => {
    setFormData((prev) => {
      if (enabled) {
        return {
          ...prev,
          button: prev.button ?? { text: '', link: '', linkDirection: '_self' },
        };
      }
      return { ...prev, button: undefined };
    });
  };

  const validate = () => {
    if (!formData.subtitle.trim()) return 'Subtitle is required';
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.titleSpan.trim()) return 'Title Span is required';
    if (!formData.titleEnd.trim()) return 'Title End is required';
    if (!formData.image?.url?.trim()) return 'Main Image URL is required';
    if (!formData.image?.fileName?.trim()) return 'Main Image file name is required';
    if (Number.isNaN(Number(formData.order))) return 'Order must be a number';

    if (formData.button) {
      if (!formData.button.text.trim()) return 'Button text is required (or disable the button)';
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

      const res = await sliderAPI.create(payload);
      if (!res.success || !res.data) {
        const errMsg = res.error || 'Failed to create slider item';
        setError(errMsg);
        toast({
          title: 'Create failed',
          description: errMsg,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Created',
        description: res.message || 'Slider item created successfully.',
        variant: 'success',
      });

      router.push('/admin/content-management/slider-content');
    } catch (e: any) {
      const errMsg = e?.message || 'Failed to create slider item';
      setError(errMsg);
      toast({
        title: 'Create failed',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='tailor-made-admin'>
      <div className='admin-page-header'>
        <div>
          <div className='mb-2'>
          </div>
          <h1 className='admin-page-title'>New Slider Item</h1>
          <p className='admin-page-subtitle'>Create homepage slider content</p>
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
                Create
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4'>
          {error}
        </div>
      )}

      <form ref={formRef} onSubmit={onSave} className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          <div className='rounded-xl border border-gray-200 bg-white p-4'>
            <div className='mb-3 text-sm font-semibold text-gray-900'>Text</div>

            <label className='block text-xs text-gray-600 mb-3'>
              <div className='mb-1'>Subtitle</div>
              <input
                className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                value={formData.subtitle}
                onChange={(e) => updateField('subtitle', e.target.value)}
              />
            </label>

            <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
              <label className='block text-xs text-gray-600'>
                <div className='mb-1'>Title</div>
                <input
                  className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                />
              </label>
              <label className='block text-xs text-gray-600'>
                <div className='mb-1'>Title Span</div>
                <input
                  className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                  value={formData.titleSpan}
                  onChange={(e) => updateField('titleSpan', e.target.value)}
                />
              </label>
              <label className='block text-xs text-gray-600'>
                <div className='mb-1'>Title End</div>
                <input
                  className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                  value={formData.titleEnd}
                  onChange={(e) => updateField('titleEnd', e.target.value)}
                />
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
                    formData.isActive ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
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
                <img src={formData.image.url} alt={formData.image.alt || 'Preview'} className='h-full w-full object-cover' />
              ) : (
                <div className='h-full w-full flex items-center justify-center gap-2 text-sm text-gray-500'>
                  <ImageIcon size={18} />
                  No image
                </div>
              )}
            </div>

            <label className='block text-xs text-gray-600 mb-3'>
              <div className='mb-1'>Image URL</div>
              <input
                className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                value={formData.image.url}
                onChange={(e) => updateImageField('url', e.target.value)}
              />
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
                <div className='mb-1'>Alt</div>
                <input
                  className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                  value={formData.image.alt || ''}
                  onChange={(e) => updateImageField('alt', e.target.value)}
                />
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
                    <div className='mb-1'>Text</div>
                    <input
                      className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                      value={formData.button.text}
                      onChange={(e) => updateButtonField('text', e.target.value)}
                    />
                  </label>
                  <label className='block text-xs text-gray-600'>
                    <div className='mb-1'>Link</div>
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
