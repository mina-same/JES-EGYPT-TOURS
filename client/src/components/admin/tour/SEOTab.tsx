import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedField from '@/components/admin/LocalizedField';

interface SEOTabProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
  handleKeywordsChange: (value: string, lang?: AdminLanguage) => void;
  handleImageUpload: (file: File) => Promise<{ url: string, fileName: string } | null>;
  activeLanguage: AdminLanguage;
}

export default function SEOTab({
  formData,
  handleChange,
  handleKeywordsChange,
  handleImageUpload,
  activeLanguage,
}: SEOTabProps) {
  const keywordsAsLocalized = () => {
    const keywords = formData.seo?.metaKeywords || [];
    const langs: AdminLanguage[] = ['en', 'de', 'it', 'es'];
    const result: any = { en: '', de: '', it: '', es: '' };
    langs.forEach((lang) => {
      result[lang] = keywords.map((k: any) => k?.[lang] || '').filter(Boolean).join(', ');
    });
    return result;
  };

  return (
    <div className="space-y-6">
      {/* Visibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Visibility &amp; Status</CardTitle>
          <CardDescription>Control tour visibility on the website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">Active Status</Label>
              <p className="text-sm text-muted-foreground">
                Enable to make this tour visible to the public
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange('isActive', checked)}
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">Featured Tour</Label>
              <p className="text-sm text-muted-foreground">
                Display this tour in featured sections
              </p>
            </div>
            <Switch
              checked={formData.isFeatured}
              onCheckedChange={(checked) => handleChange('isFeatured', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* SEO Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Metadata</CardTitle>
          <CardDescription>Optimize for search engines — edit per language using the tabs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocalizedField
            label="Meta Title"
            value={formData.seo?.metaTitle}
            globalLanguage={activeLanguage}
            onChange={(lang, val) => handleChange(`seo.metaTitle.${lang}`, val)}
          >
            {(lang, currentValue, handleLang) => (
              <Input
                id="seo.metaTitle"
                value={currentValue}
                onChange={(e) => handleLang(e.target.value)}
                placeholder={`SEO Title in ${lang}...`}
              />
            )}
          </LocalizedField>

          <LocalizedField
            label="Meta Description"
            value={formData.seo?.metaDescription}
            globalLanguage={activeLanguage}
            onChange={(lang, val) => handleChange(`seo.metaDescription.${lang}`, val)}
          >
            {(lang, currentValue, handleLang) => (
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
                value={currentValue}
                onChange={(e) => handleLang(e.target.value)}
                placeholder={`Brief description for search results in ${lang}...`}
              />
            )}
          </LocalizedField>

          <LocalizedField
            label="Keywords (comma-separated)"
            value={keywordsAsLocalized()}
            globalLanguage={activeLanguage}
            onChange={(lang, val) => handleKeywordsChange(val, lang)}
          >
            {(lang, currentValue, handleLang) => (
              <>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={2}
                  value={currentValue}
                  onChange={(e) => handleLang(e.target.value)}
                  placeholder={`egypt tours, cairo, pyramids... (${lang})`}
                />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated keywords for {lang}</p>
              </>
            )}
          </LocalizedField>
          
          <div className="space-y-2">
            <Label>Social Share Image</Label>
            <div className="flex gap-4 items-start">
              <div className="flex-1 space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const result = await handleImageUpload(file);
                      if (result) {
                        handleChange('seo.metaImage', {
                          ...formData.seo?.metaImage,
                          url: result.url,
                          fileName: result.fileName
                        });
                      }
                    }
                  }}
                />
                <Input
                  value={formData.seo?.metaImage?.url || ''}
                  onChange={(e) => handleChange('seo.metaImage.url', e.target.value)}
                  placeholder="Image URL"
                />
              </div>
              {formData.seo?.metaImage?.url && (
                <img
                  src={formData.seo.metaImage.url}
                  alt={formData.seo.metaImage.alt?.[activeLanguage] || "SEO Preview"}
                  className="w-32 h-24 object-cover rounded border"
                />
              )}
            </div>
            
            {(formData.seo?.metaImage?.url || formData.seo?.metaImage?.title || formData.seo?.metaImage?.alt) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <LocalizedField
                  label="Social Image Title"
                  value={formData.seo?.metaImage?.title}
                  globalLanguage={activeLanguage}
                  onChange={(lang, val) => handleChange(`seo.metaImage.title.${lang}`, val)}
                >
                  {(lang, currentValue, handleLang) => (
                    <Input
                      value={currentValue}
                      onChange={(e) => handleLang(e.target.value)}
                      placeholder={`Title for social share image in ${lang}`}
                      className="h-8 text-xs font-semibold"
                    />
                  )}
                </LocalizedField>
                <LocalizedField
                  label="Alt Text"
                  value={formData.seo?.metaImage?.alt}
                  globalLanguage={activeLanguage}
                  onChange={(lang, val) => handleChange(`seo.metaImage.alt.${lang}`, val)}
                >
                  {(lang, currentValue, handleLang) => (
                    <Input
                      value={currentValue}
                      onChange={(e) => handleLang(e.target.value)}
                      placeholder={`Accessibility description in ${lang}`}
                      className="h-8 text-xs"
                    />
                  )}
                </LocalizedField>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* What You Will Love */}
      <Card>
        <CardHeader>
          <CardTitle>What You Will Love</CardTitle>
          <CardDescription>Marketing content for the tour page</CardDescription>
        </CardHeader>
        <CardContent>
          <LocalizedField
            value={formData.whatYouWillLoveHtml}
            globalLanguage={activeLanguage}
            onChange={(lang, val) => handleChange(`whatYouWillLoveHtml.${lang}`, val)}
          >
            {(lang, currentValue, handleLang) => (
              <RichTextEditor
                value={currentValue}
                onChange={handleLang}
                placeholder={`Why travelers will love this tour in ${lang}...`}
              />
            )}
          </LocalizedField>
        </CardContent>
      </Card>
    </div>
  );
}
