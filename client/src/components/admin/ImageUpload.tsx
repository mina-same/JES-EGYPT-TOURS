 'use client';

 import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface ImageData {
  url: string;
  title?: string;
  alt?: string;
  fileName?: string;
}

interface ImageUploadProps {
  images: ImageData[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof ImageData, value: string) => void;
  onUpload: (file: File, index: number) => Promise<{ url: string, fileName: string } | null>;
  title?: string;
  description?: string;
  required?: boolean;
  maxImages?: number;
}

export default function ImageUpload({
  images = [],
  onAdd,
  onRemove,
  onUpdate,
  onUpload,
  title = "Images",
  description = "Upload and manage images",
  required = false,
  maxImages,
}: ImageUploadProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { toast } = useToast();

  const [selectedFileInfo, setSelectedFileInfo] = useState<Record<number, string>>({});

  const MAX_FILE_BYTES = 2 * 1024 * 1024;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const validateFileSize = (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      const message = `Image is too large (${formatBytes(file.size)}). Max allowed is 2.00 MB.`;
      setUploadError(message);
      toast({
        title: 'Upload blocked',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleFileUpload = async (file: File, index: number) => {
    setUploadError(null);
    setSelectedFileInfo(prev => ({ ...prev, [index]: `${file.name} (${formatBytes(file.size)})` }));

    if (!validateFileSize(file)) {
      return;
    }

    setUploadingIndex(index);
    try {
      const result = await onUpload(file, index);
      
      if (result && result.url) {
        onUpdate(index, 'url', result.url);
        if (result.fileName) {
          onUpdate(index, 'fileName', result.fileName);
        }
        toast({
          title: "Upload successful",
          description: `${file.name} (${formatBytes(file.size)}) uploaded successfully.`,
        });
      } else {
        console.error('Upload failed: missing image URL from server.', result);
        setUploadError('Upload failed: missing image URL from server.');
        toast({
          title: "Upload failed",
          description: "Image upload failed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err?.message || 'Upload failed. Please try again.');
      toast({
        title: "Upload error",
        description: err?.message || 'An error occurred during upload.',
        variant: "destructive",
      });
    } finally {
      setUploadingIndex(null);
    }
  };

  const canAddMore = maxImages ? images.length < maxImages : true;

  // Dynamic grid classes based on number of images
  const getGridClasses = () => {
    if (images.length === 0) return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    if (images.length === 1) return 'grid grid-cols-1 gap-4';
    if (images.length === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-4';
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">{title} {required && '*'}</Label>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {uploadError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {uploadError}
        </div>
      )}
      
      <div className={getGridClasses()}>
        {images.map((image, index) => (
          <div key={index} className="group relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary transition-colors">
            {/* Remove Button */}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg z-10"
              onClick={() => {
                setSelectedFileInfo(prev => {
                  const next = { ...prev };
                  delete next[index];
                  return next;
                });
                onRemove(index);
              }}
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
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"%3E%3Crect width="600" height="400" fill="%23F3F4F6"/%3E%3Cpath d="M300 180V220M280 200H320" stroke="%239CA3AF" stroke-width="4" stroke-linecap="round"/%3E%3Ctext x="300" y="260" font-family="sans-serif" font-size="20" fill="%236B7280" text-anchor="middle"%3EImage Failed to Load%3C/text%3E%3Ctext x="300" y="290" font-family="sans-serif" font-size="14" fill="%239CA3AF" text-anchor="middle"%3EClick to upload new image%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingIndex === index}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) await handleFileUpload(file, index);
                      }}
                    />
                    <div className="bg-white rounded-full p-2 shadow-lg">
                      {uploadingIndex === index ? (
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
                  disabled={uploadingIndex === index}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await handleFileUpload(file, index);
                  }}
                />
                {uploadingIndex === index ? (
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                )}
                <span className="text-sm text-gray-500">Click to upload</span>
                <span className="text-xs text-gray-400 mt-1">or drag and drop</span>
                <span className="text-[11px] text-gray-400 mt-1">
                  Max 2MB
                  {selectedFileInfo[index] ? ` • Selected: ${selectedFileInfo[index]}` : ''}
                </span>
              </label>
            )}

            {/* Image Details */}
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Image URL *</Label>
                <Input
                  value={image.url || ''}
                  onChange={(e) => onUpdate(index, 'url', e.target.value)}
                  placeholder="https://..."
                  className="h-8 text-xs"
                  required={required && index === 0}
                />
              </div>
              <div>
                <Label className="text-xs">Title</Label>
                <Input
                  value={image.title || ''}
                  onChange={(e) => onUpdate(index, 'title', e.target.value)}
                  placeholder="Image title"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Alt Text</Label>
                <Input
                  value={image.alt || ''}
                  onChange={(e) => onUpdate(index, 'alt', e.target.value)}
                  placeholder="Image description for accessibility"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {canAddMore && (
        <Button type="button" onClick={onAdd} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Image
        </Button>
      )}
    </div>
  );
}
