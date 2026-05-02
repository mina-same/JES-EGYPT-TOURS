'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { tourAPI } from '@/lib/api/tour';
import { getAllBlogs } from '@/lib/api/blog';
import { Button } from '@/components/ui/button';
import { 
  Loader2, Save,
  LayoutDashboard, Image as ImageIcon, Map as MapIcon, 
  ListChecks, DollarSign, Settings, HelpCircle, MapPinned
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { validateTourForm } from '@/lib/validations/tourValidation';
import { parseApiError, type FormErrorItem } from '@/lib/parseApiError';
import { normalizeTourMapSchemaForSave } from '@/lib/tourMapSchema';
import FormErrorPanel from '@/components/admin/FormErrorPanel';
import DraftBanner from '@/components/admin/DraftBanner';
import { useToast } from '@/hooks/use-toast';

// Import modular components
import { useTourForm } from '@/hooks/useTourForm';
import { 
  OverviewTab, 
  MediaTab, 
  ItineraryTab, 
  DetailsTab, 
  PricingTab, 
  ResourcesTab,
  AttractionsTab,
  SEOTab 
} from '@/components/admin/tour';
import AdminLanguageTabs, { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';

// Tab definitions
const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'itinerary', label: 'Itinerary', icon: MapIcon },
  { id: 'details', label: 'Details', icon: ListChecks },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'attractions', label: 'Attractions Schema', icon: MapPinned },
  { id: 'resources', label: 'Resources', icon: HelpCircle },
  { id: 'seo', label: 'SEO & Settings', icon: Settings },
];

