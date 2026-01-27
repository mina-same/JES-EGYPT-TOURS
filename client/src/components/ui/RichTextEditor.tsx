"use client";

import React, { useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamic import to avoid SSR issues with Quill
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="h-40 w-full bg-muted/20 animate-pulse rounded-md" />,
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Sanitize HTML content to prevent issues
const sanitizeHTML = (html: string): string => {
  if (!html) return '';
  
  // Remove potentially problematic tags and attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '');
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  
  const handleChange = useCallback((content: string, delta: any, source: string, editor: any) => {
    if (source === 'user') {
      const sanitizedContent = sanitizeHTML(content);
      onChange(sanitizedContent);
    }
  }, [onChange]);

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
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
      clipboard: {
        matchVisual: false,
      },
    }),
    []
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
