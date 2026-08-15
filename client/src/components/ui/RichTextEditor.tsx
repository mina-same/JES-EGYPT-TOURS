"use client";

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { normalizeRichTextInternalLinks } from '@/lib/richTextLinks';
import { uploadAPI } from '@/lib/api/upload';
import { useToast } from '@/hooks/use-toast';

/* Dynamic import to avoid SSR issues with Quill. The inner wrapper exists
   because `next/dynamic` does not forward refs, and the image handler needs the
   Quill instance to insert at the caret. */
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    const WithRef = ({ forwardedRef, ...props }: any) => <RQ ref={forwardedRef} {...props} />;
    WithRef.displayName = 'ReactQuillWithRef';
    return WithRef;
  },
  {
    ssr: false,
    loading: () => <div className="h-40 w-full bg-muted/20 animate-pulse rounded-md" />,
  }
);

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Sanitize HTML content to prevent issues
const sanitizeHTML = (val: string | any): string => {
  if (val === null || val === undefined) return '';
  const html = typeof val === 'string' ? val : String(val);
  
  // Remove potentially problematic tags and attributes
  const sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    /* Was a blanket `.replace(/data:/gi, '')`, which stripped the scheme out of
       every `src` Quill's own image button produced — the toolbar wrote a
       base64 URI and the sanitizer turned it into a relative path, so every
       image inserted from the editor was saved broken. It also mangled the
       characters `data:` anywhere in ordinary prose.
       Images now go through the upload handler and come back as Cloudinary
       URLs, so a data: image can only arrive by paste. Those are dropped whole
       rather than left with a mangled src: a 2MB base64 string in the record
       bloats every response that carries the field and every page that renders
       it. Any other data: URI in an attribute is emptied — `data:text/html` is
       the XSS vector the original strip was reaching for — while the same
       characters in prose are now left alone. */
    .replace(/<img[^>]*src\s*=\s*(["'])\s*data:[^"']*[^>]*>/gi, '')
    .replace(/((?:src|href|xlink:href)\s*=\s*)(["'])\s*data:[^"']*/gi, '$1$2$2')
    /* Dropping H1 from the toolbar hides the button but does not close the
       door: Quill's clipboard converts a pasted <h1> — from Word, Google Docs,
       another site — into header level 1 all the same, because `formats`
       whitelists 'header' as one format and cannot single out a level. Demoting
       here catches the paste path and, since this also runs over the incoming
       `value`, quietly corrects records written before the toolbar changed. H2
       rather than H3 because this editor is shared by every content type and H2
       is the one level that is a safe body heading everywhere. */
    .replace(/<h1(\s[^>]*)?>/gi, '<h2$1>')
    .replace(/<\/h1\s*>/gi, '</h2>');

  return normalizeRichTextInternalLinks(sanitized);
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  
  const quillRef = useRef<any>(null);
  const { toast } = useToast();
  /* The instance is mirrored into state as well as a ref. Quill is loaded
     through `next/dynamic`, so on the first commit the tree still holds the
     loading placeholder and the ref is null; an effect that only ran on mount
     would find nothing to attach to and, with stable dependencies, never run
     again. Storing it in state re-runs that effect once the real editor
     arrives. */
  const [quillInstance, setQuillInstance] = useState<any>(null);
  const registerQuill = useCallback((instance: any) => {
    quillRef.current = instance;
    setQuillInstance(instance);
  }, []);

  const handleChange = useCallback((content: string, _delta: any, source: string) => {
    if (source === 'user') {
      const sanitizedContent = sanitizeHTML(content);
      onChange(sanitizedContent);
    }
  }, [onChange]);

  /* Uploads to Cloudinary and embeds the returned URL. Quill's stock behaviour
     is to inline the file as base64, which the sanitizer used to break and
     which would put megabytes of image data inside the content field either
     way; the admin already has this upload route for every other image on the
     site. */
  const uploadAndInsertImage = useCallback(async (file: File) => {
    const editor = quillRef.current?.getEditor?.();
    if (!editor) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: 'Unsupported image',
        description: `${file.type || 'This file type'} is not accepted. Use JPEG, PNG, GIF, WebP or AVIF.`,
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast({
        title: 'Image too large',
        description: `${file.name} exceeds the ${MAX_IMAGE_BYTES / 1024 / 1024}MB limit.`,
        variant: 'destructive',
      });
      return;
    }

    /* Read the caret before awaiting: the file dialog and the request both let
       focus move, and by the time the URL comes back `getSelection()` can be
       null. */
    const range = editor.getSelection(true);
    const index = range ? range.index : editor.getLength();

    try {
      const response = await uploadAPI.uploadFile(file);
      const url = response?.data?.url;
      if (!response?.success || !url) {
        throw new Error(response?.error || 'No URL in response');
      }
      editor.insertEmbed(index, 'image', url, 'user');
      editor.setSelection(index + 1, 0);
    } catch (error) {
      console.error('Rich text image upload failed:', error);
      toast({
        title: 'Upload failed',
        description: 'The image could not be uploaded. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPTED_IMAGE_TYPES.join(',');
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) void uploadAndInsertImage(file);
    };
    input.click();
  }, [uploadAndInsertImage]);

  /* Pasting or dropping an image file bypasses the toolbar handler entirely —
     Quill inlines it as base64 straight into the delta — so the same route is
     wired to both events. */
  useEffect(() => {
    const root: HTMLElement | undefined = quillInstance?.getEditor?.()?.root;
    if (!root) return;

    const imagesFrom = (list: FileList | null | undefined) =>
      Array.from(list || []).filter((file) => file.type.startsWith('image/'));

    const onPaste = (event: ClipboardEvent) => {
      const files = imagesFrom(event.clipboardData?.files);
      if (!files.length) return;
      event.preventDefault();
      files.forEach((file) => void uploadAndInsertImage(file));
    };

    const onDrop = (event: DragEvent) => {
      const files = imagesFrom(event.dataTransfer?.files);
      if (!files.length) return;
      event.preventDefault();
      files.forEach((file) => void uploadAndInsertImage(file));
    };

    root.addEventListener('paste', onPaste);
    root.addEventListener('drop', onDrop);
    return () => {
      root.removeEventListener('paste', onPaste);
      root.removeEventListener('drop', onDrop);
    };
  }, [quillInstance, uploadAndInsertImage]);

  const modules = useMemo(
    () => ({
      toolbar: {
        /* H1 is deliberately absent. Every public page already has exactly one
           <h1> — the page title in PageHeader, the article title on a blog —
           and a second one written inside a body field competes with it. The
           remaining levels are enough for any body structure. */
        container: [
          [{ header: [2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
          [
            { list: 'ordered' },
            { list: 'bullet' },
            { indent: '-1' },
            { indent: '+1' },
          ],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: { image: imageHandler },
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    [imageHandler]
  );

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'indent',
    'link',
    'image',
  ];

  // Sanitize initial value
  const sanitizedValue = useMemo(() => sanitizeHTML(value), [value]);

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        forwardedRef={registerQuill}
        theme="snow"
        value={sanitizedValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-background text-foreground"
        preserveWhitespace
      />
      <style jsx global>{`
        .ql-toolbar.ql-snow {
          border-color: hsl(var(--input));
          border-top-left-radius: calc(var(--radius) - 2px);
          border-top-right-radius: calc(var(--radius) - 2px);
          background-color: hsl(var(--muted) / 0.3);
        }
        .ql-container.ql-snow {
          border-color: hsl(var(--input));
          border-bottom-left-radius: calc(var(--radius) - 2px);
          border-bottom-right-radius: calc(var(--radius) - 2px);
          min-height: 150px;
          font-family: inherit;
          font-size: 0.875rem;
        }
        .ql-editor {
          min-height: 150px;
          line-height: 1.6;
        }
        .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }
        .ql-editor p {
          margin-bottom: 0.5em;
        }
        .ql-editor p:last-child {
          margin-bottom: 0;
        }
        .ql-snow .ql-editor img {
          max-width: 100%;
          height: auto;
        }
        .ql-snow .ql-editor a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .ql-snow .ql-editor blockquote {
          border-left: 4px solid hsl(var(--border));
          padding-left: 1em;
          margin: 1em 0;
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  );
}
