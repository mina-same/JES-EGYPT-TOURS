import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

import { type AdminLanguage } from '../AdminLanguageTabs';
import LocalizedInput from '../LocalizedInput';

interface MediaTabProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
  addImage: () => void;
  removeImage: (index: number) => void;
  updateImage: (index: number, field: string, value: any) => void;
  addGalleryImage: () => void;
  removeGalleryImage: (index: number) => void;
  updateGalleryImage: (index: number, field: string, value: any) => void;
  handleImageUpload: (file: File) => Promise<{ url: string, fileName: string } | null>;
  activeLanguage: AdminLanguage;
}

export default function MediaTab({
  formData,
  handleChange,
  addImage,
  removeImage,
  updateImage,
  addGalleryImage,
  removeGalleryImage,
  updateGalleryImage,
  handleImageUpload,
  activeLanguage,
}: MediaTabProps) {
  const [uploadingIndex, setUploadingIndex] = useState<{ type: 'main' | 'gallery', index: number } | null>(null);

  const mapPreviewSrc = (() => {
    const raw = String(formData.tourMapIframe || '').trim();
    if (!raw) return '';
    const srcMatch = raw.match(/src\s*=\s*"([^"]+)"/i);
    if (srcMatch?.[1]) return srcMatch[1];
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return '';
  })();

  const handleFileUpload = async (file: File, type: 'main' | 'gallery', index: number) => {
    setUploadingIndex({ type, index });
    try {
      const result = await handleImageUpload(file);
      if (result) {
        if (type === 'main') {
          updateImage(index, 'url', result.url);
          updateImage(index, 'fileName', result.fileName);
        } else {
          updateGalleryImage(index, 'url', result.url);
          updateGalleryImage(index, 'fileName', result.fileName);
        }
      }
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Images */}
      <Card>
        <CardHeader>
          <CardTitle>Main Images *</CardTitle>
          <CardDescription>Primary tour images (at least one required)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formData.images?.map((image: any, index: number) => (
              <div key={index} className="group relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary transition-colors">
                {/* Remove Button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg z-10"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>

                {/* Image Preview */}
                {image.url ? (
                  <div className="relative aspect-video mb-3 rounded-md overflow-hidden bg-gray-100">
                    <img
                      src={image.url}
                      alt={image.alt || 'Preview'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Immediately replace with a gray placeholder using data URL
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"%3E%3Crect width="600" height="400" fill="%23F3F4F6"/%3E%3Cpath d="M300 180V220M280 200H320" stroke="%239CA3AF" stroke-width="4" stroke-linecap="round"/%3E%3Ctext x="300" y="260" font-family="sans-serif" font-size="20" fill="%236B7280" text-anchor="middle"%3EImage Failed to Load%3C/text%3E%3Ctext x="300" y="290" font-family="sans-serif" font-size="14" fill="%239CA3AF" text-anchor="middle"%3EClick to upload new image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingIndex?.type === 'main' && uploadingIndex?.index === index}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) await handleFileUpload(file, 'main', index);
                          }}
                        />
                        <div className="bg-white rounded-full p-2 shadow-lg">
                          {uploadingIndex?.type === 'main' && uploadingIndex?.index === index ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : (
                            <Upload className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video mb-3 rounded-md border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingIndex?.type === 'main' && uploadingIndex?.index === index}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) await handleFileUpload(file, 'main', index);
                      }}
                    />
                    {uploadingIndex?.type === 'main' && uploadingIndex?.index === index ? (
                      <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                    )}
                    <span className="text-sm text-gray-500">Click to upload</span>
                    <span className="text-xs text-gray-400 mt-1">or drag and drop</span>
                  </label>
                )}

                {/* Image Details */}
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-xs">Image URL</Label>
                    <Input
                      value={image.url}
                      onChange={(e) => updateImage(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="h-8 text-xs"
                    />
                  </div>
                  <LocalizedInput
                    label="Title"
                    value={image.title || { en: '', de: '', it: '', es: '' }}
                    onChange={(val) => updateImage(index, 'title', val)}
                    placeholder="Image title"
                  />
                  <LocalizedInput
                    label="Alt Text"
                    value={image.alt || { en: '', de: '', it: '', es: '' }}
                    onChange={(val) => updateImage(index, 'alt', val)}
                    placeholder="Alt text"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <Button type="button" onClick={addImage} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Main Image
          </Button>
        </CardContent>
      </Card>

      {/* Gallery Images */}
      <Card>
        <CardHeader>
          <CardTitle>Gallery Images</CardTitle>
          <CardDescription>Additional tour photos for the gallery</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formData.gallery?.map((image: any, index: number) => (
              <div key={index} className="group relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary transition-colors">
                {/* Remove Button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg z-10"
                  onClick={() => removeGalleryImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>

                {/* Image Preview */}
                {image.url ? (
                  <div className="relative aspect-video mb-3 rounded-md overflow-hidden bg-gray-100">
                    <img
                      src={image.url}
                      alt={image.alt || 'Preview'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Immediately replace with a gray placeholder using data URL
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"%3E%3Crect width="600" height="400" fill="%23F3F4F6"/%3E%3Cpath d="M300 180V220M280 200H320" stroke="%239CA3AF" stroke-width="4" stroke-linecap="round"/%3E%3Ctext x="300" y="260" font-family="sans-serif" font-size="20" fill="%236B7280" text-anchor="middle"%3EImage Failed to Load%3C/text%3E%3Ctext x="300" y="290" font-family="sans-serif" font-size="14" fill="%239CA3AF" text-anchor="middle"%3EClick to upload new image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingIndex?.type === 'gallery' && uploadingIndex?.index === index}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) await handleFileUpload(file, 'gallery', index);
                          }}
                        />
                        <div className="bg-white rounded-full p-2 shadow-lg">
                          {uploadingIndex?.type === 'gallery' && uploadingIndex?.index === index ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : (
                            <Upload className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video mb-3 rounded-md border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingIndex?.type === 'gallery' && uploadingIndex?.index === index}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) await handleFileUpload(file, 'gallery', index);
                      }}
                    />
                    {uploadingIndex?.type === 'gallery' && uploadingIndex?.index === index ? (
                      <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                    )}
                    <span className="text-sm text-gray-500">Click to upload</span>
                    <span className="text-xs text-gray-400 mt-1">or drag and drop</span>
                  </label>
                )}

                {/* Image Details */}
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Image URL</Label>
                    <Input
                      value={image.url}
                      onChange={(e) => updateGalleryImage(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="h-8 text-xs"
                    />
                  </div>
                  <LocalizedInput
                    label="Title"
                    value={image.title || { en: '', de: '', it: '', es: '' }}
                    onChange={(val) => updateGalleryImage(index, 'title', val)}
                    placeholder="Image title"
                  />
                  <LocalizedInput
                    label="Alt Text"
                    value={image.alt || { en: '', de: '', it: '', es: '' }}
                    onChange={(val) => updateGalleryImage(index, 'alt', val)}
                    placeholder="Alt text"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <Button type="button" onClick={addGalleryImage} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Gallery Image
          </Button>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Tour Map</CardTitle>
          <CardDescription>Embed map iframe code</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="tourMapIframe">Map Iframe Code</Label>
            <Textarea
              id="tourMapIframe"
              value={formData.tourMapIframe}
              onChange={(e) => handleChange('tourMapIframe', e.target.value)}
              placeholder="<iframe src=...></iframe>"
              rows={4}
            />
          </div>

          {mapPreviewSrc && (
            <div className="mt-4 space-y-2">
              <Label>Map Preview</Label>
              <div className="w-full overflow-hidden rounded-lg border bg-muted/10">
                <iframe
                  src={mapPreviewSrc}
                  className="w-full h-64"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
