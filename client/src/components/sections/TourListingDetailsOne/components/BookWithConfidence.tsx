import React from 'react';
import { Container } from 'react-bootstrap';
import { Calendar, Headphones, Tag, Star, Zap } from 'lucide-react';

const CONFIDENCE_ITEMS = [
  { title: 'Pay Monthly', icon: Calendar },
  { title: '24/7 Support', icon: Headphones },
  { title: 'Best Prices', icon: Tag },
  { title: 'Rated 5* Stars', icon: Star },
  { title: 'Fast Booking', icon: Zap }
] as const;

export const BookWithConfidence: React.FC = () => {
  return (
    <Container
      fluid
      style={{ maxWidth: '1400px', padding: '0 20px' }}
      className="info-area info-bg pb-3 py-4"
    >
      <div className="row align-items-center">
        <div className="col-lg-4">
          <div className="section-heading" style={{ marginBottom: '0' }}>
            <h2 className="sec__title" style={{ color: '#1a1a1a', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '10px' }}>
              Book With Confidence
            </h2>
            <p className="sec__desc" style={{ color: '#666', fontWeight: '400', letterSpacing: '0px', marginBottom: '0' }}>
              Your trusted partner for unforgettable Egyptian adventures
            </p>
          </div>
        </div>
        <div className="col-lg-8">
          <div className="d-flex justify-content-center align-items-center flex-wrap" style={{ gap: '20px' }}>
            {CONFIDENCE_ITEMS.map((item, idx) => (
              <div key={idx} className="text-center" style={{ minWidth: '120px' }}>
                <div className="info-icon flex-shrink-0 bg-white shadow-sm mx-auto mb-2" style={{
                  width: '70px',
                  height: '70px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  border: '1.5px solid #b79c5c',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 8px 16px rgba(183, 156, 92, 0.15)'
                }}>
                  <item.icon size={35} color="#b79c5c" />
                </div>
                <h4 className="info__title" style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '600', margin: '0' }}>
                  {item.title}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
};
