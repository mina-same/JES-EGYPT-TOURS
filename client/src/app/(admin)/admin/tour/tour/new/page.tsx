'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NewTourPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeAdminLanguage, setActiveAdminLanguage] = useState<AdminLanguage>('en');
  const [formErrors, setFormErrors] = useState<FormErrorItem[]>([]);
  const { toast } = useToast();
  
  const draftKey = 'draft_tour_new';
  
  // Search state for Resources tab
  const [tourSearchQuery, setTourSearchQuery] = useState('');
  const [tourSearchResults, setTourSearchResults] = useState<any[]>([]);
  const [isSearchingTours, setIsSearchingTours] = useState(false);
  const [blogSearchQuery, setBlogSearchQuery] = useState('');
  const [blogSearchResults, setBlogSearchResults] = useState<any[]>([]);
  const [isSearchingBlogs, setIsSearchingBlogs] = useState(false);

  // Use custom hook for form logic
  const tourForm = useTourForm(undefined, draftKey);

  // Search effects
  useEffect(() => {
    const searchTours = async () => {
      setIsSearchingTours(true);
      try {
        const response = await tourAPI.getAll({ search: tourSearchQuery.trim() || undefined, limit: 5 });
        if (response.success && response.data) {
          setTourSearchResults(response.data);
        }
      } catch (error) {
        console.error('Failed to search tours:', error);
      } finally {
        setIsSearchingTours(false);
      }
    };

    const timeoutId = setTimeout(searchTours, 500);
    return () => clearTimeout(timeoutId);
  }, [tourSearchQuery]);

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
        if (!mixed) return true;
        return !mixed.en?.length && !mixed.de?.length && !mixed.it?.length && !mixed.es?.length;
      };

      const flattenLocalizedList = (mixed: any) => {
        if (!mixed || typeof mixed !== 'object' || Array.isArray(mixed)) return mixed;
        const languages = ['en', 'de', 'it', 'es'];
        const result: any = { en: [], de: [], it: [], es: [] };
        
        languages.forEach(lang => {
          const list = mixed[lang] || [];
          if (Array.isArray(list)) {
            result[lang] = list.map(item => {
              if (typeof item === 'object' && item !== null) {
                return item[lang] || item.en || '';
              }
              return item;
            }).filter(Boolean);
          }
        });
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

      // Sanitize list fields
      if (cleanData.tourHighlights) cleanData.tourHighlights = flattenLocalizedList(cleanData.tourHighlights);
      if (cleanData.inclusion) cleanData.inclusion = flattenLocalizedList(cleanData.inclusion);
      if (cleanData.exclusion) cleanData.exclusion = flattenLocalizedList(cleanData.exclusion);
      if (cleanData.whatToPack) cleanData.whatToPack = flattenLocalizedList(cleanData.whatToPack);
      if (cleanData.tags) cleanData.tags = flattenLocalizedList(cleanData.tags);

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

      // Remove empty optional fields
      if (!cleanData.priceStartingFrom) delete cleanData.priceStartingFrom;
      if (!cleanData.duration) delete cleanData.duration;
      if (!cleanData.tourType) delete cleanData.tourType;
      if (!cleanData.tourStyle) delete cleanData.tourStyle;
      if (!cleanData.idExternal) delete cleanData.idExternal;
      if (!cleanData.tourMapIframe) delete cleanData.tourMapIframe;
      if (!cleanData.whatYouWillLoveHtml) delete cleanData.whatYouWillLoveHtml;
      
      // Remove empty arrays
      if (isMixedEmpty(cleanData.tourHighlights)) delete cleanData.tourHighlights;
      if (isMixedEmpty(cleanData.inclusion)) delete cleanData.inclusion;
      if (isMixedEmpty(cleanData.exclusion)) delete cleanData.exclusion;
      if (isMixedEmpty(cleanData.whatToPack)) delete cleanData.whatToPack;
      if (!cleanData.pricingPlans?.length) delete cleanData.pricingPlans;
      if (!cleanData.blogReferences?.length) delete cleanData.blogReferences;
      if (!cleanData.relatedTours?.length) delete cleanData.relatedTours;
      if (isMixedEmpty(cleanData.tags)) delete cleanData.tags;
      if (!cleanData.reviews?.length) delete cleanData.reviews;

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

      const response = await tourAPI.create(cleanData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Tour created successfully!',
        });
        tourForm.clearDraft();
        router.push('/admin/tour/tour');
      } else {
        const parsedErrors = parseApiError(response);
        setFormErrors(parsedErrors);
        setError(response.error || 'Failed to create tour');
      }
    } catch (err: any) {
      const parsedErrors = parseApiError(err.response?.data || { message: err.message });
      setFormErrors(parsedErrors);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-full space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Tour</h1>
            <p className="text-gray-500 mt-1">Create a new tour package</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Create Tour
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
          {error}
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
              handleArrayFieldChange={tourForm.handleArrayFieldChange}
              addTourNote={tourForm.addTourNote}
              removeTourNote={tourForm.removeTourNote}
              updateTourNote={tourForm.updateTourNote}
              handleChange={tourForm.handleChange}
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
