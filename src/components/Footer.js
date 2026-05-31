// Footer Component

import React from 'react';
import Link from 'next/link';
import { Heart, Globe, BookOpen } from 'lucide-react';
import Logo from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-slate-200/60 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Column 1: Brand Info */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="flex items-center group">
              <Logo size={32} showText={true} className="group-hover:scale-[1.02] transition-transform duration-200" />
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Salama AI hadir untuk melestarikan bahasa daerah Ternate dan Sula melalui inovasi teknologi kecerdasan buatan, mengukuhkan peran pemuda dalam pelestarian warisan budaya lokal Maluku Utara.
            </p>
          </div>

          {/* Column 2: Language Preservation Info */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-gold-600" /> Pelestarian Bahasa
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Kami mendokumentasikan dialek <strong>Melayu Ternate</strong>, bahasa <strong>Tidore</strong>, serta dialek <strong>Sula Standar</strong>. Setiap entri kosakata divalidasi oleh kontribusi komunitas secara langsung untuk menjamin keaslian data penutur asli.
            </p>
          </div>

          {/* Column 3: Quick Links */}
          <div className="flex flex-col space-y-4 md:items-end">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center md:justify-end">
              <Globe className="h-4 w-4 mr-2 text-gold-600" /> Pintasan Menu
            </h3>
            <div className="flex flex-col space-y-2 text-xs md:items-end">
              <Link href="/kamus" className="text-slate-550 hover:text-gold-600 transition-colors duration-200">
                Kamus Digital
              </Link>
              <Link href="/chatbot" className="text-slate-550 hover:text-gold-600 transition-colors duration-200">
                Tanya Jawab Chatbot AI
              </Link>
              <Link href="/kuis" className="text-slate-550 hover:text-gold-600 transition-colors duration-200">
                Kuis Evaluasi Belajar
              </Link>
              <Link href="/statistik" className="text-slate-550 hover:text-gold-600 transition-colors duration-200">
                Statistik & Review Pengguna
              </Link>
            </div>
          </div>

        </div>

        <div className="mt-10 pt-6 border-t border-slate-200/50 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <p className="text-xs text-slate-400 flex items-center">
            Salama AI © {new Date().getFullYear()}. Dibuat dengan <Heart className="h-3 w-3 text-red-500 mx-1 fill-red-550" /> untuk Maluku Utara.
          </p>
          <p className="text-xs text-slate-500 font-bold">
            Duta Bahasa Provinsi Maluku Utara 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
