'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Info, Search, Tag, Clock, FileText, Star, MapPin, Calendar } from 'lucide-react';
import { tourAPI } from '@/lib/api/tour';
import { getLocalizedValue } from '@/lib/localize';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import LanguageBadges from '@/components/admin/LanguageBadges';
import { getStrictLocalizedSlug, type SupportedLocale } from '@/lib/url';
import {
  Section, Field, LiveUrlPreview, TranslationMatrix, SeoHealthPanel,
  useEntity, EditEntityButton, EntityViewError, ActiveBadge, LocalePreviewTabs, FaqPreview, GalleryGroups,
  hasText, localeHasField, faqHasLocale, strictText, getImageUrl,
  type MatrixRow, type ReadinessItem,
} from '@/components/admin/entityView';

const EDIT_PATH = '/admin/tour/tour/';
const LIST_PATH = '/admin/tour/tour';

function money(prices: any): string {
  if (!prices || typeof prices !== 'object') return '—';
  const parts = ['USD', 'EUR', 'GBP'].filter((c) => prices[c] != null).map((c) => `${c} ${prices[c]}`);
  return parts.length ? parts.join(' · ') : '—';
}

export default function TourViewPage() {
  const { id } = useParams<{ id: string }>();
  const { entity, loading, error } = useEntity(tourAPI.getById, id, 'Tour not found');
  const [previewLocale, setPreviewLocale] = useState<SupportedLocale>('en');

  if (loading) return <AdminPageSkeleton />;
  if (error || !entity) return <EntityViewError error={error} backHref={LIST_PATH} />;

  const title = getLocalizedValue(entity.heading) || entity.name || '(untitled)';
  const isActive = entity.isActive !== false;
  const scheduled = !isActive && !!entity.scheduledAt;
  const seo = entity.seo ?? {};
  const socialImageUrl = getImageUrl(seo.metaImage);
  const days: any[] = Array.isArray(entity.itinerary?.days) ? entity.itinerary.days : [];
  const plans: any[] = Array.isArray(entity.pricingPlans) ? entity.pricingPlans : [];
  const faqs: any[] = Array.isArray(entity.faqs) ? entity.faqs : [];
  const notes: any[] = Array.isArray(entity.notes) ? entity.notes : [];
  const reviews: any[] = Array.isArray(entity.reviews) ? entity.reviews : [];
  const subName = entity.subcategory?.name ? getLocalizedValue(entity.subcategory.name) : null;
  const parentName = entity.subcategory?.category?.name ? getLocalizedValue(entity.subcategory.category.name) : null;

  const matrixRows: MatrixRow[] = [
    { label: 'Heading', has: (l) => localeHasField(entity.heading, l) },
    { label: 'Overview', has: (l) => localeHasField(entity.Description?.text, l) },
    { label: 'Highlights', has: (l) => localeHasField(entity.tourHighlights, l) },
    { label: 'Inclusions / Exclusions', has: (l) => localeHasField(entity.inclusion, l) || localeHasField(entity.exclusion, l) },
    { label: 'Itinerary', has: (l) => days.some((d) => localeHasField(d?.title, l) || localeHasField(d?.description, l)) },
    { label: 'FAQs', has: (l) => faqHasLocale(entity.faqs, l) },
  ];

  const readiness: ReadinessItem[] = [
    { label: 'Heading (EN)', ok: hasText(strictText(entity.heading, 'en')), required: true },
    { label: 'Slug (EN)', ok: !!getStrictLocalizedSlug(entity.slug, 'en'), required: true },
    { label: 'Images', ok: Array.isArray(entity.images) && entity.images.some((i: any) => i?.url), required: true },
    { label: 'Meta title (EN)', ok: hasText(strictText(seo.metaTitle, 'en')), required: false },
    { label: 'Meta description (EN)', ok: hasText(strictText(seo.metaDescription, 'en')), required: false },
    { label: 'SEO image', ok: !!socialImageUrl, required: false },
  ];

  const galleries: { label: string; items: any[] }[] = [
    { label: 'Main images', items: Array.isArray(entity.images) ? entity.images.filter((i: any) => i?.url) : [] },
    { label: 'Gallery', items: Array.isArray(entity.gallery) ? entity.gallery.filter((i: any) => i?.url) : [] },
  ].filter((g) => g.items.length);

  const htmlBlocks: { label: string; html: string }[] = [
    { label: 'Overview', html: strictText(entity.Description?.text, previewLocale) },
    { label: 'Highlights', html: strictText(entity.tourHighlights, previewLocale) },
    { label: 'Inclusions', html: strictText(entity.inclusion, previewLocale) },
    { label: 'Exclusions', html: strictText(entity.exclusion, previewLocale) },
    { label: 'What to pack', html: strictText(entity.whatToPack, previewLocale) },
    { label: 'What you will love', html: strictText(entity.whatYouWillLoveHtml, previewLocale) },
  ].filter((b) => hasText(b.html));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title flex items-center gap-3 flex-wrap">
            <span>{title}</span>
            {scheduled ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"><Calendar size={12} /> Scheduled</span>
            ) : (
              <ActiveBadge active={isActive} />
            )}
            {entity.isFeatured && <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-800"><Star size={10} /> Featured</span>}
            {entity.isSpecialOffer && <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-800">Special offer</span>}
          </h1>
          <p className="admin-page-subtitle flex items-center gap-2"><span>Tour{subName ? ` · ${parentName ? parentName + ' / ' : ''}${subName}` : ''} · read-only</span><LanguageBadges entity={entity} /></p>
        </div>
        <div className="header-actions">
          <EditEntityButton href={`${EDIT_PATH}${id}/edit`} resource="tour" />
          <Link href={LIST_PATH} className="btn-refresh inline-flex items-center gap-1"><ArrowLeft size={16} /> Back</Link>
        </div>
      </div>

      <LiveUrlPreview slug={entity.slug} live={isActive} warning={scheduled ? <>This tour is <b>scheduled</b> — its live URLs return 404 until it goes live{entity.scheduledAt ? ` (${new Date(entity.scheduledAt).toLocaleString()})` : ''}.</> : <>This tour is <b>inactive</b> — its live URLs return 404 until it is activated.</>} />

      <TranslationMatrix rows={matrixRows} />

      <Section title="At a glance" icon={<Info size={14} />}>
        <div className="detail-grid">
          <Field label="Status">{isActive ? 'Active' : scheduled ? 'Scheduled' : 'Inactive'}</Field>
          {scheduled && <Field label="Scheduled for">{new Date(entity.scheduledAt).toLocaleString()}</Field>}
          <Field label="Duration">{getLocalizedValue(entity.duration) || '—'}</Field>
          <Field label="Location">{getLocalizedValue(entity.tourLocation) || '—'}</Field>
          <Field label="Price from">{money(entity.priceStartingFrom)}</Field>
          <Field label="Itinerary days">{days.length}</Field>
          <Field label="Pricing plans">{plans.length}</Field>
          {entity.isSpecialOffer && <Field label="Offer discount">{entity.specialOfferDiscount != null ? `${entity.specialOfferDiscount}%` : '—'}</Field>}
        </div>
      </Section>

      <GalleryGroups galleries={galleries} locale={previewLocale} />

      <Section title="Content preview" icon={<FileText size={14} />}>
        <LocalePreviewTabs value={previewLocale} onChange={setPreviewLocale} />
        <div className="space-y-5">
          {strictText(entity.headingDescription, previewLocale) && (
            <div><label className="text-[11px] uppercase font-bold text-gray-400">Heading description</label><p className="text-[15px] text-gray-700 dark:text-gray-200 m-0">{strictText(entity.headingDescription, previewLocale)}</p></div>
          )}
          {strictText(entity.cardDescription, previewLocale) && (
            <div><label className="text-[11px] uppercase font-bold text-gray-400">Card description</label><p className="text-[15px] text-gray-700 dark:text-gray-200 m-0">{strictText(entity.cardDescription, previewLocale)}</p></div>
          )}
          {htmlBlocks.map((b) => (
            <div key={b.label}>
              <label className="text-[11px] uppercase font-bold text-gray-400">{b.label}</label>
              <div className="html-content text-[15px] text-gray-700 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: b.html }} />
            </div>
          ))}

          {days.length > 0 && (
            <div className="space-y-2"><label className="text-[11px] uppercase font-bold text-gray-400">Itinerary</label>
              {days.map((d, i) => (
                <div key={i} className="rounded-lg border border-gray-100 dark:border-slate-800 p-3">
                  <div className="font-semibold text-gray-900 dark:text-white">Day {d.day ?? i + 1}: {strictText(d.title, previewLocale) || `(no ${previewLocale.toUpperCase()} title)`}</div>
                  {strictText(d.description, previewLocale) && <div className="html-content text-[15px] text-gray-600 dark:text-gray-300 mt-1" dangerouslySetInnerHTML={{ __html: strictText(d.description, previewLocale) }} />}
                  {Array.isArray(d.activities) && d.activities.length > 0 && (
                    <ul className="list-disc pl-5 text-[14px] text-gray-500 dark:text-gray-400 mt-2 space-y-0.5">
                      {d.activities.map((a: any, j: number) => <li key={j}>{strictText(a.heading, previewLocale) || strictText(a.description, previewLocale) || '(activity)'}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {plans.length > 0 && (
            <div className="space-y-2"><label className="text-[11px] uppercase font-bold text-gray-400">Pricing plans</label>
              {plans.map((p, i) => (
                <div key={i} className="rounded-lg border border-gray-100 dark:border-slate-800 p-3">
                  <div className="font-semibold text-gray-900 dark:text-white">{p.planName || `Plan ${i + 1}`}</div>
                  {Array.isArray(p.seasons) && p.seasons.length > 0 && (
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-sm border-collapse">
                        <thead><tr>
                          <th className="text-left text-xs uppercase text-gray-400 py-1 pr-3">Season</th>
                          <th className="text-left text-xs uppercase text-gray-400 py-1 px-3">Solo</th>
                          <th className="text-left text-xs uppercase text-gray-400 py-1 px-3">2–4</th>
                          <th className="text-left text-xs uppercase text-gray-400 py-1 px-3">5–8</th>
                          <th className="text-left text-xs uppercase text-gray-400 py-1 px-3">9–16</th>
                        </tr></thead>
                        <tbody>
                          {p.seasons.map((s: any, j: number) => (
                            <tr key={j} className="border-t border-gray-100 dark:border-slate-800">
                              <td className="py-1 pr-3 text-gray-700 dark:text-gray-300">{s.seasonName || '—'}</td>
                              <td className="py-1 px-3 text-gray-600 dark:text-gray-400">{money(s.prices?.solo)}</td>
                              <td className="py-1 px-3 text-gray-600 dark:text-gray-400">{money(s.prices?.pax_2_4)}</td>
                              <td className="py-1 px-3 text-gray-600 dark:text-gray-400">{money(s.prices?.pax_5_8)}</td>
                              <td className="py-1 px-3 text-gray-600 dark:text-gray-400">{money(s.prices?.pax_9_16)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {notes.length > 0 && (
            <div className="space-y-2"><label className="text-[11px] uppercase font-bold text-gray-400">Notes</label>
              {notes.map((n, i) => (
                <div key={i} className="rounded-lg border border-gray-100 dark:border-slate-800 p-3">
                  {strictText(n.title, previewLocale) && <div className="font-semibold text-gray-900 dark:text-white">{strictText(n.title, previewLocale)}</div>}
                  {strictText(n.text, previewLocale) && <div className="text-[15px] text-gray-600 dark:text-gray-300 mt-1">{strictText(n.text, previewLocale)}</div>}
                </div>
              ))}
            </div>
          )}

          <FaqPreview faqs={faqs} locale={previewLocale} />

          {reviews.length > 0 && (
            <div className="space-y-2"><label className="text-[11px] uppercase font-bold text-gray-400">Reviews</label>
              {reviews.map((r, i) => (
                <div key={i} className="rounded-lg border border-gray-100 dark:border-slate-800 p-3 text-[15px]">
                  <div className="font-semibold text-gray-900 dark:text-white">{getLocalizedValue(r.title) || `Review ${i + 1}`}</div>
                  {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[#b79c5c] hover:underline break-all text-sm">{r.url}</a>}
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
          <Field label="Subcategory"><span className="inline-flex items-center gap-1"><MapPin size={13} className="text-gray-400" />{subName || '—'}</span></Field>
          <Field label="Parent category">{parentName || '—'}</Field>
          <Field label="Related tours">{Array.isArray(entity.relatedTours) && entity.relatedTours.length ? `${entity.relatedTours.length} linked` : '—'}</Field>
          <Field label="Blog references">{Array.isArray(entity.blogReferences) && entity.blogReferences.length ? `${entity.blogReferences.length} linked` : '—'}</Field>
          <Field label="Tags (EN)">{Array.isArray(entity.tags) && entity.tags.length ? entity.tags.map((t: any) => getLocalizedValue(t)).filter(Boolean).join(', ') || '—' : '—'}</Field>
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
