'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Section } from '@/components/admin/entityView';
import {
  auditInternalLinks,
  buildAllHtmlLinkSources,
  type AuditedInternalLink,
} from '@/lib/internalLinkAudit';
import {
  getSeoBaseUrl,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from '@/lib/url';

type LocaleFilter = 'all' | SupportedLocale;
type AvailabilityState = 'checking' | 'ok' | 'redirect' | 'not_found' | 'unavailable';

interface AvailabilityResult {
  state: AvailabilityState;
  status?: number;
}

const LOCALE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  de: 'Deutsch',
  it: 'Italiano',
  es: 'Español',
};

function normalizeOrigin(value: string): string {
  try {
    return new URL(value).host.replace(/^www\./, '').toLowerCase();
  } catch {
    return value.trim().toLowerCase();
  }
}

function availabilityKey(link: AuditedInternalLink): string | null {
  if (link.samePageReference || !link.normalizedHref.startsWith('/')) return null;
  return link.normalizedHref.split('#')[0];
}

function availabilityLabel(result: AvailabilityResult | undefined): React.ReactNode {
  if (!result) return null;
  if (result.state === 'checking') {
    return <span className="inline-flex items-center gap-1 text-gray-400"><Loader2 size={11} className="animate-spin" /> Checking live URL</span>;
  }
  if (result.state === 'ok') {
    return <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={11} /> Live URL responds</span>;
  }
  if (result.state === 'redirect') {
    return <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"><AlertTriangle size={11} /> URL redirects</span>;
  }
  if (result.state === 'not_found') {
    return <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400"><XCircle size={11} /> Not found ({result.status})</span>;
  }
  return <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"><AlertTriangle size={11} /> Could not verify{result.status ? ` (${result.status})` : ''}</span>;
}

function hasLiveIssue(result: AvailabilityResult | undefined): boolean {
  return !!result && ['redirect', 'not_found', 'unavailable'].includes(result.state);
}

function linkStatus(link: AuditedInternalLink, liveResult: AvailabilityResult | undefined) {
  if (
    link.issues.some((issue) => issue.severity === 'error') ||
    liveResult?.state === 'not_found'
  ) {
    return {
      label: 'Error',
      classes: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
      icon: <XCircle size={12} />,
    };
  }
  if (link.issues.length > 0 || hasLiveIssue(liveResult)) {
    return {
      label: 'Review',
      classes: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
      icon: <AlertTriangle size={12} />,
    };
  }
  return {
    label: 'Good',
    classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
    icon: <CheckCircle2 size={12} />,
  };
}

/**
 * `entity` is the saved document (or the live form state) exactly as this page
 * holds it. The scan runs here rather than at the call site so it can be
 * memoized on the entity itself — a caller passing `sources={build(entity)}`
 * hands over a new array on every render, which defeats the memo and re-scans
 * the whole document every time a filter or a tab changes.
 */
