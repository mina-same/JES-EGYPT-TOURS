"use client";
import React, { useEffect } from "react";

interface VideoModalProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  id: string;
  channel?: "youtube" | "vimeo";
}

const VideoModal: React.FC<VideoModalProps> = ({ 
  isOpen, 
  setOpen, 
  id, 
  channel = "youtube" 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getVideoUrl = () => {
    if (channel === "youtube") {
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    }
    return `https://player.vimeo.com/video/${id}?autoplay=1`;
  };

  return (
    <div
      className="video-modal-overlay"
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        className="video-modal-content"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "900px",
          aspectRatio: "16 / 9",
        }}
      >
        <button
          onClick={() => setOpen(false)}
          style={{
            position: "absolute",
            top: "-40px",
            right: "0",
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "30px",
            cursor: "pointer",
            padding: "0",
            width: "40px",
            height: "40px",
            lineHeight: "40px",
          }}
          aria-label="Close video"
        >
          ×
        </button>
        <iframe
          src={getVideoUrl()}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default VideoModal;
