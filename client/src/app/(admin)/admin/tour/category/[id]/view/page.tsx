'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Info, Search, Tag, Clock, FileText, Star } from 'lucide-react';
import { tourCategoryAPI } from '@/lib/api/tour';
import { getLocalizedValue } from '@/lib/localize';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import LanguageBadges from '@/components/admin/LanguageBadges';
import { InternalLinksAudit } from '@/components/admin/InternalLinksAudit';
import { getStrictLocalizedSlug, type SupportedLocale } from '@/lib/url';
import {
  Section, Field, LiveUrlPreview, TranslationMatrix, SeoHealthPanel,
  useEntity, EditEntityButton, EntityViewError, ActiveBadge, LocalePreviewTabs, FaqPreview, GalleryGroups,
  hasText, localeHasField, faqHasLocale, strictText, getImageUrl,
  type MatrixRow, type ReadinessItem,
} from '@/components/admin/entityView';

const EDIT_PATH = '/admin/tour/category/new?id=';
const LIST_PATH = '/admin/tour/category';

export default function TourCategoryViewPage() {
  const { id } = useParams<{ id: string }>();
  const { entity, loading, error } = useEntity(tourCategoryAPI.getById, id, 'Tour category not found');
  const [previewLocale, setPreviewLocale] = useState<SupportedLocale>('en');

  if (loading) return <AdminPageSkeleton />;
  if (error || !entity) return <EntityViewError error={error} backHref={LIST_PATH} />;

  const title = getLocalizedValue(entity.name) || '(untitled)';
  const isActive = entity.isActive !== false;
  const seo = entity.seo ?? {};
  const socialImageUrl = getImageUrl(seo.metaImage);
  const sh = entity.sectionHeader || {};
  const bs = entity.bottomSection || {};
  const reviews: any[] = Array.isArray(entity.reviews) ? entity.reviews : [];
  const faqs: any[] = Array.isArray(entity.faqs) ? entity.faqs : [];

  const matrixRows: MatrixRow[] = [
    { label: 'Name', has: (l) => localeHasField(entity.name, l) },
    { label: 'Description', has: (l) => localeHasField(entity.description, l) },
    { label: 'Section header', has: (l) => localeHasField(sh.title, l) || localeHasField(sh.description, l) },
    { label: 'Section titles', has: (l) => localeHasField(entity.toursSectionTitle, l) || localeHasField(entity.faqsSectionTitle, l) },
    { label: 'FAQs', has: (l) => faqHasLocale(entity.faqs, l) },
  ];

  const readiness: ReadinessItem[] = [
    { label: 'Name (EN)', ok: hasText(strictText(entity.name, 'en')), required: true },
    { label: 'Slug (EN)', ok: !!getStrictLocalizedSlug(entity.slug, 'en'), required: true },
    { label: 'Meta title (EN)', ok: hasText(strictText(seo.metaTitle, 'en')), required: false },
    { label: 'Meta description (EN)', ok: hasText(strictText(seo.metaDescription, 'en')), required: false },
    { label: 'SEO image', ok: !!socialImageUrl, required: false },
  ];

  const galleries: { label: string; items: any[] }[] = [
    { label: 'Images', items: Array.isArray(entity.images) ? entity.images.filter((i: any) => i?.url) : [] },
    { label: 'Gallery', items: Array.isArray(entity.gallery) ? entity.gallery.filter((i: any) => i?.url) : [] },
    { label: 'Header images', items: Array.isArray(sh.images) ? sh.images.filter((i: any) => i?.url) : [] },
  ].filter((g) => g.items.length);

  const descHtml = strictText(entity.description, previewLocale);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title flex items-center gap-3 flex-wrap">
            <span>{title}</span>
            <ActiveBadge active={isActive} />
          </h1>
          <p className="admin-page-subtitle flex items-center gap-2"><span>Tour category · read-only</span><LanguageBadges entity={entity} /></p>
        </div>
        <div className="header-actions">
          <EditEntityButton href={`${EDIT_PATH}${id}`} resource="tour" />
          <Link href={LIST_PATH} className="btn-refresh inline-flex items-center gap-1"><ArrowLeft size={16} /> Back</Link>
        </div>
      </div>

      <LiveUrlPreview slug={entity.slug} live={isActive} warning={<>This category is <b>inactive</b> — its live URLs return 404 until it is activated.</>} />

      <TranslationMatrix rows={matrixRows} />

      <InternalLinksAudit entity={entity} />

      <Section title="At a glance" icon={<Info size={14} />}>
        <div className="detail-grid">
          <Field label="Active">{isActive ? 'Yes' : 'No'}</Field>
          <Field label="Subcategories">{entity.subcategoriesCount ?? '—'}</Field>
          <Field label="FAQs">{faqs.length}</Field>
          <Field label="Curated reviews">{reviews.length}</Field>
          <Field label="Edit version">{entity.editVersion ?? '—'}</Field>
        </div>
      </Section>

      <GalleryGroups galleries={galleries} locale={previewLocale} />

      <Section title="Content preview" icon={<FileText size={14} />}>
        <LocalePreviewTabs value={previewLocale} onChange={setPreviewLocale} />
        <div className="space-y-5">
          {descHtml && (
            <div><label className="text-[11px] uppercase font-bold text-gray-400">Description</label>
              <div className="html-content text-[15px] text-gray-700 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: descHtml }} />
            </div>
          )}
          {(strictText(sh.title, previewLocale) || strictText(sh.description, previewLocale)) && (
            <div><label className="text-[11px] uppercase font-bold text-gray-400">Section header</label>
              {strictText(sh.title, previewLocale) && <div className="font-semibold text-gray-900 dark:text-white">{strictText(sh.title, previewLocale)}</div>}
              {strictText(sh.description, previewLocale) && <div className="html-content text-[15px] text-gray-600 dark:text-gray-300 mt-1" dangerouslySetInnerHTML={{ __html: strictText(sh.description, previewLocale) }} />}
            </div>
          )}
          {(strictText(bs.title, previewLocale) || strictText(bs.description, previewLocale)) && (
            <div><label className="text-[11px] uppercase font-bold text-gray-400">Bottom section</label>
              {strictText(bs.title, previewLocale) && <div className="font-semibold text-gray-900 dark:text-white">{strictText(bs.title, previewLocale)}</div>}
              {strictText(bs.description, previewLocale) && <div className="html-content text-[15px] text-gray-600 dark:text-gray-300 mt-1" dangerouslySetInnerHTML={{ __html: strictText(bs.description, previewLocale) }} />}
            </div>
          )}
          <FaqPreview faqs={faqs} locale={previewLocale} />
          {reviews.length > 0 && (
            <div className="space-y-2"><label className="text-[11px] uppercase font-bold text-gray-400">Curated reviews</label>
              {reviews.map((r, i) => (
                <div key={i} className="rounded-lg border border-gray-100 dark:border-slate-800 p-3">
                  <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                    {getLocalizedValue(r.name) || 'Anonymous'}
                    {typeof r.rating === 'number' && <span className="inline-flex items-center gap-0.5 text-yellow-600 text-xs"><Star size={12} /> {r.rating}</span>}
                  </div>
                  {strictText(r.comment, previewLocale) && <div className="text-[15px] text-gray-600 dark:text-gray-300 mt-1">{strictText(r.comment, previewLocale)}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      <SeoHealthPanel
        seo={seo}
        readiness={readiness}
        socialImageUrl={socialImageUrl}
        readyLabels={{ ready: 'Ready to go live', notReady: 'Not ready to go live' }}
      />

      <Section title="SEO" icon={<Search size={14} />}>
        <div className="detail-grid">
          <Field label="Meta title (EN)">{getLocalizedValue(seo.metaTitle) || '—'}</Field>
          <Field label="Meta description (EN)">{getLocalizedValue(seo.metaDescription) || '—'}</Field>
          <Field label="Meta keywords (EN)">{Array.isArray(seo.metaKeywords?.en) ? seo.metaKeywords.en.join(', ') || '—' : '—'}</Field>
          <Field label="SEO image">{getImageUrl(seo.metaImage) || '—'}</Field>
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
