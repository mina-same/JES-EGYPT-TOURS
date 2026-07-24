'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Edit2, Eye, EyeOff, Globe, FileText, Loader2, Copy, Check,
  Star, Info, Search, Tag, MapPin, Layers, Clock, AlertTriangle, X,
} from 'lucide-react';
import { blogAPI } from '@/lib/api/blogAdmin';
import { getLocalizedValue } from '@/lib/localize';
import { getStrictLocalizedSlug, getSeoBaseUrl, SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/url';
import { normalizeAmenityItems } from '@/lib/normalizeAmenityItems';
import { useToast } from '@/hooks/use-toast';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import LanguageBadges from '@/components/admin/LanguageBadges';

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English', de: 'Deutsch', it: 'Italiano', es: 'Español',
};

// ── Localized-presence helpers (used by the translation matrix + previews) ──
function hasText(v: unknown): boolean {
  if (typeof v === 'string') {
    return v.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\u00a0/g, ' ').trim().length > 0;
  }
  if (Array.isArray(v)) return v.some(hasText);
  return false;
}
function localeHasField(field: any, locale: string): boolean {
  if (field == null) return false;
  if (typeof field === 'string') return hasText(field);
  if (Array.isArray(field)) return field.some((x) => hasText(x));
  if (typeof field === 'object') return hasText(field[locale]);
  return false;
}
function faqHasLocale(faqs: any[], locale: string): boolean {
  return (faqs || []).some((f) => localeHasField(f?.question, locale) && localeHasField(f?.answer, locale));
}
function blocksHaveLocale(blocks: any[], locale: string): boolean {
  return (blocks || []).some((b) => localeHasField(b?.content, locale) || localeHasField(b?.title, locale));
}

// STRICT per-locale read — NO cross-locale fallback (getLocalizedValue would
// leak EN/first-available). The content preview must show exactly the selected
// language, matching the strict completeness matrix. A plain string / array is
// treated as EN-only (mirrors the strict-slug model).
function rawLocale(field: any, locale: string): any {
  if (field == null) return undefined;
  if (typeof field === 'string' || Array.isArray(field)) return locale === 'en' ? field : undefined;
  if (typeof field === 'object') return field[locale];
  return undefined;
}
function strictText(field: any, locale: string): string {
  const v = rawLocale(field, locale);
  return typeof v === 'string' ? v : '';
}

// Per-language LIVE URL builder — mirrors the sitemap's strict/omit logic.
function buildBlogLiveUrls(slug: unknown) {
  const baseUrl = getSeoBaseUrl();
  return SUPPORTED_LOCALES.flatMap((locale) => {
    const s = getStrictLocalizedSlug(slug, locale);
    if (!s) return [];
    return [{ locale, label: LOCALE_LABELS[locale], url: `${baseUrl}/${locale}/${s}` }];
  });
}

