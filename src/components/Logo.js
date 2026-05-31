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
      {/* Unified integrated SVG Icon */}
      <img
        src="/logo.svg"
        width={size}
        height={size}
        alt="Salama AI Logo"
        className="flex-shrink-0 filter drop-shadow-xs"
        style={{ width: `${size}px`, height: `${size}px` }}
      />

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
