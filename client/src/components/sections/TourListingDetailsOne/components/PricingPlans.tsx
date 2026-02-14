import React from "react";
import { PricingPlan } from "./types";

interface PricingPlansProps {
  pricingPlans?: PricingPlan[];
}

export const PricingPlans: React.FC<PricingPlansProps> = ({ pricingPlans }) => {
  if (!pricingPlans || pricingPlans.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#999',
        backgroundColor: '#F9F9F9',
        borderRadius: '8px'
      }}>
        <i className="fas fa-dollar-sign" style={{ fontSize: '48px', color: '#ddd', marginBottom: '15px' }}></i>
        <p style={{ margin: 0, fontSize: '16px' }}>
          Pricing information is not available for this tour. Please contact us for details.
        </p>
      </div>
    );
  }

  return (
    <div className="pricing-plans-container">
      {pricingPlans.map((plan, planIdx) => (
        <div key={planIdx} className="pricing-plan-card" style={{
          marginBottom: '40px',
          border: '2px solid rgba(183, 156, 92, 0.2)',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          {/* Plan Header */}
          <div style={{
            background: 'linear-gradient(135deg, #b79c5c 0%, #a68b4b 100%)',
            padding: '20px 30px',
            color: '#fff'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {plan.planName}
            </h3>
          </div>

          {/* Seasons */}
          <div style={{ padding: '30px' }}>
            {plan.seasons.map((season, seasonIdx) => (
              <div key={seasonIdx} style={{
                marginBottom: seasonIdx < plan.seasons.length - 1 ? '35px' : '0',
                paddingBottom: seasonIdx < plan.seasons.length - 1 ? '35px' : '0',
                borderBottom: seasonIdx < plan.seasons.length - 1 ? '1px solid #E8E8E8' : 'none'
              }}>
                {/* Season Header */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <i className="fas fa-calendar-alt" style={{ color: '#b79c5c' }}></i>
                    {season.seasonName}
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: '#666',
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    {new Date(season.startDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })} - {new Date(season.endDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>

                {/* Price Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px',
                  marginBottom: season.notes && season.notes.length > 0 ? '20px' : '0'
                }}>
                  {season.prices.solo !== undefined && (
                    <PriceCard 
                      icon="fa-user"
                      label="Solo Traveler"
                      price={season.prices.solo}
                    />
                  )}

                  {season.prices.pax_2_4 !== undefined && (
                    <PriceCard 
                      icon="fa-users"
                      label="2-4 Travelers"
                      price={season.prices.pax_2_4}
                    />
                  )}

                  {season.prices.pax_5_8 !== undefined && (
                    <PriceCard 
                      icon="fa-users"
                      label="5-8 Travelers"
                      price={season.prices.pax_5_8}
                    />
                  )}

                  {season.prices.pax_9_16 !== undefined && (
                    <PriceCard 
                      icon="fa-users"
                      label="9-16 Travelers"
                      price={season.prices.pax_9_16}
                    />
                  )}
                </div>

                {/* Season Notes */}
                {season.notes && season.notes.length > 0 && (
                  <div style={{
                    marginTop: '20px',
                    padding: '15px 20px',
                    backgroundColor: '#FFF9F0',
                    borderLeft: '4px solid #b79c5c',
                    borderRadius: '4px'
                  }}>
                    {season.notes.map((note, noteIdx) => (
                      <div key={noteIdx} style={{ marginBottom: noteIdx < season.notes!.length - 1 ? '12px' : '0' }}>
                        <h5 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#1a1a1a',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <i className="fas fa-info-circle" style={{ color: '#b79c5c', fontSize: '12px' }}></i>
                          {note.title}
                        </h5>
                        <p style={{
                          fontSize: '13px',
                          color: '#666',
                          margin: 0,
                          lineHeight: '1.6',
                          paddingLeft: '20px'
                        }}>
                          {note.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Pricing Info Footer */}
      <div style={{
        padding: '20px',
        backgroundColor: '#F5F5F5',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <p style={{
          fontSize: '14px',
          color: '#666',
          margin: 0,
          lineHeight: '1.6',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          <i className="fas fa-lightbulb" style={{ color: '#b79c5c', marginTop: '3px' }}></i>
          <span>
            <strong>Note:</strong> Prices are per person and may vary based on availability and booking date. 
            Group discounts apply automatically based on the number of travelers. 
            Contact us for custom quotes or special requests.
          </span>
        </p>
      </div>
    </div>
  );
};

// Helper component for price cards
const PriceCard: React.FC<{ icon: string; label: string; price: number }> = ({ icon, label, price }) => (
  <div style={{
    padding: '20px',
    backgroundColor: '#F9F6F1',
    borderRadius: '8px',
    border: '1px solid rgba(183, 156, 92, 0.2)',
    textAlign: 'center'
  }}>
    <div style={{
      fontSize: '14px',
      color: '#666',
      marginBottom: '8px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px'
    }}>
      <i className={`fas ${icon}`} style={{ color: '#b79c5c', fontSize: '12px' }}></i>
      {label}
    </div>
    <div style={{
      fontSize: '28px',
      fontWeight: '700',
      color: '#b79c5c'
    }}>
      ${price}
    </div>
    <div style={{
      fontSize: '12px',
      color: '#999',
      marginTop: '4px'
    }}>
      per person
    </div>
  </div>
);
