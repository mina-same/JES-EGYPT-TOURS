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
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Label } from '@/components/ui/label';
 import { Input } from '@/components/ui/input';
 import { Button } from '@/components/ui/button';
 import LocalizedRichText from '../LocalizedRichText';
 import type { ImageData } from '@/components/admin/ImageUpload';
 import { cn } from '@/lib/utils';
 import { ChevronDown, ChevronUp, Copy, GripVertical, Image as ImageIcon, Plus, Trash2, Upload, X } from 'lucide-react';

import { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedInput from '@/components/admin/LocalizedInput';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DAY_ACCOMMODATION_OPTIONS,
  DAY_LOGISTICS_UNSET,
} from '@/lib/tours/dayLogistics';
import FlightSelect from '@/components/admin/tour/FlightSelect';

interface ItineraryTabProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
  addItineraryDay: () => void;
  removeItineraryDay: (index: number) => void;
  updateItineraryDay: (index: number, field: string, value: any) => void;
  handleImageUpload: (file: File) => Promise<{ url: string, fileName: string } | null>;
  activeLanguage: AdminLanguage;
}

/**
 * The meal options, and the order they are always stored and shown in — the
 * employee may click them in any order, the value keeps this one.
 *
 * "None" is exclusive: a day either has meals or it does not, so picking it
 * clears the rest and picking a meal clears it. Storing keys rather than the
 * typed-out "Breakfast, Lunch" means one choice covers all four languages, the
 * way the duration picker does.
 */
// The three meals in the order of a day, then the extra.
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'welcomeDrink'] as const;
const MEAL_OPTIONS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'welcomeDrink', label: 'Welcome Drink' },
  { key: 'none', label: 'None' },
] as const;

function normalizeDays(days: any[]) {
  return days.map((d, i) => ({ ...d, day: i + 1 }));
}

function getDayId(day: any) {
  return String(day.day);
}

function getActivityId(dayNumber: number, activityIndex: number) {
  return `${dayNumber}-activity-${activityIndex}`;
}

function getDaySummary(day: any, lang: AdminLanguage) {
  const activities = Array.isArray(day.activities) ? day.activities : [];
  const first = activities[0]?.heading?.[lang] || '';
  const second = activities[1]?.heading?.[lang] || '';
  const parts = [first, second].filter(Boolean);
  return {
    activitiesCount: activities.length,
    preview: parts.join(' • '),
  };
}

const DAY_BG_CLASSES = [
  'bg-slate-50',
  'bg-blue-50',
  'bg-emerald-50',
  'bg-amber-50',
  'bg-rose-50',
  'bg-violet-50',
] as const;

