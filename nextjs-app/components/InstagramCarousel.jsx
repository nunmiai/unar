import { useState, useRef, useEffect } from "react";

/**
 * Extracts the iframe embed URL from an Instagram post/reel URL.
 */
function getEmbedUrl(url) {
  try {
    const u = new URL(url.endsWith("/") ? url : url + "/");
    return `${u.origin}${u.pathname}embed/`;
  } catch {
    return null;
  }
}

/**
 * Single branded video card.
 * Shows a beautiful UNAR-styled placeholder — clicking opens the video in a modal.
 */
function VideoCard({ url, index, onPlay }) {
  const embedUrl = getEmbedUrl(url);

  // Gradient palettes matching UNAR brand
  const gradients = [
    "linear-gradient(135deg, #5a7c65 0%, #3d5c49 50%, #2d3436 100%)",
    "linear-gradient(135deg, #d4a574 0%, #b8895a 50%, #5a7c65 100%)",
    "linear-gradient(135deg, #475f50 0%, #5a7c65 50%, #d4a574 100%)",
    "linear-gradient(135deg, #2d3436 0%, #475f50 60%, #5a7c65 100%)",
  ];
  const bg = gradients[index % gradients.length];

  // Decorative botanical patterns per card
  const labels = ["Scent Review", "Product Review", "Customer Story", "Unboxing"];
  const label = labels[index % labels.length];

  return (
    <div className="igc-card" onClick={() => embedUrl && onPlay(embedUrl)}>
      {/* Gradient background */}
      <div className="igc-card-bg" style={{ background: bg }}>
        {/* Decorative leaf pattern */}
        <svg className="igc-card-leaf" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M100 10 C60 40, 20 80, 30 140 C40 180, 80 190, 100 190 C120 190, 160 180, 170 140 C180 80, 140 40, 100 10Z" fill="rgba(255,255,255,0.05)" />
          <path d="M100 40 C75 60, 55 90, 60 130 C65 160, 85 170, 100 170 C115 170, 135 160, 140 130 C145 90, 125 60, 100 40Z" fill="rgba(255,255,255,0.05)" />
          <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
        </svg>

        {/* Top badge */}
        <div className="igc-card-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
          {label}
        </div>

        {/* UNAR watermark */}
        <span className="igc-card-watermark">UNAR</span>

        {/* Play button */}
        <button className="igc-play-btn" aria-label="Play video review">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>

        {/* Bottom info */}
        <div className="igc-card-footer">
          <p className="igc-card-cta">Tap to watch</p>
          <div className="igc-card-divider" />
          <p className="igc-card-brand">unar.consciousliving</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Lightbox modal — renders the actual Instagram iframe only when opened.
 */
function VideoModal({ embedUrl, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="igc-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="igc-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="igc-modal-close" onClick={onClose} aria-label="Close video">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Instagram label */}
        <div className="igc-modal-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
          @unar.consciousliving
        </div>

        {/* The iframe */}
        <div className="igc-modal-player">
          <iframe
            src={embedUrl}
            title="Instagram Video Review"
            frameBorder="0"
            scrolling="no"
            allowtransparency="true"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            className="igc-modal-iframe"
          />
        </div>

        <p className="igc-modal-hint">Press <kbd>Esc</kbd> or click outside to close</p>
      </div>
    </div>
  );
}

/**
 * Main carousel component.
 */
export default function InstagramCarousel({ urls = [] }) {
  const [activeEmbed, setActiveEmbed] = useState(null);
  const [scrollPos, setScrollPos] = useState(0);
  const trackRef = useRef(null);
  const total = urls.length;

  // Horizontal drag scroll on desktop
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);

  const onMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - trackRef.current.offsetLeft;
    startScroll.current = trackRef.current.scrollLeft;
    trackRef.current.style.cursor = "grabbing";
  };
  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    const x = e.pageX - trackRef.current.offsetLeft;
    trackRef.current.scrollLeft = startScroll.current - (x - startX.current);
  };
  const onMouseUp = () => {
    isDragging.current = false;
    if (trackRef.current) trackRef.current.style.cursor = "grab";
  };

  if (total === 0) return null;

  return (
    <>
      {/* Carousel strip */}
      <div className="igc-wrapper">
        {/* Handle badge */}
        <a
          href="https://www.instagram.com/unar.consciousliving/"
          target="_blank"
          rel="noopener noreferrer"
          className="igc-handle"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
          @unar.consciousliving · Video Reviews
        </a>

        {/* Scrollable card strip */}
        <div
          ref={trackRef}
          className="igc-track"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {urls.map((url, i) => (
            <VideoCard key={url} url={url} index={i} onPlay={setActiveEmbed} />
          ))}
        </div>

        {/* Scroll hint */}
        {total > 2 && (
          <p className="igc-scroll-hint">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Drag to see more
          </p>
        )}

        {/* <a
          href="https://www.instagram.com/unar.consciousliving/"
          target="_blank"
          rel="noopener noreferrer"
          className="igc-follow"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
          Follow us for more
        </a> */}
      </div>

      {/* Video modal — only mounted when a card is clicked */}
      {activeEmbed && (
        <VideoModal embedUrl={activeEmbed} onClose={() => setActiveEmbed(null)} />
      )}
    </>
  );
}
