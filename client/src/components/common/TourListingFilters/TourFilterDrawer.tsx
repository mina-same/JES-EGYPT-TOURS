'use client';

import type { ReactNode, RefObject } from 'react';
import { X } from 'lucide-react';
import '@/app/(visitor)/[locale]/(home)/[slug]/_views/mobileFilterDrawer.css';

export default function TourFilterDrawer({ open, close, dialogRef, title, closeLabel, children }: {
  open: boolean; close: () => void; dialogRef: RefObject<HTMLDivElement | null>;
  title: string; closeLabel: string; children: ReactNode;
}) {
  return <div className={`mobile-filter-drawer ${open ? 'is-open' : ''} d-lg-none`} aria-hidden={!open}>
    <button type="button" className="mobile-filter-drawer__overlay" onClick={close} tabIndex={-1} aria-label={closeLabel} />
    <div ref={dialogRef} id="tour-filter-dialog" className="mobile-filter-drawer__content" role="dialog" aria-modal="true" aria-labelledby="tour-filter-title">
      <div className="mobile-filter-drawer__header">
        <span id="tour-filter-title" style={{ fontWeight: 800, fontSize: 20 }}>{title}</span>
        <button type="button" onClick={close} className="btn-close-filter" aria-label={closeLabel}><X aria-hidden="true" /></button>
      </div>
      <div className="mobile-filter-drawer__body">{children}</div>
    </div>
  </div>;
}
