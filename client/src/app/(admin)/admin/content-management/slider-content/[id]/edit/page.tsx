'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { SliderItem } from '@/types/slider';
import { API_ENDPOINTS } from '@/config/api';
import SliderItemForm, {
  SliderFormData,
  buildSliderPayload,
  emptySliderFormData,
  sliderItemToFormData,
  validateSliderFormData,
} from '@/components/admin/slider/SliderItemForm';

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

  update: async (id: string, payload: Record<string, unknown>): Promise<SliderApiResponse<SliderItem>> => {
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

export default function EditSliderContentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const formRef = useRef<HTMLFormElement>(null);

  const id = params.id as string;

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SliderFormData>(() => emptySliderFormData());

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

        setFormData(sliderItemToFormData(res.data));
      } catch (e: any) {
        setError(e?.message || 'Failed to load slider item');
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) load();
  }, [id]);

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

      const res = await sliderAPI.update(id, buildSliderPayload(formData));
      if (!res.success) {
        const errMsg = res.error || 'Failed to update slider item';
        setError(errMsg);
        toast({ title: 'Save failed', description: errMsg, variant: 'destructive' });
        return;
      }

      toast({ title: 'Saved', description: 'Slider item updated successfully.', variant: 'success' });
      router.push('/admin/content-management/slider-content');
    } catch (e: any) {
      const errMsg = e?.message || 'Failed to update slider item';
      setError(errMsg);
      toast({ title: 'Save failed', description: errMsg, variant: 'destructive' });
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
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4'>{error}</div>
      )}

      <form ref={formRef} onSubmit={onSave}>
        <SliderItemForm value={formData} onChange={setFormData} saving={saving} />
      </form>
    </div>
  );
}