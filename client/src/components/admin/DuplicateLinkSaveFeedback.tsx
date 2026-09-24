'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { DUPLICATE_LINK_FEEDBACK, REVEAL_LINK_LOCATION, type DuplicateLinkGroup } from '@/lib/duplicateLinkFeedback';

export default function DuplicateLinkSaveFeedback() {
  const [groups, setGroups] = useState<DuplicateLinkGroup[]>([]);
  const [hint, setHint] = useState('');
  const panel = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => { setGroups([]); setHint(''); }, [pathname, search]);
  useEffect(() => () => { timers.current.forEach(window.clearTimeout); }, [pathname, search]);
  useEffect(() => {
    const receive = (event: Event) => {
      setGroups((event as CustomEvent<DuplicateLinkGroup[]>).detail);
      setHint('');
    };
    window.addEventListener(DUPLICATE_LINK_FEEDBACK, receive);
    return () => window.removeEventListener(DUPLICATE_LINK_FEEDBACK, receive);
  }, []);
  useEffect(() => {
    if (groups.length) {
      panel.current?.focus({ preventScroll: true });
      panel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [groups]);

  function reveal(group: DuplicateLinkGroup, location: DuplicateLinkGroup['locations'][number]) {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    let resolvedPath = location.path;
    const open = () => {
      const detail = { locale: group.locale, path: location.path, blockId: location.blockId, resolvedPath: location.path };
      window.dispatchEvent(new CustomEvent(REVEAL_LINK_LOCATION, { detail }));
      resolvedPath = detail.resolvedPath;
    };
    open();
    // A different tab may mount its collapsed editors after the first event.
    timers.current.push(window.setTimeout(open, 400));
    // Allow language tabs and collapsed content blocks to render first.
    timers.current.push(window.setTimeout(() => {
      const fieldPath = resolvedPath.replace(/\.(en|de|it|es)(?=\.|$)/, '');
      const blockPath = fieldPath.match(/^contentBlocks\.\d+/)?.[0];
      let target = location.blockId
        ? document.querySelector<HTMLElement>(`[data-content-block-id="${CSS.escape(location.blockId)}"]`)
        : document.getElementById(resolvedPath.replace(/\./g, '-'));
      const parts = fieldPath.split('.');
      while (!target && parts.length) {
        target = document.querySelector<HTMLElement>(`[data-field="${CSS.escape(parts.join('.'))}"]`);
        parts.pop();
      }
      target ||= blockPath ? document.querySelector<HTMLElement>(`[data-field="${CSS.escape(blockPath)}"]`) : null;
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.animate([{ outline: '3px solid #dc2626' }, { outline: '3px solid transparent' }], { duration: 2200 });
        const editor = target.querySelector<HTMLElement>('[contenteditable="true"], input, textarea');
        editor?.focus({ preventScroll: true });
        setHint('');
      } else {
        setHint(`Open ${location.label} in ${group.locale.toUpperCase()}. The locations above reflect the last save attempt; after editing, save again to recheck.`);
      }
    }, 750));
  }

  if (!groups.length) return null;
  return (
    <div id="duplicate-internal-links-report" ref={panel} tabIndex={-1} role="alert" className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-bold">Cannot save: duplicate internal links</h2>
        <button type="button" onClick={() => setGroups([])} aria-label="Dismiss duplicate link report" className="text-sm underline">Dismiss</button>
      </div>
      <p className="mt-1 text-sm">Your edits are still in the form. Remove the repeated links, then save again to recheck. You can keep the words as plain text.</p>
      <ul className="mt-3 space-y-3">
        {groups.map((group) => (
          <li key={`${group.locale}:${group.target}`} className="rounded-lg border border-red-200 p-3 dark:border-red-900">
            <p className="text-sm font-semibold">{group.locale.toUpperCase()} · {group.count} occurrences</p>
            <code className="text-xs break-all">{group.target}</code>
            <ul className="mt-2 space-y-1 text-sm">
              {group.locations.map((location, index) => (
                <li key={`${location.path}:${index}`} className="flex flex-wrap items-center justify-between gap-2">
                  <span>{location.label} · Link {location.occurrence}</span>
                  <button type="button" onClick={() => reveal(group, location)} className="font-semibold underline">Go to location</button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {hint && <p className="mt-3 text-sm" role="status">{hint}</p>}
    </div>
  );
}
