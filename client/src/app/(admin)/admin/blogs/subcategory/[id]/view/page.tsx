'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Eye, ArrowRight, ChevronLeft, ChevronRight, Info, Search, Tag, Clock, FileText } from 'lucide-react';
import { blogSubcategoryAPI, blogAPI } from '@/lib/api/blogAdmin';
import { getLocalizedValue } from '@/lib/localize';
import { normalizeAmenityItems } from '@/lib/normalizeAmenityItems';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import LanguageBadges from '@/components/admin/LanguageBadges';
import { getStrictLocalizedSlug, type SupportedLocale } from '@/lib/url';
import {
  Section, Field, LiveUrlPreview, TranslationMatrix, SeoHealthPanel,
  useEntity, EntityViewError, ActiveBadge, LocalePreviewTabs, FaqPreview,
  hasText, localeHasField, faqHasLocale, rawLocale, strictText, getImageUrl,
  type MatrixRow, type ReadinessItem,
} from '@/components/admin/entityView';

const EDIT_PATH = '/admin/blogs/subcategory/new?id=';
const LIST_PATH = '/admin/blogs/subcategory';
const ARTICLES_PAGE_SIZE = 8;

export default function BlogSubcategoryViewPage() {
  const { id } = useParams<{ id: string }>();
  const { entity, loading, error } = useEntity(blogSubcategoryAPI.getById, id, 'Blog subcategory not found');
  const [previewLocale, setPreviewLocale] = useState<SupportedLocale>('en');
  const [articles, setArticles] = useState<any[]>([]);
  const [articlesTotal, setArticlesTotal] = useState(0);
  const [articlesPage, setArticlesPage] = useState(1);
  const [articlesLoading, setArticlesLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setArticlesLoading(true);
    blogAPI.getAllAdmin({ subCategory: id, limit: ARTICLES_PAGE_SIZE, page: articlesPage })
      .then((res: any) => {
        if (!active) return;
        if (res?.success && Array.isArray(res.data)) {
          setArticles(res.data);
          setArticlesTotal(res.pagination?.total ?? res.data.length);
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setArticlesLoading(false); });
    return () => { active = false; };
  }, [id, articlesPage]);

  if (loading) return <AdminPageSkeleton />;
  if (error || !entity) return <EntityViewError error={error} backHref={LIST_PATH} />;

  const title = getLocalizedValue(entity.name) || '(untitled)';
  const isActive = entity.isActive !== false;
  const socialImageUrl = entity.ogImage || getImageUrl(entity.metaImage);
  const parentName = entity.category?.name ? getLocalizedValue(entity.category.name) : (typeof entity.category === 'string' ? entity.category : null);

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
  const breadcrumbs: any[] = Array.isArray(entity.breadcrumbs) ? entity.breadcrumbs : [];
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
            {entity.icon && <span>{entity.icon}</span>}
            <span>{title}</span>
            <ActiveBadge active={isActive} />
          </h1>
          <p className="admin-page-subtitle flex items-center gap-2">
            <span>Blog subcategory{parentName ? ` · under ${parentName}` : ''} · read-only</span>
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

      <LiveUrlPreview slug={entity.slug} live={isActive} warning={<>This subcategory is <b>inactive</b> — its live URLs return 404 until it is activated.</>} />

      <TranslationMatrix rows={matrixRows} />

      <Section title="At a glance" icon={<Info size={14} />}>
        <div className="detail-grid">
          <Field label="Active">{isActive ? 'Yes' : 'No'}</Field>
          <Field label="Parent category">{parentName || '—'}</Field>
          <Field label="Articles">{articlesLoading ? '…' : articlesTotal}</Field>
          <Field label="Icon">{entity.icon || '—'}</Field>
          <Field label="Features">{features.length}</Field>
          <Field label="FAQs">{faqs.length}</Field>
          <Field label="Edit version">{entity.editVersion ?? '—'}</Field>
        </div>
      </Section>

      <Section title="Articles in this sub-category" icon={<FileText size={14} />}>
        {articlesLoading && articles.length === 0 ? (
          <p className="text-sm text-gray-500 m-0">Loading articles…</p>
        ) : articles.length === 0 ? (
          <p className="text-sm text-gray-500 m-0">No articles are assigned to this sub-category yet.</p>
        ) : (
          <>
            <div className={`overflow-x-auto${articlesLoading ? ' opacity-50 transition-opacity' : ''}`}>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left font-medium text-gray-400 text-xs uppercase py-2 pr-4">Article</th>
                    <th className="text-left font-medium text-gray-400 text-xs uppercase py-2 px-3">Status</th>
                    <th className="text-left font-medium text-gray-400 text-xs uppercase py-2 px-3">Updated</th>
                    <th className="text-right font-medium text-gray-400 text-xs uppercase py-2 pl-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((a) => (
                    <tr key={a._id} className="border-t border-gray-100 dark:border-slate-800">
                      <td className="py-2 pr-4 text-gray-800 dark:text-gray-200">{getLocalizedValue(a.title) || '(untitled)'}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${a.status === 'published' ? 'bg-green-100 text-green-800' : a.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>{a.status}</span>
                      </td>
                      <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : '—'}</td>
                      <td className="py-2 pl-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/blogs/blog/${a._id}/view`} className="p-1.5 text-gray-400 hover:text-[#b79c5c] rounded-md transition-colors" title="View"><Eye size={15} /></Link>
                          <Link href={`/admin/blogs/blog/${a._id}/edit`} className="p-1.5 text-gray-400 hover:text-[#b79c5c] rounded-md transition-colors" title="Edit"><Edit2 size={15} /></Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap mt-3">
              <Link href={`/admin/blogs/blog?subCategory=${id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#b79c5c] hover:underline">
                Manage all {articlesTotal} article{articlesTotal === 1 ? '' : 's'} <ArrowRight size={15} />
              </Link>
              {articlesTotal > ARTICLES_PAGE_SIZE && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {(articlesPage - 1) * ARTICLES_PAGE_SIZE + 1}–{Math.min((articlesPage - 1) * ARTICLES_PAGE_SIZE + articles.length, articlesTotal)} of {articlesTotal}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setArticlesPage((p) => Math.max(1, p - 1))}
                      disabled={articlesPage <= 1 || articlesLoading}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-slate-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:border-[#b79c5c] hover:text-[#b79c5c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => setArticlesPage((p) => (p * ARTICLES_PAGE_SIZE < articlesTotal ? p + 1 : p))}
                      disabled={articlesPage * ARTICLES_PAGE_SIZE >= articlesTotal || articlesLoading}
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
        <LocalePreviewTabs value={previewLocale} onChange={setPreviewLocale} />
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
          {breadcrumbs.length > 0 && (
            <div><label className="text-[11px] uppercase font-bold text-gray-400">Breadcrumbs</label>
              <div className="flex items-center gap-1.5 flex-wrap text-[14px] text-gray-600 dark:text-gray-300 mt-1">
                {breadcrumbs.map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5">
                    {i > 0 && <span className="text-gray-300">/</span>}
                    <span>{getLocalizedValue(b.name) || '(unnamed)'}</span>
                  </span>
                ))}
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
    </div>
  );
}
