// 'use client';
// import React, { useRef, useState } from 'react';
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';
// import Image from 'next/image';
// import { TourDetailsOneData } from '../types';
// import { footerOneData } from '@/data/footerOneData';

// interface DownloadPdfProps {
//   tour: TourDetailsOneData;
// }

// export const DownloadPdf: React.FC<DownloadPdfProps> = ({ tour }) => {
//   const [generating, setGenerating] = useState(false);
//   const pdfRef = useRef<HTMLDivElement>(null);

//   const getImgUrl = (img: any) => {
//     if (!img) return '';
//     if (typeof img === 'string') return img;
//     if (typeof img === 'object' && 'src' in img) return (img as any).src || '';
//     return '';
//   };

//   const onDownload = async () => {
//     if (generating) return;
//     setGenerating(true);
//     try {
//       const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
//       let qrDataUrl = '';
//       let mapQrDataUrl = '';
//       let logoDataUrl = '';
//       if (pageUrl) {
//         try {
//           const qrResponse = await fetch(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(pageUrl)}&size=256x256&margin=8`);
//           const qrBlob = await qrResponse.blob();
//           qrDataUrl = await new Promise<string>((resolve) => {
//             const reader = new FileReader();
//             reader.onloadend = () => resolve(reader.result as string);
//             reader.readAsDataURL(qrBlob);
//           });
//         } catch {
//           qrDataUrl = '';
//         }
//       }
//       try {
//         const logoSrc = (footerOneData as any)?.logo?.src || '';
//         if (logoSrc) {
//           const resp = await fetch(logoSrc);
//           const blob = await resp.blob();
//           logoDataUrl = await new Promise<string>((resolve) => {
//             const reader = new FileReader();
//             reader.onloadend = () => resolve(reader.result as string);
//             reader.readAsDataURL(blob);
//           });
//         }
//       } catch {
//         logoDataUrl = '';
//       }
//       if (tour?.map) {
//         try {
//           const mapQrResponse = await fetch(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(tour.map)}&size=256x256&margin=8`);
//           const mapQrBlob = await mapQrResponse.blob();
//           mapQrDataUrl = await new Promise<string>((resolve) => {
//             const reader = new FileReader();
//             reader.onloadend = () => resolve(reader.result as string);
//             reader.readAsDataURL(mapQrBlob);
//           });
//         } catch {
//           mapQrDataUrl = '';
//         }
//       }
//       const rawPhone = (footerOneData?.contact?.phone || '').trim();
//       const digits = rawPhone.replace(/[^\d]/g, '');
//       const telHref = digits ? `tel:+${digits}` : '';
//       const waHref = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(`Hi! I'm interested in "${tour.title}" (${pageUrl})`)}` : '';

