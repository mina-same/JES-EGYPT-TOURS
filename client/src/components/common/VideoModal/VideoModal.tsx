"use client";
import React, { useEffect, useMemo, useState } from "react";

interface VideoModalProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  id?: string;
  ids?: string[];
  channel?: "youtube" | "vimeo";
}

const VideoModal: React.FC<VideoModalProps> = ({ 
  isOpen, 
  setOpen, 
  id,
  ids,
  channel = "youtube" 
}) => {
  const [current, setCurrent] = useState(0);

  const activeId = useMemo(() => {
    if (ids && ids.length > 0) return ids[Math.max(0, Math.min(current, ids.length - 1))];
    return id || "";
  }, [ids, current, id]);

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
      return `https://www.youtube.com/embed/${activeId}?autoplay=1&rel=0`;
    }
    return `https://player.vimeo.com/video/${activeId}?autoplay=1`;
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
        {ids && ids.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c - 1 + ids.length) % ids.length)}
              style={{
                position: "absolute",
                left: "-50px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "30px",
                cursor: "pointer",
              }}
              aria-label="Previous video"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % ids.length)}
              style={{
                position: "absolute",
                right: "-50px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "30px",
                cursor: "pointer",
              }}
              aria-label="Next video"
            >
              ›
            </button>
          </>
        )}
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
