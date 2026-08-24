import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import LocalizedRichText from '../LocalizedRichText';
import SubcategorySelect from '@/components/admin/SubcategorySelect';
import { ITourSubcategory } from '@/types/tour';
import { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedInput from '@/components/admin/LocalizedInput';
import LocalizedTagsInput from '@/components/admin/LocalizedTagsInput';
import DurationSelect from './DurationSelect';
import { cn } from '@/lib/utils';
import type { FormErrorItem } from '@/lib/parseApiError';

interface OverviewTabProps {
  formData: any;
  subcategories: ITourSubcategory[];
  handleChange: (field: string, value: any, lang?: AdminLanguage) => void;
  activeLanguage: AdminLanguage;
  formErrors?: FormErrorItem[];
}

const LANGUAGE_NAMES: Record<AdminLanguage, string> = {
  en: 'English',
  de: 'German',
  it: 'Italian',
  es: 'Spanish',
};

export default function OverviewTab({ formData, subcategories, handleChange, activeLanguage, formErrors = [] }: OverviewTabProps) {
  const hasError = (path: string) => formErrors.some(e => e.path === path || e.path?.startsWith(path + '.'));

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Essential tour details and identification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={cn(hasError('name') && 'text-red-600')}>System Name (Internal) *</Label>
              <Input
                id="name"
                data-field="name"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter internal name"
                required
                className={cn(hasError('name') && 'border-red-500 ring-red-500 focus:ring-red-500')}
              />
              {hasError('name') && <p className="text-xs text-red-600">{formErrors.find(e => e.path === 'name')?.message}</p>}
            </div>
            <LocalizedInput
              label={(language) =>
                `${LANGUAGE_NAMES[language]} Slug *${hasError('slug') || hasError('slug.en') ? ' ⚠' : ''}`
              }
              data-field="slug.en"
              value={formData.slug || { en: '', de: '', it: '', es: '' }}
              onChange={(val, lang) => handleChange('slug', val, lang)}
              placeholder="Enter slug"
              error={hasError('slug') || hasError('slug.en')}
              activeLanguage={activeLanguage}
            />
          </div>

          <div>
            <LocalizedInput
              label={hasError('heading') || hasError('heading.en') ? 'Tour Heading ⚠' : 'Tour Heading'}
              data-field="heading.en"
              value={formData.heading || { en: '', de: '', it: '', es: '' }}
              onChange={(val, lang) => handleChange('heading', val, lang)}
              placeholder="Enter tour heading"
              error={hasError('heading') || hasError('heading.en')}
              activeLanguage={activeLanguage}
            />
            {(hasError('heading') || hasError('heading.en')) && <p className="text-xs text-red-600 mt-1">{formErrors.find(e => e.path?.startsWith('heading'))?.message}</p>}
          </div>

          <div>
            <LocalizedRichText
              label="Tour Heading Description"
              value={formData.headingDescription || { en: '', de: '', it: '', es: '' }}
              onChange={(val, lang) => handleChange('headingDescription', val, lang)}
              placeholder="Describe this tour for the header section..."
              activeLanguage={activeLanguage}
            />
          </div>

          <div>
            <LocalizedInput
              label="Card Description (tour listings)"
              value={formData.cardDescription || { en: '', de: '', it: '', es: '' }}
              onChange={(val, lang) => handleChange('cardDescription', val, lang)}
              placeholder="One short line that makes people click"
              activeLanguage={activeLanguage}
              maxLength={220}
              helperText="Shown on the tour card as three lines — aim for 130–150 characters. Leave empty to fall back to the overview text."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="idExternal">External ID</Label>
              <Input
                id="idExternal"
                value={formData.idExternal || ''}
                onChange={(e) => handleChange('idExternal', e.target.value)}
                placeholder="EXT-001"
              />
            </div>
            <div className="space-y-2" data-field="subcategory">
              <Label htmlFor="subcategory" className={cn(hasError('subcategory') && 'text-red-600')}>Subcategory *</Label>
              <SubcategorySelect
                value={formData.subcategory || ''}
                onChange={(value) => handleChange('subcategory', value)}
                subcategories={subcategories}
                hasError={hasError('subcategory')}
              />
              {hasError('subcategory') && <p className="text-xs text-red-600">{formErrors.find(e => e.path === 'subcategory')?.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <LocalizedTagsInput
              label="Tour Tags"
              value={formData.tags || { en: [], de: [], it: [], es: [] }}
              onChange={(val, lang) => handleChange('tags', val, lang)}
              placeholder="Add a tag and press Enter..."
              activeLanguage={activeLanguage}
            />
            <p className="text-xs text-muted-foreground">General tags for this tour (e.g., Summer, Sale, New)</p>
          </div>
        </CardContent>
      </Card>

      {/* Description Headers */}
      <Card>
        <CardHeader>
          <CardTitle>Description Header</CardTitle>
          <CardDescription>Brief catchy header for the selected language</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <LocalizedInput
              label="Catchy Header"
              data-field="description.header.en"
              value={formData.description?.header || { en: '', de: '', it: '', es: '' }}
              onChange={(val, lang) => handleChange('description.header', val, lang)}
              placeholder="Enter catchy header"
              activeLanguage={activeLanguage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Description Content */}
      <Card>
        <CardHeader>
          <CardTitle>Description Content</CardTitle>
          <CardDescription>Main tour overview text (optional — can be added later)</CardDescription>
        </CardHeader>
        <CardContent>
          <LocalizedRichText
            label="Description Content"
            data-field="description.text.en"
            value={formData.description?.text || { en: '', de: '', it: '', es: '' }}
            onChange={(val, lang) => handleChange('description.text', val, lang)}
            placeholder="Tell us about the tour..."
            activeLanguage={activeLanguage}
          />
        </CardContent>
      </Card>

      {/* Tour Details */}
      <Card>
        <CardHeader>
          <CardTitle>Tour Details</CardTitle>
          <CardDescription>Location, availability, and logistics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <LocalizedInput
              label="Location"
              value={formData.tourLocation || { en: '', de: '', it: '', es: '' }}
              onChange={(val, lang) => handleChange('tourLocation', val, lang)}
              placeholder="Cairo, Egypt"
              activeLanguage={activeLanguage}
            />

            {/* No language tabs: one pick writes all four languages, so there is
                nothing per-language left for the admin to fill in. */}
            <DurationSelect
              value={formData.duration}
              onChange={(val) => handleChange('duration', val)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LocalizedInput
              label={hasError('tourAvailability') || hasError('tourAvailability.en') ? 'Availability ⚠' : 'Availability'}
              value={formData.tourAvailability || { en: '', de: '', it: '', es: '' }}
              onChange={(val, lang) => handleChange('tourAvailability', val, lang)}
              placeholder="Daily"
              maxLength={24}
              helperText="Best at 5–16 characters. Up to 22 still fits; 24 is the limit."
              error={hasError('tourAvailability') || hasError('tourAvailability.en')}
              activeLanguage={activeLanguage}
            />

            <LocalizedInput
              label={hasError('tourType') || hasError('tourType.en') ? 'Tour Type ⚠' : 'Tour Type'}
              value={formData.tourType || { en: '', de: '', it: '', es: '' }}
              onChange={(val, lang) => handleChange('tourType', val, lang)}
              placeholder="Private / Group"
              error={hasError('tourType') || hasError('tourType.en')}
              activeLanguage={activeLanguage}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LocalizedInput
              label={hasError('tourStyle') || hasError('tourStyle.en') ? 'Tour Style ⚠' : 'Tour Style'}
              value={formData.tourStyle || { en: '', de: '', it: '', es: '' }}
              onChange={(val, lang) => handleChange('tourStyle', val, lang)}
              placeholder="Adventure, Cultural, Luxury"
              error={hasError('tourStyle') || hasError('tourStyle.en')}
              activeLanguage={activeLanguage}
            />

            <LocalizedInput
              label={hasError('meetingPoint') || hasError('meetingPoint.en') ? 'Meeting Point ⚠' : 'Meeting Point'}
              value={formData.meetingPoint || { en: '', de: '', it: '', es: '' }}
              onChange={(val, lang) => handleChange('meetingPoint', val, lang)}
              placeholder="Hotel lobby"
              error={hasError('meetingPoint') || hasError('meetingPoint.en')}
              activeLanguage={activeLanguage}
            />
          </div>


          {/* A one-line field, not a paragraph box: this now heads the facts
              strip on the tour page, where it sits beside Location and Duration
              and has one column to fit in. The counter turns red on the tours
              still holding the old full-sentence text. */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <LocalizedInput
                label={hasError('pickupAndDropOff') || hasError('pickupAndDropOff.en') ? 'Pickup & Drop-off ⚠' : 'Pickup & Drop-off'}
                value={formData.pickupAndDropOff || { en: '', de: '', it: '', es: '' }}
                onChange={(val, lang) => handleChange('pickupAndDropOff', val, lang)}
                placeholder="Hotel pickup & drop-off"
                maxLength={32}
                helperText="Best at 12–24 characters. Up to 30 still fits; 32 is the limit."
                error={hasError('pickupAndDropOff') || hasError('pickupAndDropOff.en')}
                activeLanguage={activeLanguage}
              />
              {(hasError('pickupAndDropOff') || hasError('pickupAndDropOff.en')) && <p className="text-xs text-red-600 mt-1">{formErrors.find(e => e.path?.startsWith('pickupAndDropOff'))?.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
