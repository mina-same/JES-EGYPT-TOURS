'use client';

/**
 * Shared slider-item form used by both the "New" and "Edit" admin pages.
 *
 * UX features:
 * - Live preview of the composed hero heading (per active language).
 * - Human labels + helper hints for the 3-part heading (the gold phrase).
 * - Soft character counter for the full heading.
 * - Per-language completeness dots on the language tabs.
 * - Per-language button link (matches the promo bar's localized link).
 *
 * The exported helpers (normalize/validate/payload) keep punctuation spacing
 * and required-field rules consistent between the two pages and the server.
 */

import React, { useMemo, useState } from 'react';
import {
  CheckCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Upload,
  XCircle,
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { SliderItem } from '@/types/slider';
import type { ILocalizedString } from '@/types/tour';
import { uploadAPI } from '@/lib/api/upload';
import AdminLanguageTabs, { AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedField from '@/components/admin/LocalizedField';

// ==================== TYPES & HELPERS ====================

export type SliderFormData = {
  subtitle: ILocalizedString;
  title: ILocalizedString;
  titleSpan: ILocalizedString;
  titleEnd: ILocalizedString;
  image: { url: string; fileName: string; title: ILocalizedString; alt: ILocalizedString };
  /** Primary CTA — solid gold (left). */
  button: SliderFormButton | null;
  /** Secondary CTA — outline (right). null = the site default (Special
   *  Offers) is shown instead. */
  buttonSecondary: SliderFormButton | null;
  order: number;
  isActive: boolean;
};

export type SliderFormButton = {
  text: ILocalizedString;
  link: ILocalizedString;
  linkDirection: '_blank' | '_self';
};

type ButtonKey = 'button' | 'buttonSecondary';

const LANGS: AdminLanguage[] = ['en', 'de', 'it', 'es'];

export const emptyLocalized = (): ILocalizedString => ({ en: '', de: '', it: '', es: '' });

const toLocalized = (v: unknown): ILocalizedString =>
  typeof v === 'string' ? { en: v, de: '', it: '', es: '' } : { ...emptyLocalized(), ...((v as object) || {}) };

export function emptySliderFormData(): SliderFormData {
  return {
    subtitle: emptyLocalized(),
    title: emptyLocalized(),
    titleSpan: emptyLocalized(),
    titleEnd: emptyLocalized(),
    image: { url: '', fileName: '', title: emptyLocalized(), alt: emptyLocalized() },
    button: null,
    buttonSecondary: null,
    order: 0,
    isActive: true,
  };
}

/** Maps an API slider item (which may contain legacy plain strings) to the
 *  form state. */
export function sliderItemToFormData(item: SliderItem): SliderFormData {
  return {
    subtitle: toLocalized(item.subtitle),
    title: toLocalized(item.title),
    titleSpan: toLocalized(item.titleSpan),
    titleEnd: toLocalized(item.titleEnd),
    image: {
      url: item.image?.url || '',
      fileName: item.image?.fileName || '',
      title: toLocalized(item.image?.title),
      alt: toLocalized(item.image?.alt),
    },
    button: item.button
      ? {
          text: toLocalized(item.button.text),
          link: toLocalized(item.button.link),
          linkDirection: item.button.linkDirection === '_blank' ? '_blank' : '_self',
        }
      : null,
    buttonSecondary: item.buttonSecondary
      ? {
          text: toLocalized(item.buttonSecondary.text),
          link: toLocalized(item.buttonSecondary.link),
          linkDirection: item.buttonSecondary.linkDirection === '_blank' ? '_blank' : '_self',
        }
      : null,
    order: Number(item.order) || 0,
    isActive: Boolean(item.isActive),
  };
}

/** Trims and removes stray spaces before punctuation ("You , Your" → "You, Your"). */
const cleanText = (s: string) => s.replace(/\s+([,.;:!?…])/g, '$1').trim();

const normalizeLocalized = (v: ILocalizedString): ILocalizedString =>
  Object.fromEntries(LANGS.map((l) => [l, cleanText((v as Record<string, string>)[l] || '')])) as unknown as ILocalizedString;

const trimLocalized = (v: ILocalizedString): ILocalizedString =>
  Object.fromEntries(LANGS.map((l) => [l, ((v as Record<string, string>)[l] || '').trim()])) as unknown as ILocalizedString;

export function validateSliderFormData(d: SliderFormData): string | null {
  if (!d.subtitle.en?.trim()) return 'English Script Intro (subtitle) is required';
  if (!d.title.en?.trim()) return 'English Heading is required';
  if (!d.image.url?.trim()) return 'Main image is required';
  if (Number.isNaN(Number(d.order))) return 'Order must be a number';
  if (d.button) {
    if (!d.button.text.en?.trim()) return 'English Primary Button text is required (or disable it)';
    if (!d.button.link.en?.trim()) return 'English Primary Button link is required (or disable it)';
  }
  if (d.buttonSecondary) {
    if (!d.buttonSecondary.text.en?.trim())
      return 'English Secondary Button text is required (or disable it to show the default)';
    if (!d.buttonSecondary.link.en?.trim())
      return 'English Secondary Button link is required (or disable it to show the default)';
  }
  return null;
}

/** Builds the API payload: normalized text, `button: null` = remove. */
export function buildSliderPayload(d: SliderFormData): Record<string, unknown> {
  return {
    subtitle: normalizeLocalized(d.subtitle),
    title: normalizeLocalized(d.title),
    titleSpan: normalizeLocalized(d.titleSpan),
    titleEnd: normalizeLocalized(d.titleEnd),
    order: Number(d.order),
    isActive: Boolean(d.isActive),
    image: {
      url: d.image.url.trim(),
      // fileName is internal bookkeeping (auto-filled by the upload). When
      // an admin pastes a URL directly, derive a name from it so the
      // server's required-fileName validation still passes.
      fileName:
        d.image.fileName.trim() ||
        d.image.url.trim().split('/').pop()?.split('?')[0] ||
        'image',
      title: trimLocalized(d.image.title),
      alt: trimLocalized(d.image.alt),
    },
    button: d.button
      ? {
          text: trimLocalized(d.button.text),
          link: trimLocalized(d.button.link),
          linkDirection: d.button.linkDirection,
        }
      : null,
    buttonSecondary: d.buttonSecondary
      ? {
          text: trimLocalized(d.buttonSecondary.text),
          link: trimLocalized(d.buttonSecondary.link),
          linkDirection: d.buttonSecondary.linkDirection,
        }
      : null,
  };
}

// Same punctuation-aware join the hero uses between the gold phrase and the
// rest of the heading.
const joinSep = (next: string) => (/^[,.;:!?…]/.test(next) ? '' : ' ');

// "|" typed in a heading field = deliberate line break (mirrors the homepage
// hero exactly, so the preview shows the same line composition).
const renderWithLineBreaks = (text: string): React.ReactNode => {
  const parts = text.split('|');
  if (parts.length === 1) return text;
  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {part.trim()}
      {i < parts.length - 1 && <br />}
    </React.Fragment>
  ));
};

