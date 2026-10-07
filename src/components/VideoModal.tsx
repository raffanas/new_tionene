"use client";

import React, { useEffect } from "react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

function getYouTubeEmbedUrl(url: string): string {
  if (!url) return "";
  const vMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (vMatch && vMatch[1]) {
    return `https://www.youtube.com/embed/${vMatch[1]}?autoplay=1&rel=0`;
  }
  return url;
}

export default function VideoModal({
  isOpen,
  onClose,
  videoUrl,
  title,
}: VideoModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !videoUrl) return null;

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <div
      className="video-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Vídeo"}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="video-modal-container">
        <div className="video-modal-header">
          <div className="video-modal-title-wrapper">
            <span className="video-modal-badge">VÍDEO EXPLICATIVO</span>
            {title && <h3 className="video-modal-title">{title}</h3>}
          </div>
          <button
            type="button"
            className="video-modal-close"
            onClick={onClose}
            aria-label="Fechar vídeo"
          >
            ✕
          </button>
        </div>
        <div className="video-modal-player-wrapper">
          <iframe
            className="video-modal-iframe"
            src={embedUrl}
            title={title || "Vídeo Tio Nenê"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
