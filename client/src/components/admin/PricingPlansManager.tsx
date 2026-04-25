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
import LocalizedInput from './LocalizedInput';
import LocalizedTextArea from './LocalizedTextArea';
import { FormErrorItem } from '@/lib/parseApiError';
import AdminCurrencyTabs, { AdminCurrency } from './AdminCurrencyTabs';
import CurrencyInput from './CurrencyInput';
import CurrencyField from './CurrencyField';

interface PricingPlansManagerProps {
  pricingPlans: IPricingPlan[];
  onChange: (plans: IPricingPlan[]) => void;
  activeLanguage: AdminLanguage;
  formErrors?: FormErrorItem[];
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

export default function PricingPlansManager({ pricingPlans, onChange, activeLanguage, formErrors = [] }: PricingPlansManagerProps) {
  const hasError = (path: string) => formErrors.some(e => e.path === path || e.path?.startsWith(path + '.'));
  const getErrorMessage = (path: string) => formErrors.find(e => e.path === path)?.message;

  const PLAN_OPTIONS = [
    'AFFORDABLE',
    'GOLD (5 STAR STANDARD)', 
    'DIAMOND (5 STAR LUXURY)',
    'TOUR PRICES'
  ];

  const SEASON_OPTIONS = [
    '1 May 2026 – 31 August 2026',
    '1 September 2026 – 19 December 2026 / 6 January 2027 – 24 March 2027',
    '20 December 2026 – 5 January 2027 / 25 March 2027 – 15 April 2027'
  ];

  const planIds = useMemo<string[]>(() => pricingPlans.map((_, i) => getPlanId(pricingPlans[i], i)), [pricingPlans]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [collapsedPlans, setCollapsedPlans] = useState<Record<string, boolean>>({});
  const [activeCurrency, setActiveCurrency] = useState<AdminCurrency>("USD");

  const togglePlanCollapsed = useCallback((planId: string) => {
    setCollapsedPlans(prev => ({ ...prev, [planId]: !(prev[planId] ?? true) }));
  }, []);

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

  }, [planIds]);

