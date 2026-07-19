'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Copy, GripVertical, Plus, Trash2, X } from 'lucide-react';

import { type AdminLanguage } from './AdminLanguageTabs';
import LocalizedField from './LocalizedField';
import { IFAQ } from '@/types/tour';

const FAQ_LOCALES: AdminLanguage[] = ['en', 'de', 'it', 'es'];

interface FaqManagerProps {
  faqs: IFAQ[];
  onChange: (faqs: IFAQ[]) => void;
  activeLanguage: AdminLanguage;
  title?: string;
  description?: string;
}

function getFaqId(faq: any, index: number) {
  return `faq-${index}`;
}

function hasLocaleValue(value: unknown): boolean {
  if (value == null) return false;

  if (typeof value === 'string') {
    const text = value
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\u00a0/g, ' ')
      .trim();

    return text.length > 0;
  }

  if (Array.isArray(value)) {
    return value.some(hasLocaleValue);
  }

  if (typeof value === 'object') {
    return Object.values(value).some(hasLocaleValue);
  }

  return Boolean(value);
}

function hasCompleteLocale(faq: IFAQ, lang: AdminLanguage): boolean {
  return hasLocaleValue(faq.question?.[lang]) && hasLocaleValue(faq.answer?.[lang]);
}

function getCompleteFaqLocales(faq: IFAQ): AdminLanguage[] {
  return FAQ_LOCALES.filter(lang => hasCompleteLocale(faq, lang));
}

// Filter membership is looser than the green badge on purpose: a half-written
// FAQ (question only) must still show up under its language's filter.
function hasAnyLocaleContent(faq: IFAQ, lang: AdminLanguage): boolean {
  return hasLocaleValue(faq.question?.[lang]) || hasLocaleValue(faq.answer?.[lang]);
}

function filterChipClass(active: boolean): string {
  return cn(
    'text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border transition-colors',
    active
      ? 'bg-[#b79c5c] border-[#b79c5c] text-white'
      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 hover:border-[#b79c5c]'
  );
}

function getFaqHeaderTitle(faq: IFAQ, activeLang: AdminLanguage): string {
  if (hasLocaleValue(faq.question?.[activeLang])) {
    return String(faq.question?.[activeLang]);
  }

  const fallbackLang = FAQ_LOCALES.find(lang => hasLocaleValue(faq.question?.[lang]));
  return fallbackLang ? String(faq.question?.[fallbackLang]) : 'Untitled question';
}

function SortableItemWrapper({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: (props: {
    attributes: any;
    listeners: any;
    setActivatorNodeRef: (node: HTMLElement | null) => void;
  }) => React.ReactNode;
}) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners, setActivatorNodeRef } =
    useSortable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging ? 'opacity-60 z-50' : '', className)}
    >
      {children({ attributes, listeners, setActivatorNodeRef })}
    </div>
  );
}

