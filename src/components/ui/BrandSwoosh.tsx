import React from 'react';

/** Trazos curvos del logo que se dibujan al montarse (como en el diseño nuevo). */
export const BrandSwoosh: React.FC<{ className?: string; animated?: boolean }> = ({ className = '', animated = true }) => {
  const draw = animated ? 'animate-draw' : '';
  return (
    <svg viewBox="0 0 800 600" fill="none" aria-hidden="true" className={`pointer-events-none ${className}`}>
      <defs>
        <linearGradient id="bsw-a" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="bsw-b" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#69bdd7" stopOpacity="0" />
          <stop offset="0.6" stopColor="#69bdd7" stopOpacity="1" />
          <stop offset="1" stopColor="#2c84c4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className={draw} d="M-40 470 C 180 330, 420 250, 840 120" stroke="url(#bsw-a)" strokeWidth="4.5" strokeLinecap="round" />
      <path className={draw} style={{ animationDelay: '0.25s' }} d="M-40 520 C 220 400, 500 330, 840 230" stroke="url(#bsw-b)" strokeWidth="3.2" strokeLinecap="round" />
      <path className={draw} style={{ animationDelay: '0.5s' }} d="M60 600 C 300 460, 560 380, 840 340" stroke="url(#bsw-a)" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
};
