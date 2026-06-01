"use client";

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Key, LogOut, Plus, Edit2, Trash2,
  FileSpreadsheet, Download, Upload, Check, X, AlertCircle, RefreshCw, XCircle, AlertTriangle, Info
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { seedWords } from '@/lib/seedData';

const parseCorrectionJSON = (usulanStr) => {
  try {
    const trimmed = usulanStr ? usulanStr.trim() : '';
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return JSON.parse(trimmed);
    }
  } catch (e) {}
  return null;
};

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
    dialek: 'ternate',
    arti: '',
    kelas_kata: 'kata_benda',
    contoh: ''
  });
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });
  const [duplicateWarning, setDuplicateWarning] = useState(null); // { found: [...], exact: bool }

  // Bulk Selection States
  const [selectedWordIds, setSelectedWordIds] = useState([]);
  const [selectedCorrectionIds, setSelectedCorrectionIds] = useState([]);

  // CSV Import States
  const [showImport, setShowImport] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [importReport, setImportReport] = useState(null); // { imported, skipped, skippedWords }

  // Search in Admin
  const [adminSearch, setAdminSearch] = useState('');
  const [corrSearch, setCorrSearch] = useState('');

  // Sort and Filter States
  const [filterBahasa, setFilterBahasa] = useState('all');
  const [filterKelasKata, setFilterKelasKata] = useState('all');
  const [filterDialek, setFilterDialek] = useState('all');
  const [sortBy, setSortBy] = useState('id_asc');

  useEffect(() => {
    // Verify existing session token with server
    const verifySession = async () => {
      if (typeof window === 'undefined') return;
      const token = sessionStorage.getItem('salama_admin_token');
      if (!token) return;
      
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify', token })
        });
        const data = await res.json();
        if (data.success) {
          setIsAuthenticated(true);
        } else {
          // Token expired or invalid — clean up
          sessionStorage.removeItem('salama_admin_token');
        }
      } catch {
        // Server unreachable — clear stale token
        sessionStorage.removeItem('salama_admin_token');
      }
    };
    verifySession();
  }, []);

  useEffect(() => {
    setSelectedWordIds([]);
    setSelectedCorrectionIds([]);
  }, [activeTab]);

  const handleSelectWord = (id) => {
    setSelectedWordIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllWords = (visibleWords) => {
    if (selectedWordIds.length === visibleWords.length) {
      setSelectedWordIds([]);
    } else {
      setSelectedWordIds(visibleWords.map(w => w.id));
    }
  };

  const handleSelectCorrection = (id) => {
    setSelectedCorrectionIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllCorrections = (visibleCorrections) => {
    if (selectedCorrectionIds.length === visibleCorrections.length) {
      setSelectedCorrectionIds([]);
    } else {
      setSelectedCorrectionIds(visibleCorrections.map(c => c.id));
    }
  };

  const handleBulkDeleteWords = async () => {
    if (selectedWordIds.length === 0) return;
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus secara massal ${selectedWordIds.length} kosakata terpilih? Tindakan ini tidak dapat dibatalkan!`);
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const res = await db.deleteWords(selectedWordIds);
      if (res && res.error) throw new Error(res.error);
      setSelectedWordIds([]);
      await fetchAdminData();
      alert('Kosakata terpilih berhasil dihapus.');
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus beberapa kosakata.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteCorrections = async () => {
    if (selectedCorrectionIds.length === 0) return;
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus secara massal ${selectedCorrectionIds.length} laporan koreksi terpilih?`);
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const res = await db.deleteCorrections(selectedCorrectionIds);
      if (res && res.error) throw new Error(res.error);
      setSelectedCorrectionIds([]);
      await fetchAdminData();
      alert('Laporan koreksi terpilih berhasil dihapus.');
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus laporan koreksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleResequenceIds = async () => {
    const confirmReseq = window.confirm('Apakah Anda yakin ingin merapikan dan mengurutkan ulang semua ID kosakata secara berurutan tanpa celah? Tindakan ini akan menata ulang ID kata yang sempat terhapus sehingga menjadi rapi dan teratur.');
    if (!confirmReseq) return;

    setLoading(true);
    try {
      const res = await db.resequenceIds();
      if (res && !res.success) {
        throw new Error(res.error || 'Gagal merapikan ID.');
      }
      await fetchAdminData();
      alert('Semua ID kosakata berhasil dirapikan dan diurutkan ulang dengan sukses!');
    } catch (err) {
      console.error(err);
      alert(`Gagal merapikan ID: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated]);

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
        if (typeof window !== 'undefined' && data.token) {
          sessionStorage.setItem('salama_admin_token', data.token);
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

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('salama_admin_token');
      // Invalidate server session
      try {
        await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'logout', token })
        });
      } catch { /* ignore */ }
      sessionStorage.removeItem('salama_admin_token');
    }
    setIsAuthenticated(false);
  };

  // CRUD Operations
  // Check if a word already exists in the system
  const checkDuplicate = (kata, bahasa) => {
    const normalizedKata = kata.trim().toLowerCase();
    const normalizedBahasa = bahasa.trim().toLowerCase();
    return words.filter(w =>
      w.kata.trim().toLowerCase() === normalizedKata &&
      w.bahasa.trim().toLowerCase() === normalizedBahasa
    );
  };

  const handleOpenCreate = () => {
    setEditingWord(null);
    setWordForm({
      kata: '',
      bahasa: 'ternate',
      dialek: 'ternate',
      arti: '',
      kelas_kata: 'kata_benda',
      contoh: ''
    });
    setFormMsg({ type: '', text: '' });
    setDuplicateWarning(null);
    setShowForm(true);
  };

  const handleOpenEdit = (word) => {
    setEditingWord(word);
    setWordForm({
      kata: word.kata,
      bahasa: word.bahasa,
      dialek: word.dialek || 'ternate',
      arti: word.arti,
      kelas_kata: word.kelas_kata,
      contoh: word.contoh || ''
    });
    setFormMsg({ type: '', text: '' });
    setDuplicateWarning(null);
    setShowForm(true);
  };

  // Live duplicate check when user types in the form
  const handleWordFormChange = (field, value) => {
    const newForm = { ...wordForm, [field]: value };
    setWordForm(newForm);

    // Check duplicates in both create and edit mode when kata field has content
    if ((field === 'kata' || field === 'bahasa') && newForm.kata.trim().length >= 2) {
      const dupes = checkDuplicate(newForm.kata, newForm.bahasa);
      // Filter out current word being edited (so editing the same word doesn't trigger warning)
      const relevantDupes = editingWord
        ? dupes.filter(d => d.id !== editingWord.id)
        : dupes;
      if (relevantDupes.length > 0) {
        setDuplicateWarning({
          found: relevantDupes,
          message: `Kata "${newForm.kata}" dalam bahasa ${newForm.bahasa} sudah ada di sistem (ID: ${relevantDupes.map(d => d.id).join(', ')}, arti: "${relevantDupes[0].arti}").`
        });
      } else {
        setDuplicateWarning(null);
      }
    } else if (field === 'kata' && value.trim().length < 2) {
      setDuplicateWarning(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });

    if (!wordForm.kata.trim() || !wordForm.arti.trim()) {
      setFormMsg({ type: 'error', text: 'Kolom "Kosakata" dan "Arti" wajib diisi.' });
      return;
    }

    // Final duplicate check before submit (both create and edit mode)
    const dupes = checkDuplicate(wordForm.kata, wordForm.bahasa);
    const relevantDupes = editingWord
      ? dupes.filter(d => d.id !== editingWord.id)
      : dupes;
    if (relevantDupes.length > 0) {
      const action = editingWord ? 'memperbarui' : 'menambahkan';
      const confirmAdd = confirm(
        `⚠️ PERINGATAN DATA GANDA!\n\nKata "${wordForm.kata}" dalam bahasa ${wordForm.bahasa} sudah ada di sistem:\n` +
        relevantDupes.map(d => `• ID ${d.id}: "${d.kata}" → "${d.arti}" (${d.kelas_kata})`).join('\n') +
        `\n\nApakah Anda tetap ingin ${action} kata ini?`
      );
      if (!confirmAdd) return;
    }

    // Prevent double submission
    setLoading(true);
    setFormMsg({ type: 'info', text: 'Menyimpan data...' });

    try {
      let res;
      if (editingWord) {
        // Edit Mode
        res = await db.updateWord(editingWord.id, {
          kata: wordForm.kata,
          bahasa: wordForm.bahasa,
          dialek: wordForm.dialek,
          arti: wordForm.arti,
          kelas_kata: wordForm.kelas_kata,
          contoh: wordForm.contoh,
          status: editingWord.status // preserve status
        });
      } else {
        // Create Mode
        res = await db.insertWord({
          kata: wordForm.kata,
          bahasa: wordForm.bahasa,
          dialek: wordForm.dialek,
          arti: wordForm.arti,
          kelas_kata: wordForm.kelas_kata,
          contoh: wordForm.contoh,
          status: 'aktif'
        });
      }

      // Extract error message properly (handles both string and object errors)
      if (res.error) {
        const errMsg = typeof res.error === 'string'
          ? res.error
          : res.error?.message || res.error?.details || JSON.stringify(res.error);
        console.error('[Salama AI] Form submit error:', res.error);
        setFormMsg({
          type: 'error',
          text: `Gagal ${editingWord ? 'memperbarui' : 'menambahkan'} kosakata: ${errMsg}`
        });
        setLoading(false);
        return;
      }

      // Success
      setFormMsg({
        type: 'success',
        text: editingWord
          ? 'Kosakata berhasil diperbarui!'
          : 'Kosakata baru berhasil ditambahkan!'
      });
      setDuplicateWarning(null);

      await fetchAdminData();
      setTimeout(() => setShowForm(false), 1500);
    } catch (err) {
      console.error('[Salama AI] Form submit exception:', err);
      const errDetail = err?.message || 'Koneksi ke database gagal. Periksa koneksi internet Anda.';
      setFormMsg({
        type: 'error',
        text: `Gagal menyimpan: ${errDetail}`
      });
    } finally {
      setLoading(false);
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

  // Import CSV content — with smart duplicate filtering
  const handleImportCSV = async () => {
    if (!csvContent.trim()) {
      setImportStatus('Masukkan konten teks CSV Anda.');
      return;
    }

    setImportReport(null);
    setImportStatus('Sedang memproses dan memfilter data ganda...');

    try {
      const lines = csvContent.split('\n');
      let importCount = 0;
      let skippedCount = 0;
      const skippedWords = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Basic CSV Parsing (handling quotes lightly)
        const parts = line.split(',').map(p => p.replace(/^"|"$/g, '').trim());
        if (parts.length < 4) continue;

        // Expected format: kata, bahasa, dialek, arti, kelas_kata, contoh (optional)
        const [kata, bahasa, dialek, arti, kelas_kata, contoh] = parts;

        if (!kata || !arti) continue;

        const normalizedBahasa = bahasa?.toLowerCase() === 'sula' ? 'sula' : 'ternate';

        // Check for duplicates against existing system data
        const dupes = checkDuplicate(kata, normalizedBahasa);
        if (dupes.length > 0) {
          skippedCount++;
          skippedWords.push({ kata, bahasa: normalizedBahasa, arti, existingArti: dupes[0].arti, existingId: dupes[0].id });
          continue; // Skip this duplicate
        }

        await db.insertWord({
          kata,
          bahasa: normalizedBahasa,
          dialek: dialek || 'ternate',
          arti,
          kelas_kata: kelas_kata || 'kata_benda',
          contoh: contoh || '',
          status: 'aktif'
        });
        importCount++;
      }

      await fetchAdminData();

      // Build detailed report
      setImportReport({ imported: importCount, skipped: skippedCount, skippedWords });

      if (skippedCount > 0 && importCount > 0) {
        setImportStatus(`✅ Berhasil mengimpor ${importCount} kosakata baru. ⚠️ ${skippedCount} kata dilewati karena sudah ada di sistem.`);
      } else if (skippedCount > 0 && importCount === 0) {
        setImportStatus(`⚠️ Semua ${skippedCount} kosakata dalam CSV sudah ada di sistem. Tidak ada data baru yang diimpor.`);
      } else {
        setImportStatus(`✅ Berhasil mengimpor ${importCount} kosakata baru ke kamus!`);
      }

      setCsvContent('');
    } catch (err) {
      console.error(err);
      setImportStatus('❌ Gagal mengimpor CSV. Pastikan format kolom sesuai.');
    }
  };

  const getDialekName = (slug) => {
    const mappings = {
      ternate: 'Ternate',
      melayu_ternate: 'Ternate',
      tidore: 'Tidore',
      sula: 'Sula',
      sula_standar: 'Sula'
    };
    return mappings[slug] || slug;
  };

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

  const parseIndonesianNumber = (text) => {
    if (!text) return Infinity;
    const clean = text.toLowerCase().trim();
    const digitMatch = clean.match(/\d+/);
    if (digitMatch) return parseInt(digitMatch[0], 10);
    const mapping = [
      { key: 'dua puluh satu', val: 21 },
      { key: 'dua puluh dua', val: 22 },
      { key: 'dua puluh tiga', val: 23 },
      { key: 'dua puluh empat', val: 24 },
      { key: 'dua puluh lima', val: 25 },
      { key: 'dua puluh enam', val: 26 },
      { key: 'dua puluh tujuh', val: 27 },
      { key: 'dua puluh delapan', val: 28 },
      { key: 'dua puluh sembilan', val: 29 },
      { key: 'sembilan belas', val: 19 },
      { key: 'delapan belas', val: 18 },
      { key: 'tujuh belas', val: 17 },
      { key: 'enam belas', val: 16 },
      { key: 'lima belas', val: 15 },
      { key: 'empat belas', val: 14 },
      { key: 'tiga belas', val: 13 },
      { key: 'dua belas', val: 12 },
      { key: 'sebelas', val: 11 },
      { key: 'sepuluh', val: 10 },
      { key: 'sembilan', val: 9 },
      { key: 'delapan', val: 8 },
      { key: 'tujuh', val: 7 },
      { key: 'enam', val: 6 },
      { key: 'lima', val: 5 },
      { key: 'empat', val: 4 },
      { key: 'tiga', val: 3 },
      { key: 'dua', val: 2 },
      { key: 'satu', val: 1 },
      { key: 'nol', val: 0 },
      { key: 'kosong', val: 0 },
      { key: 'pertama', val: 1 },
      { key: 'kedua', val: 2 },
      { key: 'ketiga', val: 3 },
      { key: 'keempat', val: 4 },
      { key: 'kelima', val: 5 },
      { key: 'keenam', val: 6 },
      { key: 'ketujuh', val: 7 },
      { key: 'kedelapan', val: 8 },
      { key: 'kesembilan', val: 9 },
      { key: 'kesepuluh', val: 10 }
    ];
    for (const item of mapping) {
      if (clean === item.key || clean.startsWith(item.key + ' ') || clean.includes(' ' + item.key + ' ') || clean.endsWith(' ' + item.key)) {
        return item.val;
      }
    }
    return Infinity;
  };

  // Normalize legacy dialect slugs to current names
  const normalizeDialek = (d) => {
    if (!d) return '';
    const slug = d.toLowerCase().trim();
    if (slug === 'melayu_ternate') return 'ternate';
    if (slug === 'sula_standar') return 'sula';
    return slug;
  };

  // Filter words inside admin panel
  const adminFilteredWords = words
    .filter(w => {
      // 1. Search Query (ID, Word, or Meaning)
      if (adminSearch.trim()) {
        const query = adminSearch.toLowerCase().trim();
        const matchesQuery = 
          w.id.toString().includes(query) ||
          w.kata.toLowerCase().includes(query) || 
          w.arti.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }
      // 2. Bahasa Filter
      if (filterBahasa !== 'all') {
        if (!w.bahasa || w.bahasa.toLowerCase() !== filterBahasa.toLowerCase()) return false;
      }
      // 3. Kelas Kata Filter
      if (filterKelasKata !== 'all') {
        if (!w.kelas_kata || w.kelas_kata.toLowerCase() !== filterKelasKata.toLowerCase()) return false;
      }
      // 4. Dialek Filter — normalize legacy dialect slugs before comparing
      if (filterDialek !== 'all') {
        const normalizedDialek = normalizeDialek(w.dialek);
        if (normalizedDialek !== filterDialek.toLowerCase()) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'id_asc') {
        if (a.kelas_kata === 'kata_bilangan' && b.kelas_kata === 'kata_bilangan') {
          const valA = parseIndonesianNumber(a.arti);
          const valB = parseIndonesianNumber(b.arti);
          if (valA !== valB) return valA - valB;
        }
        return a.id - b.id;
      } else if (sortBy === 'id_desc') {
        if (a.kelas_kata === 'kata_bilangan' && b.kelas_kata === 'kata_bilangan') {
          const valA = parseIndonesianNumber(a.arti);
          const valB = parseIndonesianNumber(b.arti);
          if (valA !== valB) return valB - valA;
        }
        return b.id - a.id;
      } else if (sortBy === 'kata_asc') {
        if (a.kelas_kata === 'kata_bilangan' && b.kelas_kata === 'kata_bilangan') {
          const valA = parseIndonesianNumber(a.arti);
          const valB = parseIndonesianNumber(b.arti);
          if (valA !== valB) return valA - valB;
        }
        return a.kata.localeCompare(b.kata);
      } else if (sortBy === 'kata_desc') {
        if (a.kelas_kata === 'kata_bilangan' && b.kelas_kata === 'kata_bilangan') {
          const valA = parseIndonesianNumber(a.arti);
          const valB = parseIndonesianNumber(b.arti);
          if (valA !== valB) return valB - valA;
        }
        return b.kata.localeCompare(a.kata);
      } else if (sortBy === 'arti_asc') {
        if (a.kelas_kata === 'kata_bilangan' && b.kelas_kata === 'kata_bilangan') {
          const valA = parseIndonesianNumber(a.arti);
          const valB = parseIndonesianNumber(b.arti);
          if (valA !== valB) return valA - valB;
        }
        return a.arti.localeCompare(b.arti);
      } else if (sortBy === 'arti_desc') {
        if (a.kelas_kata === 'kata_bilangan' && b.kelas_kata === 'kata_bilangan') {
          const valA = parseIndonesianNumber(a.arti);
          const valB = parseIndonesianNumber(b.arti);
          if (valA !== valB) return valB - valA;
        }
        return b.arti.localeCompare(a.arti);
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
              title="Muat Ulang Data"
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
              {/* Search input with clear button */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder="Cari kata di dashboard admin..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 pr-9 text-xs text-slate-200 focus:outline-none focus:border-gold-500 transition-all"
                  />
                  {adminSearch && (
                    <button
                      onClick={() => setAdminSearch('')}
                      title="Hapus pencarian"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {selectedWordIds.length > 0 && (
                  <button
                    onClick={handleBulkDeleteWords}
                    className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 shadow-lg shadow-rose-950/20 animate-fade-in"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Hapus Terpilih ({selectedWordIds.length})</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => { setShowImport(true); setImportReport(null); setImportStatus(''); }}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
                >
                  <Upload className="h-4 w-4 text-gold-500" />
                  <span>Impor CSV</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
                >
                  <Download className="h-4 w-4 text-ocean-500" />
                  <span>Ekspor CSV</span>
                </button>
                <button
                  onClick={handleResequenceIds}
                  disabled={loading}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 disabled:opacity-50"
                  title="Rapikan & Urutkan ulang semua ID kosakata tanpa ada celah terlewat"
                >
                  <RefreshCw className={`h-4 w-4 text-emerald-500 ${loading ? 'animate-spin' : ''}`} />
                  <span>Rapikan ID</span>
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
                  <option value="ternate">Ternate</option>
                  <option value="tidore">Tidore</option>
                  <option value="sula">Sula</option>
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
                  <option value="kata_asc">Kata (A - Z)</option>
                  <option value="kata_desc">Kata (Z - A)</option>
                  <option value="arti_asc">Arti (A - Z)</option>
                  <option value="arti_desc">Arti (Z - A)</option>
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
                  Atur Ulang Filter
                </button>
              )}
            </div>

            {/* Table words */}
            <div className="overflow-x-auto rounded-2xl glass-panel border border-white/5">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-white/10 text-slate-400 uppercase font-bold tracking-wider">
                    <th className="p-4 text-center w-12">
                      <input
                        type="checkbox"
                        checked={adminFilteredWords.length > 0 && selectedWordIds.length === adminFilteredWords.length}
                        onChange={() => handleSelectAllWords(adminFilteredWords)}
                        className="rounded border-white/10 bg-slate-950 text-gold-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                    </th>
                    <th className="p-4 text-center w-12">ID</th>
                    <th className="p-4">Kata</th>
                    <th className="p-4">Arti</th>
                    <th className="p-4">Kelas</th>
                    <th className="p-4">Dialek</th>
                    <th className="p-4">Bahasa</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">Memuat data...</td>
                    </tr>
                  ) : adminFilteredWords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">Data kosong atau kata tidak ditemukan.</td>
                    </tr>
                  ) : (
                    adminFilteredWords.map((word) => (
                      <tr 
                        key={word.id} 
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                          selectedWordIds.includes(word.id) ? 'bg-gold-500/5' : ''
                        }`}
                      >
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedWordIds.includes(word.id)}
                            onChange={() => handleSelectWord(word.id)}
                            className="rounded border-white/10 bg-slate-950 text-gold-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                          />
                        </td>
                        <td className="p-4 text-center font-bold text-slate-500">{word.id}</td>
                        <td className="p-4 font-bold text-white text-sm">{word.kata}</td>
                        <td className="p-4 text-slate-300 font-semibold">{word.arti}</td>
                        <td className="p-4 text-slate-400 font-semibold">{getKelasName(word.kelas_kata)}</td>
                        <td className="p-4 text-slate-400">{getDialekName(word.dialek)}</td>
                        <td className="p-4 uppercase font-semibold text-slate-300">{word.bahasa}</td>
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
        {activeTab === 'koreksi' && (() => {
          const filteredCorrections = corrections.filter(c => {
            if (!corrSearch.trim()) return true;
            const query = corrSearch.toLowerCase();
            const matchesPelapor = c.pelapor_info?.toLowerCase().includes(query);
            const matchesKataSalah = c.kata_salah?.toLowerCase().includes(query);
            const matchesUsulan = c.usulan_perbaikan?.toLowerCase().includes(query);
            const matchesAlasan = c.alasan?.toLowerCase().includes(query);
            return matchesPelapor || matchesKataSalah || matchesUsulan || matchesAlasan;
          });

          return (
            <div className="space-y-6">
              {/* Action Bar for Corrections */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-950/20 p-4 border border-white/5 rounded-xl">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-80">
                    <input
                      type="text"
                      value={corrSearch}
                      onChange={(e) => setCorrSearch(e.target.value)}
                      placeholder="Cari laporan koreksi..."
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 pr-9 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-all"
                    />
                    {corrSearch && (
                      <button
                        onClick={() => setCorrSearch('')}
                        title="Hapus pencarian"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {selectedCorrectionIds.length > 0 && (
                    <button
                      onClick={handleBulkDeleteCorrections}
                      className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 shadow-lg shadow-rose-950/20 animate-fade-in"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Hapus Terpilih ({selectedCorrectionIds.length})</span>
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  Menampilkan <strong className="text-white">{filteredCorrections.length}</strong> dari <strong className="text-white">{corrections.length}</strong> laporan.
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl glass-panel border border-white/5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-white/10 text-slate-400 uppercase font-bold tracking-wider">
                      <th className="p-4 text-center w-12">
                        <input
                          type="checkbox"
                          checked={filteredCorrections.length > 0 && selectedCorrectionIds.length === filteredCorrections.length}
                          onChange={() => handleSelectAllCorrections(filteredCorrections)}
                          className="rounded border-white/10 bg-slate-950 text-gold-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                      </th>
                      <th className="p-4">Kata Asli</th>
                      <th className="p-4">Pelapor</th>
                      <th className="p-4">Sebelum Perbaikan</th>
                      <th className="p-4">Usulan Baru</th>
                      <th className="p-4">Alasan</th>
                      <th className="p-4">Referensi</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">Memuat data...</td>
                      </tr>
                    ) : filteredCorrections.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">Antrean koreksi kosong atau kata tidak ditemukan.</td>
                      </tr>
                    ) : (
                      filteredCorrections.map((corr) => {
                        const parsed = parseCorrectionJSON(corr.usulan_perbaikan);
                        const isJson = parsed !== null;
                        
                        return (
                          <tr 
                            key={corr.id} 
                            className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                              selectedCorrectionIds.includes(corr.id) ? 'bg-gold-500/5' : ''
                            }`}
                          >
                            <td className="p-4 text-center">
                              <input
                                type="checkbox"
                                checked={selectedCorrectionIds.includes(corr.id)}
                                onChange={() => handleSelectCorrection(corr.id)}
                                className="rounded border-white/10 bg-slate-950 text-gold-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                              />
                            </td>
                            <td className="p-4 font-bold text-white">
                              {corr.kata ? corr.kata.kata : `ID: ${corr.kata_id}`}
                            </td>
                            <td className="p-4 font-semibold text-slate-300">{corr.pelapor_info}</td>
                            
                            {/* Before correction column */}
                            <td className="p-4 text-rose-400 font-medium">
                              {isJson ? (
                                <div className="space-y-1.5">
                                  <div className="line-through font-bold">Kata: {corr.kata_salah}</div>
                                  {corr.kata && (
                                    <>
                                      <div className="line-through">Arti: {corr.kata.arti}</div>
                                      {corr.kata.contoh && (
                                        <div className="text-[10px] text-slate-500 leading-normal italic line-through">
                                          Contoh: {corr.kata.contoh}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              ) : (
                                <span className="line-through font-bold">{corr.kata_salah}</span>
                              )}
                            </td>

                            {/* Proposed correction column */}
                            <td className="p-4 text-emerald-400 font-medium">
                              {isJson ? (
                                <div className="space-y-1.5">
                                  <div className="font-bold">Kata: {parsed.kata}</div>
                                  <div>Arti: {parsed.arti}</div>
                                  {parsed.contoh && (
                                    <div className="text-[10px] text-slate-300 leading-normal italic">
                                      Contoh: {parsed.contoh}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="font-bold">{corr.usulan_perbaikan}</span>
                              )}
                            </td>

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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
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
                      onChange={(e) => handleWordFormChange('kata', e.target.value)}
                      placeholder="Masukkan kata"
                      className={`w-full bg-slate-950/60 border rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                        duplicateWarning ? 'border-amber-500/60 focus:border-amber-500' : 'border-white/10 focus:border-gold-500'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Arti (Bahasa Indonesia):</label>
                    <input
                      type="text"
                      required
                      value={wordForm.arti}
                      onChange={(e) => handleWordFormChange('arti', e.target.value)}
                      placeholder="Terjemahan bahasa"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                {/* Duplicate Warning Banner */}
                {duplicateWarning && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-amber-400 block">⚠️ Peringatan Data Ganda Terdeteksi!</span>
                      <span className="text-amber-300/80 block mt-0.5">{duplicateWarning.message}</span>
                      <span className="text-slate-400 block mt-1">Anda tetap bisa menambahkan, tapi pastikan ini bukan data duplikat.</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Bahasa:</label>
                    <select
                      value={wordForm.bahasa}
                      onChange={(e) => handleWordFormChange('bahasa', e.target.value)}
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
                      <option value="ternate">Ternate</option>
                      <option value="tidore">Tidore</option>
                      <option value="sula">Sula</option>
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
                  <div className="text-[10px] text-slate-500 font-medium leading-relaxed px-1 mt-0.5">
                    Format penulisan yang disarankan: <span className="text-gold-400/90 font-mono">Kalimat Daerah. (Terjemahan Indonesia.)</span>
                    <br />
                    Contoh: <span className="text-slate-400 italic">Ri tagi fola se sigi. (Saya pergi ke rumah dan mesjid.)</span>
                  </div>
                </div>

                {formMsg.text && (
                  <div className={`p-3 rounded-lg flex items-center text-xs font-bold ${
                    formMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                      : formMsg.type === 'info'
                      ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
                    }`}>
                    {formMsg.type === 'info' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mr-2" />
                    )}
                    <span>{formMsg.text}</span>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-slate-900 border border-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Data'}
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
                    fola, ternate, ternate, rumah, kata_benda, fola ena (rumah itu)<br />
                    pia, sula, sula, baik, kata_sifat, hia pia (dia baik)
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
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-gold-400 space-y-2">
                    <div className="flex items-center">
                      <Info className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{importStatus}</span>
                    </div>

                    {/* Detailed skip report */}
                    {importReport && importReport.skipped > 0 && (
                      <div className="mt-2 p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-lg space-y-1.5">
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Data yang Dilewati (Sudah Ada):</span>
                        <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                          {importReport.skippedWords.map((sw, i) => (
                            <div key={i} className="text-[10px] text-slate-400 flex items-center space-x-1">
                              <XCircle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                              <span>
                                <strong className="text-slate-300">"{sw.kata}"</strong> ({sw.bahasa}) — sudah ada di ID #{sw.existingId} dengan arti "{sw.existingArti}"
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
              placeholder="Masukkan kata sandi administrator"
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
