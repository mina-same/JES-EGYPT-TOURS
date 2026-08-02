'use client';

 import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
 import { type AdminLanguage } from './AdminLanguageTabs';
import LocalizedField from './LocalizedField';
import ImageLanguagesPicker from './ImageLanguagesPicker';

export interface ImageData {
  url: string;
  title?: string | any;
  alt?: string | any;
  fileName?: string;
  /** Intrinsic pixel size from the upload response; feeds og:image:width/height. */
  width?: number;
  height?: number;
  /** Locales this image renders for; absent/empty = all languages. */
  languages?: AdminLanguage[];
}

export interface UploadResult {
  url: string;
  fileName: string;
  width?: number;
  height?: number;
}

interface ImageUploadProps {
  images: ImageData[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof ImageData, value: any, lang?: AdminLanguage) => void;
  onUpload: (file: File, index: number) => Promise<UploadResult | null>;
  /**
   * Receives the WHOLE upload result so the parent can merge url, fileName and
   * dimensions in one state update. Without it only `url` is stored — see the
   * fallback in handleFileUpload for why it can't just call onUpdate repeatedly.
   */
  onUploadResult?: (index: number, result: UploadResult) => void;
  title?: string;
  description?: string;
  required?: boolean;
  maxImages?: number;
  activeLanguage?: AdminLanguage;
  addButtonLabel?: string;
  /** Show the per-image "Visible in languages" picker (galleries only). */
  showLanguagesPicker?: boolean;
  /** Warning icon + tooltip shown on the picker while an image is restricted. */
  languagesPickerWarning?: string;
}


export default function ImageUpload({
  images = [],
  onAdd,
  onRemove,
  onUpdate,
  onUpload,
  onUploadResult,
  title = "Images",
  description = "Upload and manage images",
  required = false,
  maxImages,
  activeLanguage,
  addButtonLabel = "Add Another Image",
  showLanguagesPicker = false,
  languagesPickerWarning,
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
        if (onUploadResult) {
          // One merged write, so fileName and the dimensions survive alongside
          // the url instead of each onUpdate call clobbering the previous one.
          onUploadResult(index, result);
        } else {
          // Legacy path: only "url" is stored, and the parent infers "fileName"
          // from it before submitting. Calling onUpdate twice here would hit the
          // React batching/closure issue where the second write wipes the first.
          onUpdate(index, 'url', result.url);
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
        <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">{title} {required && '*'}</Label>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      {uploadError && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md px-3 py-2">
          {uploadError}
        </div>
      )}
      
      <div className={getGridClasses()}>
        {images.map((image, index) => (
          <div key={index} className="group relative border border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-4 hover:border-[#b79c5c] dark:hover:border-[#b79c5c] bg-gray-50/50 dark:bg-slate-900/50 transition-all">
            {/* Remove Button */}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity"
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
              <div className="relative aspect-video max-h-[160px] mx-auto mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <img
                  src={image.url}
                  alt={(activeLanguage && typeof image.alt === 'object' ? image.alt[activeLanguage] : image.alt) || 'Preview'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"%3E%3Crect width="600" height="400" fill="%231F2937"/%3E%3Cpath d="M300 180V220M280 200H320" stroke="%234B5563" stroke-width="4" stroke-linecap="round"/%3E%3Ctext x="300" y="260" font-family="sans-serif" font-size="20" fill="%239CA3AF" text-anchor="middle"%3EImage Failed to Load%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <label className="cursor-pointer">
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
                    <div className="bg-white dark:bg-slate-900 rounded-full p-2.5 shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                      {uploadingIndex === index ? (
                        <Loader2 className="h-5 w-5 animate-spin text-[#b79c5c]" />
                      ) : (
                        <Upload className="h-5 w-5 text-[#b79c5c]" />
                      )}
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center aspect-video max-h-[160px] mb-4 rounded-lg border-2 border-dashed border-gray-200 dark:border-slate-700 cursor-pointer hover:border-[#b79c5c] dark:hover:border-[#b79c5c] hover:bg-white dark:hover:bg-slate-800 transition-all">
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
                  <Loader2 className="h-10 w-10 text-[#b79c5c] animate-spin mb-2" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-gray-300 dark:text-slate-600 mb-2" />
                )}
                <span className="text-sm text-gray-900 dark:text-white font-bold">Click to upload</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider font-bold">
                  Max 2MB
                  {selectedFileInfo[index] ? ` • ${selectedFileInfo[index]}` : ''}
                </span>
              </label>
            )}

            {/* Image Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Image URL *</Label>
                <Input
                  value={image.url || ''}
                  onChange={(e) => onUpdate(index, 'url', e.target.value)}
                  placeholder="https://..."
                  className="h-9 text-xs bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700"
                  required={required && index === 0}
                />
              </div>

              {activeLanguage ? (
                <>
                  <LocalizedField
                    label="Title"
                    value={image.title}
                    globalLanguage={activeLanguage}
                    onChange={(lang, val) => onUpdate(index, 'title', val, lang)}
                  >
                    {(lang, currentValue, handleLang) => (
                      <Input
                        value={currentValue || ""}
                        onChange={(e) => handleLang(e.target.value)}
                        placeholder={`Title (${lang.toUpperCase()})`}
                        className="h-9 text-xs bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700"
                      />
                    )}
                  </LocalizedField>
                  <LocalizedField
                    label="Alt Text"
                    value={image.alt}
                    globalLanguage={activeLanguage}
                    onChange={(lang, val) => onUpdate(index, 'alt', val, lang)}
                  >
                    {(lang, currentValue, handleLang) => (
                      <Input
                        value={currentValue || ""}
                        onChange={(e) => handleLang(e.target.value)}
                        placeholder={`Alt (${lang.toUpperCase()})`}
                        className="h-9 text-xs bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700"
                      />
                    )}
                  </LocalizedField>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Title</Label>
                    <Input
                      value={image.title || ''}
                      onChange={(e) => onUpdate(index, 'title', e.target.value)}
                      placeholder="Image title"
                      className="h-9 text-xs bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Alt Text</Label>
                    <Input
                      value={image.alt || ''}
                      onChange={(e) => onUpdate(index, 'alt', e.target.value)}
                      placeholder="Accessibility description"
                      className="h-9 text-xs bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700"
                    />
                  </div>
                </>
              )}
            </div>

            {showLanguagesPicker && (
              <ImageLanguagesPicker
                className="mt-3"
                value={image.languages}
                onChange={(next) => onUpdate(index, 'languages', next)}
                restrictionWarning={languagesPickerWarning}
              />
            )}
          </div>
        ))}
      </div>
      
      {canAddMore && (
        <Button 
          type="button" 
          onClick={onAdd} 
          variant="outline" 
          className="w-full border-dashed border-2 hover:border-[#b79c5c] hover:text-[#b79c5c] hover:bg-[#b79c5c]/5"
        >
          <Plus className="h-4 w-4 mr-2" />
          {addButtonLabel}
        </Button>
      )}
    </div>
  );
}
