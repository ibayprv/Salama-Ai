"use client";

import React from 'react';

/**
 * Salama AI — Premium SVG Logo Component
 * Modern, clean, and elegant logo design based on a high-end dictionary theme.
 */
export default function Logo({
  size = 40,
  showText = false,
  showSubtitle = false,
  className = '',
  textClassName = '',
}) {
  return (
    <div className={`flex items-center ${className}`}>
      {/* SVG Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 filter drop-shadow-sm"
        aria-label="Salama AI Logo"
      >
        {/* Clean Rounded Base Tile (Premium Navy/Slate) */}
        <rect width="100" height="100" rx="22" fill="#0f172a" />
        
        {/* Open Book Vector */}
        <path
          d="M25 70V30C25 30 38 27 50 32C62 27 75 30 75 30V70C75 70 62 67 50 72C38 67 25 70 25 70Z"
          fill="#ffffff"
        />
        
        {/* Book spine/center division */}
        <path
          d="M50 32V72"
          stroke="#0f172a"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Letter A on Left Page */}
        <text
          x="37"
          y="54"
          fill="#0f172a"
          fontSize="18"
          fontWeight="bold"
          fontFamily="Georgia, serif"
          textAnchor="middle"
        >
          A
        </text>
        
        {/* Letter Z on Right Page */}
        <text
          x="63"
          y="54"
          fill="#0f172a"
          fontSize="18"
          fontWeight="bold"
          fontFamily="Georgia, serif"
          textAnchor="middle"
        >
          Z
        </text>
        
        {/* Little red elegant bookmark ribbon */}
        <path
          d="M47 31V45L50 42L53 45V31H47Z"
          fill="#ca8a04"
        />
      </svg>

      {/* Optional Text */}
      {showText && (
        <div className={`flex flex-col ml-3 ${textClassName}`}>
          <span className="text-lg font-black tracking-tight text-slate-800 leading-tight">
            SALAMA<span className="text-gold-500 ml-0.5">AI</span>
          </span>
          {showSubtitle && (
            <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase leading-tight mt-0.5">
              Ternate & Sula
            </span>
          )}
        </div>
      )}
    </div>
  );
}