function statusBadgeClass(status?: string) {
  switch (status) {
    case 'published': return 'bg-green-100 text-green-800';
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getImageUrl(img: unknown): string | null {
  if (!img) return null;
  if (typeof img === 'string') return img || null;
  return (img as any).url || null;
}

// ── Small presentational helpers ─────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="detail-section">
      <h3>{icon} {title}</h3>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="detail-item">
      <label>{label}</label>
      <p>{children ?? '—'}</p>
    </div>
  );
}
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
      title="Copy URL"
      className="shrink-0 inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-slate-700 px-2 py-1 text-xs text-gray-500 hover:text-[#b79c5c] hover:border-[#b79c5c] transition-colors"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function BlogViewPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [blog, setBlog] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewLocale, setPreviewLocale] = useState<SupportedLocale>('en');
  const [confirmAction, setConfirmAction] = useState<'publish' | 'unpublish' | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchBlog = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await blogAPI.getById(id);
      if (res?.success && res.data) setBlog(res.data);
      else setError(res?.error || 'Blog post not found');
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load the blog post');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchBlog(); }, [fetchBlog]);

  const runVisibilityChange = async () => {
    if (!confirmAction || !blog) return;
    const action = confirmAction;
    setBusy(true);
    try {
      const res = action === 'publish' ? await blogAPI.publish(id) : await blogAPI.unpublish(id);
      if (res?.success) {
        toast({ title: action === 'publish' ? 'Published' : 'Unpublished', description: `Status is now ${action === 'publish' ? 'published' : 'draft'}.`, variant: 'success' } as any);
        setConfirmAction(null);
        await fetchBlog();
      } else {
        toast({ title: 'Action failed', description: res?.error || 'Could not change visibility.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Action failed', description: e?.response?.data?.error || e?.message || 'Could not change visibility.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <AdminPageSkeleton />;

  if (error || !blog) {
    return (
      <div className="p-6">
        <Link href="/admin/blogs/blog" className="btn-refresh inline-flex items-center gap-1 mb-4">
          <ArrowLeft size={16} /> Back to Blogs
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 text-red-700 dark:text-red-300">
          {error || 'Blog post not found'}
        </div>
      </div>
    );
  }

  const title = getLocalizedValue(blog.title) || '(untitled)';
  const isPublished = blog.status === 'published';
  const liveUrls = buildBlogLiveUrls(blog.slug);
  const featuredUrl = getImageUrl(blog.featuredImage);
  const hasFeaturedImage = !!featuredUrl;

  // #5 — content stats
  const blockCount = Array.isArray(blog.contentBlocks) ? blog.contentBlocks.length : 0;
  const faqCount = Array.isArray(blog.faqs) ? blog.faqs.length : 0;
  const imageCount =
    (Array.isArray(blog.contentBlocks) ? blog.contentBlocks : []).reduce((n: number, b: any) => {
      if (b?.type === 'image' && (b.url || b.image)) return n + 1;
      if (b?.type === 'imageRow') return n + (Array.isArray(b.images) ? b.images.filter((im: any) => im?.url).length : 0);
      return n;
    }, 0);

  // #2 — translation completeness matrix
  const matrixRows: { label: string; has: (loc: string) => boolean }[] = [
    { label: 'Title', has: (l) => localeHasField(blog.title, l) },
    { label: 'Excerpt', has: (l) => localeHasField(blog.excerpt, l) },
    { label: 'Summary', has: (l) => localeHasField(blog.summary, l) },
    { label: 'Key Takeaways', has: (l) => localeHasField(blog.keyTakeaways, l) },
    { label: 'Content blocks', has: (l) => blocksHaveLocale(blog.contentBlocks, l) },
    { label: 'FAQs', has: (l) => faqHasLocale(blog.faqs, l) },
  ];

  const excerptText = strictText(blog.excerpt, previewLocale);
  const summaryItems = normalizeAmenityItems(rawLocale(blog.summary, previewLocale));
  const takeawayItems = normalizeAmenityItems(rawLocale(blog.keyTakeaways, previewLocale));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title flex items-center gap-3 flex-wrap">
            <span>{title}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(blog.status)}`}>
              {blog.status}
            </span>
            {blog.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-800">
                <Star size={10} /> Featured
              </span>
            )}
          </h1>
          <p className="admin-page-subtitle flex items-center gap-2">
            <span>Read-only preview</span>
            <LanguageBadges entity={blog} />
          </p>
        </div>
        <div className="header-actions">
          {isPublished ? (
            <button type="button" onClick={() => setConfirmAction('unpublish')} className="btn-refresh inline-flex items-center gap-1">
              <EyeOff size={16} /> Unpublish
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmAction('publish')}
              disabled={!hasFeaturedImage}
              title={hasFeaturedImage ? 'Publish this article' : 'Add a featured image before publishing'}
              className="btn-refresh inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye size={16} /> Publish
            </button>
          )}
          <Link
            href={`/admin/blogs/blog/${id}/edit`}
            className="inline-flex items-center gap-1 rounded-md bg-[#b79c5c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a68b4b] transition-colors"
          >
            <Edit2 size={16} /> Edit
          </Link>
          <Link href="/admin/blogs/blog" className="btn-refresh inline-flex items-center gap-1">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </div>

      {/* ── URL Preview ── */}
      <Section title="URL Preview" icon={<Globe size={14} />}>
        {!isPublished && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3 text-sm text-amber-700 dark:text-amber-300 mb-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>This article is <b>{blog.status}</b> — these live URLs return 404 until it is published{blog.status === 'scheduled' ? ` (goes live at ${blog.scheduledAt ? new Date(blog.scheduledAt).toLocaleString() : 'the scheduled time'})` : ''}.</span>
          </div>
        )}
        {liveUrls.length === 0 ? (
          <p className="text-sm text-gray-500 m-0">No slugs set yet — add a slug in the editor.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {liveUrls.map(({ locale, label, url }) => (
              <div key={locale} className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase text-gray-400 w-16 shrink-0">{label}</span>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#b79c5c] hover:underline break-all flex-1 min-w-0">
                  {url}
                </a>
                <CopyButton text={url} />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Translation completeness (#2) ── */}
      <Section title="Translation completeness" icon={<Layers size={14} />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left font-medium text-gray-400 text-xs uppercase py-2 pr-4">Field</th>
                {SUPPORTED_LOCALES.map((l) => (
                  <th key={l} className="text-center font-bold text-xs uppercase py-2 px-3 text-gray-500">{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixRows.map((row) => (
                <tr key={row.label} className="border-t border-gray-100 dark:border-slate-800">
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{row.label}</td>
                  {SUPPORTED_LOCALES.map((l) => (
                    <td key={l} className="text-center py-2 px-3">
                      {row.has(l)
                        ? <Check size={15} className="inline text-emerald-600" />
                        : <span className="text-gray-300 dark:text-slate-600">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Content stats (#5) ── */}
      <Section title="At a glance" icon={<Info size={14} />}>
        <div className="detail-grid">
          <Field label="Reading time">{blog.readingTime ? `${blog.readingTime} min` : '—'}</Field>
          <Field label="Content blocks">{blockCount}</Field>
          <Field label="Images in content">{imageCount}</Field>
          <Field label="FAQs">{faqCount}</Field>
          <Field label="Share count">{blog.shareCount ?? 0}</Field>
          <Field label="Edit version">{blog.editVersion ?? '—'}</Field>
        </div>
      </Section>

      {/* ── Featured image ── */}
      <Section title="Featured image" icon={<FileText size={14} />}>
        {featuredUrl ? (
          <div className="max-w-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={featuredUrl} alt={getLocalizedValue((blog.featuredImage as any)?.alt) || title} className="w-full rounded-lg border border-gray-200 dark:border-slate-700" />
          </div>
        ) : (
          <p className="text-sm text-gray-500 m-0">No featured image (required before publishing).</p>
        )}
      </Section>

      {/* ── Content preview (per language) ── */}
      <Section title="Content preview" icon={<FileText size={14} />}>
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          {SUPPORTED_LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setPreviewLocale(l)}
              className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border transition-colors ${
                previewLocale === l
                  ? 'bg-[#b79c5c] border-[#b79c5c] text-white'
                  : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 hover:border-[#b79c5c]'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {excerptText && (
            <div>
              <label className="text-[11px] uppercase font-bold text-gray-400">Excerpt</label>
              <p className="text-[15px] text-gray-700 dark:text-gray-200 m-0">{excerptText}</p>
            </div>
          )}

          {summaryItems.length > 0 && (
            <div>
              <label className="text-[11px] uppercase font-bold text-gray-400">Summary</label>
              <ul className="list-disc pl-5 text-[15px] text-gray-700 dark:text-gray-200 space-y-1 m-0">
                {summaryItems.map((it, i) => <li key={i} dangerouslySetInnerHTML={{ __html: it }} />)}
              </ul>
            </div>
          )}

          {blockCount > 0 && (
            <div className="space-y-3">
              <label className="text-[11px] uppercase font-bold text-gray-400">Content blocks</label>
              {blog.contentBlocks.map((block: any, i: number) => {
                const bTitle = strictText(block.title, previewLocale);
                const bContent = strictText(block.content, previewLocale);
                return (
                  <div key={i} className="rounded-lg border border-gray-100 dark:border-slate-800 p-3">
                    <div className="text-[10px] uppercase font-bold text-[#b79c5c] mb-1">{block.type}{Array.isArray(block.languages) && block.languages.length ? ` · ${block.languages.map((x: string) => x.toUpperCase()).join('/')}` : ''}</div>
                    {bTitle && <div className="font-semibold text-gray-900 dark:text-white mb-1">{bTitle}</div>}
                    {block.type === 'html' && (
                      bContent
                        ? <div className="html-content text-[15px] text-gray-700 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: bContent }} />
                        : <span className="text-xs text-gray-400">— no {previewLocale.toUpperCase()} content</span>
                    )}
                    {block.type === 'blockquote' && (
                      bContent
                        ? <blockquote className="border-l-4 border-[#b79c5c] pl-3 italic text-gray-600 dark:text-gray-300 m-0">{bContent}</blockquote>
                        : <span className="text-xs text-gray-400">— no {previewLocale.toUpperCase()} content</span>
                    )}
                    {block.type === 'image' && getImageUrl(block.url || block.image) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getImageUrl(block.url || block.image) as string} alt={getLocalizedValue(block.alt, previewLocale) || ''} className="max-w-xs rounded-md border border-gray-200 dark:border-slate-700" />
                    )}
                    {block.type === 'imageRow' && (
                      <div className="flex flex-wrap gap-2">
                        {(block.images || []).filter((im: any) => im?.url).map((im: any, j: number) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={j} src={im.url} alt={getLocalizedValue(im.alt, previewLocale) || ''} className="h-24 w-auto rounded-md border border-gray-200 dark:border-slate-700" />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {takeawayItems.length > 0 && (
            <div>
              <label className="text-[11px] uppercase font-bold text-gray-400">Key Takeaways</label>
              <ul className="list-disc pl-5 text-[15px] text-gray-700 dark:text-gray-200 space-y-1 m-0">
                {takeawayItems.map((it, i) => <li key={i} dangerouslySetInnerHTML={{ __html: it }} />)}
              </ul>
            </div>
          )}

          {faqCount > 0 && (
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-bold text-gray-400">FAQs</label>
              {blog.faqs.map((f: any, i: number) => {
                const q = strictText(f.question, previewLocale);
                const a = strictText(f.answer, previewLocale);
                if (!q && !a) return (
                  <p key={i} className="text-xs text-gray-400 m-0">FAQ {i + 1} — no {previewLocale.toUpperCase()} content</p>
                );
                return (
                  <div key={i} className="rounded-lg border border-gray-100 dark:border-slate-800 p-3">
                    <div className="font-semibold text-gray-900 dark:text-white">{q || `(no ${previewLocale.toUpperCase()} question)`}</div>
                    {a && <div className="html-content text-[15px] text-gray-600 dark:text-gray-300 mt-1" dangerouslySetInnerHTML={{ __html: a }} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Section>

      {/* ── SEO & Open Graph ── */}
      <Section title="SEO & Open Graph" icon={<Search size={14} />}>
        <div className="detail-grid">
          <Field label="Meta title (EN)">{getLocalizedValue(blog.metaTitle) || '—'}</Field>
          <Field label="Meta description (EN)">{getLocalizedValue(blog.metaDescription) || '—'}</Field>
          <Field label="Focus keyword (EN)">{getLocalizedValue(blog.focusKeyword) || '—'}</Field>
          <Field label="Meta keywords (EN)">{Array.isArray(blog.metaKeywords?.en) ? blog.metaKeywords.en.join(', ') || '—' : '—'}</Field>
          <Field label="OG title (EN)">{getLocalizedValue(blog.ogTitle) || '—'}</Field>
          <Field label="OG description (EN)">{getLocalizedValue(blog.ogDescription) || '—'}</Field>
          <Field label="OG image">{blog.ogImage || getImageUrl(blog.metaImage) || '—'}</Field>
          <Field label="Indexing">{blog.noIndex ? 'noindex' : 'index'}{blog.noFollow ? ', nofollow' : ', follow'}</Field>
        </div>
      </Section>

      {/* ── Taxonomy & relations ── */}
      <Section title="Taxonomy & relations" icon={<Tag size={14} />}>
        <div className="detail-grid">
          <Field label="Author">{typeof blog.author === 'object' ? (blog.author?.name || blog.author?.email) : (blog.author || '—')}</Field>
          <Field label="Editorial author">{blog.editorialAuthor?.name || '—'}</Field>
          <Field label="Category">{blog.category?.name ? getLocalizedValue(blog.category.name) : (typeof blog.category === 'string' ? blog.category : '—')}</Field>
          <Field label="Sub category">{blog.subCategory?.name ? getLocalizedValue(blog.subCategory.name) : (typeof blog.subCategory === 'string' ? blog.subCategory : '—')}</Field>
          <Field label="Destination">
            <span className="inline-flex items-center gap-1"><MapPin size={13} className="text-gray-400" />{blog.destination?.name ? getLocalizedValue(blog.destination.name) : (typeof blog.destination === 'string' ? blog.destination : '—')}</span>
          </Field>
          <Field label="Tags (EN)">{Array.isArray(blog.tags?.en) && blog.tags.en.length ? blog.tags.en.join(', ') : '—'}</Field>
          <Field label="Related posts">{Array.isArray(blog.relatedPosts) && blog.relatedPosts.length ? `${blog.relatedPosts.length} linked` : '—'}</Field>
          <Field label="Related tours">{Array.isArray(blog.relatedTours) && blog.relatedTours.length ? `${blog.relatedTours.length} linked` : '—'}</Field>
        </div>
      </Section>

      {/* ── Meta / timestamps ── */}
      <Section title="Publishing & timestamps" icon={<Clock size={14} />}>
        <div className="detail-grid">
          <Field label="Status">{blog.status}</Field>
          <Field label="Featured on homepage">{blog.isFeatured ? 'Yes' : 'No'}</Field>
          <Field label="Comments enabled">{blog.commentsEnabled ? 'Yes' : 'No'}</Field>
          <Field label="Comments">{Array.isArray(blog.comments) ? blog.comments.length : 0}</Field>
          <Field label="Published at">{blog.publishedAt ? new Date(blog.publishedAt).toLocaleString() : '—'}</Field>
          <Field label="Scheduled at">{blog.scheduledAt ? new Date(blog.scheduledAt).toLocaleString() : '—'}</Field>
          <Field label="Created">{blog.createdAt ? new Date(blog.createdAt).toLocaleString() : '—'}</Field>
          <Field label="Last updated">{blog.updatedAt ? new Date(blog.updatedAt).toLocaleString() : '—'}</Field>
        </div>
      </Section>

      {/* ── Visibility confirmation (warns before changing what the URLs above resolve to) ── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !busy && setConfirmAction(null)}>
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 shadow-2xl border dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b dark:border-slate-800 p-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                {confirmAction === 'publish' ? 'Publish this article?' : 'Unpublish this article?'}
              </h3>
              <button type="button" onClick={() => !busy && setConfirmAction(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-4 text-sm text-gray-600 dark:text-gray-300">
              {confirmAction === 'publish' ? (
                <p className="m-0">This makes the article <b>publicly visible</b> on the live site — the language URLs listed above will start resolving for visitors.</p>
              ) : (
                <p className="m-0">This reverts the article to <b>Draft</b> and hides it from the public site — the language URLs above will return <b>404</b> until it is published again.</p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t dark:border-slate-800 p-4">
              <button type="button" onClick={() => setConfirmAction(null)} disabled={busy} className="btn-refresh">Cancel</button>
              <button
                type="button"
                onClick={runVisibilityChange}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-md bg-[#b79c5c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a68b4b] disabled:opacity-50"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : (confirmAction === 'publish' ? <Eye size={16} /> : <EyeOff size={16} />)}
                {confirmAction === 'publish' ? 'Publish' : 'Unpublish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
