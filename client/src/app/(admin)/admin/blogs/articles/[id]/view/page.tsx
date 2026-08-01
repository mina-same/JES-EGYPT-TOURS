'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, FileText,
  Star, Info, Search, Tag, MapPin, Clock,
} from 'lucide-react';
import { blogAPI } from '@/lib/api/blogAdmin';
import { getLocalizedValue } from '@/lib/localize';
import { getStrictLocalizedSlug, type SupportedLocale } from '@/lib/url';
import { normalizeAmenityItems } from '@/lib/normalizeAmenityItems';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import LanguageBadges from '@/components/admin/LanguageBadges';
import {
  Section, Field, LiveUrlPreview, TranslationMatrix, SeoHealthPanel,
  useEntity, EditEntityButton, EntityViewError, LocalePreviewTabs, FaqPreview,
  hasText, localeHasField, faqHasLocale, blocksHaveLocale, rawLocale, strictText, getImageUrl,
  type MatrixRow, type ReadinessItem,
} from '@/components/admin/entityView';

function statusBadgeClass(status?: string) {
  switch (status) {
    case 'published': return 'bg-green-100 text-green-800';
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export default function BlogViewPage() {
  const { id } = useParams<{ id: string }>();

  const { entity: blog, loading, error } = useEntity(blogAPI.getById, id, 'Blog post not found');
  const [previewLocale, setPreviewLocale] = useState<SupportedLocale>('en');

  if (loading) return <AdminPageSkeleton />;

  if (error || !blog) return <EntityViewError error={error} backHref="/admin/blogs/articles" backLabel="Back to Articles" />;

  const title = getLocalizedValue(blog.title) || '(untitled)';
  const isPublished = blog.status === 'published';
  const featuredUrl = getImageUrl(blog.featuredImage);
  const hasFeaturedImage = !!featuredUrl;

  const blockCount = Array.isArray(blog.contentBlocks) ? blog.contentBlocks.length : 0;
  const faqCount = Array.isArray(blog.faqs) ? blog.faqs.length : 0;
  const imageCount =
    (Array.isArray(blog.contentBlocks) ? blog.contentBlocks : []).reduce((n: number, b: any) => {
      if (b?.type === 'image' && (b.url || b.image)) return n + 1;
      if (b?.type === 'imageRow') return n + (Array.isArray(b.images) ? b.images.filter((im: any) => im?.url).length : 0);
      return n;
    }, 0);

  const matrixRows: MatrixRow[] = [
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

  const ogImageUrl = blog.ogImage || getImageUrl(blog.metaImage);
  const readiness: ReadinessItem[] = [
    { label: 'Featured image', ok: hasFeaturedImage, required: true },
    { label: 'Title (EN)', ok: hasText(strictText(blog.title, 'en')), required: true },
    { label: 'Slug (EN)', ok: !!getStrictLocalizedSlug(blog.slug, 'en'), required: true },
    { label: 'Meta title (EN)', ok: hasText(strictText(blog.metaTitle, 'en')), required: false },
    { label: 'Meta description (EN)', ok: hasText(strictText(blog.metaDescription, 'en')), required: false },
    { label: 'OG image', ok: !!ogImageUrl, required: false },
  ];

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
          <EditEntityButton href={`/admin/blogs/articles/${id}/edit`} resource="blog" />
          <Link href="/admin/blogs/articles" className="btn-refresh inline-flex items-center gap-1">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </div>

      <LiveUrlPreview
        slug={blog.slug}
        live={isPublished}
        warning={<>This article is <b>{blog.status}</b> — these live URLs return 404 until it is published{blog.status === 'scheduled' ? ` (goes live at ${blog.scheduledAt ? new Date(blog.scheduledAt).toLocaleString() : 'the scheduled time'})` : ''}.</>}
      />

      <TranslationMatrix rows={matrixRows} />

      {/* ── At a glance ── */}
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
        <LocalePreviewTabs value={previewLocale} onChange={setPreviewLocale} />

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

          <FaqPreview faqs={blog.faqs} locale={previewLocale} />
        </div>
      </Section>

      <SeoHealthPanel
        seo={blog}
        readiness={readiness}
        showOg
        showFocusKeyword
        showIndexing
        socialImageUrl={ogImageUrl}
        focusKeywordDensity={blog.focusKeywordDensity}
      />

      {/* ── SEO & Open Graph (raw values) ── */}
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

    </div>
  );
}
