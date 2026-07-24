'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Info, Search, Tag, Clock, FileText } from 'lucide-react';
import { blogCategoryAPI } from '@/lib/api/blogAdmin';
import { getLocalizedValue } from '@/lib/localize';
import { normalizeAmenityItems } from '@/lib/normalizeAmenityItems';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import LanguageBadges from '@/components/admin/LanguageBadges';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/url';
import { getStrictLocalizedSlug } from '@/lib/url';
import {
  Section, Field, LiveUrlPreview, TranslationMatrix, SeoHealthPanel,
  hasText, localeHasField, faqHasLocale, rawLocale, strictText, getImageUrl,
  type MatrixRow, type ReadinessItem,
} from '@/components/admin/entityView';

const EDIT_PATH = '/admin/blogs/category/new?id=';
const LIST_PATH = '/admin/blogs/category';

export default function BlogCategoryViewPage() {
  const { id } = useParams<{ id: string }>();
  const [entity, setEntity] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewLocale, setPreviewLocale] = useState<SupportedLocale>('en');

  const fetchEntity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await blogCategoryAPI.getById(id);
      if (res?.success && res.data) setEntity(res.data);
      else setError(res?.error || 'Blog category not found');
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load the blog category');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchEntity(); }, [fetchEntity]);

  if (loading) return <AdminPageSkeleton />;
  if (error || !entity) {
    return (
      <div className="p-6">
        <Link href={LIST_PATH} className="btn-refresh inline-flex items-center gap-1 mb-4"><ArrowLeft size={16} /> Back</Link>
        <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 text-red-700 dark:text-red-300">{error || 'Not found'}</div>
      </div>
    );
  }

  const title = getLocalizedValue(entity.name) || '(untitled)';
  const isActive = entity.isActive !== false;
  const socialImageUrl = entity.ogImage || getImageUrl(entity.metaImage);

  const matrixRows: MatrixRow[] = [
    { label: 'Name', has: (l) => localeHasField(entity.name, l) },
    { label: 'Description', has: (l) => localeHasField(entity.description, l) },
    { label: 'Hero title', has: (l) => localeHasField(entity.heroTitle, l) },
    { label: 'Hero description', has: (l) => localeHasField(entity.heroDescription, l) },
    { label: 'Section titles', has: (l) => localeHasField(entity.blogsSectionTitle, l) || localeHasField(entity.faqsSectionTitle, l) },
    { label: 'FAQs', has: (l) => faqHasLocale(entity.faqs, l) },
  ];

  const readiness: ReadinessItem[] = [
    { label: 'Name (EN)', ok: hasText(strictText(entity.name, 'en')), required: true },
    { label: 'Slug (EN)', ok: !!getStrictLocalizedSlug(entity.slug, 'en'), required: true },
    { label: 'Meta title (EN)', ok: hasText(strictText(entity.metaTitle, 'en')), required: false },
    { label: 'Meta description (EN)', ok: hasText(strictText(entity.metaDescription, 'en')), required: false },
    { label: 'Social image', ok: !!socialImageUrl, required: false },
  ];

  const descHtml = strictText(entity.description, previewLocale);
  const heroDescItems = normalizeAmenityItems(rawLocale(entity.heroDescription, previewLocale));
  const features: any[] = Array.isArray(entity.features) ? entity.features : [];
  const faqs: any[] = Array.isArray(entity.faqs) ? entity.faqs : [];

  const images: { label: string; url: string | null }[] = [
    { label: 'Main image', url: getImageUrl(entity.image) },
    { label: 'Side image', url: getImageUrl(entity.sideImage) },
    { label: 'SEO image', url: getImageUrl(entity.metaImage) },
  ].filter((i) => i.url);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title flex items-center gap-3 flex-wrap">
            <span>{title}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </h1>
          <p className="admin-page-subtitle flex items-center gap-2">
            <span>Blog category · read-only</span>
            <LanguageBadges entity={entity} />
          </p>
        </div>
        <div className="header-actions">
          <Link href={`${EDIT_PATH}${id}`} className="inline-flex items-center gap-1 rounded-md bg-[#b79c5c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a68b4b] transition-colors">
            <Edit2 size={16} /> Edit
          </Link>
          <Link href={LIST_PATH} className="btn-refresh inline-flex items-center gap-1"><ArrowLeft size={16} /> Back</Link>
        </div>
      </div>

      <LiveUrlPreview slug={entity.slug} live={isActive} warning={<>This category is <b>inactive</b> — its live URLs return 404 until it is activated.</>} />

      <TranslationMatrix rows={matrixRows} />

      <Section title="At a glance" icon={<Info size={14} />}>
        <div className="detail-grid">
          <Field label="Active">{isActive ? 'Yes' : 'No'}</Field>
          <Field label="Subcategories">{entity.subcategoriesCount ?? '—'}</Field>
          <Field label="Features">{features.length}</Field>
          <Field label="FAQs">{faqs.length}</Field>
          <Field label="Edit version">{entity.editVersion ?? '—'}</Field>
        </div>
      </Section>

      {images.length > 0 && (
        <Section title="Images" icon={<FileText size={14} />}>
          <div className="flex flex-wrap gap-4">
            {images.map((im) => (
              <div key={im.label} className="max-w-[220px]">
                <div className="text-[11px] uppercase font-bold text-gray-400 mb-1">{im.label}</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.url as string} alt={im.label} className="w-full rounded-lg border border-gray-200 dark:border-slate-700" />
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Content preview" icon={<FileText size={14} />}>
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          {SUPPORTED_LOCALES.map((l) => (
            <button key={l} type="button" onClick={() => setPreviewLocale(l)}
              className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border transition-colors ${previewLocale === l ? 'bg-[#b79c5c] border-[#b79c5c] text-white' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 hover:border-[#b79c5c]'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="space-y-5">
          {strictText(entity.heroTitle, previewLocale) && (
            <div><label className="text-[11px] uppercase font-bold text-gray-400">Hero title</label><p className="text-[15px] text-gray-700 dark:text-gray-200 m-0">{strictText(entity.heroTitle, previewLocale)}</p></div>
          )}
          {heroDescItems.length > 0 && (
            <div><label className="text-[11px] uppercase font-bold text-gray-400">Hero description</label>
              <ul className="list-disc pl-5 text-[15px] text-gray-700 dark:text-gray-200 space-y-1 m-0">{heroDescItems.map((it, i) => <li key={i} dangerouslySetInnerHTML={{ __html: it }} />)}</ul>
            </div>
          )}
          {descHtml && (
            <div><label className="text-[11px] uppercase font-bold text-gray-400">Description</label>
              <div className="html-content text-[15px] text-gray-700 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: descHtml }} />
            </div>
          )}
          {features.length > 0 && (
            <div className="space-y-2"><label className="text-[11px] uppercase font-bold text-gray-400">Features</label>
              {features.map((f, i) => (
                <div key={i} className="rounded-lg border border-gray-100 dark:border-slate-800 p-3">
                  <div className="font-semibold text-gray-900 dark:text-white">{f.icon ? `${f.icon} ` : ''}{strictText(f.title, previewLocale) || `(no ${previewLocale.toUpperCase()} title)`}</div>
                  {strictText(f.description, previewLocale) && <div className="text-[15px] text-gray-600 dark:text-gray-300 mt-1">{strictText(f.description, previewLocale)}</div>}
                </div>
              ))}
            </div>
          )}
          {faqs.length > 0 && (
            <div className="space-y-2"><label className="text-[11px] uppercase font-bold text-gray-400">FAQs</label>
              {faqs.map((f, i) => {
                const q = strictText(f.question, previewLocale); const a = strictText(f.answer, previewLocale);
                if (!q && !a) return <p key={i} className="text-xs text-gray-400 m-0">FAQ {i + 1} — no {previewLocale.toUpperCase()} content</p>;
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

      <SeoHealthPanel
        seo={entity}
        readiness={readiness}
        showOg
        showIndexing
        socialImageUrl={socialImageUrl}
        readyLabels={{ ready: 'SEO ready', notReady: 'SEO incomplete' }}
      />

      <Section title="SEO & Open Graph" icon={<Search size={14} />}>
        <div className="detail-grid">
          <Field label="Meta title (EN)">{getLocalizedValue(entity.metaTitle) || '—'}</Field>
          <Field label="Meta description (EN)">{getLocalizedValue(entity.metaDescription) || '—'}</Field>
          <Field label="OG title (EN)">{getLocalizedValue(entity.ogTitle) || '—'}</Field>
          <Field label="OG description (EN)">{getLocalizedValue(entity.ogDescription) || '—'}</Field>
          <Field label="OG image">{entity.ogImage || getImageUrl(entity.metaImage) || '—'}</Field>
          <Field label="Indexing">{entity.noIndex ? 'noindex' : 'index'}{entity.noFollow ? ', nofollow' : ', follow'}</Field>
        </div>
      </Section>

      <Section title="Relations" icon={<Tag size={14} />}>
        <div className="detail-grid">
          <Field label="Featured blogs">{Array.isArray(entity.featuredBlogs) && entity.featuredBlogs.length ? `${entity.featuredBlogs.length} linked` : '—'}</Field>
          <Field label="Featured destinations">{Array.isArray(entity.featuredDestinations) && entity.featuredDestinations.length ? `${entity.featuredDestinations.length} linked` : '—'}</Field>
        </div>
      </Section>

      <Section title="Timestamps" icon={<Clock size={14} />}>
        <div className="detail-grid">
          <Field label="Created">{entity.createdAt ? new Date(entity.createdAt).toLocaleString() : '—'}</Field>
          <Field label="Last updated">{entity.updatedAt ? new Date(entity.updatedAt).toLocaleString() : '—'}</Field>
        </div>
      </Section>
    </div>
  );
}
