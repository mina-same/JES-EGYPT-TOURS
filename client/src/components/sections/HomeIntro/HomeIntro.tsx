"use client";

import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { generalContentAPI } from "@/lib/api/generalContent";
import { Loader2, ChevronDown, ChevronUp, MapPin, Star, ShieldCheck } from "lucide-react";
import Image from "next/image";

interface HomeContent {
  title: string;
  subtitle?: string;
  content: string;
}

const HomeIntro: React.FC = () => {
  const [content, setContent] = useState<HomeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await generalContentAPI.getBySlug("home-intro");
        if (response.success) {
          setContent(response.data);
        }
      } catch (err) {
        console.error("Error fetching home intro:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#b79c5c]" size={40} />
      </div>
    );
  }

  if (!content) return null;

  // Split title to style the part after colon differently
  const titleParts = content.title.split(':');
  const mainTitle = titleParts[0];
  const highlightTitle = titleParts[1] ? titleParts[1].trim() : "";

  return (
    <section className="relative py-20 overflow-hidden bg-[#fafafa]">
      <Container>
        <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] border border-gray-100/50 overflow-hidden relative">
          
          {/* Decorative Background Accents */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#b79c5c]/5 rounded-full -mr-32 -mt-32 blur-[80px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#1a1a1a]/5 rounded-full -ml-20 -mb-20 blur-[60px] pointer-events-none"></div>

          <Row className="g-0 items-stretch">
            {/* Content Side */}
            <Col lg={7} className="p-8 md:p-12 lg:p-20 flex flex-col justify-center order-2 lg:order-1 relative z-10">
              <div className="space-y-8">
                
                {/* Decorative Badge */}
                <div className="inline-flex items-center gap-3">
                  <div className="w-12 h-[2px] bg-[#b79c5c] rounded-full"></div>
                  <span className="text-[#b79c5c] font-black uppercase tracking-[0.25em] text-[10px] md:text-xs">
                    {content.subtitle || "The Ultimate Egyptian Journey"}
                  </span>
                </div>

                {/* Impactful Heading */}
                <h2 className="text-[#1a1a1a] font-extrabold text-3xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight">
                  {mainTitle}
                  {highlightTitle && (
                    <span className="block text-[#b79c5c] mt-3 italic font-serif font-normal opacity-95 low-italic-fix">
                      {highlightTitle}
                    </span>
                  )}
                </h2>

                {/* Narrative with Smart Expansion */}
                <div className="relative group">
                  <div 
                    className={`transition-all duration-1000 ease-in-out overflow-hidden prose prose-lg max-w-none text-gray-500 font-medium leading-[1.8]`}
                    style={{ 
                      maxHeight: isExpanded ? '4000px' : '220px',
                    }}
                  >
                    <div 
                      className="narrative-html"
                      dangerouslySetInnerHTML={{ __html: content.content }}
                    />
                  </div>
                  
                  {!isExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none transition-opacity duration-500"></div>
                  )}
                </div>

                {/* Interactive Controls & Social Proof */}
                <div className="flex flex-wrap items-center justify-between gap-8 pt-4">
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="group flex items-center gap-2 text-[#1a1a1a] font-black uppercase text-[11px] tracking-widest border-b-2 border-[#b79c5c] pb-1 hover:text-[#b79c5c] transition-all duration-300"
                  >
                    {isExpanded ? (
                      <>Show Less <ChevronUp size={16} className="group-hover:-translate-y-1 transition-transform" /></>
                    ) : (
                      <>Read Full Story <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" /></>
                    )}
                  </button>

                  <div className="flex items-center gap-6">
                    <div className="flex -space-x-2">
                       {[1,2,3,4].map(i => (
                         <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                         </div>
                       ))}
                       <div className="w-8 h-8 rounded-full border-2 border-white bg-[#1a1a1a] flex items-center justify-center text-[8px] font-bold text-white">15K+</div>
                    </div>
                    <div className="flex flex-col">
                       <div className="flex items-center gap-1">
                          <span className="text-[#1a1a1a] font-bold text-sm">4.9/5</span>
                          <div className="flex">
                             <Star size={10} fill="#b79c5c" color="#b79c5c" />
                             <Star size={10} fill="#b79c5c" color="#b79c5c" />
                          </div>
                       </div>
                       <span className="text-[9px] uppercase font-bold text-gray-400 tracking-tighter">Verified Ratings</span>
                    </div>
                  </div>
                </div>

                {/* Trust Footer */}
                <div className="pt-10 border-t border-gray-100 flex flex-wrap gap-x-10 gap-y-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={22} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">Licensed Agency</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={22} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">Local Heritage Experts</span>
                  </div>
                </div>
              </div>
            </Col>

            {/* Visual Side */}
            <Col lg={5} className="relative min-h-[500px] lg:min-h-full order-1 lg:order-2">
              <div className="absolute inset-0">
                <Image 
                  src="https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?q=80&w=2070&auto=format&fit=crop"
                  alt="Majestic Giza Pyramids"
                  fill
                  className="object-cover transition-transform duration-[20s] hover:scale-110 ease-out"
                  priority
                />
                
                {/* Sophisticated Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/90 via-transparent to-transparent lg:bg-gradient-to-l lg:from-[#1a1a1a]/40 lg:via-transparent"></div>
                
                {/* Floating Discovery Badge */}
                <div className="absolute bottom-10 left-10 right-10 md:left-auto md:w-64 bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] border border-white/20 text-white shadow-2xl animate-float">
                   <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                         <div className="w-2.5 h-2.5 rounded-full bg-[#b79c5c]"></div>
                         <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-[#b79c5c] animate-ping opacity-75"></div>
                      </div>
                      <span className="text-[10px] uppercase font-black tracking-[0.2em]">Live Insights</span>
                   </div>
                   <p className="text-sm font-medium leading-relaxed italic opacity-95">"Experience the dawn rising over the Sphinx precisely as the ancients intended."</p>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Container>

      <style jsx global>{`
        .narrative-html p {
          margin-bottom: 1.5rem;
        }
        .narrative-html p:last-child {
          margin-bottom: 0;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        @media (max-width: 991px) {
          .low-italic-fix {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </section>
  );
};

export default HomeIntro;