  // Add new pricing plan with all seasons initialized
  const addPricingPlan = () => {
    const newPlan: IPricingPlan = {
      planName: '',
      seasons: SEASON_OPTIONS.map(seasonName => ({
        seasonName,
        prices: {
          solo: { USD: 0 },
          pax_2_4: { USD: 0 },
          pax_5_8: { USD: 0 },
          pax_9_16: { USD: 0 },
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
  const updateSeasonPrice = (planIndex: number, seasonIndex: number, priceType: keyof IPricingSeason['prices'], value: any) => {
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

  // Add note to plan
  const addPlanNote = (planIndex: number) => {
    const newNote: IPricingNote = { 
      title: { en: '', de: '', it: '', es: '' }, 
      text: { en: '', de: '', it: '', es: '' } 
    };
    const updated = pricingPlans.map((plan, i) => 
      i === planIndex 
        ? { ...plan, notes: [...(plan.notes || []), newNote] }
        : plan
    );
    onChange(updated);
  };

  // Remove note from plan
  const removePlanNote = (planIndex: number, noteIndex: number) => {
    const updated = pricingPlans.map((plan, i) => 
      i === planIndex 
        ? { ...plan, notes: (plan.notes || []).filter((_, k) => k !== noteIndex) }
        : plan
    );
    onChange(updated);
  };

  // Update plan note
  const updatePlanNote = (
    planIndex: number, 
    noteIndex: number, 
    field: keyof IPricingNote, 
    value: any
  ) => {
    const updated = pricingPlans.map((plan, i) => 
      i === planIndex 
        ? {
            ...plan,
            notes: (plan.notes || []).map((note, k) => {
              if (k !== noteIndex) return note;
              return { ...note, [field]: value } as IPricingNote;
            })
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
          <div className="flex items-center gap-3">
            <AdminCurrencyTabs activeCurrency={activeCurrency} onCurrencyChange={setActiveCurrency} />
            <Button type="button" onClick={addPricingPlan}>
              <Plus className="w-4 h-4 mr-2" />
              Add Plan
            </Button>
          </div>
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
                    const planHasError = hasError(`pricingPlans.${planIndex}`);

                    return (
                      <SortableItemWrapper
                        id={planId}
                        key={planId}
                        className={cn('rounded-lg border transition-all', planBg, planHasError && 'border-red-400 ring-1 ring-red-200')}
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
                                        plan.planName ? 'text-foreground' : 'text-muted-foreground',
                                        hasError(`pricingPlans.${planIndex}.planName`) && 'text-red-600 font-bold'
                                      )}
                                    >
                                      {plan.planName || 'Untitled plan'}
                                    </span>
                                    {(hasError(`pricingPlans.${planIndex}.planName`) || hasError(`pricingPlans.${planIndex}.seasons`)) && <span className="text-xs text-red-600 shrink-0 font-bold">⚠ Error</span>}
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
                              <div className="p-4 space-y-6">
                                <div className="space-y-2">
                                  <Label className={cn(hasError(`pricingPlans.${planIndex}.planName`) && 'text-red-600 underline font-bold')}>Plan Type *</Label>
                                  <Select
                                    value={plan.planName}
                                    onValueChange={(value) => updatePricingPlan(planIndex, 'planName', value)}
                                  >
                                    <SelectTrigger className={cn("bg-background font-medium", hasError(`pricingPlans.${planIndex}.planName`) && "border-red-500 ring-red-500")}>
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
                                  {hasError(`pricingPlans.${planIndex}.planName`) && <p className="text-xs text-red-600 font-medium">{getErrorMessage(`pricingPlans.${planIndex}.planName`)}</p>}
                                </div>

                                {/* Seasons */}
                                <div className="space-y-4">
                                  <Label className="text-base font-semibold">Seasons & Rates</Label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                    {plan.seasons.map((season, seasonIndex) => {
                                      const seasonBg = SEASON_BG_CLASSES[seasonIndex % SEASON_BG_CLASSES.length];
                                      const seasonPath = `pricingPlans.${planIndex}.seasons.${seasonIndex}`;
                                      const seasonHasError = hasError(seasonPath);

                                      return (
                                        <div
                                          key={seasonIndex}
                                          className={cn(
                                            'flex flex-col h-full border rounded-lg bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/20', 
                                            seasonBg,
                                            seasonHasError && "border-red-400 ring-1 ring-red-300 shadow-red-50"
                                          )}
                                        >
                                          {/* Season Header */}
                                          <div className={cn("p-3 border-b", seasonHasError ? "bg-red-50/50" : "bg-muted/30")}>
                                            <div className="flex items-center gap-2 mb-1">
                                              <Calendar className={cn("w-3.5 h-3.5", seasonHasError ? "text-red-500" : "text-primary")} />
                                              <span className={cn("text-xs font-semibold uppercase tracking-wider", seasonHasError ? "text-red-600" : "text-primary")}>
                                                Season {seasonHasError && "⚠"}
                                              </span>
                                            </div>
                                            <p className="text-sm font-bold leading-tight min-h-[2.5rem] flex items-center">
                                              {season.seasonName}
                                            </p>
                                          </div>

                                          <div className="p-4 space-y-6 flex-1 flex flex-col">
                                              {/* Prices */}
                                              <div className="space-y-3">
                                                  <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                                      <DollarSign className="w-3 h-3" />
                                                      Prices ({activeCurrency})
                                                    </Label>
                                                  </div>
                                                  <div className="space-y-4 pt-1">
                                                    <CurrencyField
                                                      label="Solo"
                                                      value={season.prices.solo || { USD: 0 }}
                                                      activeCurrency={activeCurrency}
                                                      onChange={(cur, val) => updateSeasonPrice(planIndex, seasonIndex, 'solo', { ...season.prices.solo, [cur]: val })}
                                                      error={hasError(`${seasonPath}.prices.solo`)}
                                                    >
                                                      {(cur, val, handleVal) => (
                                                        <div className="relative">
                                                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">
                                                            {cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '£'}
                                                          </span>
                                                          <Input
                                                            type="number"
                                                            className="h-8 pl-6 text-xs"
                                                            value={val ?? ""}
                                                            onChange={(e) => handleVal(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                                                          />
                                                        </div>
                                                      )}
                                                    </CurrencyField>

                                                    <CurrencyField
                                                      label="2-4 Pax"
                                                      value={season.prices.pax_2_4 || { USD: 0 }}
                                                      activeCurrency={activeCurrency}
                                                      onChange={(cur, val) => updateSeasonPrice(planIndex, seasonIndex, 'pax_2_4', { ...season.prices.pax_2_4, [cur]: val })}
                                                      error={hasError(`${seasonPath}.prices.pax_2_4`)}
                                                    >
                                                      {(cur, val, handleVal) => (
                                                        <div className="relative">
                                                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">
                                                            {cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '£'}
                                                          </span>
                                                          <Input
                                                            type="number"
                                                            className="h-8 pl-6 text-xs"
                                                            value={val ?? ""}
                                                            onChange={(e) => handleVal(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                                                          />
                                                        </div>
                                                      )}
                                                    </CurrencyField>

                                                    <CurrencyField
                                                      label="5-8 Pax"
                                                      value={season.prices.pax_5_8 || { USD: 0 }}
                                                      activeCurrency={activeCurrency}
                                                      onChange={(cur, val) => updateSeasonPrice(planIndex, seasonIndex, 'pax_5_8', { ...season.prices.pax_5_8, [cur]: val })}
                                                      error={hasError(`${seasonPath}.prices.pax_5_8`)}
                                                    >
                                                      {(cur, val, handleVal) => (
                                                        <div className="relative">
                                                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">
                                                            {cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '£'}
                                                          </span>
                                                          <Input
                                                            type="number"
                                                            className="h-8 pl-6 text-xs"
                                                            value={val ?? ""}
                                                            onChange={(e) => handleVal(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                                                          />
                                                        </div>
                                                      )}
                                                    </CurrencyField>

                                                    <CurrencyField
                                                      label="9-16 Pax"
                                                      value={season.prices.pax_9_16 || { USD: 0 }}
                                                      activeCurrency={activeCurrency}
                                                      onChange={(cur, val) => updateSeasonPrice(planIndex, seasonIndex, 'pax_9_16', { ...season.prices.pax_9_16, [cur]: val })}
                                                      error={hasError(`${seasonPath}.prices.pax_9_16`)}
                                                    >
                                                      {(cur, val, handleVal) => (
                                                        <div className="relative">
                                                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">
                                                            {cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '£'}
                                                          </span>
                                                          <Input
                                                            type="number"
                                                            className="h-8 pl-6 text-xs"
                                                            value={val ?? ""}
                                                            onChange={(e) => handleVal(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                                                          />
                                                        </div>
                                                      )}
                                                    </CurrencyField>
                                                  </div>
                                                  {hasError(`${seasonPath}.prices`) && <p className="text-[10px] text-red-600 font-semibold italic">Requires one USD price minimum</p>}
                                                </div>

                                              </div>
                                         </div>
                                       );
                                     })}
                                   </div>
                                 </div>

                                 {/* Plan Level Notes */}
                                 <div className="space-y-4 pt-6 border-t">
                                   <div className="flex items-center justify-between">
                                      <div className="space-y-1">
                                        <Label className="text-base font-semibold italic flex items-center gap-2 text-primary">
                                          <Plus className="w-4 h-4" />
                                          Plan Level Notes
                                        </Label>
                                        <p className="text-xs text-muted-foreground">These notes apply to all seasons in this plan</p>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addPlanNote(planIndex)}
                                      >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Note
                                      </Button>
                                   </div>

                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {(plan.notes || []).map((note, noteIndex) => (
                                        <div key={noteIndex} className="group relative bg-muted/20 p-4 rounded-xl border border-primary/10 shadow-sm">
                                           <Button
                                             type="button"
                                             variant="ghost"
                                             size="icon"
                                             className="absolute -right-2 -top-2 h-6 w-6 bg-background border shadow-sm rounded-full hover:bg-destructive hover:text-white"
                                             onClick={() => removePlanNote(planIndex, noteIndex)}
                                           >
                                             <X className="w-3 h-3" />
                                           </Button>
                                           <div className="space-y-4">
                                             <LocalizedInput
                                                label="Note Title"
                                                value={note.title || { en: '', de: '', it: '', es: '' }}
                                                onChange={(val) => updatePlanNote(planIndex, noteIndex, 'title', val)}
                                                placeholder="e.g. Peak Season Policy"
                                             />

                                             <LocalizedTextArea
                                                label="Note Description"
                                                value={note.text || { en: '', de: '', it: '', es: '' }}
                                                onChange={(val) => updatePlanNote(planIndex, noteIndex, 'text', val)}
                                                placeholder="Enter note details..."
                                                rows={3}
                                             />
                                           </div>
                                        </div>
                                      ))}
                                      {(plan.notes || []).length === 0 && (
                                        <div className="md:col-span-2 py-8 text-center bg-muted/10 border border-dashed rounded-xl border-primary/10">
                                          <p className="text-sm text-muted-foreground italic">No plan-level notes added</p>
                                        </div>
                                      )}
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