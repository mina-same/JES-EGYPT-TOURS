import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedInput from '@/components/admin/LocalizedInput';
import LocalizedTextArea from '@/components/admin/LocalizedTextArea';
import LocalizedTagsInput from '@/components/admin/LocalizedTagsInput';
import ImageUpload, { type ImageData, type UploadResult } from '@/components/admin/ImageUpload';
import {
  getLocalTimezoneLabel,
  parseDatetimeLocal,
  toDatetimeLocalValue,
} from '@/lib/datetimeLocal';

interface SEOTabProps {
  formData: any;
  handleChange: (field: string, value: any, lang?: AdminLanguage) => void;
  handleKeywordsChange: (value: any, lang: AdminLanguage) => void;
  handleImageUpload: (file: File) => Promise<UploadResult | null>;
  activeLanguage: AdminLanguage;
}

export default function SEOTab({
  formData,
  handleChange,
  handleKeywordsChange,
  handleImageUpload,
  activeLanguage,
}: SEOTabProps) {
  const isScheduled =
    formData.scheduledAt !== undefined && formData.scheduledAt !== null;
  const publishingStatus = isScheduled
    ? 'scheduled'
    : formData.isActive
      ? 'active'
      : 'inactive';

  // The form seeds metaImage with blank url/title/alt, so mere presence proves
  // nothing — the row renders only once something has actually been typed into
  // it, which keeps alt-before-upload working without showing an empty card.
  const hasText = (value: any) =>
    !!value &&
    typeof value === 'object' &&
    Object.values(value).some((entry) => typeof entry === 'string' && entry.trim());
  const rawMetaImage = formData.seo?.metaImage;
  const metaImage =
    rawMetaImage &&
    (String(rawMetaImage.url || '').trim() || hasText(rawMetaImage.alt) || hasText(rawMetaImage.title))
      ? rawMetaImage
      : null;

  const handlePublishingStatusChange = (status: string) => {
    if (status === 'scheduled') {
      handleChange('isActive', false);
      if (!isScheduled) handleChange('scheduledAt', '');
      return;
    }

    handleChange('isActive', status === 'active');
    handleChange('scheduledAt', null);
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
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="tourPublishingStatus" className="text-base">
                Publishing Status
              </Label>
              <p className="text-sm text-muted-foreground">
                Publish now, keep the tour hidden, or activate it automatically later.
              </p>
            </div>
            <select
              id="tourPublishingStatus"
              value={publishingStatus}
              onChange={(event) => handlePublishingStatusChange(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="active">Active — visible now</option>
              <option value="inactive">Inactive — hidden</option>
              <option value="scheduled">Scheduled — activate later</option>
            </select>

            {publishingStatus === 'scheduled' && (
              <div className="space-y-2">
                <Label htmlFor="tourScheduledAt">Scheduled Date</Label>
                <Input
                  id="tourScheduledAt"
                  type="datetime-local"
                  required
                  min={toDatetimeLocalValue(new Date())}
                  value={toDatetimeLocalValue(formData.scheduledAt)}
                  onChange={(event) =>
                    handleChange(
                      'scheduledAt',
                      event.target.value
                        ? parseDatetimeLocal(event.target.value)
                        : ''
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Timezone: {getLocalTimezoneLabel()}. The tour stays hidden until this time.
                </p>
              </div>
            )}
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
            activeLanguage={activeLanguage}
          />

          <LocalizedTextArea
            label="Meta Description"
            value={formData.seo?.metaDescription || { en: '', de: '', it: '', es: '' }}
            onChange={(val, lang) => handleChange('seo.metaDescription', val, lang)}
            placeholder="Brief description for search results"
            rows={3}
            activeLanguage={activeLanguage}
          />

          <LocalizedTagsInput
            label="Keywords (comma-separated)"
            value={formData.seo?.metaKeywords || { en: [], de: [], it: [], es: [] }}
            onChange={(val, lang) => handleKeywordsChange(val, lang)}
            placeholder="egypt tours, cairo, pyramids..."
            activeLanguage={activeLanguage}
          />
          
        </CardContent>
      </Card>

      {/* Social Sharing */}
      <Card>
        <CardHeader>
          <CardTitle>Social Sharing (Open Graph)</CardTitle>
          <CardDescription>
            How the tour looks when its link is pasted into Facebook, X, LinkedIn or WhatsApp.
            Leave the text fields empty to reuse the SEO title and description above.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LocalizedInput
            label="Social Title"
            value={formData.seo?.ogTitle || { en: '', de: '', it: '', es: '' }}
            onChange={(val, lang) => handleChange('seo.ogTitle', val, lang)}
            placeholder="Defaults to the Meta Title"
            activeLanguage={activeLanguage}
          />

          <LocalizedTextArea
            label="Social Description"
            value={formData.seo?.ogDescription || { en: '', de: '', it: '', es: '' }}
            onChange={(val, lang) => handleChange('seo.ogDescription', val, lang)}
            placeholder="Defaults to the Meta Description"
            rows={3}
            activeLanguage={activeLanguage}
          />

          <ImageUpload
            images={metaImage ? [metaImage as ImageData] : []}
            onAdd={() =>
              handleChange('seo.metaImage', {
                url: '',
                fileName: '',
                title: { en: '', de: '', it: '', es: '' },
                alt: { en: '', de: '', it: '', es: '' },
              })
            }
            onRemove={() => handleChange('seo.metaImage', undefined)}
            onUpdate={(index, field, value, lang) =>
              handleChange(`seo.metaImage.${field}`, value, lang)
            }
            onUpload={(file) => handleImageUpload(file)}
            // One merged write keeps fileName and the dimensions attached to the
            // url; fileName is required by the API, and the dimensions become
            // og:image:width / og:image:height.
            onUploadResult={(index, result) =>
              handleChange('seo.metaImage', {
                ...(formData.seo?.metaImage || {}),
                url: result.url,
                fileName: result.fileName,
                width: result.width,
                height: result.height,
              })
            }
            title="Social Share Image"
            description="Recommended 1200 × 630 px. Leave empty and the tour's first photo is used automatically."
            maxImages={1}
            activeLanguage={activeLanguage}
            addButtonLabel="Add Social Share Image"
          />
        </CardContent>
      </Card>
    </div>
  );
}
