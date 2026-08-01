'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Plus, Trash2, Copy, Settings, ChevronDown, ChevronUp,
  Type, Quote, Images, X, Image as LucideImage
} from 'lucide-react';
import LocalizedField from './LocalizedField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUpload, { ImageData } from '@/components/admin/ImageUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AdminLanguage } from './AdminLanguageTabs';
import { ILocalizedString } from '@/types/shared';

export interface ContentBlock {
  id: string;
  type: 'html' | 'blockquote' | 'imageRow' | 'image';
  content?: ILocalizedString;
  images?: any[];
  image?: string;
  url?: string;
  alt?: ILocalizedString;
  caption?: ILocalizedString;
  title?: ILocalizedString;
  fileName?: string;
  aspectRatio?: '16:9' | '4:3' | '3:2' | '3:4' | 'auto';
  fit?: 'cover' | 'contain';
  focus?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'center-top' | 'center-bottom';
  /** Non-text blocks only: locales the block renders for; absent/empty = all. */
  languages?: AdminLanguage[];
}

interface ContentBlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  onImageUpload: (file: File, index?: number) => Promise<{ url: string, fileName: string } | null>;
  activeLanguage: AdminLanguage;
}

const BLOCK_TYPES = [
  { type: 'html',      label: 'Text',    icon: Type,         description: 'Rich text content' },
  { type: 'blockquote',label: 'Quote',   icon: Quote,        description: 'Styled quote block' },
  { type: 'imageRow',  label: 'Gallery', icon: Images,       description: 'Two or more photos in a row/grid — fixed 16:9/4:3 tiles' },
  { type: 'image',     label: 'Image',   icon: LucideImage,  description: 'One photo with full control over shape & cropping (use this for tall images)' },
] as const;

const BLOCK_LOCALES: AdminLanguage[] = ['en', 'de', 'it', 'es'];
const TEXT_BLOCK_TYPES: string[] = ['html', 'blockquote'];

// Same markup-stripping emptiness test FaqManager uses.
function hasLocaleValue(value: unknown): boolean {
  if (typeof value !== 'string') return Boolean(value);
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .trim().length > 0;
}

// Mirrors the visitor page's rule exactly: a text block belongs to the
// languages it carries; an image/gallery block belongs to block.languages
// (absent/empty = every language).
function blockBelongsToLang(block: ContentBlock, lang: AdminLanguage): boolean {
  if (TEXT_BLOCK_TYPES.includes(block.type)) {
    return hasLocaleValue((block.content as any)?.[lang]) || hasLocaleValue((block.title as any)?.[lang]);
  }
  return !Array.isArray(block.languages) || block.languages.length === 0 || block.languages.includes(lang);
}

function isEmptyTextBlock(block: ContentBlock): boolean {
  return TEXT_BLOCK_TYPES.includes(block.type)
    && !BLOCK_LOCALES.some(lang => blockBelongsToLang(block, lang));
}