export default function FaqManager({
  faqs = [],
  onChange,
  activeLanguage,
  title = 'Frequently Asked Questions',
  description = 'Manage FAQs for this item. Drag to reorder.',
}: FaqManagerProps) {
  const faqIds = useMemo<string[]>(() => faqs.map((_, i) => getFaqId(faqs[i], i)), [faqs]);

  const [collapsedFaqs, setCollapsedFaqs] = useState<Record<string, boolean>>({});
  const [langFilter, setLangFilter] = useState<'all' | AdminLanguage>('all');
  const isFiltered = langFilter !== 'all';
  // While filtering, opened rows must show the FILTER language's inputs,
  // not the global admin tab's — the per-field tabs still allow overriding.
  const effectiveLanguage = isFiltered ? langFilter : activeLanguage;

  // View-only filter: rows are hidden, never re-indexed — every handler keeps
  // operating on the REAL index in the full array, so data and order are untouched.
  const isFaqVisible = useCallback(
    (faq: IFAQ) => {
      if (langFilter === 'all') return true;
      // A fully-empty draft has no language yet — keep it visible so a freshly
      // added FAQ never vanishes behind an active filter.
      if (!FAQ_LOCALES.some(lang => hasAnyLocaleContent(faq, lang))) return true;
      return hasAnyLocaleContent(faq, langFilter);
    },
    [langFilter]
  );

  const langCounts = useMemo(() => {
    const counts: Record<AdminLanguage, number> = { en: 0, de: 0, it: 0, es: 0 };
    for (const faq of faqs) {
      for (const lang of FAQ_LOCALES) {
        if (hasAnyLocaleContent(faq, lang)) counts[lang] += 1;
      }
    }
    return counts;
  }, [faqs]);

  const visibleCount = useMemo(
    () => faqs.reduce((n, faq) => (isFaqVisible(faq) ? n + 1 : n), 0),
    [faqs, isFaqVisible]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!faqIds.length) return;

    setCollapsedFaqs(prev => {
      const next = { ...prev };
      let changed = false;
      for (const id of faqIds) {
        if (next[id] === undefined) {
          next[id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [faqIds]);

  const toggleFaqCollapsed = useCallback((faqId: string) => {
    setCollapsedFaqs(prev => ({ ...prev, [faqId]: !(prev[faqId] ?? true) }));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = faqIds.indexOf(String(active.id));
      const newIndex = faqIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(faqs, oldIndex, newIndex);
      onChange(reordered);

      const collapsedByIndex: boolean[] = faqIds.map(id => collapsedFaqs[id] ?? true);
      const movedCollapsed: boolean[] = arrayMove(collapsedByIndex, oldIndex, newIndex);
      const nextCollapsedFaqs: Record<string, boolean> = {};
      reordered.forEach((_, i) => {
        nextCollapsedFaqs[getFaqId(reordered[i], i)] = movedCollapsed[i] ?? true;
      });
      setCollapsedFaqs(nextCollapsedFaqs);
    },
    [collapsedFaqs, faqIds, faqs, onChange]
  );

  const addFaq = useCallback(() => {
    const newFaq: IFAQ = {
      question: { en: '', de: '', it: '', es: '' },
      answer:   { en: '', de: '', it: '', es: '' },
      isActive: true,
      order: faqs.length,
    };
    onChange([...faqs, newFaq]);
    // Expand the new FAQ
    const newId = getFaqId(newFaq, faqs.length);
    setCollapsedFaqs(prev => ({ ...prev, [newId]: false }));
  }, [faqs, onChange]);

  const removeFaq = useCallback(
    (index: number) => {
      const next = [...faqs];
      next.splice(index, 1);
      onChange(next);
    },
    [faqs, onChange]
  );

  const updateFaq = useCallback(
    (index: number, field: keyof IFAQ, value: any, lang?: AdminLanguage) => {
      const next = [...faqs];
      if (lang) {
        next[index] = {
          ...next[index],
          [field]: { ...(next[index][field] as any), [lang]: value },
        };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      onChange(next);
    },
    [faqs, onChange]
  );

  const duplicateFaq = useCallback(
    (index: number) => {
      const current = faqs[index];
      if (!current) return;

      const cloned = JSON.parse(JSON.stringify(current));
      if (cloned.question?.en) {
        cloned.question.en = `${cloned.question.en} (Copy)`;
      }

      const next = [...faqs];
      next.splice(index + 1, 0, cloned);
      onChange(next);
    },
    [faqs, onChange]
  );

  return (
    <Card className="shadow-sm border-gray-200 dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button type="button" onClick={addFaq} size="sm" className="bg-[#b79c5c] hover:bg-[#a68b4b]">
            <Plus className="h-4 w-4 mr-1" /> Add FAQ
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {faqs.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button type="button" onClick={() => setLangFilter('all')} className={filterChipClass(!isFiltered)}>
              All ({faqs.length})
            </button>
            {FAQ_LOCALES.map(lang => (
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
                Showing {langFilter.toUpperCase()} questions — switch to All to reorder.
              </span>
            )}
          </div>
        )}
        {faqs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-slate-900 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
            <div className="bg-white dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No FAQs added yet</p>
            <Button
              type="button"
              variant="link"
              onClick={addFaq}
              className="text-[#b79c5c] font-bold hover:text-[#a68b4b] mt-1"
            >
              Click here to add your first question
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={faqIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {isFiltered && visibleCount === 0 && (
                  <p className="text-sm text-gray-500 text-center py-6 m-0">
                    No questions have {langFilter.toUpperCase()} content yet.
                  </p>
                )}
                {faqs.map((faq, index) => {
                  if (!isFaqVisible(faq)) return null;
                  const faqId = getFaqId(faq, index);
                  const isCollapsed = collapsedFaqs[faqId] ?? true;
                  const headerTitle = getFaqHeaderTitle(faq, effectiveLanguage);
                  const completeLocales = getCompleteFaqLocales(faq);
                  const hasCompleteContent = completeLocales.length > 0;

                  return (
                    <SortableItemWrapper
                      key={faqId}
                      id={faqId}
                      className="border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {({ attributes, listeners, setActivatorNodeRef }) => (
                        <>
                          <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 p-3 bg-gray-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Reordering a filtered subset would drop items between
                                  hidden neighbours — drag only in the full list. */}
                              {!isFiltered && (
                                <div
                                  ref={setActivatorNodeRef}
                                  {...attributes}
                                  {...listeners}
                                  className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-800"
                                >
                                  <GripVertical className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs font-bold text-[#b79c5c] shrink-0 uppercase tracking-wider">
                                    FAQ {index + 1}
                                  </span>
                                  <span
                                    className={cn(
                                      'text-sm font-semibold truncate',
                                      headerTitle !== 'Untitled question' ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                                    )}
                                  >
                                    {headerTitle}
                                  </span>
                                  {hasCompleteContent && (
                                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded uppercase font-bold whitespace-nowrap">
                                      {completeLocales.map(lang => lang.toUpperCase()).join(' · ')}
                                    </span>
                                  )}
                                  {!hasCompleteContent && (
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold">
                                      Draft
                                    </span>
                                  )}
                                  {!faq.isActive && hasCompleteContent && (
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold">
                                      Inactive
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => toggleFaqCollapsed(faqId)}
                              >
                                {isCollapsed ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronUp className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-[#b79c5c]"
                                onClick={() => duplicateFaq(index)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                                onClick={() => removeFaq(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {!isCollapsed && (
                            <div className="p-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                  FAQ Settings
                                </Label>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={faq.isActive !== false}
                                    onCheckedChange={(checked) => updateFaq(index, 'isActive', checked)}
                                  />
                                  <span className="text-xs text-gray-500">Active</span>
                                </div>
                              </div>

                              <LocalizedField
                                label="Question"
                                value={faq.question}
                                globalLanguage={effectiveLanguage}
                                onChange={(lang, val) => updateFaq(index, 'question', val, lang)}
                              >
                                {(lang, currentValue, handleLang) => (
                                  <Input
                                    value={currentValue}
                                    onChange={(e) => handleLang(e.target.value)}
                                    placeholder={`The question in ${lang}...`}
                                    className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 focus:border-[#b79c5c]"
                                  />
                                )}
                              </LocalizedField>

                              <LocalizedField
                                label="Answer"
                                value={faq.answer}
                                globalLanguage={effectiveLanguage}
                                onChange={(lang, val) => updateFaq(index, 'answer', val, lang)}
                              >
                                {(lang, currentValue, handleLang) => (
                                  <RichTextEditor
                                    value={currentValue}
                                    onChange={handleLang}
                                    placeholder={`The answer in ${lang}...`}
                                    className="bg-white dark:bg-slate-900 min-h-[120px]"
                                  />
                                )}
                              </LocalizedField>
                            </div>
                          )}
                        </>
                      )}
                    </SortableItemWrapper>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
