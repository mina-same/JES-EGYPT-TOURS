'use client';
import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { ArrowRight, Calendar, Users, Map, Headphones } from 'lucide-react';
import Link from 'next/link';

interface BannerCTAProps {
  locale: string;
}

const BannerCTA: React.FC<BannerCTAProps> = ({ locale }) => {
  return (
    <section className="banner-cta section-space-bottom pt-5">
      <Container>
        <div className="banner-cta__wrapper" style={{ backgroundColor: '#fdf7f0', borderRadius: '24px', padding: '50px', position: 'relative', overflow: 'hidden', border: '1px solid #f0e6d8' }}>
          <Row className="align-items-center position-relative" style={{ zIndex: 2 }}>
            <Col lg={7}>
              <div className="banner-cta__left">
                <h2 className="banner-cta__title" style={{ fontSize: '42px', fontWeight: 800, color: '#1d231f', marginBottom: '15px' }}>Inspired by Your Reading?</h2>
                <p className="banner-cta__text" style={{ fontSize: '18px', color: '#666', marginBottom: '35px', maxWidth: '500px' }}>
                  Turn your travel dreams into reality with a personalized itinerary designed uniquely for you by our local experts.
                </p>
                <div className="banner-cta__btns" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <Link href={`/${locale}/tailorMade`} className="gotur-btn" style={{ background: '#b79c5c', color: 'white', borderRadius: '12px', padding: '16px 32px', fontWeight: 700, display: 'flex', alignItems: 'center', border: 'none', textDecoration: 'none' }}>
                    Plan Your Tailor-Made Trip <ArrowRight className="ms-2" size={18} />
                  </Link>
                  <Link href={`/${locale}/tours`} className="btn-white" style={{ backgroundColor: 'white', color: '#1d231f', padding: '16px 32px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', border: '1px solid #e5e5e5', textDecoration: 'none' }}>
                    Explore All Tours <Calendar className="ms-2" size={18} />
                  </Link>
                </div>
              </div>
            </Col>
            <Col lg={5}>
              <div className="banner-cta__right" style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                <div className="banner-cta__divider d-none d-lg-block" style={{ width: '1px', height: '150px', backgroundColor: '#e5d8c5' }} />
                <div className="banner-cta__features" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                  <div className="banner-cta__feature" style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                    <div className="banner-cta__feature-icon" style={{ color: '#b79c5c' }}>
                      <Users size={24} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1d231f', margin: 0 }}>Expert Local Guides</h4>
                      <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>Knowledgeable & friendly</p>
                    </div>
                  </div>
                  <div className="banner-cta__feature" style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                    <div className="banner-cta__feature-icon" style={{ color: '#b79c5c' }}>
                      <Map size={24} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1d231f', margin: 0 }}>Custom Itineraries</h4>
                      <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>Tailored to your interests</p>
                    </div>
                  </div>
                  <div className="banner-cta__feature" style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                    <div className="banner-cta__feature-icon" style={{ color: '#b79c5c' }}>
                      <Headphones size={24} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1d231f', margin: 0 }}>24/7 Support</h4>
                      <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>We're here to help anytime</p>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
          
          {/* Background decoration */}
          <div className="banner-cta__decoration" style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1, zIndex: 1, pointerEvents: 'none' }}>
             <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 250H350V100L200 50L50 100V250Z" stroke="#b79c5c" strokeWidth="2" />
                <path d="M100 250V150" stroke="#b79c5c" strokeWidth="2" />
                <path d="M300 250V150" stroke="#b79c5c" strokeWidth="2" />
                <circle cx="320" cy="60" r="30" stroke="#b79c5c" strokeWidth="2" />
                <path d="M320 20V40" stroke="#b79c5c" strokeWidth="2" />
                <path d="M320 80V100" stroke="#b79c5c" strokeWidth="2" />
                <path d="M280 60H300" stroke="#b79c5c" strokeWidth="2" />
                <path d="M340 60H360" stroke="#b79c5c" strokeWidth="2" />
             </svg>
          </div>
        </div>
      </Container>
      
      <style jsx>{`
        @media (max-width: 991px) {
          .banner-cta__right {
            margin-top: 40px !important;
            padding-top: 40px !important;
            border-top: 1px solid #e5d8c5 !important;
            width: 100%;
          }
          .banner-cta__title {
            font-size: 32px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default BannerCTA;
