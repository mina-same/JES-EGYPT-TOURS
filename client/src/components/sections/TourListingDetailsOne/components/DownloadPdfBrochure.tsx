'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { TourDetailsOneData } from '../types';
import TourBrochure from './TourBrochure';
import { footerOneData } from '@/data/footerOneData';

interface DownloadPdfBrochureProps {
  tour: TourDetailsOneData;
}

export const DownloadPdfBrochure: React.FC<DownloadPdfBrochureProps> = ({ tour }) => {
  const { t } = useTranslation('tours');
  const [generating, setGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [mapQrDataUrl, setMapQrDataUrl] = useState<string>('');
  const [pageUrl, setPageUrl] = useState<string>('');
  const [waHref, setWaHref] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  /**
   * The off-screen brochure used to be rendered on every visit: 214 DOM nodes,
   * ~7,000 characters and FOUR images that the browser really did download
   * (verified: naturalWidth 1200/1484/1672/800) for markup nobody ever saw.
   * It now mounts on the first click and stays mounted for repeat downloads.
   */
  const [brochureMounted, setBrochureMounted] = useState(false);

  // Compute client-only values once to avoid hydration mismatch
  useEffect(() => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const rawPhone = (footerOneData?.contact?.phone || '').trim();
    const digits = rawPhone.replace(/[^\d]/g, '');

    setPageUrl(currentUrl);
    setWebsite(origin);
    setWaHref(
      digits
        ? `https://wa.me/${digits}?text=${encodeURIComponent(t("tourDetails.brochure.waMessage", { 
            defaultValue: "Hi! I'm interested in \"{{title}}\" ({{url}})", 
            title: tour.title, 
            url: currentUrl 
          }))}`
        : ''
    );
  }, [tour.title]);

  /**
   * Waits until the brochure is actually painted before html2canvas reads it.
   *
   * Needed twice over: the markup is mounted on demand now, and the QR/logo data
   * URLs are set inside onDownload — React commits those asynchronously, so
   * capturing straight after setState could snapshot the brochure before the
   * assets landed in it. The brochure also depends on webfonts. Two frames, the
   * fonts' ready promise, and the images' own load events remove all three
   * races.
   */
  const waitForBrochurePaint = async () => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
    // The brochure renders in Manrope/Playfair via the theme tokens. html2canvas
    // rasterises whatever is painted at that instant, so without this the PDF
    // could capture fallback glyphs on a cold cache and silently differ from the
    // site. Guarded because document.fonts is absent in some environments, and
    // never fatal: a font that fails to load should not block the download.
    try {
      await document.fonts?.ready;
    } catch {
      /* fall through - capture with whatever is available */
    }
    const el = pdfRef.current;
    if (!el) return;
    await Promise.all(
      Array.from(el.querySelectorAll('img')).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              const done = () => resolve();
              img.addEventListener('load', done, { once: true });
              img.addEventListener('error', done, { once: true });
            })
      )
    );
  };

  // Generate PDF only when button is clicked
  const onDownload = async () => {
    if (generating) return;
    setGenerating(true);
    setBrochureMounted(true);

    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      setPageUrl(currentUrl);

      // QR for tour page
      if (currentUrl) {
        try {
          const qrResponse = await fetch(
            `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(currentUrl)}&size=256x256&margin=8`
          );
          const qrBlob = await qrResponse.blob();
          const data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(qrBlob);
          });
          setQrDataUrl(data);
        } catch {
          setQrDataUrl('');
        }
      }

      // QR for map url
      if (tour?.map) {
        try {
          const mapQrResponse = await fetch(
            `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(tour.map)}&size=256x256&margin=8`
          );
          const mapQrBlob = await mapQrResponse.blob();
          const data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(mapQrBlob);
          });
          setMapQrDataUrl(data);
        } catch {
          setMapQrDataUrl('');
        }
      }

      // Logo as data URL (helps html2canvas avoid tainting)
      try {
        const logoSrc = (footerOneData as any)?.logo?.src || '';
        if (logoSrc) {
          const resp = await fetch(logoSrc);
          const blob = await resp.blob();
          const data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          setLogoDataUrl(data);
        }
      } catch {
        setLogoDataUrl('');
      }

      // Let the on-demand markup and the freshly-set QR/logo assets paint first.
      await waitForBrochurePaint();

      const el = pdfRef.current;
      if (!el) return;

      const canvas = await html2canvas(el, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        windowWidth: 1200,
        imageTimeout: 15000,
      });

      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 0;
      let remaining = imgHeight;
      let sourceY = 0;
      const sliceHeight = pageHeight;

      const tmpCanvas = document.createElement('canvas');
      const ctx = tmpCanvas.getContext('2d');
      if (!ctx) return;

      while (remaining > 0) {
        const effectiveSliceHeight = Math.min(remaining, sliceHeight);

        tmpCanvas.width = canvas.width;
        tmpCanvas.height = Math.floor((effectiveSliceHeight * canvas.width) / imgWidth);

        ctx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          Math.floor((sourceY * canvas.width) / imgWidth),
          canvas.width,
          tmpCanvas.height,
          0,
          0,
          tmpCanvas.width,
          tmpCanvas.height
        );

        const sliceData = tmpCanvas.toDataURL('image/jpeg', 0.85);
        if (position > 0) pdf.addPage();
        pdf.addImage(sliceData, 'JPEG', 0, 0, imgWidth, effectiveSliceHeight, undefined, 'FAST');

        remaining -= sliceHeight;
        sourceY += sliceHeight;
        position += sliceHeight;
      }

      const fileName = `${tour.title || 'tour'}-brochure.pdf`;

      // Generate and directly download the PDF
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
          alert(t("tourDetails.brochure.error", "Failed to generate PDF. Please try again."));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="tour-listing-details__content__item">
      <div
        className="d-flex flex-column flex-md-row align-items-center justify-content-between text-center text-md-start"
        style={{
          marginBottom: 24,
          padding: '32px 40px',
          background: `
            linear-gradient(135deg, rgba(253, 250, 246, 1) 0%, rgba(245, 241, 232, 1) 100%),
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(245, 166, 35, 0.02) 10px,
              rgba(245, 166, 35, 0.02) 20px
            )
          `,
          borderRadius: 20,
          border: '1px solid rgba(232, 159, 28, 0.15)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative background element */}
        <div style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 150,
          height: 150,
          background: 'radial-gradient(circle, rgba(245, 166, 35, 0.08) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        
        <div 
          className="d-flex flex-column flex-md-row align-items-center mb-4 mb-md-0" 
          style={{ gap: 28, flex: 1 }}
        >
          {/* Brochure Illustration */}
          <div style={{
            width: 70,
            height: 90,
            background: 'linear-gradient(135deg, #F5A623 0%, #E89F1C 100%)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(245, 166, 35, 0.2)',
            position: 'relative',
            flexShrink: 0
          }}>
            <div style={{
              width: 50,
              height: 70,
              background: '#FFFFFF',
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}>
              <div style={{ width: 34, height: 3, background: '#F0E8DD', borderRadius: 2 }} />
              <div style={{ width: 28, height: 3, background: '#F0E8DD', borderRadius: 2 }} />
              <div style={{ width: 30, height: 3, background: '#F0E8DD', borderRadius: 2 }} />
              <div style={{
                width: 24,
                height: 18,
                background: 'linear-gradient(135deg, #FDFAF6 0%, #F5F1E8 100%)',
                borderRadius: 2,
                marginTop: 6
              }} />
            </div>
            {/* PDF Badge */}
            <div style={{
              position: 'absolute',
              bottom: 10,
              right: -10,
              background: '#E89F1C',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: 4,
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}>PDF</div>
          </div>
          
          <div>
            <h2 style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: '#1a1a1a',
              fontFamily: "var(--gotur-display-font, Georgia), 'Times New Roman', serif",
              letterSpacing: '-0.3px'
            }}>
              {t("tourDetails.brochure.title", "Download Tour Brochure")}
            </h2>
            <p style={{
              margin: '8px 0 0',
              fontSize: 16,
              color: '#6b635a',
              fontWeight: 400,
              lineHeight: 1.5,
              maxWidth: '450px'
            }}>
              {t("tourDetails.brochure.subtitle", "Get a complete PDF guide with detailed itinerary, highlights, and travel information.")}
            </p>
          </div>
        </div>
        
        <div className="d-flex flex-column align-items-center align-items-md-end" style={{ gap: 12 }}>
          <button
            className="gotur-btn w-100 w-md-auto"
            onClick={onDownload}
            disabled={generating}
            style={{
              padding: '16px 36px',
              borderRadius: 12,
              minWidth: 200,
              fontSize: 16,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              background: generating ? '#e2e2e2' : undefined,
              color: generating ? '#999' : undefined,
              boxShadow: generating ? 'none' : '0 10px 20px rgba(232, 159, 28, 0.15)'
            }}
          >
            {generating ? (
              <>
                <div style={{
                  width: 18,
                  height: 18,
                  border: '2px solid #999',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                {t("tourDetails.brochure.generating", "Generating...")}
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7,10 12,15 17,10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                {t("tourDetails.brochure.downloadBtn", "Download PDF")}
              </>
            )}
          </button>
          
          <div className="d-none d-md-flex align-items-center gap-2 text-muted" style={{ fontSize: '13px' }}>
            <span style={{ color: '#e89f1c' }}>●</span> {t("tourDetails.brochure.free", "Free Download")}
            <span className="ms-2" style={{ color: '#e89f1c' }}>●</span> {t("tourDetails.brochure.offline", "Offline Access")}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Hidden brochure for PDF generation — mounted only once a download has
          been requested, and only after the client-only values are ready. */}
      {brochureMounted && (waHref || website) ? (
        <div
          key={`${JSON.stringify({
            title: tour.title,
            overview: tour.overview,
            overviewTitle: tour.overviewTitle,
            price: tour.price,
            location: tour.location,
            activateDay: tour.activateDay,
            highlightList: tour.highlightList,
            amenities: tour.amenities,
            amenitiesTwo: tour.amenitiesTwo,
            itinerary: tour.itinerary,
            pricingPlans: tour.pricingPlans,
            logoDataUrl,
            qrDataUrl,
            mapQrDataUrl,
          })}`}
          style={{
            position: 'absolute',
            left: -99999,
            top: 0,
            width: 1200,
            pointerEvents: 'none',
          }}
          aria-hidden
          /* aria-hidden keeps it out of the accessibility tree but does NOT stop
             Tab: the brochure holds focusable links, and off-screen focus is the
             classic keyboard trap. `inert` removes them from the tab order too. */
          inert
        >
          <TourBrochure
            ref={pdfRef}
            tour={tour}
            assets={{
              logoDataUrl,
              qrDataUrl,
              mapQrDataUrl,
              pageUrl,
              phone: footerOneData?.contact?.phone || '',
              email: footerOneData?.contact?.email || '',
              website,
              telHref: (() => {
                const rawPhone = (footerOneData?.contact?.phone || '').trim();
                const digits = rawPhone.replace(/[^\d]/g, '');
                return digits ? `tel:+${digits}` : '';
              })(),
              waHref,
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

export default DownloadPdfBrochure;
