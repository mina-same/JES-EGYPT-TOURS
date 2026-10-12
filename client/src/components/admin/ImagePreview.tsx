"use client";

/* Preview the saved original URL, including external hosts entered by editors. */
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Eye, Upload, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PreviewImage { url: string; alt?: unknown; title?: unknown }
const label = (value: unknown): string => typeof value === 'string' ? value :
  value && typeof value === 'object' ? String((value as Record<string, unknown>).en || '') : '';
const safeUrl = (url: string): boolean => /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url) || /^blob:/.test(url);

export function ImagePreviewButton({ images, index = 0 }: { images: PreviewImage[]; index?: number }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(index);
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState(false);
  const image = images[current];
  const available = !!images[index]?.url && safeUrl(images[index].url);
  const move = (step: number) => {
    let next = current;
    for (let count = 0; count < images.length; count++) {
      next = (next + step + images.length) % images.length;
      if (images[next]?.url && safeUrl(images[next].url)) break;
    }
    setCurrent(next); setZoom(1); setFailed(false);
  };
  return <Dialog.Root open={open} onOpenChange={(value) => {
    setOpen(value); if (value) { setCurrent(index); setZoom(1); setFailed(false); }
  }}>
    <Dialog.Trigger asChild>
      <Button type="button" variant="outline" size="sm" disabled={!available}>
        <Eye className="mr-2 h-4 w-4" />View image
      </Button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[1100] bg-black/80" />
      <Dialog.Content className="fixed inset-3 z-[1101] flex flex-col rounded-xl bg-background text-foreground shadow-2xl md:inset-8"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
          if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
        }}>
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <div className="mr-auto">
            <Dialog.Title className="font-semibold">Image preview</Dialog.Title>
            <Dialog.Description className="text-xs text-muted-foreground">{label(image?.title) || label(image?.alt) || 'Full image'} ? {current + 1} / {images.length}</Dialog.Description>
          </div>
          <Button type="button" variant="outline" size="icon" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => setZoom(z => Math.max(1, z - 0.5))}><ZoomOut className="h-4 w-4" /></Button>
          <span className="text-xs">{Math.round(zoom * 100)}%</span>
          <Button type="button" variant="outline" size="icon" aria-label="Zoom in" disabled={zoom >= 4} onClick={() => setZoom(z => Math.min(4, z + 0.5))}><ZoomIn className="h-4 w-4" /></Button>
          {image?.url && safeUrl(image.url) && <Button variant="outline" size="sm" asChild><a href={image.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Open original</a></Button>}
          <Dialog.Close asChild><Button type="button" variant="outline" size="icon" aria-label="Close image preview"><X className="h-5 w-5" /></Button></Dialog.Close>
        </div>
        <div className="relative min-h-0 flex-1 overflow-auto bg-black/5">
          {failed ? <p role="alert" className="p-8 text-center">Unable to load this image. Check the image URL or open the original.</p> :
            image?.url && safeUrl(image.url) && <div style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
              <img key={image.url} src={image.url} alt={label(image.alt) || 'Image preview'} className="h-full w-full object-contain" onError={() => setFailed(true)} />
            </div>}
        </div>
        {images.filter(item => item.url && safeUrl(item.url)).length > 1 && <div className="flex justify-center gap-3 border-t p-2">
          <Button type="button" variant="outline" onClick={() => move(-1)}><ChevronLeft className="mr-2 h-4 w-4" />Previous</Button>
          <Button type="button" variant="outline" onClick={() => move(1)}>Next<ChevronRight className="ml-2 h-4 w-4" /></Button>
        </div>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

export default function ImagePreview({ images, index = 0, onUpload, uploading = false }: {
  images: PreviewImage[]; index?: number; onUpload?: (file: File) => Promise<unknown>; uploading?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const image = images[index];
  return <div className="mb-4 min-w-0 space-y-2">
    <div className="mx-auto flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
      {image?.url && safeUrl(image.url) && <img src={image.url} alt={label(image.alt) || 'Preview'} className="h-full w-full object-contain" />}
      {!image?.url && <span className="text-sm text-muted-foreground">No image selected</span>}
    </div>
    <div className="flex flex-wrap justify-center gap-2">
      <ImagePreviewButton images={images} index={index} />
      {onUpload && <label className={`inline-flex cursor-pointer items-center rounded-md border bg-background px-3 py-2 text-sm font-medium focus-within:ring-2 focus-within:ring-ring ${(busy || uploading) ? 'opacity-50' : ''}`}>
        <input type="file" accept="image/*" className="sr-only" disabled={busy || uploading} aria-label="Change image" onChange={async event => {
          const file = event.target.files?.[0]; event.target.value = '';
          if (!file) return; setBusy(true); setUploadError(false);
          try { await onUpload(file); } catch { setUploadError(true); } finally { setBusy(false); }
        }} />
        {busy || uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}{image?.url ? 'Change image' : 'Upload image'}
      </label>}
    </div>
    {uploadError && <p role="alert" className="text-sm text-red-600">Image upload failed. Please try again.</p>}
  </div>;
}