//       const el = pdfRef.current;
//       if (!el) {
//         setGenerating(false);
//         return;
//       }
//       const canvas = await html2canvas(el, {
//         scale: 2,
//         useCORS: true,
//         logging: false,
//         windowWidth: 1200,
//       });
//       const pdf = new jsPDF('p', 'pt', 'a4');
//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const pageHeight = pdf.internal.pageSize.getHeight();
//       const imgWidth = pageWidth;
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;
//       let position = 0;
//       let remaining = imgHeight;
//       let sourceY = 0;
//       const sliceHeight = pageHeight;
//       const tmpCanvas = document.createElement('canvas');
//       const ctx = tmpCanvas.getContext('2d');
//       if (!ctx) {
//         setGenerating(false);
//         return;
//       }
//       while (remaining > 0) {
//         const effectiveSliceHeight = Math.min(remaining, sliceHeight);
//         tmpCanvas.width = canvas.width;
//         tmpCanvas.height = Math.floor((effectiveSliceHeight * canvas.width) / imgWidth);
//         ctx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
//         ctx.drawImage(
//           canvas,
//           0,
//           Math.floor((sourceY * canvas.width) / imgWidth),
//           canvas.width,
//           tmpCanvas.height,
//           0,
//           0,
//           tmpCanvas.width,
//           tmpCanvas.height
//         );
//         const sliceData = tmpCanvas.toDataURL('image/png', 1.0);
//         if (position > 0) pdf.addPage();
//         pdf.addImage(sliceData, 'PNG', 0, 0, imgWidth, effectiveSliceHeight);
//         remaining -= sliceHeight;
//         sourceY += sliceHeight;
//         position += sliceHeight;
//       }
//       pdf.addPage();
//       const margin = 48;
//       pdf.setTextColor(26, 26, 26);
//       pdf.setFontSize(20);
//       pdf.text('Contact & Book', margin, 60);
//       if (logoDataUrl) {
//         try {
//           const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
//             const i = new (window as any).Image();
//             i.onload = () => resolve(i);
//             i.onerror = reject;
//             i.src = logoDataUrl;
//           });
//           const maxW = 140;
//           const maxH = 40;
//           const ratio = Math.min(maxW / imgEl.naturalWidth, maxH / imgEl.naturalHeight);
//           const logoW = Math.round(imgEl.naturalWidth * ratio);
//           const logoH = Math.round(imgEl.naturalHeight * ratio);
//           pdf.addImage(logoDataUrl, 'PNG', pageWidth - margin - logoW, 30, logoW, logoH);
//         } catch {
//           // Fallback fixed size if measurement fails
//           pdf.addImage(logoDataUrl, 'PNG', pageWidth - margin - 120, 30, 120, 36);
//         }
//       }
//       if (qrDataUrl) {
//         pdf.addImage(qrDataUrl, 'PNG', margin, 80, 140, 140);
//       }
//       pdf.setFontSize(12);
//       const contactX = margin + 160 + 20;
//       let y = 100;
//       pdf.setTextColor(0, 0, 0);
//       pdf.text('View This Tour Online', contactX, y);
//       if (pageUrl) {
//         (pdf as any).textWithLink(pageUrl, contactX, y + 18, { url: pageUrl });
//       }
//       y += 50;
//       pdf.text('Call Our Travel Expert', contactX, y);
//       if (telHref) {
//         (pdf as any).textWithLink(rawPhone || telHref, contactX, y + 18, { url: telHref });
//       }
//       y += 50;
//       pdf.text('Chat on WhatsApp', contactX, y);
//       if (waHref) {
//         (pdf as any).textWithLink('Open WhatsApp chat', contactX, y + 18, { url: waHref });
//       }
//       y += 50;
//       if (footerOneData?.contact?.email) {
//         const mailHref = `mailto:${footerOneData.contact.email}`;
//         pdf.text('Email Us', contactX, y);
//         (pdf as any).textWithLink(footerOneData.contact.email, contactX, y + 18, { url: mailHref });
//       }
//       y += 70;
//       pdf.setFontSize(20);
//       pdf.text('Map & Location', margin, y);
//       if (mapQrDataUrl) {
//         pdf.addImage(mapQrDataUrl, 'PNG', margin, y + 20, 140, 140);
//       }
//       pdf.setFontSize(12);
//       const mapTextX = margin + 160 + 20;
//       const mapTextY = y + 50;
//       if (tour?.map) {
//         pdf.setTextColor(0, 0, 0);
//         pdf.text('Open Map', mapTextX, mapTextY);
//         (pdf as any).textWithLink('View on Google Maps', mapTextX, mapTextY + 18, { url: tour.map });
//       }
//       const fileName = `${tour.title || 'tour'}.pdf`;
//       pdf.save(fileName);
//     } finally {
//       setGenerating(false);
//     }
//   };

//   const heroImage =
//     tour.sliderImages && tour.sliderImages.length > 0
//       ? getImgUrl(tour.sliderImages[0])
//       : tour.images && tour.images.length > 0
//       ? getImgUrl(tour.images[0])
//       : 'https://placehold.co/1200x800?text=Tour';

//   const gallery = (tour.images || []).slice(0, 6).map(getImgUrl).filter(Boolean);

