"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, BookOpen, MessageSquare, Award, BarChart2, ShieldAlert, Home } from 'lucide-react';
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
    { name: 'Beranda', href: '/', icon: Home },
    { name: 'Kamus', href: '/kamus', icon: BookOpen },
    { name: 'Chatbot AI', href: '/chatbot', icon: MessageSquare },
    { name: 'Kuis', href: '/kuis', icon: Award },
    { name: 'Statistik & Ulasan', href: '/statistik', icon: BarChart2 },
    { name: 'Admin & Koreksi', href: '/admin', icon: ShieldAlert },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'py-2.5 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm'
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
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'text-slate-900 bg-slate-100 border border-slate-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-gold-600' : 'text-slate-450'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <Link
              href="/kuis"
              className="ml-3 px-5 py-2.5 bg-gold-600 hover:bg-gold-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 shadow-md shadow-gold-500/10 hover:shadow-lg"
            >
              Mulai Kuis
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-950 focus:outline-none transition-colors"
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
        <div className="px-3 pt-2 pb-4 space-y-1 bg-white border-t border-slate-100 shadow-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-bold transition-colors duration-200 ${
                  isActive
                    ? 'text-slate-950 bg-slate-50 border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-gold-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="px-4 pt-3">
            <Link
              href="/kuis"
              onClick={() => setIsOpen(false)}
              className="block w-full py-3 bg-gold-600 hover:bg-gold-500 text-white text-center font-bold uppercase tracking-wider rounded-lg transition-colors duration-200 shadow-md"
            >
              Mulai Kuis
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
