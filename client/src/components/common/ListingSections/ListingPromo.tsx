'use client';
import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/localize';

interface ListingPromoProps {
  title?: any;
  description?: any;
  locale: string;
}

const ListingPromo: React.FC<ListingPromoProps> = ({ title, description, locale }) => {
  const { t } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!title && !description) return null;

  const promoTitle = getLocalizedValue(title, locale);
  const promoDesc = getLocalizedValue(description, locale);

  const shouldShowReadMore = promoDesc && promoDesc.length > 500;

  return (
    <section className="contact-page section-space-bottom mt-5">
      <Container>
        <div className="contact-page__contact p-8 md:p-12 rounded-[2rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] bg-white border border-gray-100/50">
          <div className="sec-title text-start mb-4">
            {promoTitle && <h3 className="sec-title__title">{promoTitle}</h3>}
          </div>
          
          <div className="relative group">
            <div 
              className="text-base lg:text-lg text-gray-500 mb-2 leading-relaxed prose max-w-none text-left overflow-hidden transition-all duration-700 ease-in-out" 
              style={{ 
                maxHeight: isExpanded ? '4000px' : '200px',
              }}
              dangerouslySetInnerHTML={{ __html: promoDesc }} 
            />
            
            {!isExpanded && shouldShowReadMore && (
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none transition-opacity duration-500"></div>
            )}
          </div>

          {shouldShowReadMore && (
            <div className="mt-4 pt-2 border-t border-gray-100 flex justify-start">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="group flex items-center gap-2 text-[#1a1a1a] font-black uppercase text-[11px] tracking-widest border-b-2 border-[#b79c5c] pb-1 hover:text-[#b79c5c] transition-all duration-300"
              >
                {isExpanded ? (
                  <>Show Less <ChevronUp size={16} className="group-hover:-translate-y-1 transition-transform" /></>
                ) : (
                  <>Read More <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" /></>
                )}
              </button>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
};

export default ListingPromo;
