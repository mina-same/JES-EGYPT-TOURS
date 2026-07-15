'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { SliderItem } from '@/types/slider';
import { API_ENDPOINTS } from '@/config/api';
import SliderItemForm, {
  SliderFormData,
  buildSliderPayload,
  emptySliderFormData,
  validateSliderFormData,
} from '@/components/admin/slider/SliderItemForm';

type SliderApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string | null;
  message?: string;
};

const sliderAPI = {
  create: async (payload: Record<string, unknown>): Promise<SliderApiResponse<SliderItem>> => {
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

export default function NewSliderContentPage() {
  const router = useRouter();
  const { toast } = useToast();

  const formRef = useRef<HTMLFormElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SliderFormData>(() => emptySliderFormData());

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const msg = validateSliderFormData(formData);
    if (msg) {
      setError(msg);
      toast({ title: 'Validation error', description: msg, variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // For creation, an absent button is simply omitted (null is only
      // meaningful as "remove" on update).
      const payload = buildSliderPayload(formData);
      if (payload.button === null) delete payload.button;

      const res = await sliderAPI.create(payload);
      if (!res.success) {
        const errMsg = res.error || 'Failed to create slider item';
        setError(errMsg);
        toast({ title: 'Create failed', description: errMsg, variant: 'destructive' });
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
      toast({ title: 'Create failed', description: errMsg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='tailor-made-admin'>
      <div className='admin-page-header'>
        <div>
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
                Create Slider Item
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4'>{error}</div>
      )}

      <form ref={formRef} onSubmit={onSave}>
        <SliderItemForm value={formData} onChange={setFormData} saving={saving} />
      </form>
    </div>
  );
}