function filterChipClass(active: boolean): string {
  return cn(
    'text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border transition-colors',
    active
      ? 'bg-[#b79c5c] border-[#b79c5c] text-white'
      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 hover:border-[#b79c5c]'
  );
}

// Header badge: which languages this block effectively belongs to.
function BlockLangBadge({ block }: { block: ContentBlock }) {
  if (TEXT_BLOCK_TYPES.includes(block.type)) {
    const langs = BLOCK_LOCALES.filter(lang => blockBelongsToLang(block, lang));
    if (langs.length === 0) {
      return (
        <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold">
          Empty
        </span>
      );
    }
    return (
      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded uppercase font-bold whitespace-nowrap">
        {langs.map(lang => lang.toUpperCase()).join(' · ')}
      </span>
    );
  }
  const restricted = Array.isArray(block.languages)
    && block.languages.length > 0
    && block.languages.length < BLOCK_LOCALES.length;
  if (!restricted) {
    return (
      <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold">
        All
      </span>
    );
  }
  return (
    <span className="text-[10px] bg-[#b79c5c]/15 text-[#8a7440] dark:text-[#cbb27a] px-1.5 py-0.5 rounded uppercase font-bold whitespace-nowrap">
      {block.languages!.map(lang => lang.toUpperCase()).join(' · ')}
    </span>
  );
}

// Per-language visibility for image/gallery blocks. All four selected is the
// default and is stored as NO field at all — `languages` exists only when
// the block is genuinely restricted.
function BlockLanguagesPicker({
  block,
  index,
  onUpdate,
}: {
  block: ContentBlock;
  index: number;
  onUpdate: (index: number, fieldOrPatch: string | Record<string, any>, value?: any) => void;
}) {
  const selected = Array.isArray(block.languages) && block.languages.length > 0
    ? block.languages
    : BLOCK_LOCALES;

  const toggle = (lang: AdminLanguage) => {
    const next = selected.includes(lang)
      ? selected.filter(l => l !== lang)
      : [...selected, lang];
    if (next.length === 0) return; // at least one language must keep the block
    onUpdate(
      index,
      'languages',
      next.length === BLOCK_LOCALES.length ? undefined : BLOCK_LOCALES.filter(l => next.includes(l))
    );
  };

  return (
    <div className="space-y-1">
      <Label>Visible in languages</Label>
      <div className="flex items-center gap-1.5 flex-wrap">
        {BLOCK_LOCALES.map(lang => (
          <button
            key={lang}
            type="button"
            onClick={() => toggle(lang)}
            className={filterChipClass(selected.includes(lang))}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Default: all languages. Untick a language to keep this block off that language&apos;s article.
      </p>
    </div>
  );
}

// Sortable Block Item
function SortableBlockItem({
  block,
  index,
  onUpdate,
  onRemove,
  onDuplicate,
  onImageUpload,
  isCollapsed,
  onToggleCollapse,
  onMove,
  activeLanguage,
  isFirst,
  isLast,
  textBlockNumber,
  isFiltered = false
}: {
  block: ContentBlock;
  index: number;
  onUpdate: (index: number, fieldOrPatch: string | Record<string, any>, value?: any) => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
  onImageUpload: (file: File, index?: number) => Promise<{ url: string, fileName: string } | null>;
  isCollapsed: boolean;
  onToggleCollapse: (index: number) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  activeLanguage: AdminLanguage;
  isFirst: boolean;
  isLast: boolean;
  textBlockNumber?: number;
  isFiltered?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id || `temp-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const blockType = BLOCK_TYPES.find(b => b.type === block.type);
  const Icon = blockType?.icon || Type;
  const blockLabel = block.type === 'html' && textBlockNumber
    ? `Text Block ${textBlockNumber}`
    : blockType?.label;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative border rounded-lg transition-all duration-200",
        isDragging ? "opacity-50 shadow-2xl" : "hover:shadow-md",
        isCollapsed ? "border-gray-200 dark:border-slate-800" : "border-gray-300 dark:border-slate-700",
        block.type === 'html' && "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30",
        block.type === 'blockquote' && "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30",
        block.type === 'imageRow' && "bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-900/30"
      )}
    >
      {/* Block Header */}
      <div className="flex items-center justify-between p-3 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-t-lg">
        <div className="flex items-center gap-3">
          {/* Reordering a filtered subset would drop blocks between hidden
              neighbours — dragging and Up/Down live in the All view only. */}
          {!isFiltered && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
            >
              <GripVertical className="w-4 h-4 text-gray-500 dark:text-slate-400" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-600 dark:text-slate-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{blockLabel}</span>
            <BlockLangBadge block={block} />
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!isFiltered && (
          <div className="flex items-center gap-0.5 border-x px-1 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isFirst}
              onClick={() => onMove(index, 'up')}
              className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30"
              title="Move Up"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isLast}
              onClick={() => onMove(index, 'down')}
              className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30"
              title="Move Down"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onToggleCollapse(index)}
            className="h-8 w-8 p-0 transition-opacity"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(index)}
            className="h-8 w-8 p-0 transition-opacity"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="h-8 w-8 p-0 transition-opacity hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Block Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              <BlockContent 
                block={block} 
                index={index} 
                onUpdate={onUpdate}
                onImageUpload={onImageUpload}
                canRemoveImage={(imageIndex) => block.type === 'imageRow' ? (block.images?.length || 0) > 1 : true}
                activeLanguage={activeLanguage}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Block Content Renderer
function BlockContent({
  block,
  index,
  onUpdate,
  onImageUpload,
  activeLanguage,
  canRemoveImage
}: {
  block: ContentBlock;
  index: number;
  onUpdate: (index: number, fieldOrPatch: string | Record<string, any>, value?: any) => void;
  onImageUpload: (file: File, index?: number) => Promise<{ url: string, fileName: string } | null>;
  activeLanguage: AdminLanguage;
  canRemoveImage?: (imageIndex: number) => boolean;
}) {
  const handleLocalizedUpdate = (field: string, value: string, lang: string) => {
    const current = (block as any)[field] || { en: '', de: '', it: '', es: '' };
    onUpdate(index, field, {
        ...current,
        [lang]: value
    });
  };

  const currentContent = (block.content as any)?.[activeLanguage] || '';
  const currentTitle = (block.title as any)?.[activeLanguage] || '';
  switch (block.type) {
    case 'html':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <LocalizedField
              label="Block Header (Used for Table of Contents)"
              value={block.title}
              onChange={(lang, val) => handleLocalizedUpdate('title', val, lang)}
              globalLanguage={activeLanguage}
            >
              {(lang, value, onChange) => (
                <Input
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={`Section header in ${lang.toUpperCase()}...`}
                  className="font-bold dark:bg-slate-900 dark:border-slate-800"
                />
              )}
            </LocalizedField>
          </div>
          <div className="space-y-2">
            <LocalizedField
              label="Content"
              value={block.content}
              onChange={(lang, val) => handleLocalizedUpdate('content', val, lang)}
              globalLanguage={activeLanguage}
            >
              {(lang, value, onChange) => (
                <RichTextEditor
                  key={`rich-editor-${lang}-${index}`}
                  value={value}
                  onChange={onChange}
                  placeholder="Write your content here..."
                  className="min-h-[200px] dark:bg-slate-900 dark:border-slate-800"
                />
              )}
            </LocalizedField>
          </div>
          <BlockLanguagesPicker block={block} index={index} onUpdate={onUpdate} />
        </div>
      );

    case 'blockquote':
      return (
        <div className="space-y-4">

          <div className="space-y-2">
            <LocalizedField
              label="Quote Content"
              value={block.content}
              onChange={(lang, val) => handleLocalizedUpdate('content', val, lang)}
              globalLanguage={activeLanguage}
            >
              {(lang, value, onChange) => (
                <Textarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="Enter the quote text here..."
                  rows={4}
                  className="resize-none border-l-4 border-blue-500 dark:bg-slate-900 dark:border-slate-800"
                />
              )}
            </LocalizedField>
          </div>
          <BlockLanguagesPicker block={block} index={index} onUpdate={onUpdate} />
        </div>
      );

    case 'imageRow':
      return (
        <div className="space-y-4">
          <Label>Image Gallery (1 or more images)</Label>
          <ImageUpload
            images={block.images || []}
            onAdd={() => {
              const currentImages = block.images || [];
              onUpdate(index, 'images', [...currentImages, {
                url: '',
                fileName: '',
                title: { en: '', de: '', it: '', es: '' },
                alt: { en: '', de: '', it: '', es: '' }
              }]);
            }}
            onRemove={(imageIndex) => {
              const newImages = block.images?.filter((_, i) => i !== imageIndex) || [];
              onUpdate(index, 'images', newImages);
            }}
            onUpdate={(imageIndex, field, value, lang) => {
              const newImages = [...(block.images || [])];
              if (newImages[imageIndex]) {
                const targetLang = lang || activeLanguage;
                if (['alt', 'title'].includes(field)) {
                    const currentVal = newImages[imageIndex][field] || { en: '', de: '', it: '', es: '' };
                    newImages[imageIndex] = { 
                        ...newImages[imageIndex], 
                        [field]: { 
                            ...(typeof currentVal === 'string' ? { en: currentVal, de: '', it: '', es: '' } : currentVal),
                            [targetLang]: value 
                        } 
                    };
                } else {
                    newImages[imageIndex] = { ...newImages[imageIndex], [field]: value };
                }
              }
              onUpdate(index, 'images', newImages);
            }}
            onUpload={async (file, imageIndex) => {
              const result = await onImageUpload(file, imageIndex);
              return result;
            }}
            title="Image Gallery"
            description="Upload single or multiple images for a gallery layout"
            maxImages={6}
            activeLanguage={activeLanguage}
          />
          <BlockLanguagesPicker block={block} index={index} onUpdate={onUpdate} />
        </div>
      );


    case 'image': {
      const imgObj = {
        url:      (block as any).url      || '',
        fileName: (block as any).fileName || '',
        alt:      (block as any).alt      || { en: '', de: '', it: '', es: '' },
        caption:  (block as any).caption  || { en: '', de: '', it: '', es: '' },
      };

      const imageStylePreset = (() => {
        const ar = (block as any).aspectRatio;
        const ft = (block as any).fit;
        const fc = (block as any).focus;
        if (ar === '4:3'  && ft === 'cover'   && fc === 'center-top') return 'closeup';
        if (ar === '3:4'  && ft === 'cover'   && fc === 'center-top') return 'portrait';
        if (ar === 'auto' && ft === 'contain' && fc === 'center')      return 'infographic';
        return 'travel';
      })();

      const IMAGE_STYLE_PRESETS: Record<string, Record<string, string>> = {
        travel:      { aspectRatio: '16:9', fit: 'cover',   focus: 'center' },
        closeup:     { aspectRatio: '4:3',  fit: 'cover',   focus: 'center-top' },
        portrait:    { aspectRatio: '3:4',  fit: 'cover',   focus: 'center-top' },
        infographic: { aspectRatio: 'auto', fit: 'contain', focus: 'center' },
      };

      return (
        <div className="space-y-4">
          <ImageUpload
            images={[imgObj]}
            onAdd={() => {}}
            onRemove={() => {
              onUpdate(index, { url: '', fileName: '', alt: { en: '', de: '', it: '', es: '' }, caption: { en: '', de: '', it: '', es: '' } });
            }}
            onUpdate={(imgIndex, field, value, lang) => {
              if (lang && (['alt', 'caption', 'title'] as string[]).includes(field)) {
                const current = (block as any)[field] || { en: '', de: '', it: '', es: '' };
                onUpdate(index, field, { ...current, [lang]: value });
              } else {
                onUpdate(index, field, value);
              }
            }}
            onUpload={async (file) => {
              const result = await onImageUpload(file);
              if (result) {
                onUpdate(index, { url: result.url, fileName: result.fileName });
              }
              return result;
            }}
            title="Article Image"
            description="Single image for this content block"
            maxImages={1}
            activeLanguage={activeLanguage}
          />

          <div className="space-y-2">
            <Label>Image Display Style</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-slate-900 dark:border-slate-800 dark:text-white"
              value={imageStylePreset}
              onChange={(e) => {
                const style = IMAGE_STYLE_PRESETS[e.target.value];
                if (style) onUpdate(index, style);
              }}
            >
              <option value="infographic">Full image — no crop, shows the whole picture (tall photos, maps, screenshots)</option>
              <option value="travel">Wide banner (16:9) — crops to landscape</option>
              <option value="closeup">Standard (4:3) — crops, keeps the top</option>
              <option value="portrait">Portrait (3:4) — crops to a tall frame</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Pick &quot;Full image&quot; to show a tall image completely, without cropping.
            </p>
          </div>

          <BlockLanguagesPicker block={block} index={index} onUpdate={onUpdate} />
        </div>
      );
    }

    default:
      return null;
  }
}

// Add Block Modal
function AddBlockModal({ 
  isOpen, 
  onClose, 
  onAddBlock 
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock: (type: ContentBlock['type']) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto border dark:border-slate-800">
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-800">
          <h2 className="text-lg font-semibold dark:text-white">Add Content Block</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4">
          <div className="grid gap-3">
            {BLOCK_TYPES.map((blockType) => {
              const Icon = blockType.icon;
              return (
                <button
                  key={blockType.type}
                  onClick={() => {
                    onAddBlock(blockType.type);
                    onClose();
                  }}
                  className="flex items-center gap-4 p-4 text-left border dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-medium dark:text-white">{blockType.label}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{blockType.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContentBlockEditor({ blocks, onChange, onImageUpload, activeLanguage }: ContentBlockEditorProps) {
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [langFilter, setLangFilter] = useState<'all' | AdminLanguage>('all');
  const isFiltered = langFilter !== 'all';
  // While filtering, opened blocks show the FILTER language's inputs, not the
  // global admin tab's — the per-field flag tabs still allow overriding.
  const effectiveLanguage = isFiltered ? langFilter : activeLanguage;

  // View-only filter: rows are hidden, never re-indexed — every handler keeps
  // operating on the REAL index in the full array, so data and order are untouched.
  const isBlockVisible = useCallback(
    (block: ContentBlock) => {
      if (langFilter === 'all') return true;
      // A text block with no content anywhere has no language yet — keep it
      // visible so a freshly added block never vanishes behind an active filter.
      if (isEmptyTextBlock(block)) return true;
      return blockBelongsToLang(block, langFilter);
    },
    [langFilter]
  );

  const langCounts = useMemo(() => {
    const counts: Record<AdminLanguage, number> = { en: 0, de: 0, it: 0, es: 0 };
    for (const block of blocks) {
      for (const lang of BLOCK_LOCALES) {
        if (blockBelongsToLang(block, lang)) counts[lang] += 1;
      }
    }
    return counts;
  }, [blocks]);

  const visibleCount = useMemo(
    () => blocks.reduce((n, block) => (isBlockVisible(block) ? n + 1 : n), 0),
    [blocks, isBlockVisible]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(blocks, oldIndex, newIndex));
      }
    }

    setActiveId(null);
  };

  const addBlock = useCallback((type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content:     type === 'html' || type === 'blockquote' ? { en: '', de: '', it: '', es: '' } : undefined,
      images:      type === 'imageRow' ? [{ url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } }] : undefined,
      title:       type === 'html' || type === 'blockquote' ? { en: '', de: '', it: '', es: '' } : undefined,
      url:         type === 'image' ? '' : undefined,
      alt:         type === 'image' ? { en: '', de: '', it: '', es: '' } : undefined,
      caption:     type === 'image' ? { en: '', de: '', it: '', es: '' } : undefined,
      // Default a new single image to "Full image (no crop)" so a tall photo
      // is never cropped by surprise — cropping (16:9/4:3/3:4) is an opt-in
      // choice via the Image Display Style select. Maps to the 'infographic'
      // preset in IMAGE_STYLE_PRESETS.
      aspectRatio: type === 'image' ? 'auto'    : undefined,
      fit:         type === 'image' ? 'contain' : undefined,
      focus:       type === 'image' ? 'center'  : undefined,
    };

    onChange([...blocks, newBlock]);
  }, [blocks, onChange]);

  const updateBlock = useCallback((index: number, fieldOrPatch: string | Record<string, any>, value?: any) => {
    const newBlocks = [...blocks];
    if (typeof fieldOrPatch === 'object') {
      newBlocks[index] = { ...newBlocks[index], ...fieldOrPatch };
    } else {
      newBlocks[index] = { ...newBlocks[index], [fieldOrPatch]: value };
    }
    onChange(newBlocks);
  }, [blocks, onChange]);

  const removeBlock = useCallback((index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  }, [blocks, onChange]);

  const moveBlock = useCallback((index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newBlocks.length) {
      const temp = newBlocks[index];
      newBlocks[index] = newBlocks[targetIndex];
      newBlocks[targetIndex] = temp;
      onChange(newBlocks);
    }
  }, [blocks, onChange]);

  const duplicateBlock = useCallback((index: number) => {
    const blockToDuplicate = blocks[index];
    const duplicatedBlock: ContentBlock = {
      ...blockToDuplicate,
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    delete (duplicatedBlock as any)._id;
    
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, duplicatedBlock);
    onChange(newBlocks);
  }, [blocks, onChange]);

  const canRemoveImage = useCallback((blockIndex: number, imageIndex: number) => {
    const block = blocks[blockIndex];
    if (block.type === 'imageRow' && block.images) {
      return block.images.length > 1;
    }
    return true;
  }, [blocks]);

  const toggleCollapse = useCallback((index: number) => {
    const blockId = blocks[index].id;
    const newCollapsed = new Set(collapsedBlocks);
    
    if (newCollapsed.has(blockId)) {
      newCollapsed.delete(blockId);
    } else {
      newCollapsed.add(blockId);
    }
    
    setCollapsedBlocks(newCollapsed);
  }, [blocks, collapsedBlocks]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        setShowAddModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold dark:text-white">Content Blocks</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Drag to reorder • Click to edit • Ctrl+Enter to add block
          </p>
        </div>
        <Button type="button" onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Block
        </Button>
      </div>

      {blocks.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button" onClick={() => setLangFilter('all')} className={filterChipClass(!isFiltered)}>
            All ({blocks.length})
          </button>
          {BLOCK_LOCALES.map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => setLangFilter(lang)}
              className={filterChipClass(langFilter === lang)}
            >
              {lang.toUpperCase()} ({langCounts[lang]})
            </button>
          ))}
          {isFiltered && (
            <span className="text-xs text-gray-400">
              Showing {langFilter.toUpperCase()} blocks — switch to All to reorder.
            </span>
          )}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blocks.map((b, i) => b.id || `sort-${i}`)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {isFiltered && visibleCount === 0 && (
              <p className="text-sm text-gray-500 text-center py-6 m-0">
                No blocks have {langFilter.toUpperCase()} content yet.
              </p>
            )}
            <AnimatePresence>
              {blocks.map((block, index) => {
                // Numbering stays computed from the FULL list so "Text Block N"
                // keeps its real, stable number while filtering hides rows.
                const textBlockNumber = block.type === 'html'
                  ? blocks.slice(0, index + 1).filter((item) => item.type === 'html').length
                  : undefined;
                if (!isBlockVisible(block)) return null;

                return (
                <motion.div
                  key={block.id || `div-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <SortableBlockItem
                    key={block.id || `block-${index}`}
                    block={block}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === blocks.length - 1}
                    onUpdate={updateBlock}
                    onRemove={removeBlock}
                    onDuplicate={duplicateBlock}
                    onMove={moveBlock}
                    onImageUpload={onImageUpload}
                    isCollapsed={collapsedBlocks.has(block.id)}
                    onToggleCollapse={toggleCollapse}
                    activeLanguage={effectiveLanguage}
                    textBlockNumber={textBlockNumber}
                    isFiltered={isFiltered}
                  />
                </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <div className="border-2 border-blue-500 rounded-lg bg-white p-4 shadow-2xl opacity-90">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4" />
                <span className="font-medium">
                  {BLOCK_TYPES.find(b => b.type === blocks.find(b => b.id === activeId)?.type)?.label}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {blocks.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-slate-800 rounded-lg bg-gray-50/50 dark:bg-slate-900/50">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
              <Plus className="w-6 h-6 text-gray-400 dark:text-slate-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">No content blocks yet</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Get started by adding your first content block
              </p>
            </div>
            <Button type="button" onClick={() => setShowAddModal(true)} variant="outline">
              Add First Block
            </Button>
          </div>
        </div>
      )}

      <AddBlockModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddBlock={addBlock}
      />
    </div>
  );
}