export default function EditTourPage() {
  const router = useRouter();
  const params = useParams();
  const tourId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeAdminLanguage, setActiveAdminLanguage] = useState<AdminLanguage>('en');
  const [formErrors, setFormErrors] = useState<FormErrorItem[]>([]);
  const { toast } = useToast();
  
  const draftKey = `draft_tour_edit_${tourId}`;
  
  // Search state for Resources tab
  const [tourSearchQuery, setTourSearchQuery] = useState('');
  const [tourSearchResults, setTourSearchResults] = useState<any[]>([]);
  const [isSearchingTours, setIsSearchingTours] = useState(false);
  const [blogSearchQuery, setBlogSearchQuery] = useState('');
  const [blogSearchResults, setBlogSearchResults] = useState<any[]>([]);
  const [isSearchingBlogs, setIsSearchingBlogs] = useState(false);

  // Use custom hook for form logic
  const tourForm = useTourForm(undefined, draftKey);

  // Fetch tour data
  useEffect(() => {
    const fetchTour = async () => {
      try {
        setInitialLoading(true);
        setError(null);

        const response = await tourAPI.getById(tourId);
        
        if (response.success && response.data) {
          const tour = response.data;
          
          const toLocalized = (val: any) => {
            if (!val) return { en: '', de: '', it: '', es: '' };
            if (typeof val === 'string') return { en: val, de: '', it: '', es: '' };
            return {
              en: val.en || '',
              de: val.de || '',
              it: val.it || '',
              es: val.es || '',
            };
          };

          const toLocalizedMixed = (val: any) => {
            const empty = { en: [], de: [], it: [], es: [] };
            if (!val) return empty;
            
            if (Array.isArray(val)) {
              // If it's an array of objects (LocalizedSchema), we need to extract the strings
              if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
                const result: any = { en: [], de: [], it: [], es: [] };
                const languages = ['en', 'de', 'it', 'es'] as const;
                
                val.forEach(item => {
                  languages.forEach(lang => {
                    const content = item[lang];
                    if (Array.isArray(content)) {
                      // Flatten corrupted data where item[lang] was accidentally saved as an array
                      result[lang].push(...content.filter(Boolean));
                    } else if (content) {
                      result[lang].push(content);
                    }
                  });
                });
                return result;
              }
              // It's already a flat array of strings? Default to English
              return { en: val, de: [], it: [], es: [] };
            }

            // It's already the { en: [], de: [] } structure
            return {
              en: Array.isArray(val.en) ? val.en : (val.en ? [val.en] : []),
              de: Array.isArray(val.de) ? val.de : (val.de ? [val.de] : []),
              it: Array.isArray(val.it) ? val.it : (val.it ? [val.it] : []),
              es: Array.isArray(val.es) ? val.es : (val.es ? [val.es] : []),
            };
          };



          const toLocalizedImage = (img: any) => {
            if (!img) return null;
            return {
              ...img,
              title: toLocalized(img.title),
              alt: toLocalized(img.alt),
            };
          };

          // Transform the data to match form structure and update form state
          tourForm.setFormData(prev => {
            // If there's already data (from draft), don't overwrite it
            // Actually, for Edit mode, we usually want the server data as base,
            // but if a draft exists and it's newer... useTourForm already handles this in initializer.
            // If the user just opened the page, useTourForm loads draft.
            // When fetchTour finishes, we want to update the draft with any server changes?
            // Usually, draft is specifically for unsaved changes.
            // For simplicity, we only call setFormData if no draft was loaded or if we explicitly want to refresh.
            return {
              ...prev,
              name: (typeof tour.heading === 'object' ? tour.heading.en : tour.heading) || tour.name || '',
              slug: tour.slug || '',
              description: {
                header: toLocalized(tour.Description?.header),
                text: toLocalized(tour.Description?.text),
              },
              subcategory: typeof tour.subcategory === 'object' ? tour.subcategory._id : (tour.subcategory || ''),
              images: (tour.images || []).map(toLocalizedImage).filter(Boolean),
              gallery: (tour.gallery || []).map(toLocalizedImage).filter(Boolean),
              idExternal: tour.idExternal || '',
              heading: toLocalized(tour.heading),
              headingDescription: toLocalized(tour.headingDescription),
              meetingPoint: toLocalized(tour.meetingPoint),
              tags: toLocalizedMixed(tour.tags),
              tourLocation: toLocalized(tour.tourLocation),
              tourAvailability: toLocalized(tour.tourAvailability),
              pickupAndDropOff: toLocalized(tour.pickupAndDropOff),
              tourType: toLocalized(tour.tourType),
              tourStyle: toLocalized(tour.tourStyle),
              duration: toLocalized(tour.duration),
              cancellationPolicy: toLocalized(tour.cancellationPolicy),
              isFeatured: tour.isFeatured || false,
              isActive: tour.isActive !== undefined ? tour.isActive : true,
              reviewsCount: tour.reviewsCount || 0,
              seo: {
                metaTitle: toLocalized(tour.seo?.metaTitle),
                metaDescription: toLocalized(tour.seo?.metaDescription),
                metaKeywords: toLocalizedMixed(tour.seo?.metaKeywords),
                metaImage: tour.seo?.metaImage 
                  ? toLocalizedImage(tour.seo.metaImage) 
                  : { url: '', fileName: '', title: { en: '', de: '', it: '', es: '' }, alt: { en: '', de: '', it: '', es: '' } },
              },
              tourHighlights: toLocalizedMixed(tour.tourHighlights),
              inclusion: toLocalizedMixed(tour.inclusion),
              exclusion: toLocalizedMixed(tour.exclusion),
              pricingPlans: tour.pricingPlans || [],
              notes: (tour.notes || []).map((n: any) => ({
                title: toLocalized(n.title),
                text: toLocalized(n.text),
              })),
              whatToPack: toLocalizedMixed(tour.whatToPack),
              tourMapIframe: tour.tourMapIframe || '',
              mapSchema: tour.mapSchema || tour.seo?.mapSchema,
              whatYouWillLoveHtml: toLocalized(tour.whatYouWillLoveHtml),
              itinerary: {
                generalDescription: toLocalized(tour.itinerary?.generalDescription),
                days: (tour.itinerary?.days || []).map((d: any) => ({
                  ...d,
                  title: toLocalized(d.title),
                  description: toLocalized(d.description),
                  activities: (d.activities || []).map((a: any) => ({
                    ...a,
                    heading: toLocalized(a.heading),
                    description: toLocalized(a.description),
                  })),
                })),
              },
              faqs: (tour.faqs || []).map((f: any) => ({
                question: toLocalized(f.question),
                answer: toLocalized(f.answer),
              })),
              blogReferences: tour.blogReferences || [],
              relatedTours: tour.relatedTours || [],
              reviews: (tour.reviews || []).map((r: any) => ({
                ...r,
                title: toLocalized(r.title),
                content: toLocalized(r.content),
              })),
              priceStartingFrom: tour.priceStartingFrom,
            };
          });
        } else {
          setError(response.error || 'Failed to fetch tour');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setInitialLoading(false);
      }
    };

    if (tourId) {
      fetchTour();
    }
  }, [tourId]);

  // Search effects
  useEffect(() => {
    const searchTours = async () => {
      setIsSearchingTours(true);
      try {
        const response = await tourAPI.getAll({ search: tourSearchQuery.trim() || undefined, limit: 5 });
        if (response.success && response.data) {
          setTourSearchResults(response.data.filter((t: any) => t._id !== tourId));
        }
      } catch (error) {
        console.error('Failed to search tours:', error);
      } finally {
        setIsSearchingTours(false);
      }
    };

    const timeoutId = setTimeout(searchTours, 500);
    return () => clearTimeout(timeoutId);
  }, [tourSearchQuery, tourId]);

  useEffect(() => {
    const searchBlogs = async () => {
      setIsSearchingBlogs(true);
      try {
        const response = await getAllBlogs({ search: blogSearchQuery.trim() || undefined, limit: 5 });
        if (response.success && response.data) {
          setBlogSearchResults(response.data);
        }
      } catch (error) {
        console.error('Failed to search blogs:', error);
      } finally {
        setIsSearchingBlogs(false);
      }
    };

    const timeoutId = setTimeout(searchBlogs, 500);
    return () => clearTimeout(timeoutId);
  }, [blogSearchQuery]);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setFormErrors([]);

      // 1. Client-side validation
      const validationErrors = validateTourForm(tourForm.formData);
      if (validationErrors.length > 0) {
        setFormErrors(validationErrors);
        toast({
          title: 'Submission — Validation failed',
          description: `${validationErrors.length} required field${validationErrors.length > 1 ? 's' : ''} need${validationErrors.length === 1 ? 's' : ''} your attention. Check the highlighted tabs.`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // 2. Clean up empty fields
      const cleanData: any = { ...tourForm.formData };
      
      const isMixedEmpty = (mixed: any) => {
        if (!mixed || typeof mixed !== 'object' || Array.isArray(mixed)) return true;
        const languages = ['en', 'de', 'it', 'es'] as const;
        return languages.every(lang => !mixed[lang] || (Array.isArray(mixed[lang]) && mixed[lang].length === 0));
      };

      const toLocalizedMixedArray = (mixed: any) => {
        if (!mixed || typeof mixed !== 'object' || Array.isArray(mixed)) return Array.isArray(mixed) ? mixed : [];
        const languages = ['en', 'de', 'it', 'es'] as const;
        
        // Find the maximum length across all languages to ensure no item is missed
        const maxLength = Math.max(...languages.map(lang => Array.isArray(mixed[lang]) ? mixed[lang].length : 0));
        
        const result: any[] = [];
        for (let i = 0; i < maxLength; i++) {
          const item: any = {};
          languages.forEach(lang => {
            const list = mixed[lang] || [];
            const val = list[i] || '';
            // Ensure we don't save arrays into the language keys (flatten if needed)
            item[lang] = (Array.isArray(val) ? val.join(', ') : String(val)).trim();
          });

          // Only add if at least one language has content for this index
          if (languages.some(lang => item[lang])) {
            // CRITICAL FIX: Server requires English. If missing, fallback to others or a placeholder.
            if (!item.en && (item.de || item.it || item.es)) {
              item.en = item.de || item.it || item.es;
            }
            // If English is STILL empty (shouldn't happen due to check above), use a placeholder to avoid validation error
            if (!item.en) item.en = "...";
            
            result.push(item);
          }
        }
        return result;
      };
      
      // Remove empty images
      if (cleanData.images) {
        cleanData.images = cleanData.images.filter((img: any) => img.url);
        if (cleanData.images.length === 0) delete cleanData.images;
      }
      
      if (cleanData.gallery) {
        cleanData.gallery = cleanData.gallery.filter((img: any) => img.url);
        if (cleanData.gallery.length === 0) delete cleanData.gallery;
      }
      
      if (cleanData.notes) {
        cleanData.notes = cleanData.notes.filter((note: any) => note.title || note.text);
        if (cleanData.notes.length === 0) delete cleanData.notes;
      }
      
      if (cleanData.seo) {
        if (!cleanData.seo.metaTitle && !cleanData.seo.metaDescription && 
            isMixedEmpty(cleanData.seo.metaKeywords)) {
          delete cleanData.seo;
        } else if (!cleanData.seo.metaImage?.url) {
          delete cleanData.seo.metaImage;
        }
      }

      // 3. Remove empty optional fields & Sanitize list fields
      // We check if empty BEFORE transforming to array structure
      cleanData.tourHighlights = isMixedEmpty(cleanData.tourHighlights) ? [] : toLocalizedMixedArray(cleanData.tourHighlights);
      cleanData.inclusion = isMixedEmpty(cleanData.inclusion) ? [] : toLocalizedMixedArray(cleanData.inclusion);
      cleanData.exclusion = isMixedEmpty(cleanData.exclusion) ? [] : toLocalizedMixedArray(cleanData.exclusion);
      cleanData.whatToPack = isMixedEmpty(cleanData.whatToPack) ? [] : toLocalizedMixedArray(cleanData.whatToPack);
      cleanData.tags = isMixedEmpty(cleanData.tags) ? [] : toLocalizedMixedArray(cleanData.tags);

      const normalizedMapSchema = normalizeTourMapSchemaForSave(cleanData.mapSchema || cleanData.seo?.mapSchema);
      if (normalizedMapSchema) {
        cleanData.mapSchema = normalizedMapSchema;
        cleanData.seo = {
          ...(cleanData.seo || {}),
          mapSchema: normalizedMapSchema,
        };
      } else {
        delete cleanData.mapSchema;
        if (cleanData.seo?.mapSchema) delete cleanData.seo.mapSchema;
      }

      // Other cleanups
      if (!cleanData.priceStartingFrom) delete cleanData.priceStartingFrom;
      if (!cleanData.duration) delete cleanData.duration;
      if (!cleanData.tourType) delete cleanData.tourType;
      if (!cleanData.tourStyle) delete cleanData.tourStyle;
      if (!cleanData.idExternal) delete cleanData.idExternal;
      if (!cleanData.tourMapIframe) delete cleanData.tourMapIframe;
      if (!cleanData.whatYouWillLoveHtml) delete cleanData.whatYouWillLoveHtml;
      
      if (!cleanData.pricingPlans?.length) delete cleanData.pricingPlans;
      if (!cleanData.blogReferences?.length) delete cleanData.blogReferences;
      if (!cleanData.relatedTours?.length) delete cleanData.relatedTours;
      
      // Keep lists if they are required or important, only delete if really necessary
      if (!(cleanData.tourHighlights as any)?.length) delete cleanData.tourHighlights;
      // Do NOT delete tags, inclusion, exclusion if they are required by schema
      
      if (!(cleanData.reviews as any)?.length) delete cleanData.reviews;

      // Sanitize ID fields to ensure they are strings, not objects
      if (cleanData.subcategory && typeof cleanData.subcategory === 'object') {
        cleanData.subcategory = (cleanData.subcategory as any)._id || cleanData.subcategory;
      }
      
      if (cleanData.blogReferences) {
        cleanData.blogReferences = cleanData.blogReferences.map((ref: any) => 
          typeof ref === 'object' ? (ref as any)._id || ref : ref
        );
      }
      
      if (cleanData.relatedTours) {
        cleanData.relatedTours = cleanData.relatedTours.map((ref: any) => 
          typeof ref === 'object' ? (ref as any)._id || ref : ref
        );
      }

      // Map lowercase 'description' to uppercase 'Description' (required by Schema)
      if (cleanData.description) {
        (cleanData as any).Description = cleanData.description;
        delete (cleanData as any).description;
      }

      const response = await tourAPI.update(tourId, cleanData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Tour updated successfully!',
        });
        tourForm.clearDraft();
        router.push('/admin/tour/tour');
      } else {
        const parsedErrors = parseApiError(response);
        setFormErrors(parsedErrors);
        setError(response.error || 'Failed to update tour');
      }
    } catch (err: any) {
      const parsedErrors = parseApiError(err.response?.data || { message: err.message });
      setFormErrors(parsedErrors);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-full space-y-6 pb-24">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading tour...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-full space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {tourForm.formData.name || tourForm.formData.heading?.en || 'Edit Tour'}
            </h1>
            <p className="text-gray-500 mt-1">Update tour package details</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Draft Banner */}
      {tourForm.hasDraft && (
        <DraftBanner onDiscard={() => tourForm.clearDraft()} />
      )}

      {/* Error Message */}
      {error && !formErrors.length && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <div className="mt-2 text-xs text-red-600">
                Please check the form fields and try again. If the problem persists, contact support.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Error Panel */}
      {formErrors.length > 0 && (
        <FormErrorPanel errors={formErrors} onDismiss={() => setFormErrors([])} />
      )}

      {/* Language Selector */}
      <AdminLanguageTabs
        activeLanguage={activeAdminLanguage}
        onLanguageChange={setActiveAdminLanguage}
      />

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hasError = formErrors.some(err => {
            if (tab.id === 'overview') return ['name', 'heading', 'subcategory', 'slug', 'description', 'tourAvailability', 'pickupAndDropOff', 'tourType', 'tourStyle', 'meetingPoint'].some(p => err.path?.startsWith(p));
            if (tab.id === 'media') return ['images', 'gallery'].some(p => err.path?.startsWith(p));
            if (tab.id === 'itinerary') return err.path?.startsWith('itinerary');
            if (tab.id === 'details') return ['tourHighlights', 'inclusion', 'exclusion', 'whatToPack', 'notes'].some(p => err.path?.startsWith(p));
            if (tab.id === 'pricing') return ['pricingPlans', 'priceStartingFrom', 'cancellationPolicy'].some(p => err.path?.startsWith(p));
            if (tab.id === 'attractions') return err.path?.startsWith('mapSchema') || err.path?.startsWith('seo.mapSchema');
            if (tab.id === 'seo') return err.path?.startsWith('seo');
            return false;
          });
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap relative",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : hasError
                    ? "hover:bg-red-50 text-red-600 bg-red-50/50"
                    : "hover:bg-muted text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              
              {/* Error Dot */}
              {hasError && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              formData={tourForm.formData}
              subcategories={tourForm.subcategories}
              handleChange={tourForm.handleChange}
              activeLanguage={activeAdminLanguage}
              formErrors={formErrors}
            />
          )}

          {activeTab === 'media' && (
            <MediaTab
              formData={tourForm.formData}
              handleChange={tourForm.handleChange}
              addImage={tourForm.addImage}
              removeImage={tourForm.removeImage}
              updateImage={tourForm.updateImage}
              addGalleryImage={tourForm.addGalleryImage}
              removeGalleryImage={tourForm.removeGalleryImage}
              updateGalleryImage={tourForm.updateGalleryImage}
              handleImageUpload={tourForm.handleImageUpload}
              activeLanguage={activeAdminLanguage}
              formErrors={formErrors}
            />
          )}

          {activeTab === 'itinerary' && (
            <ItineraryTab
              formData={tourForm.formData}
              handleChange={tourForm.handleChange}
              addItineraryDay={tourForm.addItineraryDay}
              removeItineraryDay={tourForm.removeItineraryDay}
              updateItineraryDay={tourForm.updateItineraryDay}
              handleImageUpload={tourForm.handleImageUpload}
              activeLanguage={activeAdminLanguage}
            />
          )}

          {activeTab === 'details' && (
            <DetailsTab
              formData={tourForm.formData}
              handleChange={tourForm.handleChange}
              handleArrayFieldChange={tourForm.handleArrayFieldChange}
              addTourNote={tourForm.addTourNote}
              removeTourNote={tourForm.removeTourNote}
              updateTourNote={tourForm.updateTourNote}
              activeLanguage={activeAdminLanguage}
              formErrors={formErrors}
            />
          )}

          {activeTab === 'pricing' && (
            <PricingTab
              formData={tourForm.formData}
              handleChange={tourForm.handleChange}
              activeLanguage={activeAdminLanguage}
              formErrors={formErrors}
            />
          )}

          {activeTab === 'attractions' && (
            <AttractionsTab
              formData={tourForm.formData}
              handleChange={tourForm.handleChange}
              activeLanguage={activeAdminLanguage}
            />
          )}

          {activeTab === 'resources' && (
            <ResourcesTab
              formData={tourForm.formData}
              handleChange={tourForm.handleChange}
              tourSearchQuery={tourSearchQuery}
              setTourSearchQuery={setTourSearchQuery}
              tourSearchResults={tourSearchResults}
              isSearchingTours={isSearchingTours}
              blogSearchQuery={blogSearchQuery}
              setBlogSearchQuery={setBlogSearchQuery}
              blogSearchResults={blogSearchResults}
              isSearchingBlogs={isSearchingBlogs}
              activeLanguage={activeAdminLanguage}
            />
          )}

          {activeTab === 'seo' && (
            <SEOTab
              formData={tourForm.formData}
              handleChange={tourForm.handleChange}
              handleKeywordsChange={tourForm.handleKeywordsChange}
              handleImageUpload={tourForm.handleImageUpload}
              activeLanguage={activeAdminLanguage}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
