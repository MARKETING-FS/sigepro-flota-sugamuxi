import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'icon-only';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

/**
 * Emblema / Isotipo oficial de Flota Sugamuxi S.A.
 * Renderiza la imagen corporativa oficial con fallback integrado a SVG.
 */
export const FlotaSugamuxiEmblem: React.FC<{
  className?: string;
  isDark?: boolean;
  color?: string;
}> = ({
  className = 'w-full h-full',
  isDark = false,
}) => {
  const [imageError, setImageError] = React.useState(false);

  if (imageError) {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="fsGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id="fsGradSecondary" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="22"
          fill={isDark ? '#0b1329' : '#f0f7ff'}
          stroke={isDark ? '#1e3a8a' : '#bae6fd'}
          strokeWidth="2.5"
        />
        <path
          d="M 22 28 C 42 16 68 18 84 30 C 74 34 62 33 46 36 C 34 38 27 44 22 50 C 21 42 21 34 22 28 Z"
          fill="url(#fsGradSecondary)"
        />
        <path
          d="M 32 30 C 36 30 40 32 40 36 L 36 74 C 36 78 32 80 28 80 C 24 80 24 76 25 72 L 30 36 C 30 32 31 30 32 30 Z"
          fill="url(#fsGradPrimary)"
        />
        <path
          d="M 34 46 L 56 42 C 60 41 62 43 60 47 C 58 50 55 51 51 51 L 33 55 Z"
          fill="url(#fsGradSecondary)"
        />
        <path
          d="M 72 40 C 66 36 58 37 54 41 C 50 45 52 50 58 53 C 68 58 74 63 70 71 C 66 79 54 82 44 79 C 39 77 36 74 35 70 C 39 71 44 71 48 70 C 56 68 60 64 61 59 C 62 55 57 52 50 48 C 42 43 42 35 48 29 C 55 23 68 24 76 30 C 76 33 74 37 72 40 Z"
          fill="url(#fsGradPrimary)"
        />
        <circle cx="74" cy="32" r="4.5" fill="#38bdf8" />
      </svg>
    );
  }

  return (
    <img
      src="/logo-flota.png"
      alt="Flota Sugamuxi S.A."
      className={`${className} object-contain select-none`}
      onError={() => setImageError(true)}
      loading="eager"
    />
  );
};

/**
 * Logotipo oficial de SIGEPRO / Flota Sugamuxi S.A.
 */
export const FlotaSugamuxiLogo: React.FC<LogoProps> = ({
  className = '',
  variant = 'light',
  size = 'md',
  showSubtitle = true,
}) => {
  const isDark = variant === 'dark';

  const sizeContainerClasses = {
    xs: 'w-7 h-7 p-0.5',
    sm: 'w-9 h-9 p-1',
    md: 'w-11 h-11 p-1.5',
    lg: 'w-14 h-14 p-2',
    xl: 'w-20 h-20 p-2.5',
  }[size];

  const sizeTextClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Contenedor oficial para el logo con fondo blanco que garantiza máximo contraste */}
      <div
        className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden transition-all bg-white shadow-2xs border ${
          isDark
            ? 'border-blue-900/60 shadow-inner'
            : 'border-slate-200/90 shadow-2xs'
        } ${sizeContainerClasses}`}
      >
        <FlotaSugamuxiEmblem className="w-full h-full" isDark={isDark} />
      </div>

      {variant !== 'icon-only' && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              } ${sizeTextClasses}`}
            >
              SIGEPRO
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-cyan-400 border border-blue-300/40 dark:border-blue-400/30">
              v2.1
            </span>
          </div>
          {showSubtitle && (
            <span
              className={`font-extrabold tracking-wider uppercase text-[10px] mt-0.5 ${
                isDark ? 'text-cyan-300' : 'text-blue-700'
              }`}
            >
              Flota Sugamuxi S.A.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
