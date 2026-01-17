import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Plus, X } from 'lucide-react';

interface DetailsTabProps {
  formData: any;
  handleArrayFieldChange: (field: string, value: string) => void;
  addTourNote: () => void;
  removeTourNote: (index: number) => void;
  updateTourNote: (index: number, field: string, value: string) => void;
}

export default function DetailsTab({
  formData,
  handleArrayFieldChange,
  addTourNote,
  removeTourNote,
  updateTourNote,
}: DetailsTabProps) {
  return (
    <div className="space-y-6">
      {/* Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Tour Highlights</CardTitle>
          <CardDescription>Key features and attractions (comma-separated)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="tourHighlights">Highlights</Label>
            <Textarea
              id="tourHighlights"
              value={formData.tourHighlights?.join(', ') || ''}
              onChange={(e) => handleArrayFieldChange('tourHighlights', e.target.value)}
              placeholder="Visit the Pyramids, Sphinx, Egyptian Museum..."
              rows={4}
            />
            <p className="text-sm text-muted-foreground">Separate each highlight with a comma.</p>
          </div>
        </CardContent>
      </Card>

      {/* Inclusions & Exclusions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inclusions</CardTitle>
            <CardDescription>What is included in the price</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="inclusion">Inclusions (comma-separated)</Label>
              <Textarea
                id="inclusion"
                value={formData.inclusion?.join(', ') || ''}
                onChange={(e) => handleArrayFieldChange('inclusion', e.target.value)}
                placeholder="Hotel pickup, Lunch, Guide..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exclusions</CardTitle>
            <CardDescription>What is NOT included</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="exclusion">Exclusions (comma-separated)</Label>
              <Textarea
                id="exclusion"
                value={formData.exclusion?.join(', ') || ''}
                onChange={(e) => handleArrayFieldChange('exclusion', e.target.value)}
                placeholder="Tips, Personal expenses, Drinks..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What to Pack */}
      <Card>
        <CardHeader>
          <CardTitle>What to Pack</CardTitle>
          <CardDescription>Recommended items for travelers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="whatToPack">Items (comma-separated)</Label>
            <Textarea
              id="whatToPack"
              value={formData.whatToPack?.join(', ') || ''}
              onChange={(e) => handleArrayFieldChange('whatToPack', e.target.value)}
              placeholder="Sunscreen, Hat, Comfortable shoes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tour Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
          <CardDescription>Additional information, policies, or warnings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.notes?.map((note: any, index: number) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Note {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTourNote(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={note.title}
                  onChange={(e) => updateTourNote(index, 'title', e.target.value)}
                  placeholder="Note Title (e.g., Visa Info)"
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <RichTextEditor
                  value={note.text}
                  onChange={(value) => updateTourNote(index, 'text', value)}
                  placeholder="Note content..."
                />
              </div>
            </div>
          ))}
          <Button type="button" onClick={addTourNote} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