const HEADING_SOFT_LIMIT = 90;

const inputCls =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]';

// ==================== COMPONENT ====================

interface SliderItemFormProps {
  value: SliderFormData;
  onChange: React.Dispatch<React.SetStateAction<SliderFormData>>;
  saving?: boolean;
}

export default function SliderItemForm({ value, onChange, saving = false }: SliderItemFormProps) {
  const { toast } = useToast();
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>('en');
  const [uploading, setUploading] = useState(false);

  const formData = value;
  const hasButton = Boolean(formData.button);

  const setLocalized = (field: 'subtitle' | 'title' | 'titleSpan' | 'titleEnd', lang: AdminLanguage, val: string) => {
    onChange((prev) => ({ ...prev, [field]: { ...prev[field], [lang]: val } }));
  };

  const updateImageField = (field: keyof SliderFormData['image'], val: unknown) => {
    onChange((prev) => ({ ...prev, image: { ...prev.image, [field]: val } }));
  };

  // Shared helpers for BOTH hero buttons (primary gold / secondary outline).
  const toggleButtonKey = (key: ButtonKey, enabled: boolean) => {
    onChange((prev) => ({
      ...prev,
      [key]: enabled
        ? prev[key] ?? { text: emptyLocalized(), link: emptyLocalized(), linkDirection: '_self' }
        : null,
    }));
  };

  const updateButtonKeyField = (key: ButtonKey, field: 'text' | 'link' | 'linkDirection', val: unknown) => {
    onChange((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key]!, [field]: val } } : prev));
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'File too large', description: 'Image must be less than 2MB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const response = await uploadAPI.uploadFile(file);
      if (response.success && response.data?.url) {
        onChange((prev) => ({
          ...prev,
          image: {
            ...prev.image,
            url: response.data!.url,
            fileName: response.data!.fileName || prev.image.fileName,
          },
        }));
        toast({ title: 'Upload successful', description: 'Image uploaded successfully.', variant: 'success' });
      } else {
        toast({ title: 'Upload failed', description: response.error || 'Failed to upload image', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Upload error', description: 'An error occurred during upload', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  // Per-language completeness for the tab dots: a language counts as
  // translated when it has both the subtitle and the main heading.
  const completeness = useMemo(() => {
    const get = (v: ILocalizedString, l: AdminLanguage) => ((v as Record<string, string>)[l] || '').trim();
    return Object.fromEntries(
      LANGS.map((l) => [l, Boolean(get(formData.subtitle, l) && get(formData.title, l))])
    ) as Partial<Record<AdminLanguage, boolean>>;
  }, [formData.subtitle, formData.title]);

  // Live-preview values for the active language (shown exactly as stored —
  // no English fallback — so gaps are visible while translating).
  const pv = (v: ILocalizedString) => cleanText(((v as Record<string, string>)[activeLanguage] || ''));
  const pvSubtitle = pv(formData.subtitle);
  const pvTitle = pv(formData.title);
  const pvSpan = pv(formData.titleSpan);
  const pvEnd = pv(formData.titleEnd);
  const pvButtonText = formData.button ? pv(formData.button.text) : '';
  // "|" markers are layout, not content — exclude them from the count.
  const headingLength = (pvTitle + (pvSpan ? ` ${pvSpan}` : '') + (pvEnd ? joinSep(pvEnd) + pvEnd : ''))
    .replace(/\|/g, '')
    .length;
  const hasPreviewContent = Boolean(pvSubtitle || pvTitle || pvSpan || pvEnd);
  // Same no-break join the hero uses: leading punctuation stays glued to the
  // gold phrase so the preview matches the homepage line-wrapping behavior.
  const pvEndPunct = pvSpan ? pvEnd.match(/^[,.;:!?…]+/)?.[0] ?? '' : '';
  const pvEndRest = pvSpan ? pvEnd.slice(pvEndPunct.length).trimStart() : pvEnd;
  // Secondary button preview label: the per-slide text when set, otherwise
  // the site default shown to visitors.
  const pvButton2Text = formData.buttonSecondary
    ? pv(formData.buttonSecondary.text) || formData.buttonSecondary.text.en || 'Special Offers'
    : 'Special Offers';

  // One editing group per hero button (primary gold / secondary outline),
  // with a visual sample so the admin always knows which button this is.
  const renderButtonGroup = (
    key: ButtonKey,
    heading: string,
    description: string,
    sample: React.ReactNode
  ) => {
    const btn = formData[key];
    const enabled = Boolean(btn);
    return (
      <div className='rounded-lg border border-gray-100 bg-gray-50/60 p-3'>
        <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
          <div>
            <div className='flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-800'>
              {heading}
              {sample}
            </div>
            <p className='mt-1 text-[11px] text-gray-400'>{description}</p>
          </div>
          <button
            type='button'
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${
              enabled ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-700'
            }`}
            onClick={() => toggleButtonKey(key, !enabled)}
            disabled={saving}
          >
            {enabled ? (
              <>
                <EyeOff size={14} /> Enabled
              </>
            ) : (
              <>
                <Eye size={14} /> Disabled
              </>
            )}
          </button>
        </div>

        {btn && (
          <>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
              <label className='block text-xs text-gray-600'>
                <LocalizedField
                  label='Button Text'
                  value={btn.text}
                  globalLanguage={activeLanguage}
                  hideLanguageTabs
                  onChange={(lang, val) => updateButtonKeyField(key, 'text', { ...btn.text, [lang]: val })}
                >
                  {(lang, currentValue, handleLang) => (
                    <input
                      className={inputCls}
                      value={currentValue || ''}
                      onChange={(e) => handleLang(e.target.value)}
                      placeholder={`Button text in ${lang}`}
                    />
                  )}
                </LocalizedField>
              </label>
              <label className='block text-xs text-gray-600'>
                <LocalizedField
                  label='Button Link (per language)'
                  value={btn.link}
                  globalLanguage={activeLanguage}
                  hideLanguageTabs
                  onChange={(lang, val) => updateButtonKeyField(key, 'link', { ...btn.link, [lang]: val })}
                >
                  {(lang, currentValue, handleLang) => (
                    <input
                      className={inputCls}
                      value={currentValue || ''}
                      onChange={(e) => handleLang(e.target.value)}
                      placeholder={`Destination URL for ${lang}`}
                    />
                  )}
                </LocalizedField>
                <span className='mt-1 block text-[11px] text-gray-400'>
                  Empty language = the English link is used.
                </span>
              </label>
            </div>

            <label className='mt-3 block text-xs text-gray-600'>
              <div className='mb-1'>Link Direction</div>
              <select
                className={inputCls}
                value={btn.linkDirection}
                onChange={(e) => updateButtonKeyField(key, 'linkDirection', e.target.value as '_blank' | '_self')}
              >
                <option value='_self'>Same tab</option>
                <option value='_blank'>New tab</option>
              </select>
            </label>
          </>
        )}
      </div>
    );
  };

  return (
    <div className='space-y-4'>
      <AdminLanguageTabs
        activeLanguage={activeLanguage}
        onLanguageChange={setActiveLanguage}
        completeness={completeness}
      />

      {/* ============ LIVE PREVIEW ============ */}
      <div className='rounded-xl border border-gray-200 bg-white p-4'>
        <div className='mb-1 text-sm font-semibold text-gray-900'>Live Preview</div>
        <p className='mb-3 text-xs text-gray-500'>
          Rendered with the homepage&apos;s real type sizes and line wrapping — what you see here is
          what visitors see at this window width ({activeLanguage.toUpperCase()}). Spacing around
          punctuation is fixed automatically on save.
        </p>
        <div
          className='rounded-xl px-6 py-8 text-center'
          style={{ background: 'linear-gradient(180deg, #14273a 0%, #0d1a2a 100%)' }}
        >
          {hasPreviewContent ? (
            <>
              {pvSubtitle && (
                <div
                  className='mb-3 flex items-center justify-center gap-4 italic text-white/90'
                  style={{ fontSize: 'clamp(1.25rem, 2.8vw, 3.125rem)', lineHeight: 1.2 }}
                >
                  <span
                    aria-hidden
                    className='h-0.5 rounded'
                    style={{ width: 'clamp(22px, 6vw, 72px)', background: 'linear-gradient(90deg, transparent, #d4af37)' }}
                  />
                  <span style={{ fontFamily: 'var(--font-accent, cursive), cursive' }}>{pvSubtitle}</span>
                  <span
                    aria-hidden
                    className='h-0.5 rounded'
                    style={{ width: 'clamp(22px, 6vw, 72px)', background: 'linear-gradient(90deg, #d4af37, transparent)' }}
                  />
                </div>
              )}
              {/* Same metrics as the real hero title (fluid clamp size,
                  line-height, max content width and balanced wrapping) so the
                  preview's line breaks match the homepage at this window
                  width. */}
              <div
                className='mx-auto font-extrabold text-white'
                style={
                  {
                    maxWidth: '1040px',
                    fontSize: 'clamp(2.25rem, 4.6vw, 4.5rem)',
                    lineHeight: 1.12,
                    textWrap: 'balance',
                    // Same family as the homepage title — glyph widths decide
                    // where lines wrap, so the font must match for the preview
                    // to break at the same points. The live hero title resolves
                    // --gotur-heading-font, which currently maps to --font-body;
                    // if the site ever gets a separate display face, this needs
                    // to follow it or the preview will wrap at the wrong points.
                    fontFamily: 'var(--font-body, "Segoe UI"), system-ui, sans-serif',
                  } as React.CSSProperties
                }
              >
                {renderWithLineBreaks(pvTitle)}
                {pvSpan && (
                  <>
                    {' '}
                    <span className='whitespace-nowrap'>
                      <span className='relative inline-block text-[#d4af37]'>
                        {renderWithLineBreaks(pvSpan)}
                        <svg
                          className='pointer-events-none absolute left-0 w-full'
                          style={{ bottom: '-0.2em', height: '0.22em', color: '#d4af37' }}
                          viewBox='0 0 330 24'
                          preserveAspectRatio='none'
                          fill='none'
                          aria-hidden='true'
                        >
                          <path d='M8 17 C 90 7, 240 5, 322 11' stroke='currentColor' strokeWidth='5' strokeLinecap='round' />
                        </svg>
                      </span>
                      {pvEndPunct}
                    </span>
                  </>
                )}
                {pvEndRest && (
                  <>
                    {pvSpan || !/^[,.;:!?…]/.test(pvEndRest) ? ' ' : ''}
                    {renderWithLineBreaks(pvEndRest)}
                  </>
                )}
              </div>
              <div className='mt-6 flex flex-wrap items-center justify-center gap-4'>
                {hasButton && pvButtonText && (
                  <span
                    className='inline-flex items-center gap-2 rounded-full bg-[#d4af37] font-bold text-[#14273a]'
                    style={{
                      padding: '16px 32px',
                      fontSize: '16px',
                      lineHeight: 1,
                      fontFamily: 'var(--font-body, "Segoe UI"), system-ui, sans-serif',
                    }}
                  >
                    {pvButtonText} →
                  </span>
                )}
                <span
                  className='inline-flex items-center gap-2 rounded-full font-semibold text-white'
                  style={{
                    padding: '16px 32px',
                    fontSize: '16px',
                    lineHeight: 1,
                    border: '2px solid rgba(255, 255, 255, 0.55)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    fontFamily: 'var(--font-body, "Segoe UI"), system-ui, sans-serif',
                  }}
                >
                  {pvButton2Text} →
                </span>
              </div>
            </>
          ) : (
            <div className='py-4 text-sm text-white/50'>
              Fill in the heading fields to see a live preview for {activeLanguage.toUpperCase()}.
            </div>
          )}
        </div>
        <div
          className={`mt-2 text-xs ${
            headingLength > HEADING_SOFT_LIMIT ? 'font-medium text-amber-600' : 'text-gray-500'
          }`}
        >
          Heading length ({activeLanguage.toUpperCase()}): {headingLength} characters
          {headingLength > HEADING_SOFT_LIMIT &&
            ` — long headings wrap to several lines on the homepage; try to stay under ~${HEADING_SOFT_LIMIT}.`}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        {/* ============ TEXT ============ */}
        <div className='rounded-xl border border-gray-200 bg-white p-4'>
          <div className='mb-3 text-sm font-semibold text-gray-900'>Text</div>

          <label className='mb-3 block text-xs text-gray-600'>
            <LocalizedField
              label='Script Intro (line above the heading)'
              value={formData.subtitle}
              globalLanguage={activeLanguage}
              hideLanguageTabs
              onChange={(lang, val) => setLocalized('subtitle', lang, val)}
            >
              {(lang, currentValue, handleLang) => (
                <input
                  className={inputCls}
                  value={currentValue || ''}
                  onChange={(e) => handleLang(e.target.value)}
                  placeholder={`Script intro in ${lang}`}
                />
              )}
            </LocalizedField>
            <span className='mt-1 block text-[11px] text-gray-400'>
              Handwritten-style line shown between two gold dashes above the heading.
            </span>
          </label>

          <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
            <label className='block text-xs text-gray-600'>
              <LocalizedField
                label='Heading — before highlight'
                value={formData.title}
                globalLanguage={activeLanguage}
                hideLanguageTabs
                onChange={(lang, val) => setLocalized('title', lang, val)}
              >
                {(lang, currentValue, handleLang) => (
                  <input
                    className={inputCls}
                    value={currentValue || ''}
                    onChange={(e) => handleLang(e.target.value)}
                    placeholder={`Heading in ${lang}`}
                  />
                )}
              </LocalizedField>
              <span className='mt-1 block text-[11px] text-gray-400'>
                White text. Type “|” to force a line break (e.g. “Your pace |”).
              </span>
            </label>
            <label className='block text-xs text-gray-600'>
              <LocalizedField
                label='Highlighted phrase (optional)'
                value={formData.titleSpan}
                globalLanguage={activeLanguage}
                hideLanguageTabs
                onChange={(lang, val) => setLocalized('titleSpan', lang, val)}
              >
                {(lang, currentValue, handleLang) => (
                  <input
                    className={inputCls}
                    value={currentValue || ''}
                    onChange={(e) => handleLang(e.target.value)}
                    placeholder={`Gold phrase in ${lang}`}
                  />
                )}
              </LocalizedField>
              <span className='mt-1 block text-[11px] text-gray-400'>
                Shown in gold with a hand-drawn underline.
              </span>
            </label>
            <label className='block text-xs text-gray-600'>
              <LocalizedField
                label='Heading — after highlight (optional)'
                value={formData.titleEnd}
                globalLanguage={activeLanguage}
                hideLanguageTabs
                onChange={(lang, val) => setLocalized('titleEnd', lang, val)}
              >
                {(lang, currentValue, handleLang) => (
                  <input
                    className={inputCls}
                    value={currentValue || ''}
                    onChange={(e) => handleLang(e.target.value)}
                    placeholder={`Rest of heading in ${lang}`}
                  />
                )}
              </LocalizedField>
              <span className='mt-1 block text-[11px] text-gray-400'>
                May start with punctuation (e.g. “, your guide…”). “|” forces a line break.
              </span>
            </label>
          </div>

          <div className='mt-3 grid grid-cols-1 gap-3 md:grid-cols-3'>
            <label className='block text-xs text-gray-600'>
              <div className='mb-1'>Order</div>
              <input
                className={inputCls}
                type='number'
                value={formData.order}
                onChange={(e) => onChange((prev) => ({ ...prev, order: Number(e.target.value) }))}
              />
            </label>

            <div className='block text-xs text-gray-600 md:col-span-2'>
              <div className='mb-1'>Status</div>
              <button
                type='button'
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  formData.isActive
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
                onClick={() => onChange((prev) => ({ ...prev, isActive: !prev.isActive }))}
                disabled={saving}
              >
                {formData.isActive ? (
                  <>
                    <CheckCircle size={16} /> Active
                  </>
                ) : (
                  <>
                    <XCircle size={16} /> Inactive
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ============ MAIN IMAGE ============ */}
        <div className='rounded-xl border border-gray-200 bg-white p-4'>
          <div className='mb-3 text-sm font-semibold text-gray-900'>Main Image</div>

          <div className='mb-3 h-44 w-full overflow-hidden rounded-xl border border-dashed border-gray-200 bg-gray-50'>
            {formData.image.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={formData.image.url}
                alt={formData.image.alt.en || 'Preview'}
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center gap-2 text-sm text-gray-500'>
                <ImageIcon size={18} />
                No image
              </div>
            )}
          </div>

          <label className='mb-3 block text-xs text-gray-600'>
            <div className='mb-1'>Image URL</div>
            <div className='flex gap-2'>
              <input
                className='flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                value={formData.image.url}
                onChange={(e) => updateImageField('url', e.target.value)}
              />
              <label className='inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#63ab45] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#529938] disabled:cursor-not-allowed disabled:opacity-50'>
                <input
                  type='file'
                  accept='image/*'
                  className='hidden'
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await handleImageUpload(file);
                  }}
                />
                {uploading ? <Loader2 size={16} className='animate-spin' /> : <Upload size={16} />}
                {uploading ? 'Uploading...' : 'Upload'}
              </label>
            </div>
          </label>

          {/* The old "File Name" input was internal bookkeeping with no
              effect on the site — it is now auto-managed (from the upload,
              or derived from the URL). The admin edits the fields that
              actually matter: localized image Title + Alt. */}
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <label className='block text-xs text-gray-600'>
              <LocalizedField
                label='Image Title'
                value={formData.image.title}
                globalLanguage={activeLanguage}
                hideLanguageTabs
                onChange={(lang, val) => updateImageField('title', { ...formData.image.title, [lang]: val })}
              >
                {(lang, currentValue, handleLang) => (
                  <input
                    className={inputCls}
                    value={currentValue || ''}
                    onChange={(e) => handleLang(e.target.value)}
                    placeholder={`Image title in ${lang}`}
                  />
                )}
              </LocalizedField>
              <span className='mt-1 block text-[11px] text-gray-400'>
                Short name of the photo; also used as a fallback when Alt is empty.
              </span>
            </label>
            <label className='block text-xs text-gray-600'>
              <LocalizedField
                label='Alt text (SEO)'
                value={formData.image.alt}
                globalLanguage={activeLanguage}
                hideLanguageTabs
                onChange={(lang, val) => updateImageField('alt', { ...formData.image.alt, [lang]: val })}
              >
                {(lang, currentValue, handleLang) => (
                  <input
                    className={inputCls}
                    value={currentValue || ''}
                    onChange={(e) => handleLang(e.target.value)}
                    placeholder={`Alt text in ${lang}`}
                  />
                )}
              </LocalizedField>
              <span className='mt-1 block text-[11px] text-gray-400'>
                Describe the photo for search engines &amp; screen readers (e.g. “Giza pyramids at
                sunrise”).
              </span>
            </label>
          </div>
        </div>

        {/* ============ HERO BUTTONS ============ */}
        <div className='rounded-xl border border-gray-200 bg-white p-4'>
          <div className='mb-1 text-sm font-semibold text-gray-900'>Hero Buttons</div>
          <p className='mb-3 text-xs text-gray-500'>
            Two distinct buttons — the samples show exactly which one you are editing.
          </p>
          <div className='space-y-3'>
            {renderButtonGroup(
              'button',
              'Primary Button',
              'The solid GOLD button on the LEFT.',
              <span aria-hidden className='inline-block h-4 w-10 rounded-full bg-[#d4af37]' />
            )}
            {renderButtonGroup(
              'buttonSecondary',
              'Secondary Button',
              'The OUTLINE button on the RIGHT. Disabled = visitors see the default “Special Offers” button.',
              <span aria-hidden className='inline-block h-4 w-10 rounded-full border-2 border-gray-400 bg-white' />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}