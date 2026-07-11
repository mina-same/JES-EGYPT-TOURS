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
 import ImageUpload, { ImageData } from '@/components/admin/ImageUpload';
 import { cn } from '@/lib/utils';
 import { ChevronDown, ChevronUp, Copy, GripVertical, Image as ImageIcon, Plus, Trash2, Upload, X } from 'lucide-react';

import { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedInput from '@/components/admin/LocalizedInput';

interface ItineraryTabProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
  addItineraryDay: () => void;
  removeItineraryDay: (index: number) => void;
  updateItineraryDay: (index: number, field: string, value: any) => void;
  handleImageUpload: (file: File) => Promise<{ url: string, fileName: string } | null>;
  activeLanguage: AdminLanguage;
}

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

                              <LocalizedRichText
                                label="Day Description"
                                value={day.description || { en: '', de: '', it: '', es: '' }}
                                onChange={(val) => updateItineraryDay(dayIndex, 'description', val)}
                                placeholder="Describe what happens on this day..."
                                activeLanguage={activeLanguage}
                              />

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
