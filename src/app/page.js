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
    <div className="space-y-16 animate-fade-in-up pb-16">
      
      {/* ================= HERO SECTION ================= */}
      <section className="relative text-center py-16 sm:py-24 overflow-hidden rounded-[2.5rem] glass-panel border border-slate-200/70 px-6 sm:px-12 bg-white">
        {/* Soft elegant ambient glows in corners */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px]" />

        <div className="relative max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-amber-50 border border-amber-200/50 rounded-full text-xs font-bold text-amber-700 tracking-wider uppercase">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
            <span>Duta Bahasa Provinsi Maluku Utara 2026</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Selamat Datang di <br className="sm:hidden" />
            <span>SALAMA</span>
            <span className="text-gradient-gold ml-2">AI</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Platform Kamus Cerdas Digital & Chatbot Interaktif yang didesain secara elegan untuk melestarikan bahasa daerah <span className="text-sky-600 font-bold">Ternate</span> dan <span className="text-amber-600 font-bold">Sula</span>.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/kamus"
              className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all duration-300 transform hover:-translate-y-0.5 shadow-md shadow-slate-950/10 hover:shadow-xl hover:shadow-slate-950/15"
            >
              <Search className="h-4.5 w-4.5" />
              <span>Cari Kosakata</span>
            </Link>
            <Link
              href="/chatbot"
              className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-8 py-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold rounded-2xl transition-all duration-300 transform hover:-translate-y-0.5 shadow-xs"
            >
              <MessageSquare className="h-4.5 w-4.5 text-amber-600 animate-bounce" />
              <span>Tanya Chatbot AI</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= STATISTICS DASHBOARD ================= */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight text-center text-slate-800 uppercase tracking-widest text-[11px] font-bold text-slate-455">
          Statistik Penggunaan & Data Riil
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-6 rounded-2xl glass-panel border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-sky-50 rounded-xl mb-3">
              <BookOpen className="h-6 w-6 text-sky-600" />
            </div>
            <span className="text-3xl font-black text-slate-800">{stats.totalWords}</span>
            <span className="text-xs text-slate-500 font-semibold mt-1">Kosakata Tersedia</span>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-amber-50 rounded-xl mb-3">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
            <span className="text-3xl font-black text-slate-800">{stats.total}</span>
            <span className="text-xs text-slate-500 font-semibold mt-1">Pengunjung Web</span>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-emerald-50 rounded-xl mb-3">
              <Award className="h-6 w-6 text-emerald-600" />
            </div>
            <span className="text-3xl font-black text-slate-800">{stats.totalQuizzes}</span>
            <span className="text-xs text-slate-500 font-semibold mt-1">Kuis Diselesaikan</span>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-rose-50 rounded-xl mb-3">
              <Star className="h-6 w-6 text-rose-500 fill-rose-500" />
            </div>
            <span className="text-3xl font-black text-slate-800">{stats.avgRating > 0 ? stats.avgRating : '-'} <span className="text-xs text-slate-400">/ 5</span></span>
            <span className="text-xs text-slate-500 font-semibold mt-1">Rating Aplikasi ({stats.ratingsCount})</span>
          </div>
        </div>
      </section>

      {/* ================= DYNAMIC FEATURES GRIDS ================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Kamus Card */}
        <div className="p-8 rounded-3xl glass-panel glass-panel-hover border border-slate-100 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-3 bg-sky-50 border border-sky-100 w-fit rounded-2xl">
              <Search className="h-6 w-6 text-sky-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Kamus Bilingual Cerdas</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Cari kosakata bahasa Indonesia ke daerah (Ternate & Sula) atau sebaliknya dengan hasil instan terlengkap (arti, kelas kata, dialek, dan contoh kalimat).
            </p>
          </div>
          <Link href="/kamus" className="mt-6 text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1 uppercase tracking-wider">
            <span>Buka Kamus Digital →</span>
          </Link>
        </div>

        {/* Chatbot Card */}
        <div className="p-8 rounded-3xl glass-panel glass-panel-hover border border-slate-100 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-100 w-fit rounded-2xl">
              <MessageSquare className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Asisten Virtual Salama</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Ngobrol dengan AI cerdas kami yang ditenagai Google Gemini untuk menggali konteks kalimat, penjelasan budaya daerah, dan dialog sehari-hari.
            </p>
          </div>
          <Link href="/chatbot" className="mt-6 text-xs font-bold text-amber-600 hover:text-amber-750 flex items-center space-x-1 uppercase tracking-wider">
            <span>Tanya Asisten AI →</span>
          </Link>
        </div>

        {/* Kuis Card */}
        <div className="p-8 rounded-3xl glass-panel glass-panel-hover border border-slate-100 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-100 w-fit rounded-2xl">
              <Award className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Kuis Pilihan Ganda</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Uji pemahaman bahasa daerah Anda melalui permainan interaktif 10 soal dengan timer 15 detik. Belajar bahasa daerah jadi lebih seru dan kompetitif!
            </p>
          </div>
          <Link href="/kuis" className="mt-6 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 uppercase tracking-wider">
            <span>Mainkan Kuis Sekarang →</span>
          </Link>
        </div>
      </section>

      {/* ================= RATINGS & COMMENTS SECTION ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Rating */}
        <div className="p-8 rounded-3xl glass-panel border border-slate-200/70 lg:col-span-1 space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">Beri Rating Aplikasi</h3>
            <p className="text-xs text-slate-500 font-medium">
              Ulasan Anda sangat berharga untuk pengembangan Salama AI yang lebih baik dan pelestarian bahasa daerah Maluku Utara.
            </p>
          </div>

          <form onSubmit={handleRatingSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Pilih Bintang:</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRatingInput(prev => ({ ...prev, bintang: star }))}
                    className="p-1 hover:scale-125 transition-transform duration-205 focus:outline-none"
                  >
                    <Star 
                      className={`h-7 w-7 ${
                        star <= ratingInput.bintang 
                          ? 'text-amber-500 fill-amber-500' 
                          : 'text-slate-300'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Ulasan Anda (Maks 280 karakter):</label>
              <textarea
                value={ratingInput.komentar}
                onChange={(e) => setRatingInput(prev => ({ ...prev, komentar: e.target.value.slice(0, 280) }))}
                rows={4}
                placeholder="Tulis ulasan, kritik, saran, atau pujian Anda di sini..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-all duration-300 resize-none font-medium"
              />
              <span className="text-[10px] text-slate-400 block text-right font-semibold">
                {ratingInput.komentar.length} / 280 karakter
              </span>
            </div>

            {successMsg && (
              <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-center">
                <ShieldCheck className="h-4 w-4 mr-1.5 flex-shrink-0" /> {successMsg}
              </p>
            )}

            {errorMsg && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-lg flex items-center">
                <Heart className="h-4 w-4 mr-1.5 flex-shrink-0 fill-rose-100" /> {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-slate-900/10"
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
        <div className="p-8 rounded-3xl glass-panel border border-slate-200/70 lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Ulasan Pengguna Terbaru</h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200/60 px-3 py-1 rounded-full uppercase tracking-wider">
              Komentar Terverifikasi
            </span>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {ratings.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10 font-medium">Belum ada ulasan. Jadilah yang pertama memberikan review!</p>
            ) : (
              ratings.map((rate, i) => (
                <div key={rate.id || i} className="p-4 rounded-xl bg-slate-50/50 border border-slate-150 space-y-2 hover:border-slate-350 hover:bg-slate-50 transition-all duration-200">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star 
                          key={idx} 
                          className={`h-3.5 w-3.5 ${
                            idx < rate.bintang ? 'text-amber-500 fill-amber-500' : 'text-slate-250'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(rate.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-650 italic leading-relaxed font-medium">
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
