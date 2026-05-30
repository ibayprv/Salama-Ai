"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, BookOpen, MessageSquare, Award, BarChart2, ShieldAlert } from 'lucide-react';
import Logo from '@/components/Logo';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Kamus', href: '/kamus', icon: BookOpen },
    { name: 'Chatbot AI', href: '/chatbot', icon: MessageSquare },
    { name: 'Kuis', href: '/kuis', icon: Award },
    { name: 'Statistik & Review', href: '/statistik', icon: BarChart2 },
    { name: 'Admin & Koreksi', href: '/admin', icon: ShieldAlert },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'py-2.5 bg-ocean-950/90 backdrop-blur-lg border-b border-white/5 shadow-lg'
        : 'py-4 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Logo size={38} showText={true} showSubtitle={true} className="group-hover:scale-[1.02] transition-transform duration-200" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-white/8 border border-white/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-gold-500' : ''}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <Link
              href="/kuis"
              className="ml-3 px-5 py-2 bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors duration-200"
            >
              Mulai Kuis
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white focus:outline-none transition-colors"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-350 overflow-hidden ${
        isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-3 pt-2 pb-4 space-y-1 bg-ocean-950/95 backdrop-blur-xl border-t border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-white bg-white/5 border border-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-gold-500' : ''}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="px-4 pt-3">
            <Link
              href="/kuis"
              onClick={() => setIsOpen(false)}
              className="block w-full py-3 bg-gold-500 hover:bg-gold-400 text-slate-950 text-center font-bold uppercase tracking-wider rounded-lg transition-colors duration-200"
            >
              Mulai Kuis
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
