"use client";

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Key, LogOut, Plus, Edit2, Trash2,
  FileSpreadsheet, Download, Upload, Check, X, AlertCircle, RefreshCw
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { seedWords } from '@/lib/seedData';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dictionary management states
  const [words, setWords] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [activeTab, setActiveTab] = useState('kamus'); // 'kamus' | 'koreksi'
  const [loading, setLoading] = useState(false);

  // Form states (Create / Edit)
  const [showForm, setShowForm] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [wordForm, setWordForm] = useState({
    kata: '',
    bahasa: 'ternate',
    dialek: 'melayu_ternate',
    arti: '',
    kelas_kata: 'kata_benda',
    contoh: ''
  });
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  // CSV Import States
  const [showImport, setShowImport] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [importStatus, setImportStatus] = useState('');

  // Search in Admin
  const [adminSearch, setAdminSearch] = useState('');

  // Sort and Filter States
  const [filterBahasa, setFilterBahasa] = useState('all');
  const [filterKelasKata, setFilterKelasKata] = useState('all');
  const [filterDialek, setFilterDialek] = useState('all');
  const [sortBy, setSortBy] = useState('id_asc');

  useEffect(() => {
    // Check local session
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('salama_admin_auth');
      if (auth === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated]);

  const fetchAdminData = async () => {
    setLoading(true);
    // Fetch all words (including those in review)
    const wordsRes = await db.getAllWordsAdmin();
    if (wordsRes.data) setWords(wordsRes.data);

    // Fetch corrections queue
    const corrRes = await db.getCorrections();
    if (corrRes.data) setCorrections(corrRes.data);

    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('salama_admin_auth', 'true');
        }
      } else {
        setLoginError(data.message || 'Kata sandi salah. Silakan coba lagi.');
      }
    } catch (err) {
      setLoginError('Koneksi gagal. Pastikan server aktif.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('salama_admin_auth');
    }
  };

  // CRUD Operations
  const handleOpenCreate = () => {
    setEditingWord(null);
    setWordForm({
      kata: '',
      bahasa: 'ternate',
      dialek: 'melayu_ternate',
      arti: '',
      kelas_kata: 'kata_benda',
      contoh: ''
    });
    setFormMsg({ type: '', text: '' });
    setShowForm(true);
  };

  const handleOpenEdit = (word) => {
    setEditingWord(word);
    setWordForm({
      kata: word.kata,
      bahasa: word.bahasa,
      dialek: word.dialek || 'melayu_ternate',
      arti: word.arti,
      kelas_kata: word.kelas_kata,
      contoh: word.contoh || ''
    });
    setFormMsg({ type: '', text: '' });
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });

    if (!wordForm.kata.trim() || !wordForm.arti.trim()) {
      setFormMsg({ type: 'error', text: 'Semua kolom wajib diisi.' });
      return;
    }

    try {
      if (editingWord) {
        // Edit Mode
        const res = await db.updateWord(editingWord.id, {
          kata: wordForm.kata,
          bahasa: wordForm.bahasa,
          dialek: wordForm.dialek,
          arti: wordForm.arti,
          kelas_kata: wordForm.kelas_kata,
          contoh: wordForm.contoh,
          status: editingWord.status // preserve status
        });
        if (res.error) throw new Error(res.error);
        setFormMsg({ type: 'success', text: 'Kosakata berhasil diperbarui!' });
      } else {
        // Create Mode
        const res = await db.insertWord({
          kata: wordForm.kata,
          bahasa: wordForm.bahasa,
          dialek: wordForm.dialek,
          arti: wordForm.arti,
          kelas_kata: wordForm.kelas_kata,
          contoh: wordForm.contoh,
          status: 'aktif'
        });
        if (res.error) throw new Error(res.error);
        setFormMsg({ type: 'success', text: 'Kosakata baru berhasil ditambahkan!' });
      }

      await fetchAdminData();
      setTimeout(() => setShowForm(false), 1500);
    } catch (err) {
      console.error(err);
      setFormMsg({ type: 'error', text: 'Terjadi kesalahan sistem.' });
    }
  };

  const handleDeleteWord = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus kosakata ini secara permanen?')) {
      const res = await db.deleteWord(id);
      if (!res.error) {
        await fetchAdminData();
      } else {
        alert('Gagal menghapus kosakata.');
      }
    }
  };

  // Correction approval
  const handleApproveCorrection = async (id) => {
    if (confirm('Setujui laporan ini? Kata terkait di kamus akan langsung diperbarui secara otomatis.')) {
      await db.updateCorrectionStatus(id, 'disetujui');
      await fetchAdminData();
    }
  };

  const handleRejectCorrection = async (id) => {
    if (confirm('Tolak laporan ini? Status kata terkait akan dikembalikan menjadi Aktif tanpa perubahan.')) {
      await db.updateCorrectionStatus(id, 'ditolak');
      await fetchAdminData();
    }
  };

  // Export kamus to CSV
  const handleExportCSV = () => {
    if (words.length === 0) return;

    // Define headers
    const headers = ['id', 'kata', 'bahasa', 'dialek', 'arti', 'kelas_kata', 'contoh', 'status'];
    const rows = words.map(w => [
      w.id,
      `"${w.kata.replace(/"/g, '""')}"`,
      `"${w.bahasa}"`,
      `"${w.dialek || ''}"`,
      `"${w.arti.replace(/"/g, '""')}"`,
      `"${w.kelas_kata}"`,
      `"${(w.contoh || '').replace(/"/g, '""')}"`,
      `"${w.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    // Download trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kamus_salama_ai_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target.result);
      setImportStatus(`File "${file.name}" berhasil dimuat. Silakan klik "Impor Sekarang".`);
    };
    reader.readAsText(file);
  };

  // Import CSV content
  const handleImportCSV = async () => {
    if (!csvContent.trim()) {
      setImportStatus('Masukkan konten teks CSV Anda.');
      return;
    }

    try {
      const lines = csvContent.split('\n');
      let importCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Basic CSV Parsing (handling quotes lightly)
        const parts = line.split(',').map(p => p.replace(/^"|"$/g, '').trim());
        if (parts.length < 5) continue;

        // Expected format: kata, bahasa, dialek, arti, kelas_kata, contoh (optional)
        const [kata, bahasa, dialek, arti, kelas_kata, contoh] = parts;

        await db.insertWord({
          kata,
          bahasa: bahasa.toLowerCase() === 'sula' ? 'sula' : 'ternate',
          dialek: dialek || 'melayu_ternate',
          arti,
          kelas_kata: kelas_kata || 'kata_benda',
          contoh: contoh || '',
          status: 'aktif'
        });
        importCount++;
      }

      await fetchAdminData();
      setImportStatus(`Berhasil mengimpor ${importCount} kosakata baru ke kamus!`);
      setCsvContent('');
      setTimeout(() => setShowImport(false), 2500);
    } catch (err) {
      console.error(err);
      setImportStatus('Gagal mengimpor CSV. Pastikan format kolom sesuai.');
    }
  };

  // Filter words inside admin panel
  const adminFilteredWords = words
    .filter(w => {
      // 1. Search Query
      if (adminSearch.trim()) {
        const query = adminSearch.toLowerCase();
        const matchesQuery = w.kata.toLowerCase().includes(query) || w.arti.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }
      // 2. Bahasa Filter
      if (filterBahasa !== 'all') {
        if (w.bahasa !== filterBahasa) return false;
      }
      // 3. Kelas Kata Filter
      if (filterKelasKata !== 'all') {
        if (w.kelas_kata !== filterKelasKata) return false;
      }
      // 4. Dialek Filter
      if (filterDialek !== 'all') {
        if (w.dialek !== filterDialek) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'id_asc') {
        return a.id - b.id;
      } else if (sortBy === 'id_desc') {
        return b.id - a.id;
      } else if (sortBy === 'kata_asc') {
        return a.kata.localeCompare(b.kata);
      } else if (sortBy === 'kata_desc') {
        return b.kata.localeCompare(a.kata);
      }
      return 0;
    });

  // ==================== AUTHENTICATED PANEL ====================
  if (isAuthenticated) {
    return (
      <>
        <div className="space-y-8 animate-fade-in-up">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-950/40 p-5 border border-white/5 rounded-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Panel Administrasi Salama AI</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Editor & Kontrol Konten Kamus</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAdminData}
              title="Refresh Data"
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/25 hover:border-transparent text-rose-500 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar Admin</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setActiveTab('kamus')}
            className={`px-6 py-3 font-bold text-sm tracking-wider uppercase border-b-2 transition-all ${activeTab === 'kamus'
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-slate-400 hover:text-white'
              }`}
          >
            Kelola Kamus ({words.length})
          </button>
          <button
            onClick={() => setActiveTab('koreksi')}
            className={`px-6 py-3 font-bold text-sm tracking-wider uppercase border-b-2 transition-all flex items-center space-x-2 ${activeTab === 'koreksi'
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-slate-400 hover:text-white'
              }`}
          >
            <span>Koreksi Komunitas</span>
            {corrections.filter(c => c.status === 'menunggu').length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce">
                {corrections.filter(c => c.status === 'menunggu').length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Dictionary CRUD Dashboard */}
        {activeTab === 'kamus' && (
          <div className="space-y-6">

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-950/20 p-4 border border-white/5 rounded-xl">
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Cari kata di dashboard admin..."
                className="w-full sm:w-80 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-gold-500 transition-all"
              />

              <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowImport(true)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
                >
                  <Upload className="h-4 w-4 text-gold-500" />
                  <span>Import CSV</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
                >
                  <Download className="h-4 w-4 text-ocean-500" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handleOpenCreate}
                  className="px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow"
                >
                  <Plus className="h-4 w-4 text-slate-950" />
                  <span>Tambah Kata</span>
                </button>
              </div>
            </div>

            {/* Filter and Sort Controls */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/20 p-4 border border-white/5 rounded-xl text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400">Bahasa:</label>
                <select
                  value={filterBahasa}
                  onChange={(e) => setFilterBahasa(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-gold-505 focus:border-gold-500 transition-all cursor-pointer"
                >
                  <option value="all">Semua Bahasa</option>
                  <option value="ternate">Ternate</option>
                  <option value="sula">Sula</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400">Kelas Kata:</label>
                <select
                  value={filterKelasKata}
                  onChange={(e) => setFilterKelasKata(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-gold-500 transition-all cursor-pointer"
                >
                  <option value="all">Semua Kelas</option>
                  <option value="kata_benda">Kata Benda</option>
                  <option value="kata_kerja">Kata Kerja</option>
                  <option value="kata_sifat">Kata Sifat</option>
                  <option value="kata_ganti">Kata Ganti</option>
                  <option value="kata_bilangan">Kata Bilangan</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400">Dialek:</label>
                <select
                  value={filterDialek}
                  onChange={(e) => setFilterDialek(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-gold-500 transition-all cursor-pointer"
                >
                  <option value="all">Semua Dialek</option>
                  <option value="melayu_ternate">Melayu Ternate</option>
                  <option value="tidore">Tidore</option>
                  <option value="sula_standar">Sula Standar</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400">Urutkan:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-gold-500 transition-all cursor-pointer"
                >
                  <option value="id_asc">ID Terkecil (Awal)</option>
                  <option value="id_desc">ID Terbesar (Terbaru)</option>
                  <option value="kata_asc">Abjad (A - Z)</option>
                  <option value="kata_desc">Abjad (Z - A)</option>
                </select>
              </div>
            </div>

            {/* Count Indicator */}
            <div className="flex justify-between items-center text-xs text-slate-400 font-medium px-1">
              <span>
                Menampilkan <strong className="text-white">{adminFilteredWords.length}</strong> dari <strong className="text-white">{words.length}</strong> kosakata.
              </span>
              {(filterBahasa !== 'all' || filterKelasKata !== 'all' || filterDialek !== 'all' || adminSearch.trim() !== '') && (
                <button
                  onClick={() => {
                    setFilterBahasa('all');
                    setFilterKelasKata('all');
                    setFilterDialek('all');
                    setAdminSearch('');
                  }}
                  className="text-gold-400 hover:text-gold-300 font-bold transition-colors"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Table words */}
            <div className="overflow-x-auto rounded-2xl glass-panel border border-white/5">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-white/10 text-slate-400 uppercase font-bold tracking-wider">
                    <th className="p-4 text-center">ID</th>
                    <th className="p-4">Kata</th>
                    <th className="p-4">Bahasa</th>
                    <th className="p-4">Dialek</th>
                    <th className="p-4">Arti</th>
                    <th className="p-4">Kelas</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">Loading data...</td>
                    </tr>
                  ) : adminFilteredWords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">Data kosong atau kata tidak ditemukan.</td>
                    </tr>
                  ) : (
                    adminFilteredWords.map((word) => (
                      <tr key={word.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 text-center font-bold text-slate-500">{word.id}</td>
                        <td className="p-4 font-bold text-white text-sm">{word.kata}</td>
                        <td className="p-4 uppercase font-semibold text-slate-300">{word.bahasa}</td>
                        <td className="p-4 text-slate-400">{word.dialek || '-'}</td>
                        <td className="p-4 text-slate-300 font-semibold">{word.arti}</td>
                        <td className="p-4 text-slate-400 font-semibold">{word.kelas_kata}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${word.status === 'dalam_review'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`}>
                            {word.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleOpenEdit(word)}
                              className="p-2 bg-white/5 hover:bg-gold-500/10 border border-white/10 hover:border-gold-500/20 text-slate-400 hover:text-gold-500 rounded-lg transition-all"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteWord(word.id)}
                              className="p-2 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Corrections Antrean Queue */}
        {activeTab === 'koreksi' && (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-2xl glass-panel border border-white/5">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-white/10 text-slate-400 uppercase font-bold tracking-wider">
                    <th className="p-4">Kata Asli</th>
                    <th className="p-4">Pelapor</th>
                    <th className="p-4">Kata Salah</th>
                    <th className="p-4">Usulan</th>
                    <th className="p-4">Alasan</th>
                    <th className="p-4">Referensi</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">Loading data...</td>
                    </tr>
                  ) : corrections.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">Antrean koreksi kosong. Belum ada laporan komunitas.</td>
                    </tr>
                  ) : (
                    corrections.map((corr) => (
                      <tr key={corr.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold text-white">
                          {corr.kata ? corr.kata.kata : `ID: ${corr.kata_id}`}
                        </td>
                        <td className="p-4 font-semibold text-slate-300">{corr.pelapor_info}</td>
                        <td className="p-4 text-rose-400 font-bold line-through">{corr.kata_salah}</td>
                        <td className="p-4 text-emerald-400 font-bold">{corr.usulan_perbaikan}</td>
                        <td className="p-4 text-slate-400 max-w-xs">{corr.alasan}</td>
                        <td className="p-4 text-slate-500 italic">{corr.sumber || '-'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${corr.status === 'menunggu'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25 animate-pulse'
                              : corr.status === 'disetujui'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            }`}>
                            {corr.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {corr.status === 'menunggu' ? (
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleApproveCorrection(corr.id)}
                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-transparent text-emerald-500 hover:text-slate-950 rounded-lg transition-all"
                                title="Setujui Usulan"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleRejectCorrection(corr.id)}
                                className="p-2 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:border-transparent text-rose-500 hover:text-white rounded-lg transition-all"
                                title="Tolak Usulan"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic text-center block">Tinjauan Selesai</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

        {/* CRUD MODAL FORM DRAWES */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl glass-panel border border-white/10 overflow-hidden shadow-2xl animate-fade-in-up">

              <div className="p-6 border-b border-white/5 bg-slate-950/40 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">
                  {editingWord ? 'Sunting Kosakata' : 'Tambah Kosakata Baru'}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Kosakata:</label>
                    <input
                      type="text"
                      required
                      value={wordForm.kata}
                      onChange={(e) => setWordForm(prev => ({ ...prev, kata: e.target.value }))}
                      placeholder="Masukkan kata"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Arti (Bahasa Indonesia):</label>
                    <input
                      type="text"
                      required
                      value={wordForm.arti}
                      onChange={(e) => setWordForm(prev => ({ ...prev, arti: e.target.value }))}
                      placeholder="Terjemahan bahasa"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Bahasa:</label>
                    <select
                      value={wordForm.bahasa}
                      onChange={(e) => setWordForm(prev => ({ ...prev, bahasa: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-500"
                    >
                      <option value="ternate">Ternate</option>
                      <option value="sula">Sula</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Dialek:</label>
                    <select
                      value={wordForm.dialek}
                      onChange={(e) => setWordForm(prev => ({ ...prev, dialek: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-500"
                    >
                      <option value="melayu_ternate">Melayu Ternate</option>
                      <option value="tidore">Tidore</option>
                      <option value="sula_standar">Sula Standar</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Kelas Kata:</label>
                    <select
                      value={wordForm.kelas_kata}
                      onChange={(e) => setWordForm(prev => ({ ...prev, kelas_kata: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-500"
                    >
                      <option value="kata_benda">Kata Benda</option>
                      <option value="kata_kerja">Kata Kerja</option>
                      <option value="kata_sifat">Kata Sifat</option>
                      <option value="kata_ganti">Kata Ganti</option>
                      <option value="kata_bilangan">Kata Bilangan</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Contoh Penggunaan Kalimat:</label>
                  <textarea
                    rows={2}
                    value={wordForm.contoh}
                    onChange={(e) => setWordForm(prev => ({ ...prev, contoh: e.target.value }))}
                    placeholder="Tulis kalimat beserta artinya..."
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500 resize-none"
                  />
                </div>

                {formMsg.text && (
                  <div className={`p-3 rounded-lg flex items-center text-xs font-bold ${formMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
                    }`}>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>{formMsg.text}</span>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 bg-slate-900 border border-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg"
                  >
                    Simpan Data
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* IMPORT CSV DRAWER */}
        {showImport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl glass-panel border border-white/10 overflow-hidden shadow-2xl animate-fade-in-up">

              <div className="p-6 border-b border-white/5 bg-slate-950/40 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <FileSpreadsheet className="h-5 w-5 mr-2 text-gold-500" />
                  <span>Impor CSV Kamus</span>
                </h3>
                <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2 text-slate-400 text-[11px] leading-relaxed">
                  <span className="text-white font-bold block uppercase tracking-wide">Format Baris CSV wajib:</span>
                  <code className="block bg-slate-950 p-2.5 rounded border border-white/10 text-gold-400 overflow-x-auto whitespace-pre">
                    kata, bahasa, dialek, arti, kelas_kata, contoh<br />
                    fola, ternate, melayu_ternate, rumah, kata_benda, fola ena (rumah itu)<br />
                    pia, sula, sula_standar, baik, kata_sifat, hia pia (dia baik)
                  </code>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">Pilih File CSV:</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl border-white/10 hover:border-gold-550/30 bg-slate-950/40 hover:bg-slate-950/60 transition-all cursor-pointer group">
                      <div className="flex flex-col items-center justify-center pt-4 pb-4">
                        <Upload className="h-6 w-6 text-slate-500 group-hover:text-gold-400 transition-colors mb-1.5" />
                        <p className="text-[11px] text-slate-400 group-hover:text-white transition-colors">Klik untuk memilih file CSV dari perangkat Anda</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">Mendukung format CSV kamus</p>
                      </div>
                      <input 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        onChange={handleCSVFileChange} 
                      />
                    </label>
                  </div>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-3 text-slate-500 text-[9px] uppercase font-bold tracking-wider">Atau</span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Tempel Konten CSV:</label>
                  <textarea
                    rows={4}
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    placeholder="kata,bahasa,dialek,arti,kelas_kata,contoh..."
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500 font-mono resize-none"
                  />
                </div>

                {importStatus && (
                  <p className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-gold-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>{importStatus}</span>
                  </p>
                )}

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowImport(false)}
                    className="flex-1 py-2.5 bg-slate-900 border border-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleImportCSV}
                    className="flex-1 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg"
                  >
                    Impor Sekarang
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ==================== ADMIN LOGIN SCREEN ====================
  return (
    <div className="max-w-md mx-auto py-12 animate-fade-in-up">
      <div className="p-8 rounded-3xl glass-panel border border-white/10 space-y-6 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl" />

        <div className="text-center space-y-3">
          <div className="mx-auto p-4 bg-gradient-to-br from-rose-500 to-rose-600 w-fit rounded-2xl shadow-lg border border-rose-400/20">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Autentikasi Admin</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Halaman ini dilindungi. Masukkan kata sandi administrator Salama AI untuk mengelola database kamus & koreksi komunitas.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center">
              <Key className="h-3.5 w-3.5 mr-1 text-gold-500" />
              <span>Kata Sandi Admin:</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi (default: admin123)"
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all duration-300"
            />
          </div>

          {loginError && (
            <p className="text-xs font-bold text-rose-500 bg-rose-500/10 p-3 rounded-lg flex items-center">
              <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
              <span>{loginError}</span>
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] shadow-lg border border-rose-300/15"
          >
            Masuk ke Panel Kontrol
          </button>
        </form>
      </div>
    </div>
  );
}
