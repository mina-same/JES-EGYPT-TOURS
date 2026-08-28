import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, Loader2, Plus, Trash2, X, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';

import { type AdminLanguage } from '../AdminLanguageTabs';
import LocalizedField from '../LocalizedField';
import FaqManager from '../FaqManager';
import { blogAPI } from '@/lib/api/blogAdmin';
import { BLOG_SEARCH_LIMIT } from '@/lib/tour/relatedBlogs';

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
  activeLanguage: AdminLanguage;
}

function getReferenceId(value: any): string {
  if (typeof value === 'string') return value;

  const id = value?.id ?? value?._id;
  return id == null ? '' : String(id);
}

/**
 * A reference's own stored title, in the admin's active language where it has
 * one. It is a SNAPSHOT taken when the article was picked, so it is the
 * fallback: `useLinkedBlogs` below resolves the live title by id and this is
 * what shows until that lands, or if the article has since been deleted.
 */
function getReferenceTitle(value: any, lang: AdminLanguage): string {
  const title = value?.title;
  if (typeof title === 'string') return title;
  if (title && typeof title === 'object') {
    return title[lang] || title.en || Object.values(title).find(Boolean) as string || '';
  }
  return '';
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

/**
 * Resolves what a tour's blog references actually point at, right now.
 *
 * A reference stores an id and a title frozen at the moment it was picked, so
 * the list could show a headline that had since been rewritten, and it went on
 * showing an article that had been deleted as though it were still linked —
 * the visitor page drops those silently, so nobody saw the difference from the
 * admin. Looking the ids up gives the list live titles, the article's current
 * status (a draft linked here will not appear on the site), and the one thing
 * the frozen copy can never tell you: that the article is gone.
 */
function useLinkedBlogs(references: any[]) {
  const [records, setRecords] = useState<Record<string, any>>({});
  const [isResolving, setIsResolving] = useState(false);
  /**
   * Whether the lookup ANSWERED, as distinct from whether it found anything.
   * "Deleted" can only be claimed on a successful answer: a failed request
   * also produces zero records, and so would a tour whose every reference had
   * been deleted — the two are indistinguishable by row count alone.
   */
  const [isResolved, setIsResolved] = useState(false);

  const ids = (references || []).map(getReferenceId).filter(Boolean);
  // A stable dependency: the effect must re-run when the SET of ids changes,
  // not on every render that hands over a new array with the same contents.
  const idKey = ids.join(',');

  useEffect(() => {
    if (!idKey) {
      setRecords({});
      setIsResolved(false);
      return;
    }

    let active = true;
    setIsResolving(true);
    setIsResolved(false);

    blogAPI
      .getAllAdmin({ ids: idKey, limit: ids.length })
      .then((response: any) => {
        if (!active) return;
        const next: Record<string, any> = {};
        (response?.data || []).forEach((blog: any) => {
          next[String(blog._id)] = blog;
        });
        setRecords(next);
        setIsResolved(true);
      })
      .catch(() => {
        // A failed lookup must not blank the list, and must not accuse every
        // article of being deleted: without records each row falls back to its
        // stored title, which is exactly what it showed before.
        if (active) {
          setRecords({});
          setIsResolved(false);
        }
      })
      .finally(() => {
        if (active) setIsResolving(false);
      });

    return () => {
      active = false;
    };
  }, [idKey, ids.length]);

  return { records, isResolving, isResolved };
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
  activeLanguage,
}: ResourcesTabProps) {
  const reviews = formData.reviews || [];
  const [isTourFocused, setIsTourFocused] = useState(false);
  const [isBlogFocused, setIsBlogFocused] = useState(false);
  
  const tourRef = useRef<HTMLDivElement>(null);
  const blogRef = useRef<HTMLDivElement>(null);

  const selectedTourIds = new Set(
    (formData.relatedTours || []).map(getReferenceId).filter(Boolean)
  );
  const selectedBlogIds = new Set(
    (formData.blogReferences || []).map(getReferenceId).filter(Boolean)
  );
  const availableTourSearchResults = tourSearchResults.filter(
    (tour) => !selectedTourIds.has(getReferenceId(tour))
  );
  const availableBlogSearchResults = blogSearchResults.filter(
    (blog) => !selectedBlogIds.has(getReferenceId(blog))
  );

  const blogReferences: any[] = formData.blogReferences || [];
  const { records: linkedBlogRecords, isResolved: areBlogsResolved } =
    useLinkedBlogs(blogReferences);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tourRef.current && !tourRef.current.contains(event.target as Node)) {
        setIsTourFocused(false);
      }
      if (blogRef.current && !blogRef.current.contains(event.target as Node)) {
        setIsBlogFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addReviewVideo = () => {
    const next = [
      ...(reviews || []),
      { type: 'youtube', url: '', title: { en: '', de: '', it: '' } },
    ];
    handleChange('reviews', next);
  };

  const removeReviewVideo = (index: number) => {
    const next = (reviews || []).filter((_: any, i: number) => i !== index);
    handleChange('reviews', next);
  };

  const updateReviewVideo = (index: number, field: string, value: any, lang: AdminLanguage = activeLanguage) => {
    const next = [...(reviews || [])];
    const currentReview = next[index];

    if (field === 'title') {
      next[index] = {
        ...currentReview,
        [field]: {
          ...(currentReview[field] || { en: '', de: '', it: '' }),
          [lang]: value
        }
      };
    } else {
      next[index] = { ...currentReview, [field]: value };
    }
    
    handleChange('reviews', next);
  };

  // Related Tour Handlers
  const addRelatedTour = (tour: any) => {
    const tourId = getReferenceId(tour);
    if (tourId && !selectedTourIds.has(tourId)) {
      const newRelated = [
        ...(formData.relatedTours || []),
        { id: tourId, title: typeof tour.heading === 'object' ? tour.heading : typeof tour.name === 'object' ? tour.name : { en: tour.heading || tour.name || '', de: '', it: '' } }
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
    const blogId = getReferenceId(blog);
    if (blogId && !selectedBlogIds.has(blogId)) {
      const newRefs = [
        ...(formData.blogReferences || []),
        {
          id: blogId,
          // The whole localized object when the API gives one. It used to be
          // rebuilt as `{ en, de, it }` from a flattened English string — one
          // language, and no `es` key at all — because the picker was reading
          // the public endpoint. This title is only a label for THIS screen;
          // the tour page always re-fetches the article by id.
          title:
            blog.title && typeof blog.title === 'object'
              ? blog.title
              : { en: blog.title || '', de: '', it: '', es: '' },
        },
      ];
      handleChange('blogReferences', newRefs);
      setBlogSearchQuery(''); // Clear search
    }
  };

  const removeBlogReference = (index: number) => {
    const newRefs = (formData.blogReferences || []).filter((_: any, i: number) => i !== index);
    handleChange('blogReferences', newRefs);
  };

  /** Ordering here is the ordering visitors see in the carousel. */
  const moveBlogReference = (index: number, direction: -1 | 1) => {
    const refs = [...(formData.blogReferences || [])];
    const target = index + direction;
    if (target < 0 || target >= refs.length) return;
    [refs[index], refs[target]] = [refs[target], refs[index]];
    handleChange('blogReferences', refs);
  };

  return (
    <div className="space-y-6">
      {/* FAQs */}
      <FaqManager
        faqs={formData.faqs}
        onChange={(faqs) => handleChange('faqs', faqs)}
        activeLanguage={activeLanguage}
      />

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
                          {r?.title?.[activeLanguage] || r?.title?.en || `Video ${index + 1}`}
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
                      <LocalizedField
                        label="Title"
                        value={r?.title}
                        globalLanguage={activeLanguage}
                        onChange={(lang, val) => updateReviewVideo(index, 'title', val, lang)}
                      >
                        {(lang, currentValue, handleLang) => (
                          <Input
                            value={currentValue}
                            onChange={(e) => handleLang(e.target.value)}
                            placeholder={`Review title in ${lang}`}
                          />
                        )}
                      </LocalizedField>
                      <div className="space-y-2 pt-[21px]">
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
                <span className="text-sm font-medium truncate">{typeof tour.title === 'object' ? tour.title.en || tour.title[activeLanguage] : tour.title}</span>
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
          <div className="relative" ref={tourRef}>
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tours to add..."
              value={tourSearchQuery}
              onChange={(e) => setTourSearchQuery(e.target.value)}
              onFocus={() => setIsTourFocused(true)}
              className="pl-8"
            />
            {isSearchingTours && (
              <div className="absolute right-2 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {isTourFocused && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 left-0 right-0 mt-1 border rounded-md max-h-60 overflow-y-auto bg-background shadow-lg"
                >
                  {availableTourSearchResults.length > 0 ? (
                    <div className="py-1">
                      {availableTourSearchResults.map((tour) => (
                        <button
                          key={tour._id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2 transition-colors"
                          onClick={() => {
                            addRelatedTour(tour);
                            setIsTourFocused(false);
                          }}
                        >
                          <Plus className="h-3 w-3 text-primary" />
                          <span className="truncate">
                            {typeof tour.heading === 'object' ? tour.heading?.en : typeof tour.name === 'object' ? tour.name?.en : (tour.heading || tour.name)}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      {isSearchingTours ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching tours...
                        </div>
                      ) : (
                        tourSearchQuery ? 'No tours found matching your search' : 'Start typing to search tours'
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Related Blogs */}
      <Card>
        <CardHeader>
          <CardTitle>Related Blogs</CardTitle>
          <CardDescription>
            All linked published articles appear in this order in the tour-page carousel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Blogs List */}
          <div className="space-y-2">
            {blogReferences.map((blog: any, index: number) => {
              const id = getReferenceId(blog);
              const record = linkedBlogRecords[id];
              // Live title where the lookup found the article, the stored
              // snapshot until it lands or if the article is gone.
              const title =
                (record && getReferenceTitle(record, activeLanguage)) ||
                getReferenceTitle(blog, activeLanguage) ||
                'Untitled article';
              // Only claimable once the lookup has actually answered.
              const isMissing = areBlogsResolved && !record;
              const isUnpublished = record && record.status !== 'published';
              return (
                <div
                  key={id || `ref-${index}`}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-md border',
                    'bg-secondary/20',
                    isMissing && 'border-red-300 bg-red-50 dark:bg-red-950/20'
                  )}
                >
                  {/* Position, because position is what decides visibility. */}
                  <span
                    className={cn(
                      'shrink-0 w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold',
                      'bg-primary/10 text-primary'
                    )}
                  >
                    {index + 1}
                  </span>

                  <span className="text-sm font-medium truncate flex-1">{title}</span>

                  {isMissing && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      Deleted
                    </span>
                  )}
                  {!isMissing && isUnpublished && (
                    <span className="shrink-0 text-[11px] font-semibold uppercase text-amber-600">
                      {record.status}
                    </span>
                  )}
                  <div className="shrink-0 flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-1.5"
                      disabled={index === 0}
                      aria-label={`Move ${title} up`}
                      onClick={() => moveBlogReference(index, -1)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-1.5"
                      disabled={index === blogReferences.length - 1}
                      aria-label={`Move ${title} down`}
                      onClick={() => moveBlogReference(index, 1)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-1.5"
                      aria-label={`Remove ${title}`}
                      onClick={() => removeBlogReference(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {blogReferences.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No related blogs selected.</p>
            )}

          </div>

          {/* Search Input */}
          <div className="relative" ref={blogRef}>
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search blogs to add..."
              value={blogSearchQuery}
              onChange={(e) => setBlogSearchQuery(e.target.value)}
              onFocus={() => setIsBlogFocused(true)}
              className="pl-8"
            />
            {isSearchingBlogs && (
              <div className="absolute right-2 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {isBlogFocused && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 left-0 right-0 mt-1 border rounded-md max-h-60 overflow-y-auto bg-background shadow-lg"
                >
                  {availableBlogSearchResults.length > 0 ? (
                    <div className="py-1">
                      {availableBlogSearchResults.map((blog) => (
                        <button
                          key={blog._id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2 transition-colors"
                          onClick={() => {
                            addBlogReference(blog);
                            setIsBlogFocused(false);
                          }}
                        >
                          <Plus className="h-3 w-3 text-primary" />
                          <span className="truncate flex-1">
                            {getReferenceTitle(blog, activeLanguage) || 'Untitled article'}
                          </span>
                          {/* The admin listing returns drafts too, which the
                              public one never did. Linking one is allowed —
                              it simply will not show until it is published. */}
                          {blog.status && blog.status !== 'published' && (
                            <span className="shrink-0 text-[10px] font-semibold uppercase text-amber-600">
                              {blog.status}
                            </span>
                          )}
                        </button>
                      ))}
                      {blogSearchResults.length >= BLOG_SEARCH_LIMIT && (
                        <p className="px-3 py-2 text-[11px] text-muted-foreground border-t">
                          Showing the first {BLOG_SEARCH_LIMIT} matches — refine the search to narrow it.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      {isSearchingBlogs ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching blogs...
                        </div>
                      ) : (
                        blogSearchQuery ? 'No blogs found matching your search' : 'Start typing to search blogs'
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
