'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Plus, Save } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { menuService, type MenuItem } from '@/services/menuService';

const makeItem = (): MenuItem => ({
  label: '',
  url: '',
  isActive: true,
  order: 0,
  children: [],
});

export default function NewMenuPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [key, setKey] = useState('');
  const [title, setTitle] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<MenuItem[]>([makeItem()]);
  const [saving, setSaving] = useState(false);

  const updateItem = (path: number[], patch: Partial<MenuItem>) => {
    const clone = structuredClone(items);
    let arr: MenuItem[] = clone;
    for (let i = 0; i < path.length - 1; i++) {
      arr = (arr[path[i]].children || []) as MenuItem[];
    }
    const idx = path[path.length - 1];
    arr[idx] = { ...arr[idx], ...patch };
    setItems(clone);
  };

  const addChild = (path: number[]) => {
    const clone = structuredClone(items);
    let arr: MenuItem[] = clone;
    for (let i = 0; i < path.length; i++) {
      const idx = path[i];
      arr[idx].children = Array.isArray(arr[idx].children) ? arr[idx].children : [];
      if (i === path.length - 1) {
        (arr[idx].children as MenuItem[]).push(makeItem());
      } else {
        arr = arr[idx].children as MenuItem[];
      }
    }
    setItems(clone);
  };

  const removeItem = (path: number[]) => {
    const clone = structuredClone(items);
    if (path.length === 1) {
      clone.splice(path[0], 1);
      setItems(clone.length ? clone : [makeItem()]);
      return;
    }

    let arr: MenuItem[] = clone;
    for (let i = 0; i < path.length - 1; i++) {
      arr = (arr[path[i]].children || []) as MenuItem[];
    }
    arr.splice(path[path.length - 1], 1);
    setItems(clone);
  };

  const addRoot = () => setItems((prev) => [...prev, makeItem()]);

  const renderItems = (arr: MenuItem[], prefix: number[] = []) => {
    return arr.map((it, idx) => {
      const path = [...prefix, idx];
      return (
        <div key={path.join('-')} className="border rounded p-3 mb-3 bg-white">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Label</label>
              <input
                className="form-control"
                value={it.label}
                onChange={(e) => updateItem(path, { label: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">URL</label>
              <input
                className="form-control"
                value={it.url || ''}
                onChange={(e) => updateItem(path, { url: e.target.value })}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Order</label>
              <input
                type="number"
                className="form-control"
                value={it.order}
                onChange={(e) => updateItem(path, { order: Number(e.target.value) })}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Active</label>
              <select
                className="form-select"
                value={it.isActive ? 'true' : 'false'}
                onChange={(e) => updateItem(path, { isActive: e.target.value === 'true' })}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          <div className="d-flex gap-2 mt-3">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => addChild(path)}>
              <Plus size={14} /> Add child
            </button>
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeItem(path)}>
              Remove
            </button>
          </div>

          {Array.isArray(it.children) && it.children.length > 0 ? (
            <div className="mt-3 ms-3">
              {renderItems(it.children, path)}
            </div>
          ) : null}
        </div>
      );
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const created = await menuService.adminCreate({ key, title, isActive, items } as any);
      toast({ title: 'Saved', description: 'Menu created successfully', variant: 'success' });
      router.push(`/admin/content-management/menus/${created._id}/edit`);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.error || err?.message || 'Failed to create menu',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='tailor-made-admin'>
      <div className='admin-page-header'>
        <div className="d-flex align-items-center gap-2">
          <Link href="/admin/content-management/menus" className="btn btn-link p-0">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className='admin-page-title'>New Menu</h1>
            <p className='admin-page-subtitle'>Create a new header menu</p>
          </div>
        </div>

        <button className='btn-add-new' onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
          Save
        </button>
      </div>

      <div className="border rounded p-3 bg-white">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Key</label>
            <input className="form-control" value={key} onChange={(e) => setKey(e.target.value)} placeholder="header-main" />
          </div>
          <div className="col-md-6">
            <label className="form-label">Title</label>
            <input className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Header Main Menu" />
          </div>
          <div className="col-md-2">
            <label className="form-label">Active</label>
            <select className="form-select" value={isActive ? 'true' : 'false'} onChange={(e) => setIsActive(e.target.value === 'true')}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h3 style={{ marginBottom: 0 }}>Items</h3>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={addRoot}>
            <Plus size={14} /> Add item
          </button>
        </div>
        {renderItems(items)}
      </div>
    </div>
  );
}
