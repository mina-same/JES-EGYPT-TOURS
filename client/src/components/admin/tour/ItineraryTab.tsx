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
 import RichTextEditor from '@/components/ui/RichTextEditor';
 import ImageUpload, { ImageData } from '@/components/admin/ImageUpload';
 import { cn } from '@/lib/utils';
 import { ChevronDown, ChevronUp, Copy, GripVertical, Plus, Trash2, X } from 'lucide-react';

interface ItineraryTabProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
  addItineraryDay: () => void;
  removeItineraryDay: (index: number) => void;
  updateItineraryDay: (index: number, field: string, value: any) => void;
  handleImageUpload: (file: File) => Promise<{ url: string, fileName: string } | null>;
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

function getDaySummary(day: any) {
  const activities = Array.isArray(day.activities) ? day.activities : [];
  const first = activities[0]?.heading || '';
  const second = activities[1]?.heading || '';
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
      cloned.title = current.title ? `${current.title} (Copy)` : '';

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
          <CardTitle>General Itinerary Description</CardTitle>
          <CardDescription>Overview of the tour itinerary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="itinerary.generalDescription">General Description</Label>
            <RichTextEditor
              value={formData.itinerary?.generalDescription || ''}
              onChange={(value: string) => handleChange('itinerary.generalDescription', value)}
              placeholder="Provide an overview of the tour itinerary..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Itinerary Days */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Itinerary</CardTitle>
          <CardDescription>Add day-by-day tour schedule</CardDescription>
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
                  const summary = getDaySummary(day);
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
                      { heading: '', description: '', image: null },
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
                    const current = next[actIndex] || { heading: '', description: '', image: null };
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
                                      day.title ? 'text-foreground' : 'text-muted-foreground'
                                    )}
                                  >
                                    {day.title || 'Untitled day'}
                                  </span>
                                  {!day.title && <span className="text-xs text-red-600 shrink-0">Required</span>}
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
                              <div className="space-y-2">
                                <Label>Day Title *</Label>
                                <Input
                                  value={day.title || ''}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    updateItineraryDay(dayIndex, 'title', e.target.value)
                                  }
                                  placeholder="e.g., Arrival in Cairo"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Day Description *</Label>
                                <RichTextEditor
                                  value={day.description || ''}
                                  onChange={(value: string) => updateItineraryDay(dayIndex, 'description', value)}
                                  placeholder="Describe what happens on this day..."
                                />
                              </div>

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
                                        const activityTitle = activity.heading || '';
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
                                                    <div className="space-y-2">
                                                      <Label>Activity Heading</Label>
                                                      <Input
                                                        value={activity.heading || ''}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                          updateActivity(actIndex, 'heading', e.target.value)
                                                        }
                                                        placeholder="e.g., Visit the Pyramids"
                                                      />
                                                    </div>

                                                    <div className="space-y-2">
                                                      <Label>Activity Description</Label>
                                                      <RichTextEditor
                                                        value={activity.description || ''}
                                                        onChange={(value: string) =>
                                                          updateActivity(actIndex, 'description', value)
                                                        }
                                                        placeholder="Describe this activity..."
                                                      />
                                                    </div>

                                                    <div className="space-y-2">
                                                      <ImageUpload
                                                        images={image ? [image] : []}
                                                        title="Activity Image"
                                                        description="Upload an image for this activity"
                                                        maxImages={1}
                                                        onAdd={() => {
                                                          const nextImage: ImageData = {
                                                            url: '',
                                                            title: activity.heading || '',
                                                            alt: activity.heading || '',
                                                            fileName: '',
                                                          };
                                                          updateActivity(actIndex, 'image', nextImage);
                                                        }}
                                                        onRemove={() => {
                                                          updateActivity(actIndex, 'image', null);
                                                        }}
                                                        onUpdate={(_, field, value) => {
                                                          const currentImage: ImageData = (activity?.image || {
                                                            url: '',
                                                          }) as ImageData;

                                                          const nextImage: ImageData = {
                                                            ...currentImage,
                                                            [field]: value,
                                                          };

                                                          if (!nextImage.title) nextImage.title = activity.heading || '';
                                                          if (!nextImage.alt) nextImage.alt = activity.heading || '';

                                                          updateActivity(actIndex, 'image', nextImage);
                                                        }}
                                                        onUpload={async (file: File, _index: number) => {
                                                          return handleImageUpload(file);
                                                        }}
                                                      />
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
