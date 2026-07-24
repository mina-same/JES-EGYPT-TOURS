'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Eye, EyeOff, ArrowRight, ChevronLeft, ChevronRight, AlertTriangle, X, Loader2, Info, Search, Tag, Clock, FileText, Star } from 'lucide-react';
import { tourSubcategoryAPI, tourAPI } from '@/lib/api/tour';
import { getLocalizedValue } from '@/lib/localize';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import LanguageBadges from '@/components/admin/LanguageBadges';
import { useToast } from '@/hooks/use-toast';
import { getStrictLocalizedSlug, type SupportedLocale } from '@/lib/url';
import {
  Section, Field, LiveUrlPreview, TranslationMatrix, SeoHealthPanel,
  useEntity, EntityViewError, ActiveBadge, LocalePreviewTabs, FaqPreview, GalleryGroups,
  hasText, localeHasField, faqHasLocale, strictText, getImageUrl,
  type MatrixRow, type ReadinessItem,
} from '@/components/admin/entityView';

const EDIT_PATH = '/admin/tour/subcategory/new?id=';
const LIST_PATH = '/admin/tour/subcategory';
const TOURS_PAGE_SIZE = 8;

export default function TourSubcategoryViewPage() {
  const { id } = useParams<{ id: string }>();
  const { entity, loading, error, reload } = useEntity(tourSubcategoryAPI.getById, id, 'Tour subcategory not found');
  const { toast } = useToast();
  const [previewLocale, setPreviewLocale] = useState<SupportedLocale>('en');
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [toggleBusy, setToggleBusy] = useState(false);
  const [tours, setTours] = useState<any[]>([]);
  const [toursTotal, setToursTotal] = useState(0);
  const [toursPage, setToursPage] = useState(1);
  const [toursLoading, setToursLoading] = useState(true);
  const [toursError, setToursError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setToursLoading(true);
    setToursError(false);
    tourAPI.getAll({ subcategory: id, limit: TOURS_PAGE_SIZE, page: toursPage })
      .then((res: any) => {
        if (!active) return;
        if (res?.success && Array.isArray(res.data)) {
          setTours(res.data);
          setToursTotal(res.total ?? res.data.length);
        } else {
          setToursError(true);
        }
      })
      .catch(() => { if (active) setToursError(true); })
      .finally(() => { if (active) setToursLoading(false); });
    return () => { active = false; };
  }, [id, toursPage]);

  if (loading) return <AdminPageSkeleton />;
  if (error || !entity) return <EntityViewError error={error} backHref={LIST_PATH} />;

  const title = getLocalizedValue(entity.name) || '(untitled)';
  const isActive = entity.isActive !== false;

  const runToggle = async () => {
    setToggleBusy(true);
    try {
      const res = await tourSubcategoryAPI.toggleStatus(id);
      if (res?.success) {
        toast({ title: isActive ? 'Deactivated' : 'Activated', description: `This subcategory is now ${isActive ? 'inactive' : 'active'}.`, variant: 'success' } as any);
        setConfirmToggle(false);
        await reload();
      } else {
        toast({ title: 'Action failed', description: (res as any)?.error || 'Could not change status.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Action failed', description: e?.response?.data?.error || e?.message || 'Could not change status.', variant: 'destructive' });
    } finally {
      setToggleBusy(false);
    }
  };

  const seo = entity.seo ?? {};
  const socialImageUrl = getImageUrl(seo.metaImage);
  const sh = entity.sectionHeader || {};
  const bs = entity.bottomSection || {};
  const reviews: any[] = Array.isArray(entity.reviews) ? entity.reviews : [];
  const faqs: any[] = Array.isArray(entity.faqs) ? entity.faqs : [];
  const parentName = entity.category?.name ? getLocalizedValue(entity.category.name) : (typeof entity.category === 'string' ? entity.category : null);

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
          <p className="admin-page-subtitle flex items-center gap-2"><span>Tour subcategory{parentName ? ` · under ${parentName}` : ''} · read-only</span><LanguageBadges entity={entity} /></p>
        </div>
        <div className="header-actions">
          <button type="button" onClick={() => setConfirmToggle(true)} className="btn-refresh inline-flex items-center gap-1">
            {isActive ? <><EyeOff size={16} /> Deactivate</> : <><Eye size={16} /> Activate</>}
          </button>
          <Link href={`${EDIT_PATH}${id}`} className="inline-flex items-center gap-1 rounded-md bg-[#b79c5c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a68b4b] transition-colors"><Edit2 size={16} /> Edit</Link>
          <Link href={LIST_PATH} className="btn-refresh inline-flex items-center gap-1"><ArrowLeft size={16} /> Back</Link>
        </div>
      </div>

      <LiveUrlPreview slug={entity.slug} live={isActive} warning={<>This subcategory is <b>inactive</b> — its live URLs return 404 until it is activated.</>} />

      <TranslationMatrix rows={matrixRows} />

      <Section title="At a glance" icon={<Info size={14} />}>
        <div className="detail-grid">
          <Field label="Active">{isActive ? 'Yes' : 'No'}</Field>
          <Field label="Parent category">{parentName || '—'}</Field>
          <Field label="Tours">{toursLoading ? '…' : toursTotal}</Field>
          <Field label="FAQs">{faqs.length}</Field>
          <Field label="Curated reviews">{reviews.length}</Field>
          <Field label="Edit version">{entity.editVersion ?? '—'}</Field>
        </div>
      </Section>

      <Section title="Tours in this sub-category" icon={<FileText size={14} />}>
        {toursError ? (
          <p className="text-sm text-red-600 dark:text-red-400 m-0">Could not load tours for this sub-category. Try refreshing the page.</p>
        ) : toursLoading && tours.length === 0 ? (
          <p className="text-sm text-gray-500 m-0">Loading tours…</p>
        ) : tours.length === 0 ? (
          <p className="text-sm text-gray-500 m-0">No tours are assigned to this sub-category yet.</p>
        ) : (
          <>
            <div className={`overflow-x-auto${toursLoading ? ' opacity-50 transition-opacity' : ''}`}>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left font-medium text-gray-400 text-xs uppercase py-2 pr-4">Tour</th>
                    <th className="text-left font-medium text-gray-400 text-xs uppercase py-2 px-3">Status</th>
                    <th className="text-left font-medium text-gray-400 text-xs uppercase py-2 px-3">Updated</th>
                    <th className="text-right font-medium text-gray-400 text-xs uppercase py-2 pl-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tours.map((t) => {
                    const scheduled = !t.isActive && !!t.scheduledAt;
                    return (
                      <tr key={t._id} className="border-t border-gray-100 dark:border-slate-800">
                        <td className="py-2 pr-4 text-gray-800 dark:text-gray-200">{getLocalizedValue(t.heading) || getLocalizedValue(t.name) || '(untitled)'}</td>
                        <td className="py-2 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${t.isActive ? 'bg-green-100 text-green-800' : scheduled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>{t.isActive ? 'Active' : scheduled ? 'Scheduled' : 'Inactive'}</span>
                        </td>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : '—'}</td>
                        <td className="py-2 pl-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/tour/tour/${t._id}/view`} className="p-1.5 text-gray-400 hover:text-[#b79c5c] rounded-md transition-colors" title="View"><Eye size={15} /></Link>
                            <Link href={`/admin/tour/tour/${t._id}/edit`} className="p-1.5 text-gray-400 hover:text-[#b79c5c] rounded-md transition-colors" title="Edit"><Edit2 size={15} /></Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap mt-3">
              <Link href={`/admin/tour/tour?subcategory=${id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#b79c5c] hover:underline">
                Manage all {toursTotal} tour{toursTotal === 1 ? '' : 's'} <ArrowRight size={15} />
              </Link>
              {toursTotal > TOURS_PAGE_SIZE && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {(toursPage - 1) * TOURS_PAGE_SIZE + 1}–{Math.min((toursPage - 1) * TOURS_PAGE_SIZE + tours.length, toursTotal)} of {toursTotal}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setToursPage((p) => Math.max(1, p - 1))}
                      disabled={toursPage <= 1 || toursLoading}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-slate-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:border-[#b79c5c] hover:text-[#b79c5c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => setToursPage((p) => (p * TOURS_PAGE_SIZE < toursTotal ? p + 1 : p))}
                      disabled={toursPage * TOURS_PAGE_SIZE >= toursTotal || toursLoading}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-slate-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:border-[#b79c5c] hover:text-[#b79c5c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
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
          <Field label="Parent category">{parentName || '—'}</Field>
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

      {confirmToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !toggleBusy && setConfirmToggle(false)}>
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 shadow-2xl border dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b dark:border-slate-800 p-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                {isActive ? 'Deactivate this subcategory?' : 'Activate this subcategory?'}
              </h3>
              <button type="button" onClick={() => !toggleBusy && setConfirmToggle(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-4 text-sm text-gray-600 dark:text-gray-300">
              {isActive ? (
                <p className="m-0">This hides the subcategory from the live site — its language URLs will return <b>404</b> until it is activated again.</p>
              ) : (
                <p className="m-0">This makes the subcategory <b>publicly visible</b> — its language URLs will start resolving for visitors.</p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t dark:border-slate-800 p-4">
              <button type="button" onClick={() => setConfirmToggle(false)} disabled={toggleBusy} className="btn-refresh">Cancel</button>
              <button type="button" onClick={runToggle} disabled={toggleBusy} className="inline-flex items-center gap-1 rounded-md bg-[#b79c5c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a68b4b] disabled:opacity-50">
                {toggleBusy ? <Loader2 size={16} className="animate-spin" /> : (isActive ? <EyeOff size={16} /> : <Eye size={16} />)}
                {isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
