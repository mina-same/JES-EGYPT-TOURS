import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/ui/RichTextEditor';
import SubcategorySelect from '@/components/admin/SubcategorySelect';
import { ITourSubcategory } from '@/types/tour';
import { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedField from '@/components/admin/LocalizedField';

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
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (Auto-generated)</Label>
              <Input
                id="slug"
                value={formData.slug || ''}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="tour-slug"
              />
            </div>
          </div>

          <LocalizedField
            label="Tour Heading *"
            value={formData.heading}
            globalLanguage={activeLanguage}
            onChange={(lang, val) => handleChange(`heading.${lang}`, val)}
          >
            {(lang, currentValue, handleLang) => (
              <Input
                id="heading"
                value={currentValue}
                onChange={(e) => handleLang(e.target.value)}
                placeholder={`Enter tour heading in ${lang}`}
                required={lang === 'en'}
              />
            )}
          </LocalizedField>

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
        </CardContent>
      </Card>

      {/* Description Headers */}
      <Card>
        <CardHeader>
          <CardTitle>Description Header</CardTitle>
          <CardDescription>Brief catchy header for the selected language</CardDescription>
        </CardHeader>
        <CardContent>
          <LocalizedField
            value={formData.description?.header}
            globalLanguage={activeLanguage}
            onChange={(lang, val) => handleChange(`description.header.${lang}`, val)}
          >
            {(lang, currentValue, handleLang) => (
              <Input
                value={currentValue}
                onChange={(e) => handleLang(e.target.value)}
                placeholder={`Enter catchy header in ${lang}`}
              />
            )}
          </LocalizedField>
        </CardContent>
      </Card>

      {/* Description Content */}
      <Card>
        <CardHeader>
          <CardTitle>Description Content</CardTitle>
          <CardDescription>Main tour overview text</CardDescription>
        </CardHeader>
        <CardContent>
          <LocalizedField
            value={formData.description?.text}
            globalLanguage={activeLanguage}
            onChange={(lang, val) => handleChange(`description.text.${lang}`, val)}
          >
            {(lang, currentValue, handleLang) => (
              <RichTextEditor
                value={currentValue}
                onChange={handleLang}
                placeholder={`Tell us about the tour in ${lang}...`}
              />
            )}
          </LocalizedField>
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
            <LocalizedField
              label="Location"
              value={formData.tourLocation}
              globalLanguage={activeLanguage}
              onChange={(lang, val) => handleChange(`tourLocation.${lang}`, val)}
            >
              {(lang, currentValue, handleLang) => (
                <Input
                  id="tourLocation"
                  value={currentValue}
                  onChange={(e) => handleLang(e.target.value)}
                  placeholder="Cairo, Egypt"
                />
              )}
            </LocalizedField>

            <LocalizedField
              label="Duration"
              value={formData.duration}
              globalLanguage={activeLanguage}
              onChange={(lang, val) => handleChange(`duration.${lang}`, val)}
            >
              {(lang, currentValue, handleLang) => (
                <Input
                  id="duration"
                  value={currentValue}
                  onChange={(e) => handleLang(e.target.value)}
                  placeholder="3 days / 2 nights"
                />
              )}
            </LocalizedField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LocalizedField
              label="Availability"
              value={formData.tourAvailability}
              globalLanguage={activeLanguage}
              onChange={(lang, val) => handleChange(`tourAvailability.${lang}`, val)}
            >
              {(lang, currentValue, handleLang) => (
                <Input
                  id="tourAvailability"
                  value={currentValue}
                  onChange={(e) => handleLang(e.target.value)}
                  placeholder="Year-round"
                />
              )}
            </LocalizedField>

            <LocalizedField
              label="Tour Type"
              value={formData.tourType}
              globalLanguage={activeLanguage}
              onChange={(lang, val) => handleChange(`tourType.${lang}`, val)}
            >
              {(lang, currentValue, handleLang) => (
                <Input
                  id="tourType"
                  value={currentValue}
                  onChange={(e) => handleLang(e.target.value)}
                  placeholder="Private / Group"
                />
              )}
            </LocalizedField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LocalizedField
              label="Tour Style"
              value={formData.tourStyle}
              globalLanguage={activeLanguage}
              onChange={(lang, val) => handleChange(`tourStyle.${lang}`, val)}
            >
              {(lang, currentValue, handleLang) => (
                <Input
                  id="tourStyle"
                  value={currentValue}
                  onChange={(e) => handleLang(e.target.value)}
                  placeholder="Adventure, Cultural, Luxury"
                />
              )}
            </LocalizedField>

            <LocalizedField
              label="Meeting Point"
              value={formData.meetingPoint}
              globalLanguage={activeLanguage}
              onChange={(lang, val) => handleChange(`meetingPoint.${lang}`, val)}
            >
              {(lang, currentValue, handleLang) => (
                <Input
                  id="meetingPoint"
                  value={currentValue}
                  onChange={(e) => handleLang(e.target.value)}
                  placeholder="Hotel lobby"
                />
              )}
            </LocalizedField>
          </div>

          <LocalizedField
            label="Pickup & Drop-off"
            value={formData.pickupAndDropOff}
            globalLanguage={activeLanguage}
            onChange={(lang, val) => handleChange(`pickupAndDropOff.${lang}`, val)}
          >
            {(lang, currentValue, handleLang) => (
              <Textarea
                id="pickupAndDropOff"
                value={currentValue}
                onChange={(e) => handleLang(e.target.value)}
                placeholder="Pickup and drop-off details..."
                rows={3}
              />
            )}
          </LocalizedField>
        </CardContent>
      </Card>
    </div>
  );
}
