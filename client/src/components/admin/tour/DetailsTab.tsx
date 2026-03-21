import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Plus, X } from 'lucide-react';
import TagInput from '@/components/admin/TagInput';

import { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedField from '@/components/admin/LocalizedField';

interface DetailsTabProps {
  formData: any;
  handleArrayFieldChange: (field: string, value: string[], lang: AdminLanguage) => void;
  addTourNote: () => void;
  removeTourNote: (index: number) => void;
  updateTourNote: (index: number, field: string, value: string, lang: AdminLanguage) => void;
  activeLanguage: AdminLanguage;
}


export default function DetailsTab({
  formData,
  handleArrayFieldChange,
  addTourNote,
  removeTourNote,
  updateTourNote,
  activeLanguage,
}: DetailsTabProps) {
  return (
    <div className="space-y-6">
      {/* Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Tour Highlights</CardTitle>
          <CardDescription>Key features and attractions (comma-separated per language)</CardDescription>
        </CardHeader>
        <CardContent>
          <LocalizedField
            value={formData.tourHighlights}
            globalLanguage={activeLanguage}
            onChange={(lang, val) => handleArrayFieldChange('tourHighlights', val, lang)}
          >
            {(lang, currentValue, handleLang) => (
              <TagInput
                tags={currentValue || []}
                onChange={handleLang}
                placeholder={`Visit the Pyramids, Sphinx, Egyptian Museum... (${lang})`}
              />
            )}
          </LocalizedField>
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
            <LocalizedField
              value={formData.inclusion}
              globalLanguage={activeLanguage}
              onChange={(lang, val) => handleArrayFieldChange('inclusion', val, lang)}
            >
              {(lang, currentValue, handleLang) => (
                <TagInput
                  tags={currentValue || []}
                  onChange={handleLang}
                  placeholder={`Hotel pickup, Lunch, Guide... (${lang})`}
                />
              )}
            </LocalizedField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exclusions</CardTitle>
            <CardDescription>What is NOT included</CardDescription>
          </CardHeader>
          <CardContent>
            <LocalizedField
              value={formData.exclusion}
              globalLanguage={activeLanguage}
              onChange={(lang, val) => handleArrayFieldChange('exclusion', val, lang)}
            >
              {(lang, currentValue, handleLang) => (
                <TagInput
                  tags={currentValue || []}
                  onChange={handleLang}
                  placeholder={`Tips, Personal expenses, Drinks... (${lang})`}
                />
              )}
            </LocalizedField>
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
          <LocalizedField
            value={formData.whatToPack}
            globalLanguage={activeLanguage}
            onChange={(lang, val) => handleArrayFieldChange('whatToPack', val, lang)}
          >
            {(lang, currentValue, handleLang) => (
              <TagInput
                tags={currentValue || []}
                onChange={handleLang}
                placeholder={`Sunscreen, Hat, Comfortable shoes... (${lang})`}
              />
            )}
          </LocalizedField>
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

                  <div className="grid grid-cols-1 gap-4">
                    <LocalizedField
                      label="Title"
                      value={note.title}
                      globalLanguage={activeLanguage}
                      onChange={(lang, val) => updateTourNote(index, 'title', val, lang)}
                    >
                      {(lang, currentValue, handleLang) => (
                        <Input
                          value={currentValue}
                          onChange={(e) => handleLang(e.target.value)}
                          placeholder={`Note Title (e.g., Visa Info) - ${lang}`}
                        />
                      )}
                    </LocalizedField>

                    <LocalizedField
                      label="Content"
                      value={note.text}
                      globalLanguage={activeLanguage}
                      onChange={(lang, val) => updateTourNote(index, 'text', val, lang)}
                    >
                      {(lang, currentValue, handleLang) => (
                        <RichTextEditor
                          value={currentValue}
                          onChange={handleLang}
                          placeholder={`Note content (${lang})...`}
                        />
                      )}
                    </LocalizedField>
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
