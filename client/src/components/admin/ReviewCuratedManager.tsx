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
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Copy, GripVertical, Plus, Trash2, Star, User } from 'lucide-react';

import { type AdminLanguage } from './AdminLanguageTabs';
import LocalizedField from './LocalizedField';
import ImageUpload, { type ImageData } from './ImageUpload';
import { ILocalizedString } from '@/types/tour';

export interface ICuratedReview {
  name: string;
  avatar?: string;
  rating: number;
  comment: ILocalizedString;
  status?: string;
}

interface ReviewCuratedManagerProps {
  reviews: ICuratedReview[];
  onChange: (reviews: ICuratedReview[]) => void;
  onUpload: (file: File) => Promise<{ url: string, fileName: string } | null>;
  activeLanguage: AdminLanguage;
  title?: string;
  description?: string;
}

function getReviewId(review: any, index: number) {
  return `review-${index}`;
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

export default function ReviewCuratedManager({
  reviews = [],
  onChange,
  onUpload,
  activeLanguage,
  title = 'Testimonials & Reviews',
  description = 'Manage curated reviews for this category. Drag to reorder.',
}: ReviewCuratedManagerProps) {
  const reviewIds = useMemo<string[]>(() => reviews.map((_, i) => getReviewId(reviews[i], i)), [reviews]);

  const [collapsedReviews, setCollapsedReviews] = useState<Record<string, boolean>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!reviewIds.length) return;

    setCollapsedReviews(prev => {
      const next = { ...prev };
      let changed = false;
      for (const id of reviewIds) {
        if (next[id] === undefined) {
          next[id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [reviewIds]);

  const toggleReviewCollapsed = useCallback((reviewId: string) => {
    setCollapsedReviews(prev => ({ ...prev, [reviewId]: !(prev[reviewId] ?? true) }));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = reviewIds.indexOf(String(active.id));
      const newIndex = reviewIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(reviews, oldIndex, newIndex);
      onChange(reordered);

      const collapsedByIndex: boolean[] = reviewIds.map(id => collapsedReviews[id] ?? true);
      const movedCollapsed: boolean[] = arrayMove(collapsedByIndex, oldIndex, newIndex);
      const nextCollapsedReviews: Record<string, boolean> = {};
      reordered.forEach((_, i) => {
        nextCollapsedReviews[getReviewId(reordered[i], i)] = movedCollapsed[i] ?? true;
      });
      setCollapsedReviews(nextCollapsedReviews);
    },
    [collapsedReviews, reviewIds, reviews, onChange]
  );

  const addReview = useCallback(() => {
    const newReview: ICuratedReview = {
      name: '',
      avatar: '',
      rating: 5,
      comment: { en: '', de: '', it: '', es: '' },
      status: 'approved',
    };
    onChange([...reviews, newReview]);
    // Expand the new review
    const newId = getReviewId(newReview, reviews.length);
    setCollapsedReviews(prev => ({ ...prev, [newId]: false }));
  }, [reviews, onChange]);

  const removeReview = useCallback(
    (index: number) => {
      const next = [...reviews];
      next.splice(index, 1);
      onChange(next);
    },
    [reviews, onChange]
  );

  const updateReview = useCallback(
    (index: number, field: keyof ICuratedReview, value: any, lang?: AdminLanguage) => {
      const next = [...reviews];
      if (lang && field === 'comment') {
        next[index] = {
          ...next[index],
          [field]: { ...(next[index][field] as any), [lang]: value },
        };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      onChange(next);
    },
    [reviews, onChange]
  );

  const duplicateReview = useCallback(
    (index: number) => {
      const current = reviews[index];
      if (!current) return;

      const cloned = JSON.parse(JSON.stringify(current));
      if (cloned.name) {
        cloned.name = `${cloned.name} (Copy)`;
      }

      const next = [...reviews];
      next.splice(index + 1, 0, cloned);
      onChange(next);
    },
    [reviews, onChange]
  );

  return (
    <Card className="shadow-sm border-gray-200 dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button type="button" onClick={addReview} size="sm" className="bg-[#b79c5c] hover:bg-[#a68b4b]">
            <Plus className="h-4 w-4 mr-1" /> Add Review
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-slate-900 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
            <div className="bg-white dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <User className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No reviews added yet</p>
            <Button
              type="button"
              variant="link"
              onClick={addReview}
              className="text-[#b79c5c] font-bold hover:text-[#a68b4b] mt-1"
            >
              Click here to add your first testimonial
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={reviewIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {reviews.map((review, index) => {
                  const reviewId = getReviewId(review, index);
                  const isCollapsed = collapsedReviews[reviewId] ?? true;

                  return (
                    <SortableItemWrapper
                      key={reviewId}
                      id={reviewId}
                      className="border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {({ attributes, listeners, setActivatorNodeRef }) => (
                        <>
                          <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 p-3 bg-gray-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                ref={setActivatorNodeRef}
                                {...attributes}
                                {...listeners}
                                className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-800"
                              >
                                <GripVertical className="h-4 w-4 text-gray-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs font-bold text-[#b79c5c] shrink-0 uppercase tracking-wider">
                                    Review {index + 1}
                                  </span>
                                  <span
                                    className={cn(
                                      'text-sm font-semibold truncate',
                                      review.name ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                                    )}
                                  >
                                    {review.name || 'Anonymous Review'}
                                  </span>
                                  <div className="flex items-center gap-0.5 ml-2">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        size={10} 
                                        className={cn(i < (review.rating || 5) ? "text-yellow-500 fill-yellow-500" : "text-gray-300")} 
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => toggleReviewCollapsed(reviewId)}
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
                                onClick={() => duplicateReview(index)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                                onClick={() => removeReview(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {!isCollapsed && (
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Reviewer Name
                                  </Label>
                                  <Input 
                                    value={review.name}
                                    onChange={(e) => updateReview(index, 'name', e.target.value)}
                                    placeholder="Enter reviewer name..."
                                    className="mt-1"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Rating (1-5)
                                  </Label>
                                  <div className="flex items-center gap-4 mt-1">
                                    <Input 
                                      type="number"
                                      min="1"
                                      max="5"
                                      value={review.rating}
                                      onChange={(e) => updateReview(index, 'rating', parseInt(e.target.value))}
                                      className="w-20"
                                    />
                                    <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <button
                                          key={i}
                                          type="button"
                                          onClick={() => updateReview(index, 'rating', i + 1)}
                                          className="focus:outline-none"
                                        >
                                          <Star 
                                            size={20} 
                                            className={cn(i < (review.rating || 5) ? "text-yellow-500 fill-yellow-500" : "text-gray-300")} 
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                                    Reviewer Avatar
                                  </Label>
                                  <ImageUpload 
                                    images={review.avatar ? [{ url: review.avatar }] : []}
                                    maxImages={1}
                                    onAdd={() => {}} 
                                    onRemove={() => updateReview(index, 'avatar', '')}
                                    onUpdate={(_i, _f, value) => updateReview(index, 'avatar', value)}
                                    onUpload={onUpload ? (file) => onUpload(file) : async () => null}
                                    activeLanguage={activeLanguage}
                                    title="Avatar"
                                    description="Upload or pick an image"
                                    addButtonLabel="Click to Upload Avatar"
                                  />
                                </div>
                              </div>

                              <div className="space-y-4">
                                <LocalizedField
                                  label="Comment / Testimonial"
                                  value={review.comment}
                                  globalLanguage={activeLanguage}
                                  onChange={(lang, val) => updateReview(index, 'comment', val, lang)}
                                >
                                  {(lang, currentValue, handleLang) => (
                                    <div className="space-y-2">
                                      <textarea
                                        value={currentValue}
                                        onChange={(e) => handleLang(e.target.value)}
                                        placeholder={`The review text in ${lang}...`}
                                        className="w-full min-h-[150px] p-3 rounded-md border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#b79c5c] focus:border-transparent text-sm"
                                      />
                                    </div>
                                  )}
                                </LocalizedField>

                                <div className="flex items-center justify-between pt-2">
                                  <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Status
                                  </Label>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={review.status !== 'rejected'}
                                      onCheckedChange={(checked) => updateReview(index, 'status', checked ? 'approved' : 'rejected')}
                                    />
                                    <span className="text-xs text-gray-500">{review.status === 'approved' ? 'Visible' : 'Hidden'}</span>
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
        )}
      </CardContent>
    </Card>
  );
}
