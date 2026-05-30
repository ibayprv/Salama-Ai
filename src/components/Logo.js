"use client";

import React from 'react';

/**
 * Salama AI — Premium SVG Logo Component
 * Scalable vector logo that looks crisp at any size.
 * Matches modern web app logo standards (gradient, glow, clean lines).
 *
 * Props:
 *  - size: number (default 40) — width & height in px
 *  - showText: boolean (default false) — show "SALAMA AI" text beside icon
 *  - showSubtitle: boolean (default false) — show "Ternate & Sula" subtitle
 *  - className: string — additional CSS classes
 *  - textClassName: string — additional CSS classes for text
 */
export default function Logo({
  size = 40,
  showText = false,
  showSubtitle = false,
  className = '',
  textClassName = '',
}) {
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <div className={`flex items-center ${className}`}>
      {/* SVG Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-label="Salama AI Logo"
      >
        <defs>
          {/* Background gradient */}
          <linearGradient id={`bg_${uniqueId}`} x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Gold gradient for book */}
          <linearGradient id={`gold_${uniqueId}`} x1="30" y1="30" x2="90" y2="95" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Blue accent gradient */}
          <linearGradient id={`blue_${uniqueId}`} x1="40" y1="25" x2="80" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          {/* Glow filter */}
          <filter id={`glow_${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Soft outer glow */}
          <filter id={`outerGlow_${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor="#f59e0b" floodOpacity="0.15" />
            <feComposite in2="blur" operator="in" />
            <feComposite in="SourceGraphic" />
          </filter>

          {/* Clip for rounded rect */}
          <clipPath id={`clip_${uniqueId}`}>
            <rect width="120" height="120" rx="26" />
          </clipPath>
        </defs>

        <g clipPath={`url(#clip_${uniqueId})`}>
          {/* Background */}
          <rect width="120" height="120" rx="26" fill={`url(#bg_${uniqueId})`} />

          {/* Subtle grid pattern */}
          <g opacity="0.03">
            {[20, 40, 60, 80, 100].map(pos => (
              <React.Fragment key={pos}>
                <line x1={pos} y1="0" x2={pos} y2="120" stroke="white" strokeWidth="0.5" />
                <line x1="0" y1={pos} x2="120" y2={pos} stroke="white" strokeWidth="0.5" />
              </React.Fragment>
            ))}
          </g>

          {/* Ambient glow behind book */}
          <ellipse cx="60" cy="68" rx="30" ry="18" fill="#f59e0b" opacity="0.06" />

          {/* === Open Book Icon === */}
          <g filter={`url(#glow_${uniqueId})`}>
            {/* Book spine (center) */}
            <line x1="60" y1="38" x2="60" y2="82" stroke={`url(#gold_${uniqueId})`} strokeWidth="2.5" strokeLinecap="round" />

            {/* Left page */}
            <path
              d="M58 40 C58 40 34 38 30 42 C26 46 28 72 28 76 C28 80 54 78 58 78 L58 40Z"
              fill={`url(#gold_${uniqueId})`}
              opacity="0.9"
              stroke="#fcd34d"
              strokeWidth="0.5"
            />

            {/* Right page */}
            <path
              d="M62 40 C62 40 86 38 90 42 C94 46 92 72 92 76 C92 80 66 78 62 78 L62 40Z"
              fill={`url(#gold_${uniqueId})`}
              opacity="0.75"
              stroke="#fcd34d"
              strokeWidth="0.5"
            />

            {/* Left page lines (text representation) */}
            <g opacity="0.3">
              <line x1="35" y1="50" x2="54" y2="49" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="36" y1="56" x2="53" y2="55" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="37" y1="62" x2="52" y2="61" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="37" y1="68" x2="50" y2="67.5" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* AI circuit pattern on right page */}
            <g opacity="0.35">
              {/* Circuit lines */}
              <path d="M68 50 L76 50 L76 56 L82 56" stroke="#1e293b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d="M70 58 L78 58 L78 64 L84 64" stroke="#1e293b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d="M69 66 L74 66 L74 72" stroke="#1e293b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              {/* Circuit nodes */}
              <circle cx="76" cy="50" r="1.5" fill="#1e293b" />
              <circle cx="82" cy="56" r="1.5" fill="#1e293b" />
              <circle cx="78" cy="58" r="1.5" fill="#1e293b" />
              <circle cx="74" cy="72" r="1.5" fill="#1e293b" />
            </g>
          </g>

          {/* === Decorative Arc Above Book === */}
          <path
            d="M32 36 C32 22 88 22 88 36"
            stroke={`url(#blue_${uniqueId})`}
            strokeWidth="1.5"
            fill="none"
            opacity="0.4"
            strokeLinecap="round"
          />

          {/* AI sparkle dot top-right */}
          <circle cx="86" cy="28" r="2.5" fill="#60a5fa" opacity="0.6">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="86" cy="28" r="1" fill="white" opacity="0.9" />

          {/* Small sparkle top-left */}
          <circle cx="38" cy="30" r="1.5" fill="#fcd34d" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
          </circle>

          {/* === "AI" Text Badge === */}
          <g filter={`url(#outerGlow_${uniqueId})`}>
            <rect x="72" y="82" width="28" height="16" rx="8" fill="#f59e0b" />
            <text
              x="86"
              y="94"
              textAnchor="middle"
              fill="#0f172a"
              fontSize="11"
              fontWeight="800"
              fontFamily="Inter, system-ui, sans-serif"
              letterSpacing="0.5"
            >
              AI
            </text>
          </g>

          {/* Border highlight */}
          <rect
            width="120"
            height="120"
            rx="26"
            fill="none"
            stroke="white"
            strokeWidth="1"
            opacity="0.06"
          />
        </g>
      </svg>

      {/* Optional Text */}
      {showText && (
        <div className={`flex flex-col ml-2.5 ${textClassName}`}>
          <span className="text-lg font-bold tracking-wider text-white flex items-center leading-tight">
            SALAMA<span className="text-gold-500 font-extrabold ml-1">AI</span>
          </span>
          {showSubtitle && (
            <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase leading-tight">
              Ternate & Sula
            </span>
          )}
        </div>
      )}
    </div>
  );
}
