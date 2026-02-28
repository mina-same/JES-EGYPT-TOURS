'use client';
import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import type { TourDetailsOneData } from '../types';
import TourBrochure from './TourBrochure';
import { footerOneData } from '@/data/footerOneData';

interface DownloadPdfBrochureProps {
  tour: TourDetailsOneData;
}

export const DownloadPdfBrochure: React.FC<DownloadPdfBrochureProps> = ({ tour }) => {
  const [generating, setGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [mapQrDataUrl, setMapQrDataUrl] = useState<string>('');
  const [pageUrl, setPageUrl] = useState<string>('');
  const [waHref, setWaHref] = useState<string>('');
  const [website, setWebsite] = useState<string>('');

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
        ? `https://wa.me/${digits}?text=${encodeURIComponent(`Hi! I'm interested in "${tour.title}" (${currentUrl})`)}`
        : ''
    );
  }, [tour.title]);

  // Generate PDF only when button is clicked
  const onDownload = async () => {
    if (generating) return;
    setGenerating(true);

    try {
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

      const el = pdfRef.current;
      if (!el) return;

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1200,
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

        const sliceData = tmpCanvas.toDataURL('image/png', 1.0);
        if (position > 0) pdf.addPage();
        pdf.addImage(sliceData, 'PNG', 0, 0, imgWidth, effectiveSliceHeight);

        remaining -= sliceHeight;
        sourceY += sliceHeight;
        position += sliceHeight;
      }

      const fileName = `${tour.title || 'tour'}-brochure.pdf`;

      // Generate and directly download the PDF
      pdf.save(fileName);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="tour-listing-details__content__item">
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 24,
        padding: '32px',
        background: `
          linear-gradient(135deg, rgba(253, 250, 246, 0.95) 0%, rgba(245, 241, 232, 0.95) 100%),
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(245, 166, 35, 0.03) 10px,
            rgba(245, 166, 35, 0.03) 20px
          )
        `,
        borderRadius: 16,
        border: '1px solid rgba(45, 31, 14, 0.08)',
        boxShadow: '0 4px 20px rgba(45, 31, 14, 0.06)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative corner element */}
        <div style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          background: 'radial-gradient(circle, rgba(245, 166, 35, 0.1) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
          {/* Brochure illustration */}
          <div style={{
            width: 80,
            height: 100,
            background: 'linear-gradient(135deg, #F5A623 0%, #E89F1C 100%)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(245, 166, 35, 0.25)',
            position: 'relative',
            flexShrink: 0
          }}>
            <div style={{
              width: 60,
              height: 80,
              background: '#FFFFFF',
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              <div style={{
                width: 40,
                height: 4,
                background: '#E0D5C7',
                borderRadius: 2
              }} />
              <div style={{
                width: 32,
                height: 3,
                background: '#E0D5C7',
                borderRadius: 2
              }} />
              <div style={{
                width: 36,
                height: 3,
                background: '#E0D5C7',
                borderRadius: 2
              }} />
              <div style={{
                width: 28,
                height: 20,
                background: 'linear-gradient(135deg, #FDFAF6 0%, #F5F1E8 100%)',
                borderRadius: 2,
                marginTop: 8
              }} />
            </div>
          </div>
          
          <div>
            <h4 style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: '#2D1F0E',
              fontFamily: "'Playfair Display', Georgia, serif",
              letterSpacing: '-0.5px'
            }}>
              Download Tour Brochure
            </h4>
            <p style={{
              margin: '6px 0 0',
              fontSize: 15,
              color: '#8B7355',
              fontWeight: 400,
              lineHeight: 1.5
            }}>
              Get a complete PDF guide with itinerary, pricing, and tour details
            </p>
          </div>
        </div>
        
        <button
          className="gotur-btn"
          onClick={onDownload}
          disabled={generating}
          style={{
            background: generating 
              ? '#E0D5C7' 
              : 'linear-gradient(135deg, #F5A623 0%, #E89F1C 100%)',
            color: generating ? '#8B7355' : '#2D1F0E',
            border: 'none',
            padding: '16px 32px',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            cursor: generating ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: generating 
              ? 'none' 
              : '0 4px 16px rgba(245, 166, 35, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 220,
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1
          }}
          onMouseEnter={(e) => {
            if (!generating) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 166, 35, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!generating) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(245, 166, 35, 0.3)';
            }
          }}
        >
          {generating ? (
            <>
              <div style={{
                width: 18,
                height: 18,
                border: '2px solid #8B7355',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Generating...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download Brochure PDF
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Hidden brochure for PDF generation; render only after client values are ready */}
      {waHref || website ? (
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