//   return (
//     <div className="tour-listing-details__content__item">
//       <div className="d-flex align-items-center justify-content-between mb-3">
//         <h4 className="tour-listing-details__title">Download Tour PDF</h4>
//         <button
//           className="gotur-btn tour-listing-details__destination__btn"
//           onClick={onDownload}
//           disabled={generating}
//         >
//           {generating ? 'Generating...' : 'Download PDF'}
//         </button>
//       </div>
//       {/* Offscreen brochure content (not previewed on page) */}
//       <div
//         ref={pdfRef}
//         aria-hidden
//         style={{
//           position: 'absolute',
//           left: -99999,
//           top: 0,
//           width: 794,
//           padding: 24,
//           background: '#ffffff',
//           color: '#1a1a1a',
//           border: '1px solid #eee',
//           borderRadius: 8,
//           pointerEvents: 'none',
//         }}
//       >
//         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//             <Image
//               src={(footerOneData as any).logo}
//               alt="Brand logo"
//               width={140}
//               height={36}
//               style={{ objectFit: 'contain', height: 36, width: 'auto' }}
//             />
//             <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: -0.2 }}>Tour Brochure</div>
//           </div>
//           <div style={{ fontSize: 12, color: '#666' }}>{new Date().toLocaleDateString()}</div>
//         </div>
//         <div style={{ height: 4, width: '100%', background: '#b79c5c', borderRadius: 2, marginBottom: 12 }} />
//         <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
//           {(() => {
//             const rawPhone = (footerOneData?.contact?.phone || '').trim();
//             const digits = rawPhone.replace(/[^\d]/g, '');
//             const telHref = digits ? `tel:+${digits}` : '';
//             const waHref = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(`Hi! I'm interested in "${tour.title}"`)}` : '';
//             return (
//               <>
//                 {telHref && (
//                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', border: '1px solid #e9e9e9', borderRadius: 999, fontSize: 12, background: '#f9f9f9' }}>
//                     <span style={{ fontWeight: 700, color: '#1a1a1a', letterSpacing: 0.3 }}>Call</span>
//                     <span style={{ padding: '2px 8px', borderRadius: 999, background: '#fff', border: '1px solid #eee', fontWeight: 600 }}>{rawPhone}</span>
//                   </div>
//                 )}
//                 {waHref && (
//                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', border: '1px solid #e9e9e9', borderRadius: 999, fontSize: 12, background: '#f8fff8' }}>
//                     <span style={{ fontWeight: 700, color: '#1a1a1a', letterSpacing: 0.3 }}>WhatsApp</span>
//                     <span style={{ padding: '2px 8px', borderRadius: 999, background: '#fff', border: '1px solid #dfeedd', color: '#2e7d32', fontWeight: 700 }}>Available</span>
//                   </div>
//                 )}
//                 {footerOneData?.contact?.email && (
//                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', border: '1px solid #e9e9e9', borderRadius: 999, fontSize: 12, background: '#f9f9f9' }}>
//                     <span style={{ fontWeight: 700, color: '#1a1a1a', letterSpacing: 0.3 }}>Email</span>
//                     <span style={{ padding: '2px 8px', borderRadius: 999, background: '#fff', border: '1px solid #eee', fontWeight: 600 }}>{footerOneData.contact.email}</span>
//                   </div>
//                 )}
//               </>
//             );
//           })()}
//         </div>

//         <div
//           style={{
//             position: 'relative',
//             width: '100%',
//             height: 420,
//             overflow: 'hidden',
//             borderRadius: 8,
//             marginBottom: 16,
//           }}
//         >
//           <Image
//             src={heroImage}
//             alt={tour.title}
//             fill
//             sizes="100vw"
//             style={{ objectFit: 'cover' }}
//           />
//           <div
//             style={{
//               position: 'absolute',
//               left: 0,
//               right: 0,
//               bottom: 0,
//               padding: '16px 20px',
//               background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)',
//               color: '#fff',
//             }}
//           >
//             <div style={{ fontSize: 22, fontWeight: 800 }}>{tour.title}</div>
//             <div style={{ fontSize: 14, opacity: 0.95 }}>
//               {tour.location} • {tour.activateDay || ''} • From ${tour.price?.toFixed?.(0) || tour.price}
//             </div>
//           </div>
//         </div>

//         <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
//           {gallery.map((g, idx) => (
//             <div key={idx} style={{ position: 'relative', flex: '1 1 240px', minWidth: 220, height: 140, borderRadius: 8, overflow: 'hidden', background: '#f7f7f7' }}>
//               <Image src={g} alt={`Gallery ${idx + 1}`} fill sizes="400px" style={{ objectFit: 'cover' }} />
//             </div>
//           ))}
//         </div>

//         <div style={{ marginBottom: 16 }}>
//           <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{tour.overviewTitle || 'Overview'}</div>
//           <div
//             style={{ fontSize: 13, lineHeight: 1.6 }}
//             dangerouslySetInnerHTML={{ __html: tour.overview || '' }}
//           />
//         </div>

//         {tour.highlightList && tour.highlightList.length > 0 && (
//           <div style={{ marginBottom: 16 }}>
//             <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Highlights</div>
//             <ul style={{ paddingLeft: 18, margin: 0 }}>
//               {tour.highlightList.map((h, i) => (
//                 <li key={i} style={{ fontSize: 13, marginBottom: 6 }}>{h}</li>
//               ))}
//             </ul>
//           </div>
//         )}

