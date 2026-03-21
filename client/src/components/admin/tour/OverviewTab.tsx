import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import LocalizedRichText from '../LocalizedRichText';
import TagInput from '@/components/admin/TagInput';
import SubcategorySelect from '@/components/admin/SubcategorySelect';
import { ITourSubcategory } from '@/types/tour';
import { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedInput from '@/components/admin/LocalizedInput';
import LocalizedTextArea from '@/components/admin/LocalizedTextArea';
import LocalizedTagsInput from '@/components/admin/LocalizedTagsInput';

interface OverviewTabProps {
  formData: any;
  subcategories: ITourSubcategory[];
  handleChange: (field: string, value: any) => void;
  activeLanguage: AdminLanguage;
}

export default function OverviewTab({ formData, subcategories, handleChange, activeLanguage }: OverviewTabProps) {
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
              <Label htmlFor="name">System Name (Internal) *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter internal name (for slug)"
                required
              />
            </div>
            <LocalizedInput
              label="Slug (Auto-generated)"
              value={formData.slug || { en: '', de: '', it: '', es: '' }}
              onChange={(val) => handleChange('slug', val)}
              placeholder="Enter slug"
            />
          </div>

          <LocalizedInput
            label="Tour Heading *"
            value={formData.heading || { en: '', de: '', it: '', es: '' }}
            onChange={(val) => handleChange('heading', val)}
            placeholder="Enter tour heading"
          />

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
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory *</Label>
              <SubcategorySelect
                value={formData.subcategory || ''}
                onChange={(value) => handleChange('subcategory', value)}
                subcategories={subcategories}
              />
            </div>
          </div>

          <div className="space-y-2">
            <LocalizedTagsInput
              label="Tour Tags"
              value={formData.tags || { en: [], de: [], it: [], es: [] }}
              onChange={(val) => handleChange('tags', val)}
              placeholder="Add a tag and press Enter..."
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
          <LocalizedInput
            label="Catchy Header"
            value={formData.description?.header || { en: '', de: '', it: '', es: '' }}
            onChange={(val) => handleChange('description.header', val)}
            placeholder="Enter catchy header"
          />
        </CardContent>
      </Card>

      {/* Description Content */}
      <Card>
        <CardHeader>
          <CardTitle>Description Content</CardTitle>
          <CardDescription>Main tour overview text</CardDescription>
        </CardHeader>
        <CardContent>
          <LocalizedRichText
            label="Description Content"
            value={formData.description?.text || { en: '', de: '', it: '', es: '' }}
            onChange={(val) => handleChange('description.text', val)}
            placeholder="Tell us about the tour..."
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
              onChange={(val) => handleChange('tourLocation', val)}
              placeholder="Cairo, Egypt"
            />

            <LocalizedInput
              label="Duration"
              value={formData.duration || { en: '', de: '', it: '', es: '' }}
              onChange={(val) => handleChange('duration', val)}
              placeholder="3 days / 2 nights"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LocalizedInput
              label="Availability"
              value={formData.tourAvailability || { en: '', de: '', it: '', es: '' }}
              onChange={(val) => handleChange('tourAvailability', val)}
              placeholder="Year-round"
            />

            <LocalizedInput
              label="Tour Type"
              value={formData.tourType || { en: '', de: '', it: '', es: '' }}
              onChange={(val) => handleChange('tourType', val)}
              placeholder="Private / Group"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LocalizedInput
              label="Tour Style"
              value={formData.tourStyle || { en: '', de: '', it: '', es: '' }}
              onChange={(val) => handleChange('tourStyle', val)}
              placeholder="Adventure, Cultural, Luxury"
            />

            <LocalizedInput
              label="Meeting Point"
              value={formData.meetingPoint || { en: '', de: '', it: '', es: '' }}
              onChange={(val) => handleChange('meetingPoint', val)}
              placeholder="Hotel lobby"
            />
          </div>

          <LocalizedTextArea
            label="Pickup & Drop-off"
            value={formData.pickupAndDropOff || { en: '', de: '', it: '', es: '' }}
            onChange={(val) => handleChange('pickupAndDropOff', val)}
            placeholder="Pickup and drop-off details..."
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
}
