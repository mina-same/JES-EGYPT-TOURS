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
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Copy, GripVertical, Plus, Trash2, X, Search, Loader2 } from 'lucide-react';

interface ResourcesTabProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
  // Search props
  tourSearchQuery: string;
  setTourSearchQuery: (query: string) => void;
  tourSearchResults: any[];
  isSearchingTours?: boolean;
  blogSearchQuery: string;
  setBlogSearchQuery: (query: string) => void;
  blogSearchResults: any[];
  isSearchingBlogs?: boolean;
}

function getFaqId(faq: any, index: number) {
  return `faq-${index}`;
}

function getYouTubeVideoId(url: string): string {
  if (!url) return '';

  const trimmed = url.trim();

  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch?.[1]) return shortMatch[1];

  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (watchMatch?.[1]) return watchMatch[1];

  const embedMatch = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (embedMatch?.[1]) return embedMatch[1];

  const shortsMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/);
  if (shortsMatch?.[1]) return shortsMatch[1];

  return '';
}

const FAQ_BG_CLASSES = [
  'bg-slate-50',
  'bg-blue-50',
  'bg-emerald-50',
  'bg-amber-50',
  'bg-rose-50',
  'bg-violet-50',
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

export default function ResourcesTab({
  formData,
  handleChange,
  tourSearchQuery,
  setTourSearchQuery,
  tourSearchResults,
  isSearchingTours = false,
  blogSearchQuery,
  setBlogSearchQuery,
  blogSearchResults,
  isSearchingBlogs = false,
}: ResourcesTabProps) {
  const faqs = formData.faqs || [];
  const faqIds = useMemo<string[]>(() => faqs.map((_: any, i: number) => getFaqId(faqs[i], i)), [faqs]);

  const reviews = formData.reviews || [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [collapsedFaqs, setCollapsedFaqs] = useState<Record<string, boolean>>({});

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

  const handleFaqsDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = faqIds.indexOf(String(active.id));
      const newIndex = faqIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(faqs, oldIndex, newIndex);
      handleChange('faqs', reordered);

      const collapsedByIndex: boolean[] = faqIds.map(id => collapsedFaqs[id] ?? true);
      const movedCollapsed: boolean[] = arrayMove(collapsedByIndex, oldIndex, newIndex);
      const nextCollapsedFaqs: Record<string, boolean> = {};
      reordered.forEach((_, i) => {
        nextCollapsedFaqs[getFaqId(reordered[i], i)] = movedCollapsed[i] ?? true;
      });
      setCollapsedFaqs(nextCollapsedFaqs);
    },
    [collapsedFaqs, faqIds, faqs, handleChange]
  );

  const duplicateFaq = useCallback(
    (faqIndex: number) => {
      const current = faqs[faqIndex];
      if (!current) return;

      const cloned = JSON.parse(JSON.stringify(current));
      cloned.question = current.question ? `${current.question} (Copy)` : '';

      const next = [...faqs];
      next.splice(faqIndex + 1, 0, cloned);
      handleChange('faqs', next);
    },
    [faqs, handleChange]
  );

  const closeAll = useCallback(() => {
    const nextFaqs: Record<string, boolean> = {};
    faqIds.forEach(id => {
      nextFaqs[id] = true;
    });
    setCollapsedFaqs(nextFaqs);
  }, [faqIds]);
  
  // FAQ Handlers
  const addFaq = () => {
    const newFaqs = [...(formData.faqs || []), { question: '', answer: '' }];
    handleChange('faqs', newFaqs);
  };

  const removeFaq = (index: number) => {
    const newFaqs = formData.faqs.filter((_: any, i: number) => i !== index);
    handleChange('faqs', newFaqs);
  };

  const updateFaq = (index: number, field: string, value: any) => {
    const newFaqs = [...formData.faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    handleChange('faqs', newFaqs);
  };

  const addReviewVideo = () => {
    const next = [
      ...(reviews || []),
      { type: 'youtube', url: '', title: '' },
    ];
    handleChange('reviews', next);
  };

  const removeReviewVideo = (index: number) => {
    const next = (reviews || []).filter((_: any, i: number) => i !== index);
    handleChange('reviews', next);
  };

  const updateReviewVideo = (index: number, field: string, value: any) => {
    const next = [...(reviews || [])];
    next[index] = { ...next[index], [field]: value };
    handleChange('reviews', next);
  };

  // Related Tour Handlers
  const addRelatedTour = (tour: any) => {
    if (!formData.relatedTours?.some((t: any) => t.id === tour._id)) {
      const newRelated = [
        ...(formData.relatedTours || []),
        { id: tour._id, title: tour.heading || tour.name }
      ];
      handleChange('relatedTours', newRelated);
      setTourSearchQuery(''); // Clear search
    }
  };

  const removeRelatedTour = (index: number) => {
    const newRelated = formData.relatedTours.filter((_: any, i: number) => i !== index);
    handleChange('relatedTours', newRelated);
  };

  // Blog Reference Handlers
  const addBlogReference = (blog: any) => {
    if (!formData.blogReferences?.some((b: any) => b.id === blog._id)) {
      const newRefs = [
        ...(formData.blogReferences || []),
        { id: blog._id, title: blog.title }
      ];
      handleChange('blogReferences', newRefs);
      setBlogSearchQuery(''); // Clear search
    }
  };

  const removeBlogReference = (index: number) => {
    const newRefs = formData.blogReferences.filter((_: any, i: number) => i !== index);
    handleChange('blogReferences', newRefs);
  };

  return (
    <div className="space-y-6">
      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Common questions and answers for this tour</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No FAQs yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                Add your first FAQ to help travelers learn more about your tour.
              </p>
              <Button type="button" onClick={addFaq}>
                <Plus className="w-4 h-4 mr-2" />
                Create First FAQ
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-end">
                <Button type="button" variant="outline" size="sm" onClick={closeAll}>
                  Close all
                </Button>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFaqsDragEnd}>
                <SortableContext items={faqIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {faqs.map((faq: any, faqIndex: number) => {
                      const faqId = getFaqId(faq, faqIndex);
                      const isCollapsed = collapsedFaqs[faqId] ?? true;
                      const faqBg = FAQ_BG_CLASSES[faqIndex % FAQ_BG_CLASSES.length];

                      return (
                        <SortableItemWrapper
                          id={faqId}
                          key={faqId}
                          className={cn('rounded-lg border', faqBg)}
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
                                      <span className="text-sm font-semibold shrink-0">FAQ {faqIndex + 1}</span>
                                      <span
                                        className={cn(
                                          'text-sm truncate',
                                          faq.question ? 'text-foreground' : 'text-muted-foreground'
                                        )}
                                      >
                                        {faq.question || 'Untitled question'}
                                      </span>
                                      {!faq.question && <span className="text-xs text-red-600 shrink-0">Required</span>}
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
                                    className="h-8 w-8 p-0"
                                    onClick={() => duplicateFaq(faqIndex)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    onClick={() => removeFaq(faqIndex)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {!isCollapsed && (
                                <div className="p-4 space-y-3">
                                  <div className="space-y-2">
                                    <Label>Question *</Label>
                                    <Input
                                      value={faq.question}
                                      onChange={(e) => updateFaq(faqIndex, 'question', e.target.value)}
                                      placeholder="e.g., What should I wear?"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Answer *</Label>
                                    <RichTextEditor
                                      value={faq.answer}
                                      onChange={(value) => updateFaq(faqIndex, 'answer', value)}
                                      placeholder="Answer..."
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
            </>
          )}
          <Button type="button" onClick={addFaq} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        </CardContent>
      </Card>

      {/* Reflective & Honest Reviews (YouTube) */}
      <Card>
        <CardHeader>
          <CardTitle>Reflective &amp; Honest Reviews</CardTitle>
          <CardDescription>Add YouTube links to show on the tour details page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(reviews || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No YouTube reviews yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                Add YouTube links and titles. If there are no valid links, the section will not appear on the public tour page.
              </p>
              <Button type="button" onClick={addReviewVideo}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Video
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {(reviews || []).map((r: any, index: number) => {
                const url = String(r?.url || '');
                const videoId = getYouTubeVideoId(url);
                const isValid = Boolean(videoId);

                return (
                  <div key={index} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {r?.title || `Video ${index + 1}`}
                        </div>
                        <div className={cn('text-xs', isValid ? 'text-emerald-600' : 'text-amber-600')}>
                          {isValid ? `Valid YouTube video (ID: ${videoId})` : 'Invalid YouTube link'}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => removeReviewVideo(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={r?.title || ''}
                          onChange={(e) => updateReviewVideo(index, 'title', e.target.value)}
                          placeholder="e.g., Traveler Experience in Cairo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>YouTube URL</Label>
                        <Input
                          value={r?.url || ''}
                          onChange={(e) => updateReviewVideo(index, 'url', e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <Button type="button" onClick={addReviewVideo} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Video
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Tours */}
      <Card>
        <CardHeader>
          <CardTitle>Related Tours</CardTitle>
          <CardDescription>Link other tours that might interest travelers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Tours List */}
          <div className="space-y-2">
            {formData.relatedTours?.map((tour: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-secondary/20 rounded-md border">
                <span className="text-sm font-medium truncate">{tour.title}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRelatedTour(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(!formData.relatedTours || formData.relatedTours.length === 0) && (
              <p className="text-sm text-muted-foreground italic">No related tours selected.</p>
            )}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tours to add..."
              value={tourSearchQuery}
              onChange={(e) => setTourSearchQuery(e.target.value)}
              className="pl-8"
            />
            {isSearchingTours && (
              <div className="absolute right-2 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Search Results */}
          {tourSearchQuery && (
            <div className="border rounded-md max-h-48 overflow-y-auto bg-background shadow-sm">
              {tourSearchResults.length > 0 ? (
                tourSearchResults.map((tour) => (
                  <button
                    key={tour._id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2"
                    onClick={() => addRelatedTour(tour)}
                  >
                    <Plus className="h-3 w-3" />
                    <span className="truncate">{tour.heading || tour.name}</span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  {isSearchingTours ? 'Searching...' : 'No tours found'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Blogs */}
      <Card>
        <CardHeader>
          <CardTitle>Related Blogs</CardTitle>
          <CardDescription>Link relevant blog posts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Blogs List */}
          <div className="space-y-2">
            {formData.blogReferences?.map((blog: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-secondary/20 rounded-md border">
                <span className="text-sm font-medium truncate">{blog.title}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBlogReference(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(!formData.blogReferences || formData.blogReferences.length === 0) && (
              <p className="text-sm text-muted-foreground italic">No related blogs selected.</p>
            )}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search blogs to add..."
              value={blogSearchQuery}
              onChange={(e) => setBlogSearchQuery(e.target.value)}
              className="pl-8"
            />
            {isSearchingBlogs && (
              <div className="absolute right-2 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Search Results */}
          {blogSearchQuery && (
            <div className="border rounded-md max-h-48 overflow-y-auto bg-background shadow-sm">
              {blogSearchResults.length > 0 ? (
                blogSearchResults.map((blog) => (
                  <button
                    key={blog._id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2"
                    onClick={() => addBlogReference(blog)}
                  >
                    <Plus className="h-3 w-3" />
                    <span className="truncate">{blog.title}</span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  {isSearchingBlogs ? 'Searching...' : 'No blogs found'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
