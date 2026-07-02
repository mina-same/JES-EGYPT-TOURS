"use client";
import React from "react";
import { Accordion } from "react-bootstrap";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Itinerary } from "../types";

interface TourPlanProps {
  itinerary?: Itinerary;
}

export const TourPlan: React.FC<TourPlanProps> = ({ itinerary }) => {
  const { t } = useTranslation("tours");
  console.log("DEBUG: Itinerary Image Data:", JSON.stringify(
    itinerary?.days?.flatMap(d => d.activities?.map(a => ({ heading: a.heading, imgUrl: a.image?.url, imgAlt: a.image?.alt, imgTitle: a.image?.title }))) || []
  ));

  if (!itinerary || !itinerary.days || itinerary.days.length === 0) {
    return null;
  }

  return (
    <div className='tour-listing-details__content__item tour-listing-details__ture-plan'>
      <h2 className='tour-listing-details__title'>{t("tourDetails.nav.tourPlan", "Tour Plan")}</h2>
      
      {itinerary.generalDescription && (
        <div 
          className="tour-plan-general-description mb-4"
          dangerouslySetInnerHTML={{ __html: itinerary.generalDescription }}
        />
      )}

      <div className='faq-page__accordion faq-accordion gotur-accordion'>
        <Accordion defaultActiveKey='0'>
          {itinerary.days.map((day, idx) => (
            <Accordion.Item eventKey={idx.toString()} key={idx}>
              <Accordion.Header as="div">
                <div className='accordion-title'>
                  <h3 className='accordion-title__text' style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="day-title" style={{ color: '#1a1a1a', fontWeight: '600', fontSize: '16px' }}>
                      <span style={{ color: '#b79c5c', fontWeight: '700' }}>{t("tourDetails.day", "Day")} {day.day}:</span> {day.title.replace(/^(?:Day|Tag|Giorno|Día|Jour)\s*\d+[:\s-]*/i, "").trim()}
                    </span>
                    <span className='accordion-title__icon'></span>
                  </h3>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <div className='accordion-content' style={{ padding: '20px 35px' }}>
                  {/* Day Description */}
                  <div 
                    style={{ 
                      marginBottom: '32px', 
                      color: '#4a4a4a', 
                      fontSize: '15px', 
                      lineHeight: '1.8',
                      fontWeight: '400'
                    }} 
                    dangerouslySetInnerHTML={{ __html: day.description }} 
                  />
                  
                  {/* Activities Timeline */}
                  {day.activities && day.activities.length > 0 && (
                    <div style={{ position: 'relative', paddingLeft: '0', marginTop: '24px' }}>
                      {day.activities.map((activity, idx) => (
                        <div 
                          key={idx} 
                          style={{ 
                            position: 'relative',
                            display: 'flex',
                            gap: '24px',
                            marginBottom: idx < day.activities.length - 1 ? '40px' : '0',
                          }}
                        >
                          {/* Left Side: Image with vertical line */}
                          <div style={{ position: 'relative', flexShrink: 0, width: '60px', minWidth: '60px' }}>
                            {/* Circular Image */}
                            {activity.image && (
                              <div 
                                style={{ 
                                  width: '60px', 
                                  height: '60px', 
                                  borderRadius: '50%',
                                  overflow: 'hidden',
                                  border: '2px solid #b79c5c',
                                  backgroundColor: '#fff',
                                  position: 'relative',
                                  zIndex: 2,
                                }}
                              >
                                <Image 
                                  src={activity.image.url} 
                                  alt={activity.image.alt || ""}
                                  title={activity.image.title || ""}
                                  width={60} 
                                  height={60} 
                                  style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover',
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Placeholder dot when no image — keeps column height = 60px so vertical line top stays correct */}
                            {!activity.image && (
                              <div
                                style={{
                                  width: '60px',
                                  height: '60px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  position: 'relative',
                                  zIndex: 2,
                                }}
                              >
                                <div
                                  style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    border: '2px solid #b79c5c',
                                    backgroundColor: '#fff',
                                  }}
                                />
                              </div>
                            )}

                            {/* Vertical connecting line */}
                            {idx < day.activities.length - 1 && (
                              <div 
                                style={{ 
                                  position: 'absolute',
                                  left: '50%',
                                  top: '60px',
                                  transform: 'translateX(-50%)',
                                  width: '2px',
                                  height: 'calc(100% + 40px)',
                                  backgroundColor: '#E5E7EB',
                                  zIndex: 1,
                                }} 
                              />
                            )}
                          </div>
                          
                          {/* Right Side: Content */}
                          <div style={{ 
                            flex: 1,
                            paddingTop: '4px',
                          }}>
                            <h5 
                              style={{ 
                                fontSize: '17px', 
                                fontWeight: '700', 
                                color: '#1a1a1a', 
                                margin: '0 0 8px 0',
                                lineHeight: '1.4'
                              }}
                            >
                              {activity.heading}
                            </h5>
                            <div 
                              style={{ 
                                fontSize: '14px', 
                                color: '#666', 
                                lineHeight: '1.7', 
                                margin: 0 
                              }} 
                              dangerouslySetInnerHTML={{ __html: activity.description }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </div>
  );
};
