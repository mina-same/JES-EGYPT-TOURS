'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Copy, GripVertical, Plus, Trash2, X, Calendar, DollarSign, Users } from 'lucide-react';
import { IPricingPlan, IPricingSeason, IPricingNote, ILocalizedString, ILocalizedMixed } from '@/types/tour';
import { type AdminLanguage } from './AdminLanguageTabs';
import LocalizedField from './LocalizedField';

interface PricingPlansManagerProps {
  pricingPlans: IPricingPlan[];
  onChange: (plans: IPricingPlan[]) => void;
  activeLanguage: AdminLanguage;
}

function getPlanId(plan: any, index: number) {
  return `plan-${index}`;
}

const PLAN_BG_CLASSES = [
  'bg-slate-50',
  'bg-blue-50',
  'bg-emerald-50',
  'bg-amber-50',
  'bg-rose-50',
  'bg-violet-50',
] as const;

const SEASON_BG_CLASSES = [
  'bg-white/70',
  'bg-slate-50/70',
  'bg-blue-50/70',
  'bg-emerald-50/70',
  'bg-amber-50/70',
  'bg-rose-50/70',
] as const;

function SortableItemWrapper({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: (props: {
    attributes: ReturnType<typeof useSortable>['attributes'];
    listeners: ReturnType<typeof useSortable>['listeners'];
    setActivatorNodeRef: ReturnType<typeof useSortable>['setActivatorNodeRef'];
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
      className={cn(isDragging ? 'opacity-60' : '', className)}
    >
      {children({ attributes, listeners, setActivatorNodeRef })}
    </div>
  );
}

export default function PricingPlansManager({ pricingPlans, onChange, activeLanguage }: PricingPlansManagerProps) {
  const PLAN_OPTIONS = [
    'AFFORDABLE',
    'GOLD (5 STAR STANDARD)', 
    'DIAMOND (5 STAR LUXURY)'
  ];

  const SEASON_OPTIONS = [
    "From Oct 2025 to Dec 2025",
    "From Jan 2026 to Mar 2026",
    "From 15 Apr 2026 to 30 Sep 2026",
    "Peak (20 Dec 2025 - 5 Jan 2026) / (25 Mar - 15 Apr 2026)"
  ];

  const planIds = useMemo<string[]>(() => pricingPlans.map((_, i) => getPlanId(pricingPlans[i], i)), [pricingPlans]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [collapsedPlans, setCollapsedPlans] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!planIds.length) return;

    setCollapsedPlans(prev => {
      const next = { ...prev };
      let changed = false;
      for (const id of planIds) {
        if (next[id] === undefined) {
          next[id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [planIds]);

  const togglePlanCollapsed = useCallback((planId: string) => {
    setCollapsedPlans(prev => ({ ...prev, [planId]: !(prev[planId] ?? true) }));
  }, []);

  const handlePlansDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = planIds.indexOf(String(active.id));
      const newIndex = planIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(pricingPlans, oldIndex, newIndex);
      onChange(reordered);

      const collapsedByIndex: boolean[] = planIds.map(id => collapsedPlans[id] ?? true);
      const movedCollapsed: boolean[] = arrayMove(collapsedByIndex, oldIndex, newIndex);
      const nextCollapsedPlans: Record<string, boolean> = {};
      reordered.forEach((_, i) => {
        nextCollapsedPlans[getPlanId(reordered[i], i)] = movedCollapsed[i] ?? true;
      });
      setCollapsedPlans(nextCollapsedPlans);
    },
    [collapsedPlans, planIds, pricingPlans, onChange]
  );

  const duplicatePlan = useCallback(
    (planIndex: number) => {
      const current = pricingPlans[planIndex];
      if (!current) return;

      const cloned = JSON.parse(JSON.stringify(current));
      cloned.planName = current.planName ? `${current.planName} (Copy)` : '';

      const next = [...pricingPlans];
      next.splice(planIndex + 1, 0, cloned);
      onChange(next);
    },
    [pricingPlans, onChange]
  );

  const closeAll = useCallback(() => {
    const nextPlans: Record<string, boolean> = {};
    planIds.forEach(id => {
      nextPlans[id] = true;
    });
    setCollapsedPlans(nextPlans);

  }, [planIds, pricingPlans]);

  // Add new pricing plan with all seasons initialized
  const addPricingPlan = () => {
    const newPlan: IPricingPlan = {
      planName: '',
      seasons: SEASON_OPTIONS.map(seasonName => ({
        seasonName,
        startDate: '',
        endDate: '',
        prices: {
          solo: 0,
          pax_2_4: 0,
          pax_5_8: 0,
          pax_9_16: 0,
        },
        notes: [],
      })),
    };
    onChange([...pricingPlans, newPlan]);
  };

  // Remove pricing plan
  const removePricingPlan = (planIndex: number) => {
    onChange(pricingPlans.filter((_, i) => i !== planIndex));
  };

  // Update pricing plan
  const updatePricingPlan = (planIndex: number, field: keyof IPricingPlan, value: any) => {
    const updated = pricingPlans.map((plan, i) => 
      i === planIndex ? { ...plan, [field]: value } : plan
    );
    onChange(updated);
  };

  // Update season prices
  const updateSeasonPrice = (planIndex: number, seasonIndex: number, priceType: keyof IPricingSeason['prices'], value: number) => {
    const updated = pricingPlans.map((plan, i) => 
      i === planIndex 
        ? {
            ...plan,
            seasons: plan.seasons.map((season, j) => 
              j === seasonIndex 
                ? { ...season, prices: { ...season.prices, [priceType]: value } }
                : season
            )
          }
        : plan
    );
    onChange(updated);
  };

  // Add note to season
  const addSeasonNote = (planIndex: number, seasonIndex: number) => {
    const newNote: IPricingNote = { 
      title: { en: '', de: '', it: '', es: '' }, 
      text: { en: '', de: '', it: '', es: '' } 
    };
    const updated = pricingPlans.map((plan, i) => 
      i === planIndex 
        ? {
            ...plan,
            seasons: plan.seasons.map((season, j) => 
              j === seasonIndex 
                ? { ...season, notes: [...season.notes, newNote] }
                : season
            )
          }
        : plan
    );
    onChange(updated);
  };

  // Remove note from season
  const removeSeasonNote = (planIndex: number, seasonIndex: number, noteIndex: number) => {
    const updated = pricingPlans.map((plan, i) => 
      i === planIndex 
        ? {
            ...plan,
            seasons: plan.seasons.map((season, j) => 
              j === seasonIndex 
                ? { ...season, notes: season.notes.filter((_, k) => k !== noteIndex) }
                : season
            )
          }
        : plan
    );
    onChange(updated);
  };

  // Update season note
  const updateSeasonNote = (
    planIndex: number, 
    seasonIndex: number, 
    noteIndex: number, 
    field: keyof IPricingNote, 
    value: string,
    lang: AdminLanguage = activeLanguage
  ) => {
    const updated = pricingPlans.map((plan, i) => 
      i === planIndex 
        ? {
            ...plan,
            seasons: plan.seasons.map((season, j) => 
              j === seasonIndex 
                ? {
                    ...season,
                    notes: season.notes.map((note, k) => {
                      if (k !== noteIndex) return note;
                      return {
                        ...note,
                        [field]: {
                          ...((note as any)[field] || { en: '', de: '', it: '', es: '' }),
                          [lang]: value
                        }
                      } as IPricingNote;
                    })
                  }
                : season
            )
          }
        : plan
    );
    onChange(updated);
  };

  return (
    <Card className="border-none shadow-none" style={{border: 'none !important'}}>
      <CardHeader className="px-0 pt-0" style={{ border: 'none !important' }}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-medium">Pricing Plans</h3>
            <p className="text-sm text-muted-foreground">
              Configure pricing for different seasons and group sizes
            </p>
          </div>
          <Button type="button" onClick={addPricingPlan}>
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 space-y-8">
        {pricingPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No pricing plans yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
              Create your first pricing plan to start adding seasonal rates.
            </p>
            <Button type="button" onClick={addPricingPlan}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Plan
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end">
              <Button type="button" variant="outline" size="sm" onClick={closeAll}>
                Close all
              </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePlansDragEnd}>
              <SortableContext items={planIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {pricingPlans.map((plan, planIndex) => {
                    const planId = getPlanId(plan, planIndex);
                    const isCollapsed = collapsedPlans[planId] ?? true;
                    const planBg = PLAN_BG_CLASSES[planIndex % PLAN_BG_CLASSES.length];

                    return (
                      <SortableItemWrapper
                        id={planId}
                        key={planId}
                        className={cn('rounded-lg border', planBg)}
                        children={({ attributes, listeners, setActivatorNodeRef }) => (
                          <>
                            <div className="flex items-center justify-between gap-3 border-b p-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  ref={setActivatorNodeRef}
                                  {...attributes}
                                  {...listeners}
                                  className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
                                >
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm font-semibold shrink-0">Plan {planIndex + 1}</span>
                                    <span
                                      className={cn(
                                        'text-sm truncate',
                                        plan.planName ? 'text-foreground' : 'text-muted-foreground'
                                      )}
                                    >
                                      {plan.planName || 'Untitled plan'}
                                    </span>
                                    {!plan.planName && <span className="text-xs text-red-600 shrink-0">Required</span>}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {plan.seasons?.length || 0} seasons
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => togglePlanCollapsed(planId)}
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
                                  className="h-8 w-8 p-0"
                                  onClick={() => duplicatePlan(planIndex)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  onClick={() => removePricingPlan(planIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {!isCollapsed && (
                              <div className="p-4 space-y-5">
                                <div className="space-y-2">
                                  <Label>Plan Type *</Label>
                                  <Select
                                    value={plan.planName}
                                    onValueChange={(value) => updatePricingPlan(planIndex, 'planName', value)}
                                  >
                                    <SelectTrigger className="bg-background font-medium">
                                      <SelectValue placeholder="Select plan type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PLAN_OPTIONS.map((option) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Seasons */}
                                <div className="space-y-3">
                                  <Label>Seasons</Label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                    {plan.seasons.map((season, seasonIndex) => {
                                      const seasonBg = SEASON_BG_CLASSES[seasonIndex % SEASON_BG_CLASSES.length];

                                      return (
                                        <div
                                          key={seasonIndex}
                                          className={cn('flex flex-col h-full border rounded-lg bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/20', seasonBg)}
                                        >
                                          {/* Season Header */}
                                          <div className="p-3 bg-muted/30 border-b">
                                            <div className="flex items-center gap-2 mb-1">
                                              <Calendar className="w-3.5 h-3.5 text-primary" />
                                              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Season</span>
                                            </div>
                                            <p className="text-sm font-medium leading-tight min-h-[2.5rem] flex items-center">
                                              {season.seasonName}
                                            </p>
                                          </div>

                                          <div className="p-4 space-y-6 flex-1 flex flex-col">
                                              {/* Prices */}
                                              <div className="space-y-3">
                                                <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                                  <DollarSign className="w-3 h-3" />
                                                  Prices (USD)
                                                </Label>
                                                <div className="space-y-2.5">
                                                  <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                                                    <Label htmlFor={`solo-${planIndex}-${seasonIndex}`} className="text-xs text-muted-foreground">Solo</Label>
                                                    <div className="relative">
                                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                                                      <Input
                                                        id={`solo-${planIndex}-${seasonIndex}`}
                                                        type="number"
                                                        min="0"
                                                        className="h-8 pl-5 text-sm"
                                                        value={season.prices.solo || ''}
                                                        onChange={(e) => updateSeasonPrice(planIndex, seasonIndex, 'solo', parseFloat(e.target.value) || 0)}
                                                        placeholder="0"
                                                      />
                                                    </div>
                                                  </div>
                                                  <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                                                    <Label htmlFor={`pax24-${planIndex}-${seasonIndex}`} className="text-xs text-muted-foreground">2-4 Pax</Label>
                                                    <div className="relative">
                                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                                                      <Input
                                                        id={`pax24-${planIndex}-${seasonIndex}`}
                                                        type="number"
                                                        min="0"
                                                        className="h-8 pl-5 text-sm"
                                                        value={season.prices.pax_2_4 || ''}
                                                        onChange={(e) => updateSeasonPrice(planIndex, seasonIndex, 'pax_2_4', parseFloat(e.target.value) || 0)}
                                                        placeholder="0"
                                                      />
                                                    </div>
                                                  </div>
                                                  <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                                                    <Label htmlFor={`pax58-${planIndex}-${seasonIndex}`} className="text-xs text-muted-foreground">5-8 Pax</Label>
                                                    <div className="relative">
                                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                                                      <Input
                                                        id={`pax58-${planIndex}-${seasonIndex}`}
                                                        type="number"
                                                        min="0"
                                                        className="h-8 pl-5 text-sm"
                                                        value={season.prices.pax_5_8 || ''}
                                                        onChange={(e) => updateSeasonPrice(planIndex, seasonIndex, 'pax_5_8', parseFloat(e.target.value) || 0)}
                                                        placeholder="0"
                                                      />
                                                    </div>
                                                  </div>
                                                  <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                                                    <Label htmlFor={`pax916-${planIndex}-${seasonIndex}`} className="text-xs text-muted-foreground">9-16 Pax</Label>
                                                    <div className="relative">
                                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                                                      <Input
                                                        id={`pax916-${planIndex}-${seasonIndex}`}
                                                        type="number"
                                                        min="0"
                                                        className="h-8 pl-5 text-sm"
                                                        value={season.prices.pax_9_16 || ''}
                                                        onChange={(e) => updateSeasonPrice(planIndex, seasonIndex, 'pax_9_16', parseFloat(e.target.value) || 0)}
                                                        placeholder="0"
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Notes */}
                                              <div className="space-y-3 pt-3 border-t mt-auto">
                                                <div className="flex items-center justify-between">
                                                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Notes</Label>
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                                                    onClick={() => addSeasonNote(planIndex, seasonIndex)}
                                                  >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Add
                                                  </Button>
                                                </div>

                                                <div className="space-y-2">
                                                  {season.notes.map((note, noteIndex) => (
                                                    <div key={noteIndex} className="group relative bg-muted/30 p-3 rounded-md border text-xs">
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute -right-1 -top-1 h-5 w-5 opacity-100 transition-opacity bg-background border shadow-sm rounded-full hover:bg-destructive hover:text-destructive-foreground"
                                                        onClick={() => removeSeasonNote(planIndex, seasonIndex, noteIndex)}
                                                      >
                                                        <X className="w-3 h-3" />
                                                      </Button>
                                                      <div className="space-y-2">
                                                        <LocalizedField
                                                          label="Note Title"
                                                          value={note.title}
                                                          globalLanguage={activeLanguage}
                                                          onChange={(lang, val) => updateSeasonNote(planIndex, seasonIndex, noteIndex, 'title', val, lang)}
                                                        >
                                                          {(lang, currentValue, handleLang) => (
                                                            <div className="flex items-center gap-2">
                                                              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                                              <Input
                                                                className="h-7 text-xs border-0 bg-transparent p-0 placeholder:text-muted-foreground/50 focus-visible:ring-0 font-semibold pr-6"
                                                                value={currentValue}
                                                                onChange={(e) => handleLang(e.target.value)}
                                                                placeholder={`Note Title (${lang})`}
                                                              />
                                                            </div>
                                                          )}
                                                        </LocalizedField>

                                                        <LocalizedField
                                                          label="Note Description"
                                                          value={note.text}
                                                          globalLanguage={activeLanguage}
                                                          onChange={(lang, val) => updateSeasonNote(planIndex, seasonIndex, noteIndex, 'text', val, lang)}
                                                        >
                                                          {(lang, currentValue, handleLang) => (
                                                            <Input
                                                              className="h-6 text-xs border-0 bg-transparent p-0 placeholder:text-muted-foreground/50 focus-visible:ring-0"
                                                              value={currentValue}
                                                              onChange={(e) => handleLang(e.target.value)}
                                                              placeholder={`Description (${lang})`}
                                                            />
                                                          )}
                                                        </LocalizedField>
                                                      </div>
                                                    </div>
                                                  ))}
                                                  {season.notes.length === 0 && (
                                                    <div className="text-xs text-muted-foreground italic text-center py-2">
                                                      No notes added
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </CardContent>
    </Card>
  );
}
