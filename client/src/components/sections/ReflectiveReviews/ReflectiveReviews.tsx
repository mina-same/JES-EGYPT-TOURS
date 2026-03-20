"use client";

import React, { useEffect, useState } from "react";
import { Container, Row, Col, Modal } from "react-bootstrap";
import { videoReviewAPI, VideoReview } from "@/lib/api/videoReview";
import { Loader2, Play, X } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { getLocalizedValue } from "@/lib/localize";

const ReflectiveReviews: React.FC = () => {
  const { i18n } = useTranslation();
  const [videos, setVideos] = useState<VideoReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<VideoReview | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await videoReviewAPI.getAll();
        if (response.success && response.data) {
          setVideos(response.data.slice(0, 6));
        }
      } catch (err) {
        console.error("Error fetching reflective reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handlePlay = (video: VideoReview) => {
    setPlayingVideo(video);
  };

  const handleClose = () => {
    setPlayingVideo(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-[#b79c5c]" />
      </div>
    );
  }

  if (videos.length === 0) return null;

  return (
    <section className="reflective-reviews section-space bg-[#fafafa]" id="reflective-reviews">
      <Container>
        <div className="sec-title text-center mb-10">
            <h6 className="sec-title__tagline bw-split-in-right">Travelers Honest Experiences</h6>
            <h3 className="sec-title__title bw-split-in-left">Reflective & <span className="text-[#b79c5c]">Honest Reviews</span></h3>
            <p className="mt-3 text-gray-500 max-w-2xl mx-auto text-lg">
              Watch authentic stories from travelers who explored the magic of Egypt with JES Egypt Tours.
            </p>
        </div>
        
        <Row className="gutter-y-30">
          {videos.map((v, idx) => (
            <Col lg={4} md={6} key={v._id || idx}>
              <div className="review-card group bg-white rounded-[2rem] overflow-hidden shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100 h-100 flex flex-col transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(183,156,92,0.15)] hover:-translate-y-2">
                
                {/* Thumbnail Header */}
                <div className="relative aspect-video overflow-hidden cursor-pointer" onClick={() => handlePlay(v)}>
                  <Image 
                    src={v.thumbnail || `https://img.youtube.com/vi/${v.videoId}/maxresdefault.jpg`}
                    alt={getLocalizedValue(v.title, i18n.language)}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500 flex items-center justify-center">
                    <div className="w-16 h-16 bg-[#b79c5c] rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-500 group-hover:scale-110 group-hover:bg-white text-white group-hover:text-[#b79c5c]">
                      <Play fill="currentColor" size={24} className="ml-1" />
                    </div>
                  </div>
                  
                  {/* YouTube Tag */}
                  <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Video Experience</span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#b79c5c]"></div>
                    <span className="text-[#b79c5c] text-[11px] font-black uppercase tracking-widest">
                      {getLocalizedValue(v.tourName, i18n.language)}
                    </span>
                  </div>
                  <h5 className="text-[#1a1a1a] font-bold text-xl leading-snug mb-4 flex-grow">
                    {getLocalizedValue(v.title, i18n.language)}
                  </h5>
                  
                  <button 
                    onClick={() => handlePlay(v)}
                    className="flex items-center gap-2 text-[#1a1a1a] font-black uppercase text-[10px] tracking-widest group/btn hover:text-[#b79c5c] transition-colors"
                  >
                    Watch Story 
                    <div className="w-6 h-[1px] bg-gray-200 group-hover/btn:bg-[#b79c5c] group-hover/btn:w-10 transition-all"></div>
                  </button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Video Modal */}
      <Modal 
        show={!!playingVideo} 
        onHide={handleClose}
        size="lg"
        centered
        className="video-review-modal"
        contentClassName="bg-transparent border-0"
      >
        <div className="relative pt-[56.25%] bg-black rounded-3xl overflow-hidden shadow-2xl">
          <button 
            onClick={handleClose}
            className="absolute -top-12 right-0 text-white hover:text-[#b79c5c] transition-colors z-[1060]"
          >
            <X size={32} />
          </button>
          {playingVideo && (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${playingVideo.videoId}?autoplay=1`}
              title={getLocalizedValue(playingVideo.title, i18n.language)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          )}
        </div>
      </Modal>

      <style jsx global>{`
        .video-review-modal .modal-dialog {
          max-width: 900px;
        }
        @media (max-width: 576px) {
          .video-review-modal .modal-dialog {
            margin: 1rem;
          }
        }
      `}</style>
    </section>
  );
};

export default ReflectiveReviews;
