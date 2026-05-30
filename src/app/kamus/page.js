"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, AlertTriangle, Send, CheckCircle, HelpCircle, ShieldAlert, Heart, MessageSquare, ThumbsUp } from 'lucide-react';
import supabase, { db } from '@/lib/supabase';

export default function Kamus() {
  const [words, setWords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBahasa, setFilterBahasa] = useState('semua');
  const [filterKelas, setFilterKelas] = useState('semua');
  
  // Word Comments & Likes states
  const [wordComments, setWordComments] = useState({});
  const [expandedCommentsWordId, setExpandedCommentsWordId] = useState(null);
  const [newCommentInput, setNewCommentInput] = useState({ nama: '', teks: '' });
  const [likedWords, setLikedWords] = useState({}); // stores { wordId: true } to prevent double likes

  // Correction Form Modal State
  const [selectedWord, setSelectedWord] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    pelapor_info: '',
    kata_salah: '',
    usulan_perbaikan: '',
    alasan: '',
    sumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchWords();
    // Load liked words from localStorage if available
    if (typeof window !== 'undefined') {
      const storedLikes = localStorage.getItem('salama_liked_words');
      if (storedLikes) {
        try {
          setLikedWords(JSON.parse(storedLikes));
        } catch (e) {
          console.error(e);
        }
      }
    }

    // Subscribe to realtime database updates
    let channel;
    if (supabase) {
      channel = supabase
        .channel('kamus-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kata' }, () => {
          fetchWords();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'komentar_kata' }, (payload) => {
          if (payload.new && payload.new.kata_id) {
            loadComments(payload.new.kata_id);
          }
        })
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchWords = async () => {
    const res = await db.getWords();
    if (res.data) {
      setWords(res.data);
    }
  };

  const handleLike = async (wordId) => {
    if (likedWords[wordId]) return; // already liked

    const updatedLikes = { ...likedWords, [wordId]: true };
    setLikedWords(updatedLikes);
    if (typeof window !== 'undefined') {
      localStorage.setItem('salama_liked_words', JSON.stringify(updatedLikes));
    }

    // Call database to increment like
    const res = await db.likeWord(wordId);
    if (res.data) {
      setWords(prev => prev.map(w => w.id === wordId ? { ...w, likes: res.data.likes } : w));
    }
  };

  const toggleCommentsSection = async (wordId) => {
    if (expandedCommentsWordId === wordId) {
      setExpandedCommentsWordId(null);
    } else {
      setExpandedCommentsWordId(wordId);
      setNewCommentInput({ nama: '', teks: '' });
      await loadComments(wordId);
    }
  };

  const loadComments = async (wordId) => {
    const res = await db.getWordComments(wordId);
    if (res.data) {
      setWordComments(prev => ({ ...prev, [wordId]: res.data }));
    }
  };

  const handleAddComment = async (e, wordId) => {
    e.preventDefault();
    if (!newCommentInput.nama.trim() || !newCommentInput.teks.trim()) return;

    const payload = {
      kata_id: wordId,
      nama: newCommentInput.nama.trim(),
      komentar: newCommentInput.teks.trim()
    };

    const res = await db.insertWordComment(payload);
    if (res.data) {
      // Clear input
      setNewCommentInput({ nama: '', teks: '' });
      // Reload comments
      await loadComments(wordId);
    }
  };

  const handleOpenCorrection = (word) => {
    setSelectedWord(word);
    setCorrectionForm({
      pelapor_info: '',
      kata_salah: word.kata,
      usulan_perbaikan: '',
      alasan: '',
      sumber: ''
    });
    setFormSuccess('');
    setFormError('');
  };

  const handleCloseCorrection = () => {
    setSelectedWord(null);
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!correctionForm.pelapor_info.trim()) {
      setFormError('Nama atau info pelapor harus diisi.');
      return;
    }
    if (!correctionForm.usulan_perbaikan.trim()) {
      setFormError('Usulan perbaikan kata harus diisi.');
      return;
    }
    if (!correctionForm.alasan.trim()) {
      setFormError('Tuliskan alasan perbaikan Anda.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        kata_id: selectedWord.id,
        pelapor_info: correctionForm.pelapor_info,
        kata_salah: correctionForm.kata_salah,
        usulan_perbaikan: correctionForm.usulan_perbaikan,
        alasan: correctionForm.alasan,
        sumber: correctionForm.sumber
      };

      const res = await db.insertCorrection(payload);
      if (res.error) throw new Error(res.error);

      await fetchWords();

      setFormSuccess('Laporan Anda berhasil dikirim! Tim editor kami akan meninjau usulan ini.');
      setTimeout(() => {
        handleCloseCorrection();
      }, 2500);
    } catch (err) {
      console.error(err);
      setFormError('Gagal mengirim laporan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const query = searchQuery.trim().toLowerCase();
  
  const filteredWords = words.filter(w => {
    if (filterBahasa !== 'semua' && w.bahasa.toLowerCase() !== filterBahasa) return false;
    if (filterKelas !== 'semua' && w.kelas_kata.toLowerCase() !== filterKelas) return false;

    if (query) {
      const matchKata = w.kata.toLowerCase().includes(query);
      const matchArti = w.arti.toLowerCase().includes(query);
      return matchKata || matchArti;
    }
    return true;
  });

  const getSuggestions = () => {
    if (!query || filteredWords.length > 0) return [];
    
    const partial = query.slice(0, 3);
    if (!partial) return [];

    return words.filter(w => 
      w.kata.toLowerCase().startsWith(partial) || 
      w.arti.toLowerCase().startsWith(partial)
    ).slice(0, 4);
  };

  const suggestions = getSuggestions();

  const getKelasName = (slug) => {
    const mappings = {
      kata_benda: 'Kata Benda',
      kata_kerja: 'Kata Kerja',
      kata_sifat: 'Kata Sifat',
      kata_ganti: 'Kata Ganti',
      kata_bilangan: 'Kata Bilangan'
    };
    return mappings[slug] || slug;
  };

  const getDialekName = (slug) => {
    const mappings = {
      melayu_ternate: 'Melayu Ternate',
      tidore: 'Tidore',
      sula_standar: 'Sula Standar'
    };
    return mappings[slug] || slug;
  };

  return (
    <>
      <div className="space-y-8 animate-fade-in-up">
        {/* Page Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Kamus Bahasa <span className="text-gradient-gold">Ternate & Sula</span>
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Temukan terjemahan kata terlengkap beserta kelas kata, dialek, contoh kalimat, serta berikan suka (like) dan review ulasan langsung di setiap kata.
        </p>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="p-6 rounded-2xl glass-panel border border-white/5 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kata (contoh: fola, rumah, pia, baik)..."
            className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-500 transition-all duration-300"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2">
          {/* Bahasa Tabs */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-white/5 w-full sm:w-auto">
            {['semua', 'ternate', 'sula'].map((lang) => (
              <button
                key={lang}
                onClick={() => setFilterBahasa(lang)}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  filterBahasa === lang
                    ? 'bg-gradient-to-r from-ocean-600 to-ocean-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Kelas Kata Select */}
          <div className="flex items-center space-x-2 w-full sm:w-auto bg-slate-950/40 px-3 py-2 border border-white/10 rounded-xl">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-300 focus:outline-none cursor-pointer w-full sm:w-60"
            >
              <option value="semua" className="bg-slate-950 text-slate-200">Semua Kelas Kata</option>
              <option value="kata_benda" className="bg-slate-950 text-slate-200">Kata Benda (Nomina)</option>
              <option value="kata_kerja" className="bg-slate-950 text-slate-200">Kata Kerja (Verba)</option>
              <option value="kata_sifat" className="bg-slate-950 text-slate-200">Kata Sifat (Adjektiva)</option>
              <option value="kata_bilangan" className="bg-slate-950 text-slate-200">Kata Bilangan (Numeralia)</option>
              <option value="kata_ganti" className="bg-slate-950 text-slate-200">Kata Ganti (Pronomina)</option>
            </select>
          </div>
        </div>
      </div>

      {/* DICTIONARY RESULTS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <span className="text-xs text-slate-400">
            Menampilkan <span className="text-white font-bold">{filteredWords.length}</span> kosakata
          </span>
        </div>

        {filteredWords.length === 0 ? (
          <div className="p-12 text-center rounded-3xl glass-panel border border-white/5 space-y-6">
            <div className="mx-auto w-16 h-16 bg-slate-900 border border-white/5 flex items-center justify-center rounded-2xl">
              <HelpCircle className="h-8 w-8 text-slate-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Kosakata tidak ditemukan</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                Kata <span className="text-gold-500 font-semibold">"{searchQuery}"</span> belum tersedia atau tidak cocok dengan filter aktif.
              </p>
            </div>

            {suggestions.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-white/5 max-w-md mx-auto">
                <span className="text-xs font-semibold text-slate-400 block">Apakah maksud Anda:</span>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((sug) => (
                    <button
                      key={sug.id}
                      onClick={() => setSearchQuery(sug.kata)}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-gold-500/50 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all duration-200"
                    >
                      {sug.kata} ({sug.arti})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredWords.map((word) => (
              <div
                key={word.id}
                className="p-6 rounded-2xl glass-panel border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Line */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        word.bahasa.toLowerCase() === 'ternate'
                          ? 'bg-ocean-500/10 text-ocean-400 border border-ocean-500/20'
                          : 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                      }`}>
                        Bahasa {word.bahasa}
                      </span>
                      {word.dialek && (
                        <span className="text-[10px] text-slate-500 ml-2 font-semibold bg-slate-900 border border-white/5 px-2 py-0.5 rounded">
                          {getDialekName(word.dialek)}
                        </span>
                      )}
                    </div>
                    {word.status === 'dalam_review' && (
                      <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/25 animate-pulse">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Dalam Review</span>
                      </span>
                    )}
                  </div>

                  {/* Words */}
                  <div className="flex items-baseline space-x-2">
                    <h3 className="text-2xl font-bold text-white tracking-wide">{word.kata}</h3>
                    <span className="text-xs text-slate-500 italic font-medium">
                      ({getKelasName(word.kelas_kata)})
                    </span>
                  </div>

                  {/* Meaning */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 block">Arti:</span>
                    <p className="text-sm text-slate-200 leading-relaxed font-semibold bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
                      {word.arti}
                    </p>
                  </div>

                  {/* Example */}
                  {word.contoh && (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-400 block">Contoh Kalimat:</span>
                      <p className="text-xs text-slate-450 italic leading-relaxed border-l-2 border-gold-500 pl-3">
                        {word.contoh}
                      </p>
                    </div>
                  )}
                </div>

                {/* Social Likes & Comments Toggles */}
                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex space-x-4">
                    {/* Like Button */}
                    <button
                      onClick={() => handleLike(word.id)}
                      className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        likedWords[word.id]
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : 'bg-slate-900 text-slate-400 hover:text-rose-500 border border-white/5'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${likedWords[word.id] ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{word.likes || 0}</span>
                    </button>

                    {/* Comments Button */}
                    <button
                      onClick={() => toggleCommentsSection(word.id)}
                      className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        expandedCommentsWordId === word.id
                          ? 'bg-ocean-500/10 text-ocean-400 border border-ocean-500/20'
                          : 'bg-slate-900 text-slate-400 hover:text-ocean-450 border border-white/5'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Review / Diskusi</span>
                    </button>
                  </div>

                  {/* Report Correction Button */}
                  <button
                    onClick={() => handleOpenCorrection(word)}
                    disabled={word.status === 'dalam_review'}
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all duration-200 border ${
                      word.status === 'dalam_review'
                        ? 'text-slate-650 bg-transparent border-transparent cursor-not-allowed'
                        : 'text-amber-500 border-amber-500/25 bg-amber-550/5 hover:bg-amber-500 hover:text-slate-950'
                    }`}
                  >
                    {word.status === 'dalam_review' ? 'Usulan Diproses' : 'Koreksi'}
                  </button>
                </div>

                {/* EXPANDED REVIEW COMMENTS SECTION */}
                {expandedCommentsWordId === word.id && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-4 animate-fade-in-up">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 flex justify-between">
                      <span>Ulasan Pengguna ({wordComments[word.id]?.length || 0})</span>
                    </h4>

                    {/* Comments List */}
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                      {!wordComments[word.id] || wordComments[word.id].length === 0 ? (
                        <p className="text-[11px] text-slate-500 italic py-2 text-center">Belum ada review untuk kata ini. Jadilah yang pertama!</p>
                      ) : (
                        wordComments[word.id].map((comm) => (
                          <div key={comm.id} className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-[11px]">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-350">{comm.nama}</span>
                              <span className="text-[9px] text-slate-600">
                                {new Date(comm.created_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </span>
                            </div>
                            <p className="text-slate-300 leading-normal">{comm.komentar}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment Form */}
                    <form onSubmit={(e) => handleAddComment(e, word.id)} className="space-y-2 pt-2 border-t border-white/5">
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          required
                          value={newCommentInput.nama}
                          onChange={(e) => setNewCommentInput(prev => ({ ...prev, nama: e.target.value }))}
                          placeholder="Nama Anda"
                          className="col-span-1 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-ocean-500"
                        />
                        <input
                          type="text"
                          required
                          value={newCommentInput.teks}
                          onChange={(e) => setNewCommentInput(prev => ({ ...prev, teks: e.target.value }))}
                          placeholder="Tulis ulasan/komentar mengenai kata ini..."
                          className="col-span-2 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-ocean-500"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-ocean-500 hover:bg-ocean-400 text-slate-950 font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all"
                        >
                          Kirim Review
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

      {/* COMMUNITY CORRECTION MODAL POPUP */}
      {selectedWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md rounded-2xl glass-panel border border-white/10 overflow-hidden shadow-2xl animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 bg-slate-950/40 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-bold text-white">Koreksi Komunitas</h3>
              </div>
              <button 
                onClick={handleCloseCorrection}
                className="text-slate-400 hover:text-white transition-colors duration-200 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCorrectionSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Kata Asli:</span>
                <p className="text-sm font-bold text-white">{selectedWord.kata} — <span className="text-slate-400 text-xs italic">{selectedWord.arti}</span></p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Nama Pelapor / Info Kontak:</label>
                <input
                  type="text"
                  required
                  value={correctionForm.pelapor_info}
                  onChange={(e) => setCorrectionForm(prev => ({ ...prev, pelapor_info: e.target.value }))}
                  placeholder="Nama Lengkap atau email pelapor"
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Usulan Perbaikan Kata / Arti:</label>
                <input
                  type="text"
                  required
                  value={correctionForm.usulan_perbaikan}
                  onChange={(e) => setCorrectionForm(prev => ({ ...prev, usulan_perbaikan: e.target.value }))}
                  placeholder="Ketik kata perbaikan yang benar beserta arti"
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Alasan Perbaikan:</label>
                <textarea
                  required
                  rows={2}
                  value={correctionForm.alasan}
                  onChange={(e) => setCorrectionForm(prev => ({ ...prev, alasan: e.target.value }))}
                  placeholder="Kenapa kata ini harus diperbaiki? Jelaskan kesalahannya..."
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Sumber Referensi (Opsional):</label>
                <input
                  type="text"
                  value={correctionForm.sumber}
                  onChange={(e) => setCorrectionForm(prev => ({ ...prev, sumber: e.target.value }))}
                  placeholder="Buku Kamus, Ahli Penutur Asli, Balai Bahasa dll"
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center text-emerald-500 text-xs font-bold">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center text-rose-500 text-xs font-bold">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseCorrection}
                  className="flex-1 py-2.5 bg-slate-900 border border-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-lg"
                >
                  {isSubmitting ? (
                    <span>Mengirim...</span>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Kirim Laporan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
