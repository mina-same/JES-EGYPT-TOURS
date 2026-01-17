"use client";

import React, { useMemo } from 'react';
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

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
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

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={(content, delta, source, editor) => {
          if (source === 'user') {
            onChange(content);
          }
        }}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-background text-foreground"
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
        }
        .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }
      `}</style>
    </div>
  );
}
