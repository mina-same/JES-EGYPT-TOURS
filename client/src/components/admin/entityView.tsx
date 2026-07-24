'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Globe, Layers, Search, Check, AlertTriangle, Copy, ArrowLeft, FileText } from 'lucide-react';
import { getStrictLocalizedSlug, getSeoBaseUrl, SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/url';
import { getLocalizedValue } from '@/lib/localize';

// Shared primitives for read-only admin ENTITY VIEW pages (blogs, tours,
// destinations, categories, subcategories). Extracted from the blog view page
// so every entity's view page stays thin and consistent.

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English', de: 'Deutsch', it: 'Italiano', es: 'Español',
};

// ── Localized-presence helpers (translation matrix + previews) ──
export function hasText(v: unknown): boolean {
  if (typeof v === 'string') {
    return v.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/ /g, ' ').trim().length > 0;
  }
  if (Array.isArray(v)) return v.some(hasText);
  return false;
}
export function localeHasField(field: any, locale: string): boolean {
  if (field == null) return false;
  if (typeof field === 'string') return hasText(field);
  if (Array.isArray(field)) return field.some((x) => hasText(x));
  if (typeof field === 'object') return hasText(field[locale]);
  return false;
}
export function faqHasLocale(faqs: any[], locale: string): boolean {
  return (faqs || []).some((f) => localeHasField(f?.question, locale) && localeHasField(f?.answer, locale));
}
export function blocksHaveLocale(blocks: any[], locale: string): boolean {
  return (blocks || []).some((b) => localeHasField(b?.content, locale) || localeHasField(b?.title, locale));
}

// STRICT per-locale read — NO cross-locale fallback (getLocalizedValue would
// leak EN/first-available). A plain string / array is treated as EN-only.
export function rawLocale(field: any, locale: string): any {
  if (field == null) return undefined;
  if (typeof field === 'string' || Array.isArray(field)) return locale === 'en' ? field : undefined;
  if (typeof field === 'object') return field[locale];
  return undefined;
}
export function strictText(field: any, locale: string): string {
  const v = rawLocale(field, locale);
  return typeof v === 'string' ? v : '';
}

export function getImageUrl(img: unknown): string | null {
  if (!img) return null;
  if (typeof img === 'string') return img || null;
  return (img as any).url || null;
}

// Per-language LIVE URL builder — mirrors the sitemap's strict/omit logic.
export function buildLiveUrls(slug: unknown) {
  const baseUrl = getSeoBaseUrl();
  return SUPPORTED_LOCALES.flatMap((locale) => {
    const s = getStrictLocalizedSlug(slug, locale);
    if (!s) return [];
    return [{ locale, label: LOCALE_LABELS[locale], url: `${baseUrl}/${locale}/${s}` }];
  });
}

// ── SEO length scoring ──
export type SeoScore = 'good' | 'warn' | 'bad';
export function lenScore(len: number, goodMin: number, goodMax: number, hardMax: number): SeoScore {
  if (len === 0) return 'bad';
  if (len >= goodMin && len <= goodMax) return 'good';
  if (len <= hardMax) return 'warn';
  return 'bad';
}
export const SCORE_DOT: Record<SeoScore, string> = { good: 'bg-emerald-500', warn: 'bg-amber-500', bad: 'bg-red-500' };
export const SCORE_TXT: Record<SeoScore, string> = {
  good: 'text-emerald-600 dark:text-emerald-400',
  warn: 'text-amber-600 dark:text-amber-400',
  bad: 'text-red-600 dark:text-red-400',
};

// ── Presentational primitives ──
export function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="detail-section">
      <h3>{icon} {title}</h3>
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="detail-item">
      <label>{label}</label>
      <p>{children ?? '—'}</p>
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
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

// ── Shared fetch hook for read-only entity view pages ──
export function useEntity(fetcher: (id: string) => Promise<any>, id: string, notFoundMsg: string) {
  const [entity, setEntity] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetcher(id);
      if (res?.success && res.data) setEntity(res.data);
      else setError(res?.error || notFoundMsg);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || notFoundMsg);
    } finally {
      setLoading(false);
    }
  }, [fetcher, id, notFoundMsg]);

  useEffect(() => { reload(); }, [reload]);

  return { entity, loading, error, reload };
}

