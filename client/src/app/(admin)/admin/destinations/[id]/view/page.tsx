'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Info, Search, Tag, Clock, FileText } from 'lucide-react';
import { destinationAPI } from '@/lib/api/blogAdmin';
import { getLocalizedValue } from '@/lib/localize';
import { normalizeAmenityItems } from '@/lib/normalizeAmenityItems';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import LanguageBadges from '@/components/admin/LanguageBadges';
import { getStrictLocalizedSlug, type SupportedLocale } from '@/lib/url';
import {
  Section, Field, LiveUrlPreview, TranslationMatrix, SeoHealthPanel,
  useEntity, EditEntityButton, EntityViewError, ActiveBadge, LocalePreviewTabs, FaqPreview,
  hasText, localeHasField, faqHasLocale, rawLocale, strictText, getImageUrl,
  type MatrixRow, type ReadinessItem,
} from '@/components/admin/entityView';

const EDIT_PATH = '/admin/destinations/new?id=';
const LIST_PATH = '/admin/destinations';

export default function DestinationViewPage() {
  const { id } = useParams<{ id: string }>();
  const { entity, loading, error } = useEntity(destinationAPI.getById, id, 'Destination not found');
  const [previewLocale, setPreviewLocale] = useState<SupportedLocale>('en');

  if (loading) return <AdminPageSkeleton />;
  if (error || !entity) return <EntityViewError error={error} backHref={LIST_PATH} />;

  const title = getLocalizedValue(entity.name) || '(untitled)';
  const isActive = entity.isActive !== false;
  const socialImageUrl = entity.ogImage || getImageUrl(entity.metaImage);
  const coverUrl = getImageUrl(entity.coverImage);
  const faqs: any[] = Array.isArray(entity.faqs) ? entity.faqs : [];

  const matrixRows: MatrixRow[] = [
    { label: 'Name', has: (l) => localeHasField(entity.name, l) },
    { label: 'Subheader', has: (l) => localeHasField(entity.subheader, l) },
    { label: 'Description', has: (l) => localeHasField(entity.description, l) },
    { label: 'Hero', has: (l) => localeHasField(entity.heroTitle, l) || localeHasField(entity.heroDescription, l) },
    { label: 'At a glance', has: (l) => localeHasField(entity.bestFor, l) || localeHasField(entity.timeNeeded, l) || localeHasField(entity.bestSeason, l) },
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
  const glanceRows: { label: string; value: string }[] = [
    { label: 'Region', value: strictText(entity.region, previewLocale) },
    { label: 'Best for', value: strictText(entity.bestFor, previewLocale) },
    { label: 'Combines with', value: strictText(entity.combinesWith, previewLocale) },
    { label: 'Time needed', value: strictText(entity.timeNeeded, previewLocale) },
    { label: 'Best season', value: strictText(entity.bestSeason, previewLocale) },
  ].filter((r) => r.value);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title flex items-center gap-3 flex-wrap">
            <span>{title}</span>
            <ActiveBadge active={isActive} />
          </h1>
          <p className="admin-page-subtitle flex items-center gap-2"><span>Destination · read-only</span><LanguageBadges entity={entity} /></p>
        </div>
        <div className="header-actions">
          <EditEntityButton href={`${EDIT_PATH}${id}`} resource="blog" />
          <Link href={LIST_PATH} className="btn-refresh inline-flex items-center gap-1"><ArrowLeft size={16} /> Back</Link>
        </div>
      </div>

      <LiveUrlPreview slug={entity.slug} live={isActive} warning={<>This destination is <b>inactive</b> — its live URLs return 404 until it is activated.</>} />

      <TranslationMatrix rows={matrixRows} />

      <Section title="At a glance" icon={<Info size={14} />}>
        <div className="detail-grid">
          <Field label="Active">{isActive ? 'Yes' : 'No'}</Field>
          <Field label="Region">{getLocalizedValue(entity.region) || '—'}</Field>
          <Field label="Time needed">{getLocalizedValue(entity.timeNeeded) || '—'}</Field>
          <Field label="FAQs">{faqs.length}</Field>
        </div>
      </Section>

      {coverUrl && (
        <Section title="Cover image" icon={<FileText size={14} />}>
          <div className="max-w-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt={getLocalizedValue((entity.coverImage as any)?.alt) || title} className="w-full rounded-lg border border-gray-200 dark:border-slate-700" />
          </div>
        </Section>
      )}

      <Section title="Content preview" icon={<FileText size={14} />}>
        <LocalePreviewTabs value={previewLocale} onChange={setPreviewLocale} />
        <div className="space-y-5">
          {strictText(entity.subheader, previewLocale) && (
            <div><label className="text-[11px] uppercase font-bold text-gray-400">Subheader</label><p className="text-[15px] text-gray-700 dark:text-gray-200 m-0">{strictText(entity.subheader, previewLocale)}</p></div>
          )}
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
          {glanceRows.length > 0 && (
            <div><label className="text-[11px] uppercase font-bold text-gray-400">At a glance</label>
              <div className="detail-grid mt-2">
                {glanceRows.map((r) => <Field key={r.label} label={r.label}>{r.value}</Field>)}
              </div>
            </div>
          )}
          <FaqPreview faqs={faqs} locale={previewLocale} />
        </div>
      </Section>

      <SeoHealthPanel
        seo={entity}
        readiness={readiness}
        showOg
        showIndexing
        socialImageUrl={socialImageUrl}
        readyLabels={{ ready: 'Ready to go live', notReady: 'Not ready to go live' }}
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
          <Field label="Related destinations">{Array.isArray(entity.relatedDestinations) && entity.relatedDestinations.length ? `${entity.relatedDestinations.length} linked` : '—'}</Field>
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
