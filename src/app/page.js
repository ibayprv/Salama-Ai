"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, Search, MessageSquare, Award, BarChart2, 
  Users, BookOpen, Star, Send, ShieldCheck, Heart 
} from 'lucide-react';
import supabase, { db } from '@/lib/supabase';

export default function Home() {
  const [stats, setStats] = useState({
    today: 0,
    total: 0,
    totalWords: 0,
    totalQuizzes: 0,
    avgScore: 0,
    avgRating: 0,
    ratingsCount: 0
  });

  const [ratings, setRatings] = useState([]);
  const [ratingInput, setRatingInput] = useState({ bintang: 5, komentar: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Record visit and fetch stats
    const initPage = async () => {
      // 1. Visit
      const visitData = await db.recordVisit();
      
      // 2. Words
      const wordsRes = await db.getWords();
      const wordsCount = wordsRes.data ? wordsRes.data.length : 0;

      // 3. Ratings
      const ratingsRes = await db.getRatings();
      const ratingsData = ratingsRes.data || [];
      setRatings(ratingsData);

      // 4. Quiz scores
      const quizRes = await db.getQuizScores();
      const quizData = quizRes.data || [];
      const totalQuiz = quizData.length;
      const avgScore = quizData.length 
        ? Math.round(quizData.reduce((acc, curr) => acc + curr.skor, 0) / quizData.length)
        : 0;

      // Calculate Average Rating
      let avgRating = 0;
      if (ratingsData.length > 0) {
        const sum = ratingsData.reduce((acc, curr) => acc + curr.bintang, 0);
        avgRating = Number((sum / ratingsData.length).toFixed(1));
      }

      setStats({
        today: visitData.today,
        total: visitData.total,
        totalWords: wordsCount,
        totalQuizzes: totalQuiz,
        avgScore: avgScore,
        avgRating: avgRating,
        ratingsCount: ratingsData.length
      });
    };

    initPage();

    // Subscribe to realtime database updates
    let channel;
    if (supabase) {
      channel = supabase
        .channel('homepage-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rating' }, () => {
          initPage();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pengunjung' }, () => {
          initPage();
        })
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Check 24 hour limit in Local Storage
    if (typeof window !== 'undefined') {
      const lastRated = localStorage.getItem('salama_last_rated');
      if (lastRated) {
        const hoursPassed = (Date.now() - Number(lastRated)) / 3600000;
        if (hoursPassed < 24) {
          setErrorMsg('Anda sudah memberikan rating. Silakan kirim ulasan lagi setelah 24 jam.');
          return;
        }
      }
    }

    if (!ratingInput.komentar.trim()) {
      setErrorMsg('Tulis komentar singkat ulasan Anda.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newRating = {
        bintang: ratingInput.bintang,
        komentar: ratingInput.komentar.slice(0, 280),
        device_hash: 'local_user_' + Math.random().toString(36).substring(7)
      };

      const res = await db.insertRating(newRating);
      if (res.error) throw new Error(res.error);

      // Update UI state
      const updatedRatings = [res.data[0], ...ratings];
      setRatings(updatedRatings);

      // Re-calculate stats
      const sum = updatedRatings.reduce((acc, curr) => acc + curr.bintang, 0);
      const newAvg = Number((sum / updatedRatings.length).toFixed(1));

      setStats(prev => ({
        ...prev,
        avgRating: newAvg,
        ratingsCount: updatedRatings.length
      }));

      // Lock rating for 24h
      localStorage.setItem('salama_last_rated', Date.now().toString());

      setRatingInput({ bintang: 5, komentar: '' });
      setSuccessMsg('Terima kasih banyak atas rating & ulasan berharga Anda!');
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal mengirim rating. Coba lagi nanti.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-16 animate-fade-in-up">
      
      {/* ================= HERO SECTION ================= */}
      <section className="relative text-center py-16 sm:py-24 overflow-hidden rounded-3xl glass-panel border border-white/10 px-6 sm:px-12">
        <div className="absolute top-0 right-0 w-72 h-72 bg-ocean-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gold-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-gold-400 tracking-wider uppercase">
            <Sparkles className="h-4 w-4 text-gold-500 animate-spin" />
            <span>Duta Bahasa Provinsi Maluku Utara 2026</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            Selamat Datang di <br className="sm:hidden" />
            <span className="text-white">SALAMA</span>
            <span className="text-gradient-gold font-black ml-2">AI</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
            Platform Kamus Cerdas Digital & Chatbot Interaktif yang didesain khusus untuk melestarikan bahasa daerah <span className="text-ocean-500 font-semibold">Ternate</span> dan <span className="text-gold-400 font-semibold">Sula</span>.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/kamus"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-ocean-600 to-ocean-500 hover:from-ocean-500 hover:to-ocean-400 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-ocean-500/20 border border-ocean-500/30"
            >
              <Search className="h-5 w-5" />
              <span>Cari Kosakata</span>
            </Link>
            <Link
              href="/chatbot"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105"
            >
              <MessageSquare className="h-5 w-5 text-gold-500 animate-bounce" />
              <span>Tanya Chatbot AI</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= STATISTICS DASHBOARD ================= */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-wide text-center text-gradient-gold">
          Statistik Penggunaan & Data Riil
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col items-center justify-center text-center">
            <BookOpen className="h-8 w-8 text-ocean-500 mb-3" />
            <span className="text-3xl font-extrabold text-white">{stats.totalWords}</span>
            <span className="text-xs text-slate-400 font-medium mt-1">Kosakata Tersedia</span>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col items-center justify-center text-center">
            <Users className="h-8 w-8 text-gold-500 mb-3" />
            <span className="text-3xl font-extrabold text-white">{stats.total}</span>
            <span className="text-xs text-slate-400 font-medium mt-1">Pengunjung Web</span>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col items-center justify-center text-center">
            <Award className="h-8 w-8 text-emerald-500 mb-3" />
            <span className="text-3xl font-extrabold text-white">{stats.totalQuizzes}</span>
            <span className="text-xs text-slate-400 font-medium mt-1">Kuis Diselesaikan</span>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col items-center justify-center text-center">
            <Star className="h-8 w-8 text-amber-400 mb-3 animate-pulse" />
            <span className="text-3xl font-extrabold text-white">{stats.avgRating > 0 ? stats.avgRating : '-'} <span className="text-xs text-slate-400">/ 5</span></span>
            <span className="text-xs text-slate-400 font-medium mt-1">Rating Aplikasi ({stats.ratingsCount})</span>
          </div>
        </div>
      </section>

      {/* ================= DYNAMIC FEATURES GRIDS ================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Kamus Card */}
        <div className="p-8 rounded-3xl glass-panel glass-panel-hover border border-white/5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-3 bg-ocean-500/10 border border-ocean-500/20 w-fit rounded-2xl">
              <Search className="h-6 w-6 text-ocean-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Kamus Bilingual Cerdas</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Cari kosakata bahasa Indonesia ke daerah (Ternate & Sula) atau sebaliknya dengan hasil instan terlengkap (arti, kelas kata, dialek, dan contoh kalimat).
            </p>
          </div>
          <Link href="/kamus" className="mt-6 text-sm font-bold text-ocean-500 hover:text-ocean-400 flex items-center space-x-1">
            <span>Buka Kamus Digital →</span>
          </Link>
        </div>

        {/* Chatbot Card */}
        <div className="p-8 rounded-3xl glass-panel glass-panel-hover border border-white/5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-3 bg-gold-500/10 border border-gold-500/20 w-fit rounded-2xl">
              <MessageSquare className="h-6 w-6 text-gold-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Asisten Virtual Salama</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Ngobrol dengan AI cerdas kami yang ditenagai Google Gemini untuk menggali konteks kalimat, penjelasan budaya daerah, dan dialog sehari-hari.
            </p>
          </div>
          <Link href="/chatbot" className="mt-6 text-sm font-bold text-gold-500 hover:text-gold-400 flex items-center space-x-1">
            <span>Tanya Asisten AI →</span>
          </Link>
        </div>

        {/* Kuis Card */}
        <div className="p-8 rounded-3xl glass-panel glass-panel-hover border border-white/5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 w-fit rounded-2xl">
              <Award className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Kuis Pilihan Ganda</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Uji pemahaman bahasa daerah Anda melalui permainan interaktif 10 soal dengan timer 15 detik. Belajar bahasa daerah jadi lebih seru dan kompetitif!
            </p>
          </div>
          <Link href="/kuis" className="mt-6 text-sm font-bold text-emerald-500 hover:text-emerald-400 flex items-center space-x-1">
            <span>Mainkan Kuis Sekarang →</span>
          </Link>
        </div>
      </section>

      {/* ================= RATINGS & COMMENTS SECTION ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Rating */}
        <div className="p-8 rounded-3xl glass-panel border border-white/10 lg:col-span-1 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Beri Rating Aplikasi</h3>
            <p className="text-xs text-slate-400">
              Ulasan Anda sangat berharga untuk pengembangan Salama AI yang lebih baik dan pelestarian bahasa daerah Maluku Utara.
            </p>
          </div>

          <form onSubmit={handleRatingSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Pilih Bintang:</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRatingInput(prev => ({ ...prev, bintang: star }))}
                    className="p-1 hover:scale-125 transition-transform duration-200 focus:outline-none"
                  >
                    <Star 
                      className={`h-7 w-7 ${
                        star <= ratingInput.bintang 
                          ? 'text-gold-500 fill-gold-500' 
                          : 'text-slate-600'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Ulasan Anda (Maks 280 karakter):</label>
              <textarea
                value={ratingInput.komentar}
                onChange={(e) => setRatingInput(prev => ({ ...prev, komentar: e.target.value.slice(0, 280) }))}
                rows={4}
                placeholder="Tulis ulasan, kritik, saran, atau pujian Anda di sini..."
                className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500 transition-all duration-300 resize-none"
              />
              <span className="text-[10px] text-slate-500 block text-right">
                {ratingInput.komentar.length} / 280 karakter
              </span>
            </div>

            {successMsg && (
              <p className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 p-3 rounded-lg flex items-center">
                <ShieldCheck className="h-4 w-4 mr-1.5 flex-shrink-0" /> {successMsg}
              </p>
            )}

            {errorMsg && (
              <p className="text-xs font-semibold text-rose-500 bg-rose-500/10 p-3 rounded-lg flex items-center">
                <Heart className="h-4 w-4 mr-1.5 flex-shrink-0" /> {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Mengirim...</span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Kirim Ulasan</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Feed Ulasan */}
        <div className="p-8 rounded-3xl glass-panel border border-white/10 lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h3 className="text-xl font-bold text-white">Ulasan Pengguna Terbaru</h3>
            <span className="text-xs font-semibold text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              Komentar Terverifikasi
            </span>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {ratings.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">Belum ada ulasan. Jadilah yang pertama memberikan review!</p>
            ) : (
              ratings.map((rate, i) => (
                <div key={rate.id || i} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 hover:border-white/10 transition-colors duration-200">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star 
                          key={idx} 
                          className={`h-4 w-4 ${
                            idx < rate.bintang ? 'text-gold-500 fill-gold-500' : 'text-slate-700'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(rate.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 italic leading-relaxed">
                    "{rate.komentar}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </section>

    </div>
  );
}