// ── Error / not-found shell (Back link + red box) ──
export function EntityViewError({ error, backHref, backLabel = 'Back' }: { error: string | null; backHref: string; backLabel?: string }) {
  return (
    <div className="p-6">
      <Link href={backHref} className="btn-refresh inline-flex items-center gap-1 mb-4"><ArrowLeft size={16} /> {backLabel}</Link>
      <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 text-red-700 dark:text-red-300">{error || 'Not found'}</div>
    </div>
  );
}

// ── Active / Inactive header badge ──
export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// ── Language toggle chips for a per-locale content preview ──
export function LocalePreviewTabs({ value, onChange }: { value: SupportedLocale; onChange: (l: SupportedLocale) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-4">
      {SUPPORTED_LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border transition-colors ${
            value === l
              ? 'bg-[#b79c5c] border-[#b79c5c] text-white'
              : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 hover:border-[#b79c5c]'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

// ── FAQ preview list (strict per-locale) ──
export function FaqPreview({ faqs, locale }: { faqs: any[]; locale: SupportedLocale }) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;
  return (
    <div className="space-y-2">
      <label className="text-[11px] uppercase font-bold text-gray-400">FAQs</label>
      {faqs.map((f, i) => {
        const q = strictText(f.question, locale);
        const a = strictText(f.answer, locale);
        if (!q && !a) return <p key={i} className="text-xs text-gray-400 m-0">FAQ {i + 1} — no {locale.toUpperCase()} content</p>;
        return (
          <div key={i} className="rounded-lg border border-gray-100 dark:border-slate-800 p-3">
            <div className="font-semibold text-gray-900 dark:text-white">{q || `(no ${locale.toUpperCase()} question)`}</div>
            {a && <div className="html-content text-[15px] text-gray-600 dark:text-gray-300 mt-1" dangerouslySetInnerHTML={{ __html: a }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Grouped image galleries (thumbnails) ──
export function GalleryGroups({ galleries, locale, title = 'Images & galleries' }: { galleries: { label: string; items: any[] }[]; locale: SupportedLocale; title?: string }) {
  if (!galleries.length) return null;
  return (
    <Section title={title} icon={<FileText size={14} />}>
      <div className="space-y-4">
        {galleries.map((g) => (
          <div key={g.label}>
            <div className="text-[11px] uppercase font-bold text-gray-400 mb-1">{g.label} ({g.items.length})</div>
            <div className="flex flex-wrap gap-2">
              {g.items.map((im: any, i: number) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={im.url} alt={getLocalizedValue(im.alt, locale) || g.label} className="h-24 w-auto rounded-md border border-gray-200 dark:border-slate-700" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── URL Preview: per-locale live links + copy + optional "not live" warning ──
export function LiveUrlPreview({ slug, live = true, warning }: { slug: unknown; live?: boolean; warning?: React.ReactNode }) {
  const liveUrls = buildLiveUrls(slug);
  return (
    <Section title="URL Preview" icon={<Globe size={14} />}>
      {!live && warning && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3 text-sm text-amber-700 dark:text-amber-300 mb-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{warning}</span>
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
  );
}

// ── Translation completeness matrix ──
export interface MatrixRow { label: string; has: (loc: SupportedLocale) => boolean }
export function TranslationMatrix({ rows }: { rows: MatrixRow[] }) {
  return (
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
            {rows.map((row) => (
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
  );
}

// ── SEO health panel ──
// `seo` is the object that CARRIES the flat seo keys — the CALLER resolves
// flat-vs-nested: blog/destination/blog-taxonomy pass the entity itself;
// tour/tour-taxonomy pass `entity.seo ?? {}`.
export interface ReadinessItem { label: string; ok: boolean; required?: boolean }
export function SeoHealthPanel({
  seo,
  readiness,
  showOg = false,
  showFocusKeyword = false,
  showIndexing = false,
  socialImageUrl = null,
  focusKeywordDensity,
  readyLabels,
}: {
  seo: any;
  readiness: ReadinessItem[];
  showOg?: boolean;
  showFocusKeyword?: boolean;
  showIndexing?: boolean;
  socialImageUrl?: string | null;
  focusKeywordDensity?: number | null;
  readyLabels?: { ready: string; notReady: string };
}) {
  const labels = readyLabels ?? { ready: 'Ready to publish', notReady: 'Not ready to publish' };
  const ready = readiness.filter((r) => r.required).every((r) => r.ok);
  const rows = SUPPORTED_LOCALES.map((loc) => {
    const mt = strictText(seo?.metaTitle, loc);
    const md = strictText(seo?.metaDescription, loc);
    return {
      loc,
      mtLen: mt.length, mtScore: lenScore(mt.length, 50, 60, 70),
      mdLen: md.length, mdScore: lenScore(md.length, 120, 160, 170),
      ogT: hasText(strictText(seo?.ogTitle, loc)),
      ogD: hasText(strictText(seo?.ogDescription, loc)),
      kw: hasText(strictText(seo?.focusKeyword, loc)),
    };
  });

  return (
    <Section title="SEO health" icon={<Search size={14} />}>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${ready ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {ready ? <Check size={13} /> : <AlertTriangle size={13} />}
          {ready ? labels.ready : labels.notReady}
        </span>
        {readiness.map((r) => (
          <span key={r.label} className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-slate-700 px-2 py-1 text-[11px]">
            {r.ok ? <Check size={12} className="text-emerald-600" /> : <span className="text-red-500 font-bold leading-none">✗</span>}
            <span className={r.ok ? 'text-gray-600 dark:text-gray-300' : 'text-red-600 dark:text-red-400'}>
              {r.label}{r.required && !r.ok ? ' (required)' : ''}
            </span>
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left font-medium text-gray-400 text-xs uppercase py-2 pr-4">Lang</th>
              <th className="text-left font-medium text-gray-400 text-xs uppercase py-2 px-3">Meta title <span className="normal-case text-gray-300">(50–60)</span></th>
              <th className="text-left font-medium text-gray-400 text-xs uppercase py-2 px-3">Meta desc <span className="normal-case text-gray-300">(120–160)</span></th>
              {showOg && <th className="text-center font-medium text-gray-400 text-xs uppercase py-2 px-3">OG title</th>}
              {showOg && <th className="text-center font-medium text-gray-400 text-xs uppercase py-2 px-3">OG desc</th>}
              {showFocusKeyword && <th className="text-center font-medium text-gray-400 text-xs uppercase py-2 px-3">Focus kw</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.loc} className="border-t border-gray-100 dark:border-slate-800">
                <td className="py-2 pr-4 font-bold uppercase text-xs text-gray-500">{r.loc}</td>
                <td className="py-2 px-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${SCORE_DOT[r.mtScore]}`} />
                    <span className={SCORE_TXT[r.mtScore]}>{r.mtLen}</span>
                  </span>
                </td>
                <td className="py-2 px-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${SCORE_DOT[r.mdScore]}`} />
                    <span className={SCORE_TXT[r.mdScore]}>{r.mdLen}</span>
                  </span>
                </td>
                {showOg && <td className="text-center py-2 px-3">{r.ogT ? <Check size={15} className="inline text-emerald-600" /> : <span className="text-gray-300 dark:text-slate-600">—</span>}</td>}
                {showOg && <td className="text-center py-2 px-3">{r.ogD ? <Check size={15} className="inline text-emerald-600" /> : <span className="text-gray-300 dark:text-slate-600">—</span>}</td>}
                {showFocusKeyword && <td className="text-center py-2 px-3">{r.kw ? <Check size={15} className="inline text-emerald-600" /> : <span className="text-gray-300 dark:text-slate-600">—</span>}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="detail-grid mt-4">
        <Field label="Social image">{socialImageUrl ? 'Set' : 'Missing'}</Field>
        {showFocusKeyword && (
          <Field label="Focus keyword density (EN)">
            {focusKeywordDensity != null ? `${focusKeywordDensity}%  ·  ideal 0.5–2.5%` : '—'}
          </Field>
        )}
        {showIndexing && (
          <Field label="Indexing">{seo?.noIndex ? 'noindex' : 'index'}{seo?.noFollow ? ', nofollow' : ', follow'}</Field>
        )}
      </div>
    </Section>
  );
}
