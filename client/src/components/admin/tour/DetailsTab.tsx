import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import LocalizedRichText from '../LocalizedRichText';
import { Plus, X } from 'lucide-react';
import { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedTagsInput from '@/components/admin/LocalizedTagsInput';
import LocalizedInput from '@/components/admin/LocalizedInput';
import type { FormErrorItem } from '@/lib/parseApiError';
import { cn } from '@/lib/utils';

interface DetailsTabProps {
  formData: any;
  handleArrayFieldChange: (field: string, value: string[], lang: AdminLanguage) => void;
  addTourNote: () => void;
  removeTourNote: (index: number) => void;
  updateTourNote: (index: number, field: string, value: any) => void; // Value is now full object
  handleChange: (field: string, value: any) => void;
  activeLanguage: AdminLanguage;
  formErrors?: FormErrorItem[];
}


export default function DetailsTab({
  formData,
  handleArrayFieldChange,
  addTourNote,
  removeTourNote,
  updateTourNote,
  handleChange,
  activeLanguage,
  formErrors = [],
}: DetailsTabProps) {
  const hasError = (path: string) => formErrors.some(e => e.path === path || e.path?.startsWith(path + '.'));

  return (
    <div className="space-y-6">
      {/* Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Tour Highlights</CardTitle>
          <CardDescription>Key features and attractions (comma-separated per language)</CardDescription>
        </CardHeader>
        <CardContent>
          <LocalizedTagsInput
            value={formData.tourHighlights || { en: [], de: [], it: [], es: [] }}
            onChange={(val) => handleChange('tourHighlights', val)}
            placeholder="Visit the Pyramids, Sphinx, Egyptian Museum..."
            activeLanguage={activeLanguage}
          />
        </CardContent>
      </Card>

      {/* Inclusions & Exclusions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={cn(hasError('inclusion') && "border-red-500 ring-1 ring-red-200 shadow-red-50")}>
          <CardHeader>
            <CardTitle className={cn(hasError('inclusion') && "text-red-600")}>Inclusions</CardTitle>
            <CardDescription>What is included — supports bold, links, and lists</CardDescription>
          </CardHeader>
          <CardContent>
            <LocalizedRichText
              value={formData.inclusion || { en: "", de: "", it: "", es: "" }}
              onChange={(val) => handleChange('inclusion', val)}
              placeholder="e.g. Hotel pickup, private guide, entrance fees…"
              activeLanguage={activeLanguage}
            />
          </CardContent>
        </Card>

        <Card className={cn(hasError('exclusion') && "border-red-500 ring-1 ring-red-200 shadow-red-50")}>
          <CardHeader>
            <CardTitle className={cn(hasError('exclusion') && "text-red-600")}>Exclusions</CardTitle>
            <CardDescription>What is NOT included — supports bold, links, and lists</CardDescription>
          </CardHeader>
          <CardContent>
            <LocalizedRichText
              value={formData.exclusion || { en: "", de: "", it: "", es: "" }}
              onChange={(val) => handleChange('exclusion', val)}
              placeholder="e.g. Tips, personal expenses, international flights…"
              activeLanguage={activeLanguage}
            />
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
          <LocalizedTagsInput
            value={formData.whatToPack || { en: [], de: [], it: [], es: [] }}
            onChange={(val) => handleChange('whatToPack', val)}
            placeholder="Sunscreen, Hat, Comfortable shoes..."
            activeLanguage={activeLanguage}
          />
        </CardContent>
      </Card>

      {/* Tour Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
          <CardDescription>Additional information, policies, or warnings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(!formData.notes || formData.notes.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No notes yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                Add important notes like policies, warnings, meeting point details, or special requirements.
              </p>
              <Button type="button" onClick={addTourNote}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Note
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.notes.map((note: any, index: number) => (
                <div key={index} className="rounded-lg border p-4 space-y-3 shadow-sm bg-card/50">
                  <div className="flex items-center justify-between gap-3 border-b pb-2 mb-2">
                    <div className="text-sm font-semibold truncate">
                      {note?.title?.en || note?.title?.[activeLanguage] || `Note ${index + 1}`}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeTourNote(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <LocalizedInput
                      label="Title"
                      value={note.title || { en: '', de: '', it: '', es: '' }}
                      onChange={(val) => updateTourNote(index, 'title', val)}
                      placeholder="Note Title (e.g., Visa Info)"
                      activeLanguage={activeLanguage}
                    />

                    <LocalizedRichText
                      label="Content"
                      value={note.text || { en: '', de: '', it: '', es: '' }}
                      onChange={(val) => updateTourNote(index, 'text', val)}
                      placeholder="Note content..."
                      activeLanguage={activeLanguage}
                    />
                  </div>
                </div>
              ))}

              <Button type="button" onClick={addTourNote} variant="outline" className="w-full border-dashed">
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
