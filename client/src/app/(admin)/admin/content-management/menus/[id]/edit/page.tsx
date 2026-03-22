'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronDown as ChevronDownIcon,
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight,
  ArrowUpRight,
  Wand2,
} from 'lucide-react';
import AdminLanguageTabs, { AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedInput from '@/components/admin/LocalizedInput';
import { getLocalizedValue } from '@/lib/localize';

import { useToast } from '@/hooks/use-toast';
import { menuService, type Menu, type MenuItem } from '@/services/menuService';
import { tourCategoryAPI } from '@/lib/api/tour';
import { blogCategoryAPI } from '@/lib/api/blogAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const makeItem = (): MenuItem => ({
  label: { en: '', de: '', it: '', es: '' },
  url: '',
  isActive: true,
  order: 0,
  children: [],
});

export default function EditMenuPage() {
  const params = useParams();
  const id = String((params as any)?.id || '');
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');
  const [menu, setMenu] = useState<Menu | null>(null);
  const [title, setTitle] = useState({ en: '', de: '', it: '', es: '' });
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const mapToLocalized = (val: any) => {
    if (typeof val === 'string') return { en: val, de: '', it: '', es: '' };
    return val || { en: '', de: '', it: '', es: '' };
  };

  const mapItemsToLocalized = (arr: any[]): MenuItem[] => {
    return arr.map(it => ({
      ...it,
      label: mapToLocalized(it.label),
      children: Array.isArray(it.children) ? mapItemsToLocalized(it.children) : []
    }));
  };

  const pathKey = (path: number[]) => path.join('.');

  const isExpanded = (path: number[], level: number) => {
    const k = pathKey(path);
    if (expanded[k] !== undefined) return !!expanded[k];
    // Default UX: expand root items, collapse deeper levels
    return level === 0;
  };

  const syncBlogCategories = async (path: number[]) => {
    const ok = window.confirm('Replace all current children under "Blogs" with all blog categories?');
    if (!ok) return;

    try {
      const res: any = await blogCategoryAPI.getAll({ limit: 200, isActive: true, sort: 'name' } as any);
      const categories = Array.isArray(res?.data) ? res.data : [];

      const children: MenuItem[] = categories
        .map((c: any, index: number) => {
          const name = c?.name || { en: '' };
          const slug = getLocalizedValue(c?.slug, 'en');
          if (!getLocalizedValue(name, 'en') || !slug) return null;
          return {
            label: name,
            url: `/blogs/category/${slug}`,
            isActive: true,
            order: index,
            children: [],
          } as MenuItem;
        })
        .filter(Boolean) as MenuItem[];

      replaceChildrenAtPath(path, children);
      toast({
        title: 'Synced',
        description: `Added ${children.length} categories under Blogs`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to sync blog categories',
        variant: 'destructive',
      });
    }
  };

  const setExpandedForPath = (path: number[], value: boolean) => {
    const k = pathKey(path);
    setExpanded((prev) => ({ ...prev, [k]: value }));
  };

  const collectAllPaths = (arr: MenuItem[], prefix: number[] = []): string[] => {
    const keys: string[] = [];
    arr.forEach((it, idx) => {
      const path = [...prefix, idx];
      keys.push(pathKey(path));
      if (Array.isArray(it.children) && it.children.length > 0) {
        keys.push(...collectAllPaths(it.children, path));
      }
    });
    return keys;
  };

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const data = await menuService.adminGetById(id);
      setMenu(data);
      setTitle(mapToLocalized(data.title));
      setIsActive(!!data.isActive);
      setItems(Array.isArray(data.items) && data.items.length ? mapItemsToLocalized(data.items) : [makeItem()]);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to load menu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    void fetchMenu();
  }, [id]);

  const getArrayAtPath = (root: MenuItem[], prefix: number[]) => {
    let arr: MenuItem[] = root;
    for (let i = 0; i < prefix.length; i++) {
      const idx = prefix[i];
      arr[idx].children = Array.isArray(arr[idx].children) ? arr[idx].children : [];
      arr = arr[idx].children as MenuItem[];
    }
    return arr;
  };

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

  const replaceChildrenAtPath = (path: number[], children: MenuItem[]) => {
    const clone = structuredClone(items);
    let arr: MenuItem[] = clone;
    for (let i = 0; i < path.length; i++) {
      const idx = path[i];
      if (i === path.length - 1) {
        arr[idx].children = children;
      } else {
        arr[idx].children = Array.isArray(arr[idx].children) ? arr[idx].children : [];
        arr = arr[idx].children as MenuItem[];
      }
    }
    setItems(clone);
    setExpandedForPath(path, true);
  };

  const isToursNode = (it: MenuItem) => {
    const label = String(it.label || '').trim().toLowerCase();
    const url = String(it.url || '').trim().toLowerCase();
    return label === 'tours' || url === '/tours' || url === '/search';
  };

  const isBlogsNode = (it: MenuItem) => {
    const label = String(it.label || '').trim().toLowerCase();
    const url = String(it.url || '').trim().toLowerCase();
    return label === 'blogs' || url === '/blogs' || url === '/blog';
  };

  const syncTourCategories = async (path: number[]) => {
    const ok = window.confirm('Replace all current children under "Tours" with all tour categories?');
    if (!ok) return;

    try {
      const res = await tourCategoryAPI.getAll({ limit: 200, isActive: true, sort: 'name' } as any);
      const categories = Array.isArray((res as any)?.data) ? (res as any).data : [];

      const children: MenuItem[] = categories
        .map((c: any, index: number) => {
          const name = c?.name || { en: '' }; // ITourCategory.name is ILocalizedString
          const slug = getLocalizedValue(c?.slug, 'en');
          if (!getLocalizedValue(name, 'en') || !slug) return null;
          return {
            label: name,
            url: `/${slug}`,
            isActive: true,
            order: index,
            children: [],
          } as MenuItem;
        })
        .filter(Boolean) as MenuItem[];

      replaceChildrenAtPath(path, children);
      toast({
        title: 'Synced',
        description: `Added ${children.length} categories under Tours`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to sync categories',
        variant: 'destructive',
      });
    }
  };

  const moveItem = (path: number[], direction: 'up' | 'down') => {
    const clone = structuredClone(items);
    const parentPrefix = path.slice(0, -1);
    const idx = path[path.length - 1];
    const arr = getArrayAtPath(clone, parentPrefix);

    const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= arr.length) {
      setItems(clone);
      return;
    }

    const tmp = arr[idx];
    arr[idx] = arr[nextIdx];
    arr[nextIdx] = tmp;
    setItems(clone);
  };

  const toggleItemActive = (path: number[]) => {
    const current = (() => {
      let arr: MenuItem[] = items;
      for (let i = 0; i < path.length - 1; i++) {
        arr = (arr[path[i]].children || []) as MenuItem[];
      }
      return arr[path[path.length - 1]];
    })();
    updateItem(path, { isActive: !current.isActive });
  };

  const renderItems = (arr: MenuItem[], prefix: number[] = [], level: number = 0) => {
    return arr.map((it, idx) => {
      const path = [...prefix, idx];
      const hasChildren = Array.isArray(it.children) && it.children.length > 0;
      const indent = level * 18;
      const open = isExpanded(path, level);
      return (
        <div key={path.join('-')} className="mb-3" style={{ marginLeft: indent }}>
          <div className="rounded-lg border bg-background">
            <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setExpandedForPath(path, !open)}
                  title={open ? 'Collapse' : 'Expand'}
                  className="h-8 w-8"
                >
                  {open ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>

                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    it.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  Level {level + 1}
                </span>

                <div className="truncate text-sm font-semibold">
                  {getLocalizedValue(it.label, activeLanguage) || 'Untitled item'}
                </div>

                {it.url ? (
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hidden max-w-[360px] items-center gap-1 truncate rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80 md:flex"
                    title={it.url}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {it.url}
                  </a>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => moveItem(path, 'up')} title="Move up">
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => moveItem(path, 'down')} title="Move down">
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => toggleItemActive(path)} title={it.isActive ? 'Deactivate' : 'Activate'}>
                  {it.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                </Button>
                {isToursNode(it) ? (
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => void syncTourCategories(path)} title="Sync tour categories">
                    <Wand2 className="h-4 w-4" />
                  </Button>
                ) : null}
                {isBlogsNode(it) ? (
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => void syncBlogCategories(path)} title="Sync blog categories">
                    <Wand2 className="h-4 w-4" />
                  </Button>
                ) : null}
                <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={() => removeItem(path)} title="Remove item">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {open ? (
              <div className="grid gap-4 p-3 md:grid-cols-12">
              <div className="md:col-span-5">
                <LocalizedInput
                  label="Label"
                  value={it.label}
                  onChange={(val) => updateItem(path, { label: val as any })}
                  placeholder="Menu label"
                />
              </div>
              <div className="md:col-span-5">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <LinkIcon className="h-4 w-4" />
                  URL
                </label>
                <div className="mt-2">
                  <Input value={it.url || ''} onChange={(e) => updateItem(path, { url: e.target.value })} placeholder="/search" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Order</label>
                <div className="mt-2">
                  <Input type="number" value={String(it.order ?? 0)} onChange={(e) => updateItem(path, { order: Number(e.target.value) })} />
                </div>
              </div>

              <div className="md:col-span-12 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">{hasChildren ? `${it.children!.length} children` : 'No children'}</div>
                <Button type="button" variant="outline" size="sm" onClick={() => addChild(path)}>
                  <Plus className="h-4 w-4" />
                  Add child
                </Button>
              </div>
              {hasChildren ? (
                <div className="md:col-span-12">
                  <div className="rounded-lg border bg-card p-3">
                    {renderItems(it.children || [], path, level + 1)}
                  </div>
                </div>
              ) : null}
              </div>
            ) : null}
          </div>
        </div>
      );
    });
  };

  const handleSave = async () => {
    try {
      if (!title.en) {
        toast({ title: 'Validation Error', description: 'English Title is required', variant: 'destructive' });
        return;
      }
      setSaving(true);
      await menuService.adminUpdate(id, { title, isActive, items } as any);
      toast({ title: 'Saved', description: 'Menu updated successfully', variant: 'success' });
      await fetchMenu();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to update menu',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!menu?._id) return;
    try {
      await menuService.adminDelete(menu._id);
      toast({ title: 'Deleted', description: 'Menu deleted', variant: 'success' });
      router.push('/admin/content-management/menus');
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to delete menu', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          Loading menu...
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        Menu not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon" className="mt-0.5">
            <Link href="/admin/content-management/menus" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Edit Menu</h1>
            <div className="text-sm text-muted-foreground">key: {menu.key}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Menu settings</div>
            <div className="text-xs text-muted-foreground">Used by the website header</div>
          </div>
          <span className={`status-badge ${isActive ? 'status-completed' : 'status-cancelled'}`}>{isActive ? 'Active' : 'Inactive'}</span>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <LocalizedInput
              label="Menu Title"
              value={title}
              onChange={(val) => setTitle(val as any)}
              placeholder="Main Menu Name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Active</label>
            <div className="mt-2">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-base font-semibold">Items</div>
            <div className="text-xs text-muted-foreground">Use the arrows to reorder. Expand/collapse for deep trees.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const keys = collectAllPaths(items);
                const next: Record<string, boolean> = {};
                keys.forEach((k) => (next[k] = false));
                setExpanded(next);
              }}
            >
              Collapse all
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const keys = collectAllPaths(items);
                const next: Record<string, boolean> = {};
                keys.forEach((k) => (next[k] = true));
                setExpanded(next);
              }}
            >
              Expand all
            </Button>
            <Button type="button" onClick={addRoot}>
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </div>
        </div>

        <div className="mt-4">
          {items.length === 0 ? (
            <div className="rounded-lg border bg-background p-6 text-center">
              <div className="text-sm font-semibold">No items</div>
              <div className="mt-1 text-sm text-muted-foreground">Add your first menu item to start building the header navigation.</div>
              <Button className="mt-4" variant="outline" onClick={addRoot}>
                <Plus className="h-4 w-4" />
                Add item
              </Button>
            </div>
          ) : (
            <div>{renderItems(items)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