//         {(tour.amenities?.length || 0) > 0 || (tour.amenitiesTwo?.length || 0) > 0 ? (
//           <div style={{ marginBottom: 16 }}>
//             <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Inclusions / Exclusions</div>
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
//               {(tour.amenities?.length || 0) > 0 && (
//                 <div>
//                   <div style={{ fontWeight: 700, marginBottom: 6 }}>Included</div>
//                   <ul style={{ paddingLeft: 18, margin: 0 }}>
//                     {tour.amenities.map((a, i) => (
//                       <li key={i} style={{ fontSize: 13, marginBottom: 6 }}>{a}</li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//               {(tour.amenitiesTwo?.length || 0) > 0 && (
//                 <div>
//                   <div style={{ fontWeight: 700, marginBottom: 6 }}>Excluded</div>
//                   <ul style={{ paddingLeft: 18, margin: 0 }}>
//                     {tour.amenitiesTwo.map((a, i) => (
//                       <li key={i} style={{ fontSize: 13, marginBottom: 6 }}>{a}</li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </div>
//           </div>
//         ) : null}

//         {tour.pricingPlans && tour.pricingPlans.length > 0 && (
//           <div style={{ marginBottom: 16 }}>
//             <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Pricing</div>
//             {tour.pricingPlans.map((p, i) => (
//               <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 12 }}>
//                 <div style={{ fontWeight: 700, marginBottom: 8 }}>{p.planName}</div>
//                 {p.seasons.map((s, j) => (
//                   <div key={j} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, padding: '6px 0', borderTop: j === 0 ? 'none' : '1px solid #f3f3f3' }}>
//                     <div style={{ minWidth: 160 }}>
//                       <div style={{ fontWeight: 600 }}>{s.seasonName}</div>
//                       <div style={{ opacity: 0.7 }}>{s.startDate} – {s.endDate}</div>
//                     </div>
//                     <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
//                       {typeof s.prices?.solo === 'number' && <div>Solo: ${s.prices.solo}</div>}
//                       {typeof s.prices?.pax_2_4 === 'number' && <div>2–4 pax: ${s.prices.pax_2_4}</div>}
//                       {typeof s.prices?.pax_5_8 === 'number' && <div>5–8 pax: ${s.prices.pax_5_8}</div>}
//                       {typeof s.prices?.pax_9_16 === 'number' && <div>9–16 pax: ${s.prices.pax_9_16}</div>}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ))}
//           </div>
//         )}

//         {tour.itinerary && tour.itinerary.days && tour.itinerary.days.length > 0 && (
//           <div style={{ marginBottom: 8 }}>
//             <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Itinerary</div>
//             {tour.itinerary.days.map((d, k) => (
//               <div key={k} style={{ marginBottom: 16, border: '1px solid #eee', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
//                 <div style={{ display: 'flex' }}>
//                   <div style={{ width: 8, background: '#b79c5c' }} />
//                   <div style={{ flex: 1, padding: '12px 14px' }}>
//                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
//                       <div style={{ fontWeight: 800 }}>Day {d.day}: {d.title}</div>
//                       <div style={{ fontSize: 11, color: '#666' }}>{tour.location || ''}</div>
//                     </div>
//                     <div style={{ fontSize: 13 }} dangerouslySetInnerHTML={{ __html: d.description }} />
//                     {Array.isArray(d.activities) && d.activities.some(a => (a as any)?.image?.url) && (
//                       <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
//                         {d.activities
//                           .filter(a => (a as any)?.image?.url)
//                           .slice(0, 6)
//                           .map((a, idx) => {
//                             const url = (a as any)?.image?.url as string;
//                             const heading = (a as any)?.heading || '';
//                             const descHtml = ((a as any)?.description || '') as string;
//                             const descText = descHtml.replace(/<[^>]*>/g, '').slice(0, 120) + (descHtml.length > 120 ? '…' : '');
//                             return (
//                               <div key={idx} style={{ flex: '1 1 calc(50% - 14px)', minWidth: 250, maxWidth: 'calc(50% - 14px)', border: '1px solid #eee', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
//                                 <div style={{ position: 'relative', width: '100%', height: 140, background: '#f7f7f7' }}>
//                                   <Image src={url} alt={heading || `Day ${d.day} activity`} fill sizes="400px" style={{ objectFit: 'cover' }} />
//                                 </div>
//                                 <div style={{ padding: '10px 12px' }}>
//                                   <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{heading}</div>
//                                   <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>{descText}</div>
//                                 </div>
//                               </div>
//                             );
//                           })}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         <div style={{ marginTop: 8, padding: 12, border: '1px solid #eee', borderRadius: 8, background: '#fafafa' }}>
//           <div style={{ fontWeight: 800, marginBottom: 6 }}>What You Will Love</div>
//           <div style={{ fontSize: 13 }} dangerouslySetInnerHTML={{ __html: tour.whatYouWillLoveHtml || '—' }} />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DownloadPdf;