const ACTIVITY_BG_CLASSES = [
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

export default function ItineraryTab({
  formData,
  handleChange,
  addItineraryDay,
  removeItineraryDay,
  updateItineraryDay,
  handleImageUpload,
  activeLanguage,
}: ItineraryTabProps) {
  const days = formData.itinerary?.days || [];
  const dayIds = useMemo<string[]>(() => days.map(getDayId), [days]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
  const [collapsedActivities, setCollapsedActivities] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!dayIds.length) return;

    setCollapsedDays(prev => {
      const next = { ...prev };
      let changed = false;
      for (const id of dayIds) {
        if (next[id] === undefined) {
          next[id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [dayIds]);

  const toggleDayCollapsed = useCallback((dayId: string) => {
    setCollapsedDays(prev => ({ ...prev, [dayId]: !(prev[dayId] ?? true) }));
  }, []);

  const toggleActivityCollapsed = useCallback((key: string) => {
    setCollapsedActivities(prev => ({ ...prev, [key]: !(prev[key] ?? true) }));
  }, []);

  const handleDaysDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = dayIds.indexOf(String(active.id));
      const newIndex = dayIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const collapsedByIndex: boolean[] = days.map((d: any) => {
        const id = getDayId(d);
        return collapsedDays[id] ?? true;
      });

      const reordered = arrayMove(days, oldIndex, newIndex);
      const normalized = normalizeDays(reordered);
      handleChange('itinerary.days', normalized);

      const movedCollapsed: boolean[] = arrayMove(collapsedByIndex, oldIndex, newIndex);
      const nextCollapsedDays: Record<string, boolean> = {};
      normalized.forEach((d: any, i: number) => {
        nextCollapsedDays[getDayId(d)] = movedCollapsed[i] ?? true;
      });
      setCollapsedDays(nextCollapsedDays);

      setCollapsedActivities({});
    },
    [collapsedDays, dayIds, days, handleChange]
  );

  const duplicateDay = useCallback(
    (dayIndex: number) => {
      const current = days[dayIndex];
      if (!current) return;

      const cloned = JSON.parse(JSON.stringify(current));
      const titleObj = current.title || { en: '', de: '', it: '', es: '' };
      cloned.title = { 
        ...titleObj,
        en: titleObj.en ? `${titleObj.en} (Copy)` : 'New Day'
      };

      const nextDays = [...days];
      nextDays.splice(dayIndex + 1, 0, cloned);
      handleChange('itinerary.days', normalizeDays(nextDays));
    },
    [days, handleChange]
  );

  const closeAll = useCallback(() => {
    const nextDays: Record<string, boolean> = {};
    dayIds.forEach((id: string) => {
      nextDays[id] = true;
    });
    setCollapsedDays(nextDays);

    const nextActivities: Record<string, boolean> = {};
    days.forEach((day: any) => {
      const dayId = getDayId(day);
      const activities = Array.isArray(day.activities) ? day.activities : [];
      activities.forEach((_: any, actIndex: number) => {
        const activityId = getActivityId(day.day, actIndex);
        const key = `${dayId}-${activityId}`;
        nextActivities[key] = true;
      });
    });
    setCollapsedActivities(nextActivities);
  }, [dayIds, days]);

  return (
    <div className="space-y-6">
      {/* General Description */}
      <Card>
        <CardHeader>
          <CardTitle>General Itinerary Description ({activeLanguage.toUpperCase()})</CardTitle>
          <CardDescription>Overview of the tour itinerary in the selected language</CardDescription>
        </CardHeader>
        <CardContent>
          <LocalizedRichText
            label="General Description"
            value={formData.itinerary?.generalDescription || { en: '', de: '', it: '', es: '' }}
            onChange={(val) => handleChange('itinerary.generalDescription', val)}
            placeholder="Provide an overview of the tour itinerary..."
            activeLanguage={activeLanguage}
          />
        </CardContent>
      </Card>

      {/* Itinerary Days */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Itinerary ({activeLanguage.toUpperCase()})</CardTitle>
          <CardDescription>Add day-by-day tour schedule for the selected language</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-end">
            <Button type="button" variant="outline" size="sm" onClick={closeAll}>
              Close all
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDaysDragEnd}>
            <SortableContext items={dayIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {days.map((day: any, dayIndex: number) => {
                  const dayId = getDayId(day);
                  const summary = getDaySummary(day, activeLanguage);
                  const isCollapsed = collapsedDays[dayId] ?? true;

                  const activities = Array.isArray(day.activities) ? day.activities : [];
                  const activityIds = activities.map((_: any, actIndex: number) => getActivityId(day.day, actIndex));

                  const handleActivitiesDragEnd = (event: DragEndEvent) => {
                    const { active, over } = event;
                    if (!over || active.id === over.id) return;

                    const oldIndex = activityIds.indexOf(String(active.id));
                    const newIndex = activityIds.indexOf(String(over.id));
                    if (oldIndex === -1 || newIndex === -1) return;

                    const collapsedByIndex: boolean[] = activities.map((_: any, i: number) => {
                      const activityId = getActivityId(day.day, i);
                      const key = `${dayId}-${activityId}`;
                      return collapsedActivities[key] ?? true;
                    });

                    const reordered = arrayMove(activities, oldIndex, newIndex);
                    updateItineraryDay(dayIndex, 'activities', reordered);

                    const movedCollapsed: boolean[] = arrayMove(collapsedByIndex, oldIndex, newIndex);
                    setCollapsedActivities(prev => {
                      const next = { ...prev };
                      reordered.forEach((_: any, i: number) => {
                        const activityId = getActivityId(day.day, i);
                        const key = `${dayId}-${activityId}`;
                        next[key] = movedCollapsed[i] ?? true;
                      });
                      return next;
                    });
                  };

                  const addActivity = () => {
                    const nextActivities = [
                      ...activities,
                      { 
                        heading: { en: '', de: '', it: '', es: '' }, 
                        description: { en: '', de: '', it: '', es: '' }, 
                        image: null 
                      },
                    ];
                    updateItineraryDay(dayIndex, 'activities', nextActivities);
                  };

                  const duplicateActivity = (actIndex: number) => {
                    const current = activities[actIndex];
                    if (!current) return;
                    const cloned = JSON.parse(JSON.stringify(current));
                    const next = [...activities];
                    next.splice(actIndex + 1, 0, cloned);
                    updateItineraryDay(dayIndex, 'activities', next);
                  };

                  const removeActivity = (actIndex: number) => {
                    const next = activities.filter((_: any, i: number) => i !== actIndex);
                    updateItineraryDay(dayIndex, 'activities', next);
                  };

                  const updateActivity = (actIndex: number, field: string, value: any) => {
                    const next = [...activities];
                    const current = next[actIndex] || { 
                      heading: { en: '', de: '', it: '', es: '' }, 
                      description: { en: '', de: '', it: '', es: '' }, 
                      image: null 
                    };
                    
                    next[actIndex] = { ...current, [field]: value };
                    updateItineraryDay(dayIndex, 'activities', next);
                  };

                  const meals: string[] = Array.isArray(day.meals) ? day.meals : [];
                  const toggleMeal = (key: string) => {
                    if (key === 'none') {
                      updateItineraryDay(dayIndex, 'meals', meals.includes('none') ? [] : ['none']);
                      return;
                    }
                    const withoutNone = meals.filter((m) => m !== 'none');
                    const next = withoutNone.includes(key)
                      ? withoutNone.filter((m) => m !== key)
                      : [...withoutNone, key];
                    updateItineraryDay(
                      dayIndex,
                      'meals',
                      MEAL_ORDER.filter((m) => next.includes(m))
                    );
                  };

                  const dayBg = DAY_BG_CLASSES[dayIndex % DAY_BG_CLASSES.length];

                  return (
                    <SortableItemWrapper
                      id={dayId}
                      key={dayId}
                      className={cn('rounded-lg border', dayBg)}
                    >
                      {({ attributes, listeners, setActivatorNodeRef }) => (
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
                                  <span className="text-sm font-semibold shrink-0">Day {day.day}</span>
                                  <span
                                    className={cn(
                                      'text-sm truncate',
                                      day.title?.[activeLanguage] ? 'text-foreground' : 'text-muted-foreground'
                                    )}
                                  >
                                    {day.title?.[activeLanguage] || 'Untitled day'}
                                  </span>
                                  {!day.title?.[activeLanguage] && <span className="text-xs text-red-600 shrink-0">Required</span>}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {summary.activitiesCount} activities
                                  {summary.preview ? ` • ${summary.preview}` : ''}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => toggleDayCollapsed(dayId)}
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
                                onClick={() => duplicateDay(dayIndex)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                onClick={() => removeItineraryDay(dayIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {!isCollapsed && (
                            <div className="p-4 space-y-5">
                              <LocalizedInput
                                label="Day Title"
                                value={day.title || { en: '', de: '', it: '', es: '' }}
                                onChange={(val) => updateItineraryDay(dayIndex, 'title', val)}
                                placeholder="e.g., Arrival in Cairo"
                                activeLanguage={activeLanguage}
                              />

                              {/* Day Description removed: the itinerary's own
                                  general description already covers the day, and
                                  writing a stop here left it outside the activity
                                  timeline — no image, no marker, out of sequence.
                                  A day is a title plus its activities. */}

                              {/* Activities */}
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <Label>Activities</Label>
                                  <Button type="button" variant="outline" size="sm" onClick={addActivity}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Activity
                                  </Button>
                                </div>

                                <DndContext
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={handleActivitiesDragEnd}
                                >
                                  <SortableContext items={activityIds} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-3">
                                      {activities.map((activity: any, actIndex: number) => {
                                        const activityId = getActivityId(day.day, actIndex);
                                        const collapseKey = `${dayId}-${activityId}`;
                                        const isActivityCollapsed = collapsedActivities[collapseKey] ?? true;
                                        const activityTitle = activity.heading?.[activeLanguage] || '';
                                        const activityBg =
                                          ACTIVITY_BG_CLASSES[actIndex % ACTIVITY_BG_CLASSES.length];

                                        const image: ImageData | null =
                                          activity?.image && activity.image?.url !== undefined
                                            ? (activity.image as ImageData)
                                            : null;

                                        return (
                                          <SortableItemWrapper
                                            key={activityId}
                                            id={activityId}
                                            className={cn('rounded-md border', activityBg)}
                                          >
                                            {({ attributes, listeners, setActivatorNodeRef }) => (
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
                                                      <div className="text-sm font-medium truncate">
                                                        Activity {actIndex + 1}
                                                        {activityTitle ? ` • ${activityTitle}` : ''}
                                                      </div>
                                                    </div>
                                                  </div>

                                                  <div className="flex items-center gap-1 shrink-0">
                                                    <Button
                                                      type="button"
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-8 w-8 p-0"
                                                      onClick={() => toggleActivityCollapsed(collapseKey)}
                                                    >
                                                      {isActivityCollapsed ? (
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
                                                      onClick={() => duplicateActivity(actIndex)}
                                                    >
                                                      <Copy className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                      type="button"
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                      onClick={() => removeActivity(actIndex)}
                                                    >
                                                      <X className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                </div>

                                                {!isActivityCollapsed && (
                                                  <div className="p-3 space-y-3">
                                                    <LocalizedInput
                                                      label="Activity Heading"
                                                      value={activity.heading || { en: '', de: '', it: '', es: '' }}
                                                      onChange={(val) => updateActivity(actIndex, 'heading', val)}
                                                      placeholder="e.g., Visit the Pyramids"
                                                      activeLanguage={activeLanguage}
                                                    />

                                                    {/* Optional add-on. Off by
                                                        default: a stop is part
                                                        of the programme unless
                                                        someone says otherwise. */}
                                                    <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
                                                      <div>
                                                        <Label className="text-sm">Optional activity</Label>
                                                        <p className="text-[11px] text-muted-foreground">
                                                          Marks it on the tour page as an add-on, not part of the base programme.
                                                        </p>
                                                      </div>
                                                      <Switch
                                                        checked={!!activity.isOptional}
                                                        onCheckedChange={(checked) =>
                                                          updateActivity(actIndex, 'isOptional', checked)
                                                        }
                                                      />
                                                    </div>

                                                    <LocalizedRichText
                                                      label="Activity Description"
                                                      value={activity.description || { en: '', de: '', it: '', es: '' }}
                                                      onChange={(val) => updateActivity(actIndex, 'description', val)}
                                                      placeholder="Describe this activity..."
                                                      activeLanguage={activeLanguage}
                                                    />

                                                    <div className="space-y-4 pt-2 border-t mt-4">
                                                      <div className="flex items-center gap-2">
                                                        <ImageIcon className="w-4 h-4 text-primary" />
                                                        <Label className="font-semibold">Activity Image</Label>
                                                      </div>
                                                      
                                                      {image?.url ? (
                                                        <div className="flex flex-col md:flex-row gap-4 items-start">
                                                          <div className="relative group aspect-video w-full md:w-48 rounded-lg overflow-hidden bg-gray-100 border shrink-0">
                                                            <img
                                                              src={image.url}
                                                              alt={(image as any)?.alt?.[activeLanguage] || 'Preview'}
                                                              className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                              <label className="cursor-pointer bg-white rounded-full p-2 shadow-lg scale-90 group-hover:scale-100 transition-transform">
                                                                <input
                                                                  type="file"
                                                                  accept="image/*"
                                                                  className="hidden"
                                                                  onChange={async (e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                      const result = await handleImageUpload(file);
                                                                      if (result) {
                                                                        updateActivity(actIndex, 'image', { ...image, url: result.url, fileName: result.fileName });
                                                                      }
                                                                    }
                                                                  }}
                                                                />
                                                                <Upload className="h-5 w-5 text-primary" />
                                                              </label>
                                                              <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="h-9 w-9 rounded-full ml-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform"
                                                                onClick={() => updateActivity(actIndex, 'image', undefined)}
                                                              >
                                                                <Trash2 className="h-5 w-5" />
                                                              </Button>
                                                            </div>
                                                          </div>
                                                          
                                                          <div className="flex-1 space-y-3 w-full">
                                                            <Input
                                                              value={image.url || ''}
                                                              onChange={(e) => updateActivity(actIndex, 'image', { ...image, url: e.target.value })}
                                                              placeholder="Image URL"
                                                              className="h-8 text-xs"
                                                            />
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                              <LocalizedInput
                                                                label="Image Title"
                                                                value={image.title || { en: '', de: '', it: '', es: '' }}
                                                                onChange={(val) => updateActivity(actIndex, 'image', { ...image, title: val })}
                                                                placeholder="Title"
                                                                activeLanguage={activeLanguage}
                                                              />
                                                              <LocalizedInput
                                                                label="Alt Text"
                                                                value={image.alt || { en: '', de: '', it: '', es: '' }}
                                                                onChange={(val) => updateActivity(actIndex, 'image', { ...image, alt: val })}
                                                                placeholder="Alt text"
                                                                activeLanguage={activeLanguage}
                                                              />
                                                            </div>
                                                          </div>
                                                        </div>
                                                      ) : (
                                                        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                                                          <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                              const file = e.target.files?.[0];
                                                              if (file) {
                                                                const result = await handleImageUpload(file);
                                                                if (result) {
                                                                  updateActivity(actIndex, 'image', { 
                                                                    url: result.url, 
                                                                    fileName: result.fileName,
                                                                    title: { en: activity.heading?.en || '', de: '', it: '', es: '' },
                                                                    alt: { en: activity.heading?.en || '', de: '', it: '', es: '' }
                                                                  });
                                                                }
                                                              }
                                                            }}
                                                          />
                                                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                                          <span className="text-sm font-medium">Click to upload activity image</span>
                                                          <span className="text-xs text-muted-foreground mt-1 tracking-tight">Max size 2MB</span>
                                                        </label>
                                                      )}
                                                    </div>
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

                                <Button
                                  type="button"
                                  onClick={addActivity}
                                  variant="outline"
                                  className="w-full"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Activity
                                </Button>
                              </div>

                              {/* Day logistics — deliberately AFTER the
                                  activities: the employee decides flights,
                                  meals and where the night is spent once the
                                  day is written, not before. */}
                              <div className="rounded-lg border bg-muted/20 p-3 space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Day Logistics
                                  </Label>
                                  <span className="text-[11px] text-muted-foreground">
                                    Fly to and Accommodation are optional
                                  </span>
                                </div>

                                <div>
                                  <Label className={cn('text-xs', meals.length === 0 && 'text-red-600')}>
                                    Meals *
                                  </Label>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {MEAL_OPTIONS.map((option) => {
                                      const active = meals.includes(option.key);
                                      return (
                                        <button
                                          key={option.key}
                                          type="button"
                                          onClick={() => toggleMeal(option.key)}
                                          aria-pressed={active}
                                          className={cn(
                                            'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                                            active
                                              ? 'border-primary bg-primary/10 text-primary'
                                              : 'border-input text-muted-foreground hover:border-primary/50 hover:bg-muted/50 hover:text-foreground',
                                            meals.length === 0 && 'border-red-300'
                                          )}
                                        >
                                          {option.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <p className={cn('mt-1.5 text-[11px]', meals.length === 0 ? 'text-red-600' : 'text-muted-foreground')}>
                                    {meals.length === 0
                                      ? 'Pick at least one meal, or None if the day includes no meals.'
                                      : 'Pick every meal included. None means the day includes no meals.'}
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Fly to</Label>
                                    <FlightSelect
                                      value={day.flight}
                                      onChange={(val) => updateItineraryDay(dayIndex, 'flight', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                      Egypt first; hover “Other destinations” for flights abroad.
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Accommodation</Label>
                                    <Select
                                      value={day.accommodation || DAY_LOGISTICS_UNSET}
                                      onValueChange={(value) =>
                                        updateItineraryDay(
                                          dayIndex,
                                          'accommodation',
                                          value === DAY_LOGISTICS_UNSET ? '' : value
                                        )
                                      }
                                    >
                                      <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Not set" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value={DAY_LOGISTICS_UNSET}>Not set</SelectItem>
                                        {DAY_ACCOMMODATION_OPTIONS.map((option) => (
                                          <SelectItem key={option.key} value={option.key}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <p className="text-[11px] text-muted-foreground">
                                      Picked once — shown in all four languages automatically.
                                    </p>
                                  </div>
                                </div>
                              </div>
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

          <Button type="button" onClick={addItineraryDay} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Day
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
