'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, FileJson, CheckCircle2, XCircle, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LanguageBadges from '@/components/admin/LanguageBadges';
import { blogAPI } from '@/lib/api/blogAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  parseBlogImportFile,
  buildBlogCreatePayload,
  BLOG_IMPORT_ENGINE_VERSION,
  type ParsedBlogImportFile,
} from '@/lib/blogImport';

type ItemResult =
  | { state: 'pending' }
  | { state: 'created'; id?: string }
  | { state: 'failed'; message: string };

// Blocks come either as per-language arrays (preferred — counts may differ
// by language on purpose) or as one legacy aligned array.
function describeBlockCounts(cb: any): string {
  if (Array.isArray(cb)) return `${cb.length} block(s)`;
  if (cb && typeof cb === 'object') {
    const parts = (['en', 'de', 'it', 'es'] as const)
      .filter((l) => Array.isArray(cb[l]))
      .map((l) => `${l.toUpperCase()} ${cb[l].length}`);
    return parts.length ? `blocks: ${parts.join(' · ')}` : '0 block(s)';
  }
  return '0 block(s)';
}

export default function ImportBlogsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedBlogImportFile | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<Record<number, ItemResult>>({});
  const [finished, setFinished] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setResults({});
    setFinished(false);
    const reader = new FileReader();
    reader.onload = () => {
      setParsed(parseBlogImportFile(String(reader.result ?? '')));
    };
    reader.onerror = () => {
      setParsed({ items: [], fileErrors: ['Could not read the file.'] });
    };
    reader.readAsText(file);
  };

  const validItems = (parsed?.items || []).filter((item) => item.errors.length === 0);
  const invalidCount = (parsed?.items || []).length - validItems.length;

  const runImport = async () => {
    if (!user?.id) {
      toast({ title: 'Not signed in', description: 'Your admin session is required to import.', variant: 'destructive' });
      return;
    }
    setImporting(true);
    setFinished(false);

    // Sequential on purpose: precise per-article reporting, one failure never
    // stops the rest, duplicate-slug errors stay attributable, order is kept.
    let created = 0;
    let failed = 0;
    for (const item of validItems) {
      setResults((prev) => ({ ...prev, [item.index]: { state: 'pending' } }));
      try {
        const payload = buildBlogCreatePayload(item.raw, user.id);
        // BlogFormData still types featuredImage as required, but imported
        // drafts are deliberately imageless (server allows it for drafts).
        const res = await blogAPI.create(payload as any);
        if (res?.success) {
          created += 1;
          setResults((prev) => ({ ...prev, [item.index]: { state: 'created', id: res.data?._id } }));
        } else {
          failed += 1;
          setResults((prev) => ({ ...prev, [item.index]: { state: 'failed', message: res?.error || 'Unknown error' } }));
        }
      } catch (e: any) {
        failed += 1;
        const message = e?.response?.data?.error || e?.message || 'Request failed';
        setResults((prev) => ({ ...prev, [item.index]: { state: 'failed', message } }));
      }
    }

    setImporting(false);
    setFinished(true);
    toast({
      title: failed === 0 ? 'Import complete' : 'Import finished with failures',
      description: `${created} article(s) created as drafts${failed ? `, ${failed} failed` : ''}.`,
      variant: failed === 0 ? 'success' : 'destructive',
    } as any);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin/blogs/articles" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Articles
          </Link>
          <h1 className="text-2xl font-bold">Import Articles from JSON</h1>
        </div>
        {/* Engine stamp: confirms which import logic THIS page loaded —
            check it before uploading if results ever look off. */}
        <span className="text-xs text-muted-foreground border rounded px-2 py-1">
          engine {BLOG_IMPORT_ENGINE_VERSION}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileJson size={20} /> 1. Choose the file</CardTitle>
          <CardDescription>
            One JSON file per import — a single article object or an array of articles
            (see docs/blog-import). Everything is created as a <b>draft</b>; images,
            categories, tags and authors are set manually afterwards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              <Upload size={16} className="mr-2" /> Select JSON file
            </Button>
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          </div>

          {parsed?.fileErrors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">
              <XCircle size={16} className="mt-0.5 shrink-0" /> {err}
            </div>
          ))}
        </CardContent>
      </Card>

      {parsed && parsed.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Preview — {parsed.items.length} article(s)</CardTitle>
            <CardDescription>
              {validItems.length} ready to import{invalidCount > 0 ? `, ${invalidCount} blocked by errors` : ''}.
              Nothing is written until you confirm below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsed.items.map((item) => {
              const result = results[item.index];
              const title = item.raw?.title?.en || item.raw?.title?.de || item.raw?.title?.it || item.raw?.title?.es || `(untitled #${item.index + 1})`;
              const blocked = item.errors.length > 0;
              return (
                <div
                  key={item.index}
                  className={`rounded-lg border p-4 space-y-2 ${blocked ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : 'bg-card'}`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground">#{item.index + 1}</span>
                      <span className="font-semibold truncate">{title}</span>
                      <LanguageBadges entity={item.raw} />
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {describeBlockCounts(item.raw?.contentBlocks)} · {(Array.isArray(item.raw?.faqs) ? item.raw.faqs.length : 0)} FAQ(s)
                    </div>
                  </div>

                  {item.errors.map((msg, i) => (
                    <p key={`e${i}`} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-1.5 m-0">
                      <XCircle size={14} className="mt-0.5 shrink-0" /> {msg}
                    </p>
                  ))}
                  {item.warnings.map((msg, i) => (
                    <p key={`w${i}`} className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-1.5 m-0">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {msg}
                    </p>
                  ))}

                  {result?.state === 'pending' && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 m-0"><Loader2 size={14} className="animate-spin" /> Importing…</p>
                  )}
                  {result?.state === 'created' && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 m-0">
                      <CheckCircle2 size={14} /> Created as draft
                      {result.id && (
                        <Link href={`/admin/blogs/articles/${result.id}/edit`} className="inline-flex items-center gap-1 underline ml-1">
                          open <ExternalLink size={12} />
                        </Link>
                      )}
                    </p>
                  )}
                  {result?.state === 'failed' && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-1.5 m-0">
                      <XCircle size={14} className="mt-0.5 shrink-0" /> {result.message}
                    </p>
                  )}
                </div>
              );
            })}

            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <Button type="button" onClick={runImport} disabled={importing || validItems.length === 0 || finished}>
                {importing ? (<><Loader2 size={16} className="mr-2 animate-spin" /> Importing…</>) : (
                  finished ? 'Import finished' : `Import ${validItems.length} article(s) as drafts`
                )}
              </Button>
              {finished && (
                <Link href="/admin/blogs/articles" className="text-sm underline">
                  Go to blog list to review the drafts
                </Link>
              )}
              <span className="text-xs text-muted-foreground">
                Remember: add the featured image during review — publishing without one is blocked.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
