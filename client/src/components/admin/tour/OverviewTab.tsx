import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/ui/RichTextEditor';
import SubcategorySelect from '@/components/admin/SubcategorySelect';
import { ITourSubcategory } from '@/types/tour';

interface OverviewTabProps {
  formData: any;
  subcategories: ITourSubcategory[];
  handleChange: (field: string, value: any) => void;
}

export default function OverviewTab({ formData, subcategories, handleChange }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Essential tour details and identification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tour Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter tour name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (Auto-generated)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="tour-slug"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="idExternal">External ID</Label>
              <Input
                id="idExternal"
                value={formData.idExternal}
                onChange={(e) => handleChange('idExternal', e.target.value)}
                placeholder="EXT-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heading">Heading *</Label>
              <Input
                id="heading"
                value={formData.heading}
                onChange={(e) => handleChange('heading', e.target.value)}
                placeholder="Tour heading"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory *</Label>
            <SubcategorySelect
              value={formData.subcategory}
              onChange={(value) => handleChange('subcategory', value)}
              subcategories={subcategories}
            />
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
          <CardDescription>Tour description and overview</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description.header">Description Header *</Label>
            <Input
              id="description.header"
              value={formData.description?.header || ''}
              onChange={(e) => handleChange('description.header', e.target.value)}
              placeholder="Brief description header"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description.text">Description Text *</Label>
            <RichTextEditor
              value={formData.description?.text || ''}
              onChange={(value) => handleChange('description.text', value)}
              placeholder="Detailed tour description..."
            />
          </div>
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
            <div className="space-y-2">
              <Label htmlFor="tourLocation">Location</Label>
              <Input
                id="tourLocation"
                value={formData.tourLocation}
                onChange={(e) => handleChange('tourLocation', e.target.value)}
                placeholder="Cairo, Egypt"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                placeholder="3 days / 2 nights"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tourAvailability">Availability</Label>
              <Input
                id="tourAvailability"
                value={formData.tourAvailability}
                onChange={(e) => handleChange('tourAvailability', e.target.value)}
                placeholder="Year-round"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tourType">Tour Type</Label>
              <Input
                id="tourType"
                value={formData.tourType}
                onChange={(e) => handleChange('tourType', e.target.value)}
                placeholder="Private / Group"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tourStyle">Tour Style</Label>
              <Input
                id="tourStyle"
                value={formData.tourStyle}
                onChange={(e) => handleChange('tourStyle', e.target.value)}
                placeholder="Adventure, Cultural, Luxury"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meetingPoint">Meeting Point</Label>
              <Input
                id="meetingPoint"
                value={formData.meetingPoint}
                onChange={(e) => handleChange('meetingPoint', e.target.value)}
                placeholder="Hotel lobby"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickupAndDropOff">Pickup & Drop-off</Label>
            <Textarea
              id="pickupAndDropOff"
              value={formData.pickupAndDropOff}
              onChange={(e) => handleChange('pickupAndDropOff', e.target.value)}
              placeholder="Pickup and drop-off details..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
