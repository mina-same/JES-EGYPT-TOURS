import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedInput from '@/components/admin/LocalizedInput';
import LocalizedTextArea from '@/components/admin/LocalizedTextArea';
import LocalizedTagsInput from '@/components/admin/LocalizedTagsInput';
import LocalizedRichText from '@/components/admin/LocalizedRichText';

interface SEOTabProps {
  formData: any;
  handleChange: (field: string, value: any, lang?: AdminLanguage) => void;
  handleKeywordsChange: (value: any, lang: AdminLanguage) => void;
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
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">Special Offer</Label>
              <p className="text-sm text-muted-foreground">
                Show this tour on the Special Offers page
              </p>
            </div>
            <Switch
              checked={!!formData.isSpecialOffer}
              onCheckedChange={(checked) => handleChange('isSpecialOffer', checked)}
            />
          </div>
          {formData.isSpecialOffer && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base">Discount Percentage</Label>
                <p className="text-sm text-muted-foreground">
                  Shown as a badge on the tour card (e.g. -30% off)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.specialOfferDiscount ?? 0}
                  onChange={(e) => handleChange('specialOfferDiscount', Number(e.target.value))}
                  className="w-20 text-center"
                />
                <span className="text-sm font-medium text-muted-foreground">%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Metadata</CardTitle>
          <CardDescription>Optimize for search engines — edit per language using the tabs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocalizedInput
            label="Meta Title"
            value={formData.seo?.metaTitle || { en: '', de: '', it: '', es: '' }}
            onChange={(val, lang) => handleChange('seo.metaTitle', val, lang)}
            placeholder="SEO Title"
          />

          <LocalizedTextArea
            label="Meta Description"
            value={formData.seo?.metaDescription || { en: '', de: '', it: '', es: '' }}
            onChange={(val, lang) => handleChange('seo.metaDescription', val, lang)}
            placeholder="Brief description for search results"
            rows={3}
          />

          <LocalizedTagsInput
            label="Keywords (comma-separated)"
            value={formData.seo?.metaKeywords || { en: [], de: [], it: [], es: [] }}
            onChange={(val, lang) => handleKeywordsChange(val, lang)}
            placeholder="egypt tours, cairo, pyramids..."
          />
          
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
                <LocalizedInput
                  label="Social Image Title"
                  value={formData.seo?.metaImage?.title || { en: '', de: '', it: '', es: '' }}
                  onChange={(val, lang) => handleChange('seo.metaImage.title', val, lang)}
                  placeholder="Title for social share image"
                />
                <LocalizedInput
                  label="Alt Text"
                  value={formData.seo?.metaImage?.alt || { en: '', de: '', it: '', es: '' }}
                  onChange={(val, lang) => handleChange('seo.metaImage.alt', val, lang)}
                  placeholder="Accessibility description"
                />
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
          <div className="space-y-2">
            <LocalizedRichText
              label="Why travelers will love this tour"
              value={formData.whatYouWillLoveHtml || { en: '', de: '', it: '', es: '' }}
              onChange={(val) => handleChange('whatYouWillLoveHtml', val)}
              activeLanguage={activeLanguage}
              placeholder="Why travelers will love this tour"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
