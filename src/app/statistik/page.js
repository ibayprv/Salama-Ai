"use client";

import React, { useState, useEffect } from 'react';
import { BarChart2, Users, BookOpen, Star, Award, TrendingUp, Compass, MessageSquare, Heart } from 'lucide-react';
import supabase, { db } from '@/lib/supabase';

export default function Statistik() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    todayVisitors: 0,
    totalVisitors: 0,
    totalWords: 0,
    totalQuizzes: 0,
    avgScore: 0,
    avgRating: 0,
    ratingsCount: 0,
    ratingsList: [],
    history: [],
    totalLikes: 0,
    totalComments: 0,
    topLikedWords: [],
    recentComments: []
  });

  useEffect(() => {
    const fetchStats = async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        // 1. Visit Counter
        const visitData = await db.recordVisit();
        
        // 2. Words, Likes, and Top Words
        const wordsRes = await db.getWords();
        const words = wordsRes.data || [];
        const wordsCount = words.length;
        const totalLikes = words.reduce((acc, curr) => acc + (Number(curr.likes) || 0), 0);
        
        // Sort words by likes to get top words
        const topLikedWords = [...words]
          .filter(w => (w.likes || 0) > 0)
          .sort((a, b) => (b.likes || 0) - (a.likes || 0))
          .slice(0, 5);

        // 3. Ratings (Ulasan Aplikasi)
        const ratingsRes = await db.getRatings();
        const ratingsData = ratingsRes.data || [];

        // 4. Quiz scores
        const quizRes = await db.getQuizScores();
        const quizData = quizRes.data || [];
        const totalQuiz = quizData.length;
        const avgScore = totalQuiz
          ? Math.round(quizData.reduce((acc, curr) => acc + curr.skor, 0) / totalQuiz)
          : 0;

        // 5. Comments on words (Reviews)
        const commentsRes = await db.getAllWordComments();
        const commentsData = commentsRes.data || [];
        const totalComments = commentsData.length;
        
        // Match word comments with word names
        const recentComments = commentsData.slice(0, 5).map(c => {
          const matchedWord = words.find(w => w.id === c.kata_id);
          return {
            ...c,
            kataName: matchedWord ? matchedWord.kata : 'Kata'
          };
        });

        // Calculate Average Rating
        let avgRating = 0;
        if (ratingsData.length > 0) {
          const sum = ratingsData.reduce((acc, curr) => acc + curr.bintang, 0);
          avgRating = Number((sum / ratingsData.length).toFixed(1));
        }

        // Generate actual history (last 7 days)
        let historyList = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          
          // look in db history
          const dbRec = visitData.history ? visitData.history.find(p => p.tanggal === dateStr) : null;
          const count = dbRec ? dbRec.jumlah : 0;
          
          historyList.push({
            label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
            date: dateStr,
            count: i === 0 ? visitData.today : count
          });
        }

        setData({
          todayVisitors: visitData.today,
          totalVisitors: visitData.total,
          totalWords: wordsCount,
          totalQuizzes: totalQuiz,
          avgScore: avgScore,
          avgRating: avgRating,
          ratingsCount: ratingsData.length,
          ratingsList: ratingsData,
          history: historyList,
          totalLikes,
          totalComments,
          topLikedWords,
          recentComments
        });
      } catch (err) {
        console.error(err);
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchStats(true);

    // Subscribe to realtime database updates
    let channel;
    if (supabase) {
      channel = supabase
        .channel('statistik-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pengunjung' }, () => {
          fetchStats(false);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kata' }, () => {
          fetchStats(false);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rating' }, () => {
          fetchStats(false);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'komentar_kata' }, () => {
          fetchStats(false);
        })
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const maxVisits = data.history.length > 0 
    ? Math.max(...data.history.map(h => h.count))
    : 10;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-80 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500" />
        <span className="text-slate-400 text-sm font-semibold">Mengambil visualisasi statistik...</span>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in-up">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center justify-center space-x-2">
          <BarChart2 className="h-8 w-8 text-gold-500" />
          <span>Statistik & <span className="text-gradient-gold">Review Pengguna</span></span>
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Pantau data statistik riil, performa belajar siswa, serta ulasan diskusi dan likes secara real-time langsung dari kelas Anda.
        </p>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl glass-panel border border-white/5 flex items-center space-x-4">
          <div className="p-3 bg-ocean-500/10 border border-ocean-500/20 rounded-xl">
            <Users className="h-6 w-6 text-ocean-500" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Total Kunjungan</span>
            <span className="text-2xl font-black text-white">
              {data.totalVisitors}{' '}
              <span className="text-[10px] text-emerald-500 font-bold block">
                +{data.todayVisitors} hari ini
              </span>
            </span>
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-white/5 flex items-center space-x-4">
          <div className="p-3 bg-gold-500/10 border border-gold-500/20 rounded-xl">
            <BookOpen className="h-6 w-6 text-gold-500" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Dataset Kamus</span>
            <span className="text-2xl font-black text-white">
              {data.totalWords} <span className="text-xs text-slate-500">Kata</span>
            </span>
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-white/5 flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <Award className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Kuis Selesai</span>
            <span className="text-2xl font-black text-white">
              {data.totalQuizzes}{' '}
              <span className="text-[10px] text-emerald-400 font-bold block">
                Rata-rata: {data.avgScore}/100
              </span>
            </span>
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-white/5 flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Star className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Rating Aplikasi</span>
            <span className="text-2xl font-black text-white">
              {data.avgRating > 0 ? data.avgRating : '-'}{' '}
              <span className="text-xs text-slate-500">
                {data.ratingsCount > 0 ? `(${data.ratingsCount} ulasan)` : '(Belum ada)'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Second Row: Community Likes & Reviews Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl glass-panel border border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Total Suka (Likes) Kata</span>
              <p className="text-sm text-slate-300">Pengguna memberikan apresiasi suka pada kosakata kamus.</p>
            </div>
          </div>
          <span className="text-3xl font-black text-white">{data.totalLikes}</span>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <MessageSquare className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Total Ulasan/Komentar Kata</span>
              <p className="text-sm text-slate-300">Diskusi dan review kosakata yang dikirim oleh siswa/pengguna.</p>
            </div>
          </div>
          <span className="text-3xl font-black text-white">{data.totalComments}</span>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CHART 1: 7-Day Visitor Graph */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-gold-500" />
              <span>Grafik Kunjungan Siswa (7 Hari Terakhir)</span>
            </h3>
            <span className="text-[10px] text-slate-450 bg-white/5 border border-white/10 px-2 py-0.5 rounded font-bold uppercase">Real-Time</span>
          </div>

          <div className="h-60 flex items-end justify-between gap-2 pt-6 px-2">
            {data.history.map((hist, index) => {
              const heightPct = maxVisits > 0 ? (hist.count / maxVisits) * 100 : 0;
              return (
                <div key={index} className="flex-grow flex flex-col items-center group relative cursor-pointer">
                  <span className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-slate-900 border border-white/10 px-2 py-1 rounded text-[10px] font-bold text-white transition-opacity duration-200 shadow-xl whitespace-nowrap z-10">
                    {hist.count} kunjungan
                  </span>
                  
                  <div 
                    className="w-full sm:w-8 rounded-t-lg bg-gradient-to-t from-ocean-800 to-ocean-500 group-hover:from-gold-500 group-hover:to-gold-400 transition-all duration-500 border border-white/5 group-hover:scale-105 shadow-gold-500/10"
                    style={{ height: `${Math.max(heightPct, 3)}%` }}
                  />
                  
                  <span className="text-[10px] text-slate-500 font-bold mt-2 tracking-wider group-hover:text-white uppercase transition-colors">
                    {hist.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 2: Kata Terfavorit (Most Liked Words) */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Compass className="h-5 w-5 text-gold-500" />
              <span>Daftar Kosakata Terfavorit</span>
            </h3>
          </div>

          <div className="space-y-4 pt-2">
            {data.topLikedWords.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-8 text-center">Belum ada kosakata yang disukai pengguna. Silakan tekan tombol Suka di halaman Kamus!</p>
            ) : (
              data.topLikedWords.map((word, i) => (
                <div key={word.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-gold-500">#{i + 1}</span>
                    <div>
                      <span className="text-sm font-bold text-white block">{word.kata}</span>
                      <span className="text-[10px] text-slate-400">Bahasa {word.bahasa} — {word.arti}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-rose-500 font-bold text-xs">
                    <Heart className="h-4 w-4 fill-rose-500" />
                    <span>{word.likes} suka</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Row 3: Recent Word Comments & App Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Column 1: Recent Comments on Words */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-gold-500" />
              <span>Review & Diskusi Kata Terbaru</span>
            </h3>
          </div>

          <div className="space-y-4">
            {data.recentComments.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-8 text-center">Belum ada review kosakata yang dikirim.</p>
            ) : (
              data.recentComments.map((comm) => (
                <div key={comm.id} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-300">{comm.nama} <span className="text-slate-500 font-normal">pada</span> <span className="text-gold-500 font-bold">"{comm.kataName}"</span></span>
                    <span className="text-[9px] text-slate-500">
                      {new Date(comm.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-normal">"{comm.komentar}"</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: App Feedback Ratings */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Star className="h-5 w-5 text-gold-500" />
              <span>Umpan Balik Rating Aplikasi ({data.ratingsCount})</span>
            </h3>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {data.ratingsList.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-8 text-center">Belum ada ulasan rating aplikasi masuk.</p>
            ) : (
              data.ratingsList.map((rate) => (
                <div key={rate.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star 
                          key={idx} 
                          className={`h-3 w-3 ${
                            idx < rate.bintang ? 'text-gold-500 fill-gold-500' : 'text-slate-700'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-[9px] text-slate-500">
                      {new Date(rate.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "{rate.komentar}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
