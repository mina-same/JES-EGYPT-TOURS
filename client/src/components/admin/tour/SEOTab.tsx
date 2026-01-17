import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface SEOTabProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
  handleKeywordsChange: (value: string) => void;
  handleImageUpload: (file: File) => Promise<{ url: string, fileName: string } | null>;
}

export default function SEOTab({
  formData,
  handleChange,
  handleKeywordsChange,
  handleImageUpload,
}: SEOTabProps) {
  return (
    <div className="space-y-6">
      {/* Visibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Visibility & Status</CardTitle>
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
          <CardDescription>Optimize for search engines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seo.metaTitle">Meta Title</Label>
            <Input
              id="seo.metaTitle"
              value={formData.seo?.metaTitle || ''}
              onChange={(e) => handleChange('seo.metaTitle', e.target.value)}
              placeholder="SEO Title (defaults to tour name)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo.metaDescription">Meta Description</Label>
            <Textarea
              id="seo.metaDescription"
              value={formData.seo?.metaDescription || ''}
              onChange={(e) => handleChange('seo.metaDescription', e.target.value)}
              placeholder="Brief description for search results..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo.metaKeywords">Keywords</Label>
            <Textarea
              id="seo.metaKeywords"
              value={formData.seo?.metaKeywords?.join(', ') || ''}
              onChange={(e) => handleKeywordsChange(e.target.value)}
              placeholder="egypt tours, cairo, pyramids..."
              rows={2}
            />
            <p className="text-sm text-muted-foreground">Comma-separated keywords</p>
          </div>
          
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
                  alt="SEO Preview"
                  className="w-32 h-24 object-cover rounded border"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Content */}
      <Card>
        <CardHeader>
          <CardTitle>What You Will Love</CardTitle>
          <CardDescription>Marketing content for the tour page</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor
              value={formData.whatYouWillLoveHtml || ''}
              onChange={(value) => handleChange('whatYouWillLoveHtml', value)}
              placeholder="Why travelers will love this tour..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