export function InternalLinksAudit({
  entity,
  siteUrl = getSeoBaseUrl(),
}: {
  entity: unknown;
  siteUrl?: string;
}) {
  const links = useMemo(
    () => auditInternalLinks(buildAllHtmlLinkSources(entity), siteUrl),
    [entity, siteUrl]
  );
  const [localeFilter, setLocaleFilter] = useState<LocaleFilter>('all');
  const [availability, setAvailability] = useState<Record<string, AvailabilityResult>>({});
  const [checking, setChecking] = useState(false);
  // Read after mount only: the server render has no origin, and rendering one
  // it cannot know would be a hydration mismatch.
  const [previewOrigin, setPreviewOrigin] = useState('');
  useEffect(() => setPreviewOrigin(window.location.origin), []);

  const visibleLinks = localeFilter === 'all'
    ? links
    : links.filter((link) => link.locale === localeFilter);

  const checkableTargets = Array.from(
    new Set(links.map(availabilityKey).filter((value): value is string => !!value))
  );

  async function checkLiveUrls() {
    if (checking || checkableTargets.length === 0) return;
    setChecking(true);
    setAvailability(Object.fromEntries(
      checkableTargets.map((target) => [target, { state: 'checking' as const }])
    ));

    const results: Record<string, AvailabilityResult> = {};
    let cursor = 0;
    const workers = Array.from({ length: Math.min(5, checkableTargets.length) }, async () => {
      while (cursor < checkableTargets.length) {
        const target = checkableTargets[cursor++];
        try {
          const response = await fetch(target, {
            method: 'HEAD',
            cache: 'no-store',
            credentials: 'same-origin',
          });
          results[target] = response.status === 404 || response.status === 410
            ? { state: 'not_found', status: response.status }
            : !response.ok
              ? { state: 'unavailable', status: response.status }
              : response.redirected
                ? { state: 'redirect', status: response.status }
                : { state: 'ok', status: response.status };
        } catch {
          results[target] = { state: 'unavailable' };
        }
      }
    });

    await Promise.all(workers);
    setAvailability(results);
    setChecking(false);
  }

  return (
    <Section title="Internal links audit" icon={<Link2 size={14} />}>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 m-0 max-w-2xl">
          Links inside this page&apos;s saved text fields. Language, URL format and SEO attributes are checked automatically.
        </p>
        <button
          type="button"
          onClick={checkLiveUrls}
          disabled={checking || checkableTargets.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-[#b79c5c] hover:text-[#b79c5c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Check these paths against the current website environment"
        >
          {checking ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {checking ? 'Checking…' : 'Check live URLs'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {SUPPORTED_LOCALES.map((locale) => {
          const localeLinks = links.filter((link) => link.locale === locale);
          const flagged = localeLinks.filter((link) => {
            const key = availabilityKey(link);
            return link.issues.length > 0 || hasLiveIssue(key ? availability[key] : undefined);
          }).length;
          return (
            <button
              key={locale}
              type="button"
              onClick={() => setLocaleFilter(localeFilter === locale ? 'all' : locale)}
              className={`text-left rounded-lg border p-3 transition-colors ${
                localeFilter === locale
                  ? 'border-[#b79c5c] bg-[#b79c5c]/5'
                  : 'border-gray-100 dark:border-slate-800 hover:border-[#b79c5c]/60'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wide text-gray-400">{LOCALE_NAMES[locale]}</div>
              <div className="flex items-end justify-between gap-2 mt-1">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{localeLinks.length}</span>
                <span className={`text-[10px] font-semibold ${flagged ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {flagged ? `${flagged} to review` : 'No issues'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {localeFilter !== 'all' && (
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs text-gray-500">Showing {LOCALE_NAMES[localeFilter]} links</span>
          <button type="button" onClick={() => setLocaleFilter('all')} className="text-xs font-semibold text-[#b79c5c] hover:underline">
            Show all languages
          </button>
        </div>
      )}

      {visibleLinks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 dark:border-slate-700 p-5 text-center text-sm text-gray-500 dark:text-gray-400">
          {localeFilter === 'all'
            ? 'No internal links were found in this page’s text content.'
            : `No internal links were found in ${LOCALE_NAMES[localeFilter]} content.`}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left font-medium text-gray-400 text-xs uppercase py-2 pr-3">Lang</th>
                <th className="text-left font-medium text-gray-400 text-xs uppercase py-2 px-3">Anchor text</th>
                <th className="text-left font-medium text-gray-400 text-xs uppercase py-2 px-3">Target</th>
                <th className="text-left font-medium text-gray-400 text-xs uppercase py-2 px-3">Found in</th>
                <th className="text-left font-medium text-gray-400 text-xs uppercase py-2 pl-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleLinks.map((link) => {
                const targetKey = availabilityKey(link);
                const liveResult = targetKey ? availability[targetKey] : undefined;
                const status = linkStatus(link, liveResult);
                return (
                  <tr key={link.id} className="border-t border-gray-100 dark:border-slate-800 align-top">
                    <td className="py-3 pr-3">
                      <span className="inline-flex rounded-full bg-gray-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-600 dark:text-gray-300">
                        {link.locale}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-[190px]">
                      <span className={link.anchorText ? 'text-gray-800 dark:text-gray-200' : 'italic text-red-500'}>
                        {link.anchorText || '(empty)'}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-[280px]">
                      {link.samePageReference ? (
                        <code className="text-xs text-[#b79c5c] break-all">{link.href}</code>
                      ) : (
                        <a
                          // Relative on purpose: opening the path on the origin
                          // being browsed keeps this link and the live check
                          // above it talking about the same environment.
                          href={link.normalizedHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Canonical URL: ${link.resolvedUrl}`}
                          className="inline-flex items-start gap-1 text-xs text-[#b79c5c] hover:underline break-all"
                        >
                          <span>{link.href}</span><ExternalLink size={11} className="shrink-0 mt-0.5" />
                        </a>
                      )}
                      {link.targetLocale && (
                        <div className="text-[10px] uppercase text-gray-400 mt-1">Target: {link.targetLocale}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400 max-w-[180px]">{link.source}</td>
                    <td className="py-3 pl-3 min-w-[190px]">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${status.classes}`}>
                        {status.icon}{status.label}
                      </span>
                      {link.issues.length > 0 && (
                        <ul className="mt-1.5 space-y-1 m-0 p-0 list-none">
                          {link.issues.map((issue) => (
                            <li key={issue.code} className={`text-[11px] leading-snug ${issue.severity === 'error' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {issue.message}
                            </li>
                          ))}
                        </ul>
                      )}
                      {liveResult && <div className="text-[11px] mt-1.5">{availabilityLabel(liveResult)}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {checkableTargets.length > 0 && (
        <p className="text-[11px] text-gray-400 mt-3 mb-0">
          Live checks and target links both open{' '}
          <span className="font-semibold">{previewOrigin || 'the current environment'}</span>
          {previewOrigin && normalizeOrigin(previewOrigin) !== normalizeOrigin(siteUrl) && (
            <> — not the canonical site at <span className="font-semibold">{siteUrl}</span></>
          )}
          . Draft or inactive destinations may correctly return 404 until published.
        </p>
      )}
    </Section>
  );
}
