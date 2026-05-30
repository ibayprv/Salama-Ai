import { createClient } from '@supabase/supabase-js';
import { seedWords, seedStats } from './seedData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let isSupabaseConfigured = false;
let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    isSupabaseConfigured = true;
  } catch (error) {
    console.warn("Gagal menginisialisasi Supabase client:", error);
  }
}

// ==================== MOCK LOCAL STORAGE DATABASE ====================
// Berfungsi sebagai database lokal penuh jika Supabase belum terhubung

// CACHE BUSTER: Hapus data lama (versi sebelumnya dengan 300 kata bernomor)
// Setiap kali versi seed berubah, naikkan angka ini agar data lama di-reset
const SEED_DATA_VERSION = 'v3';

const initCacheBuster = () => {
  if (typeof window === 'undefined') return;
  const currentVersion = localStorage.getItem('salama_data_version');
  if (currentVersion !== SEED_DATA_VERSION) {
    // Hapus semua data lama yang usang
    localStorage.removeItem('salama_kata');
    localStorage.removeItem('salama_pengunjung');
    localStorage.removeItem('salama_skor_kuis');
    localStorage.removeItem('salama_rating');
    localStorage.removeItem('salama_laporan_koreksi');
    localStorage.removeItem('salama_komentar_kata');
    localStorage.removeItem('salama_visit_registered');
    localStorage.removeItem('salama_liked_words');
    // Tandai versi baru
    localStorage.setItem('salama_data_version', SEED_DATA_VERSION);
    console.log('[Salama AI] Data lama di-reset. Memuat dataset kosakata terbaru.');
  }
};

// Jalankan cache buster saat modul dimuat
initCacheBuster();

const getLocalData = (key, defaultVal) => {
  if (typeof window === 'undefined') return defaultVal;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return defaultVal;
  }
};

const setLocalData = (key, data) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

// Fallback logic for words, corrections, ratings, stats, quiz scores, likes, comments
export const getLocalDb = () => {
  return {
    kata: getLocalData('salama_kata', seedWords),
    laporan_koreksi: getLocalData('salama_laporan_koreksi', []),
    rating: getLocalData('salama_rating', []),
    skor_kuis: getLocalData('salama_skor_kuis', []),
    pengunjung: getLocalData('salama_pengunjung', []),
    komentar_kata: getLocalData('salama_komentar_kata', [])
  };
};

export const localDb = {
  // Kata
  async getWords() {
    const db = getLocalDb();
    return { data: db.kata.filter(k => k.status === 'aktif' || k.status === 'dalam_review'), error: null };
  },
  async getAllWordsAdmin() {
    const db = getLocalDb();
    return { data: db.kata, error: null };
  },
  async insertWord(word) {
    const db = getLocalDb();
    const newWord = {
      ...word,
      id: db.kata.length ? Math.max(...db.kata.map(w => w.id)) + 1 : 1,
      likes: 0,
      status: word.status || 'aktif',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.kata.push(newWord);
    setLocalData('salama_kata', db.kata);
    return { data: [newWord], error: null };
  },
  async updateWord(id, updates) {
    const db = getLocalDb();
    const idx = db.kata.findIndex(w => w.id === Number(id));
    if (idx === -1) return { data: null, error: 'Word not found' };
    db.kata[idx] = { ...db.kata[idx], ...updates, updated_at: new Date().toISOString() };
    setLocalData('salama_kata', db.kata);
    return { data: [db.kata[idx]], error: null };
  },
  async deleteWord(id) {
    const db = getLocalDb();
    const filtered = db.kata.filter(w => w.id !== Number(id));
    setLocalData('salama_kata', filtered);
    return { error: null };
  },
  async likeWord(id) {
    const db = getLocalDb();
    const idx = db.kata.findIndex(w => w.id === Number(id));
    if (idx === -1) return { data: null, error: 'Word not found' };
    const likes = Number(db.kata[idx].likes || 0) + 1;
    db.kata[idx] = { ...db.kata[idx], likes };
    setLocalData('salama_kata', db.kata);
    return { data: db.kata[idx], error: null };
  },

  // Komentar Kata
  async getWordComments(kataId) {
    const db = getLocalDb();
    const filtered = db.komentar_kata.filter(c => c.kata_id === Number(kataId));
    return { data: filtered, error: null };
  },
  async getAllWordComments() {
    const db = getLocalDb();
    return { data: db.komentar_kata, error: null };
  },
  async insertWordComment(comment) {
    const db = getLocalDb();
    const newComment = {
      ...comment,
      id: db.komentar_kata.length ? Math.max(...db.komentar_kata.map(c => c.id)) + 1 : 1,
      created_at: new Date().toISOString()
    };
    db.komentar_kata.push(newComment);
    setLocalData('salama_komentar_kata', db.komentar_kata);
    return { data: [newComment], error: null };
  },

  // Laporan Koreksi (Koreksi Komunitas)
  async getCorrections() {
    const db = getLocalDb();
    return { data: db.laporan_koreksi, error: null };
  },
  async insertCorrection(correction) {
    const db = getLocalDb();
    const newCorr = {
      ...correction,
      id: db.laporan_koreksi.length ? Math.max(...db.laporan_koreksi.map(c => c.id)) + 1 : 1,
      status: 'menunggu',
      created_at: new Date().toISOString()
    };
    db.laporan_koreksi.push(newCorr);
    setLocalData('salama_laporan_koreksi', db.laporan_koreksi);
    
    if (correction.kata_id) {
      await this.updateWord(correction.kata_id, { status: 'dalam_review' });
    }

    return { data: [newCorr], error: null };
  },
  async updateCorrectionStatus(id, status) {
    const db = getLocalDb();
    const idx = db.laporan_koreksi.findIndex(c => c.id === Number(id));
    if (idx === -1) return { error: 'Correction not found' };
    
    const corr = db.laporan_koreksi[idx];
    corr.status = status;
    setLocalData('salama_laporan_koreksi', db.laporan_koreksi);

    if (status === 'disetujui' && corr.kata_id) {
      await this.updateWord(corr.kata_id, {
        kata: corr.usulan_perbaikan,
        status: 'aktif'
      });
    } else if (status === 'ditolak' && corr.kata_id) {
      await this.updateWord(corr.kata_id, { status: 'aktif' });
    }

    return { error: null };
  },

  // Rating
  async getRatings() {
    const db = getLocalDb();
    return { data: db.rating, error: null };
  },
  async insertRating(rating) {
    const db = getLocalDb();
    const newRating = {
      ...rating,
      id: db.rating.length ? Math.max(...db.rating.map(r => r.id)) + 1 : 1,
      created_at: new Date().toISOString()
    };
    db.rating.unshift(newRating);
    setLocalData('salama_rating', db.rating);
    return { data: [newRating], error: null };
  },

  // Skor Kuis
  async getQuizScores() {
    const db = getLocalDb();
    return { data: db.skor_kuis, error: null };
  },
  async insertQuizScore(score) {
    const db = getLocalDb();
    const newScore = {
      ...score,
      id: db.skor_kuis.length ? Math.max(...db.skor_kuis.map(s => s.id)) + 1 : 1,
      created_at: new Date().toISOString()
    };
    db.skor_kuis.push(newScore);
    setLocalData('salama_skor_kuis', db.skor_kuis);
    return { data: [newScore], error: null };
  },

  // Visitor Counter
  async recordVisit() {
    if (typeof window === 'undefined') return { today: 0, total: 0, history: [] };
    
    const sessionKey = 'salama_visit_registered';
    const registered = sessionStorage.getItem(sessionKey);
    
    const db = getLocalDb();
    const todayStr = new Date().toISOString().split('T')[0];
    
    let todayRecord = db.pengunjung.find(p => p.tanggal === todayStr);
    if (!todayRecord) {
      todayRecord = { id: db.pengunjung.length + 1, tanggal: todayStr, jumlah: 0 };
      db.pengunjung.push(todayRecord);
    }

    if (!registered) {
      todayRecord.jumlah += 1;
      setLocalData('salama_pengunjung', db.pengunjung);
      sessionStorage.setItem(sessionKey, 'true');
    }

    const todayCount = todayRecord.jumlah;
    const totalCount = db.pengunjung.reduce((acc, curr) => acc + curr.jumlah, 0);

    return { today: todayCount, total: totalCount, history: db.pengunjung };
  }
};

// ==================== DB LAYER SWITCHER ====================
export const db = {
  isFallback: !isSupabaseConfigured,
  
  async getWords() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('kata')
        .select('*')
        .or('status.eq.aktif,status.eq.dalam_review')
        .order('kata', { ascending: true });
      if (!error && data && data.length > 0) return { data, error };
      if (error) console.error("Supabase getWords error:", error);
    }
    return localDb.getWords();
  },

  async getAllWordsAdmin() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('kata')
        .select('*')
        .order('id', { ascending: false });
      if (!error) return { data, error };
      console.error("Supabase getAllWordsAdmin error:", error);
    }
    return localDb.getAllWordsAdmin();
  },

  async insertWord(word) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('kata')
        .insert([word])
        .select();
      if (!error) return { data, error };
      console.error("Supabase insertWord error:", error);
    }
    return localDb.insertWord(word);
  },

  async updateWord(id, updates) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('kata')
        .update(updates)
        .eq('id', id)
        .select();
      if (!error) return { data, error };
      console.error("Supabase updateWord error:", error);
    }
    return localDb.updateWord(id, updates);
  },

  async deleteWord(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('kata')
        .delete()
        .eq('id', id);
      if (!error) return { error };
      console.error("Supabase deleteWord error:", error);
    }
    return localDb.deleteWord(id);
  },

  async likeWord(id) {
    if (isSupabaseConfigured) {
      try {
        const { data: current, error: fetchErr } = await supabase
          .from('kata')
          .select('likes')
          .eq('id', id)
          .single();
        
        if (!fetchErr && current) {
          const { data, error } = await supabase
            .from('kata')
            .update({ likes: (current.likes || 0) + 1 })
            .eq('id', id)
            .select()
            .single();
          if (!error) return { data, error: null };
        }
      } catch (err) {
        console.error("Supabase likeWord error:", err);
      }
    }
    return localDb.likeWord(id);
  },

  // Komentar Kata
  async getWordComments(kataId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('komentar_kata')
        .select('*')
        .eq('kata_id', kataId)
        .order('id', { ascending: false });
      if (!error) return { data, error };
      console.error("Supabase getWordComments error:", error);
    }
    return localDb.getWordComments(kataId);
  },

  async getAllWordComments() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('komentar_kata')
        .select('*')
        .order('id', { ascending: false });
      if (!error) return { data, error };
      console.error("Supabase getAllWordComments error:", error);
    }
    return localDb.getAllWordComments();
  },

  async insertWordComment(comment) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('komentar_kata')
        .insert([comment])
        .select();
      if (!error) return { data, error };
      console.error("Supabase insertWordComment error:", error);
    }
    return localDb.insertWordComment(comment);
  },

  // Laporan Koreksi (Koreksi Komunitas)
  async getCorrections() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('laporan_koreksi')
        .select('*, kata:kata_id(*)')
        .order('id', { ascending: false });
      if (!error) return { data, error };
      console.error("Supabase getCorrections error:", error);
    }
    return localDb.getCorrections();
  },

  async insertCorrection(correction) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('laporan_koreksi')
        .insert([correction])
        .select();
      if (!error) {
        await supabase.from('kata').update({ status: 'dalam_review' }).eq('id', correction.kata_id);
        return { data, error };
      }
      console.error("Supabase insertCorrection error:", error);
    }
    return localDb.insertCorrection(correction);
  },

  async updateCorrectionStatus(id, status) {
    if (isSupabaseConfigured) {
      const { data: corrData, error: fetchErr } = await supabase
        .from('laporan_koreksi')
        .select('*')
        .eq('id', id)
        .single();
      if (!fetchErr && corrData) {
        const { error } = await supabase
          .from('laporan_koreksi')
          .update({ status })
          .eq('id', id);
        
        if (!error) {
          if (status === 'disetujui') {
            await supabase.from('kata').update({
              kata: corrData.usulan_perbaikan,
              status: 'aktif'
            }).eq('id', corrData.kata_id);
          } else if (status === 'ditolak') {
            await supabase.from('kata').update({ status: 'aktif' }).eq('id', corrData.kata_id);
          }
          return { error: null };
        }
      }
      console.error("Supabase updateCorrectionStatus error:", fetchErr);
    }
    return localDb.updateCorrectionStatus(id, status);
  },

  // Rating
  async getRatings() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('rating')
        .select('*')
        .order('id', { ascending: false });
      if (!error) return { data, error };
      console.error("Supabase getRatings error:", error);
    }
    return localDb.getRatings();
  },

  async insertRating(rating) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('rating')
        .insert([rating])
        .select();
      if (!error) return { data, error };
      console.error("Supabase insertRating error:", error);
    }
    return localDb.insertRating(rating);
  },

  // Skor Kuis
  async getQuizScores() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('skor_kuis')
        .select('*');
      if (!error) return { data, error };
      console.error("Supabase getQuizScores error:", error);
    }
    return localDb.getQuizScores();
  },

  async insertQuizScore(score) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('skor_kuis')
        .insert([score])
        .select();
      if (!error) return { data, error };
      console.error("Supabase insertQuizScore error:", error);
    }
    return localDb.insertQuizScore(score);
  },

  // Visitor Counter
  async recordVisit() {
    if (isSupabaseConfigured) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        
        const { data: records, error: fetchErr } = await supabase
          .from('pengunjung')
          .select('*')
          .eq('tanggal', todayStr);
          
        let todayRecord = records && records[0];
        
        if (fetchErr) throw fetchErr;

        const sessionKey = 'salama_visit_registered';
        const registered = typeof window !== 'undefined' ? sessionStorage.getItem(sessionKey) : 'true';

        if (!todayRecord) {
          const { data: newRecs, error: insErr } = await supabase
            .from('pengunjung')
            .insert([{ tanggal: todayStr, jumlah: registered ? 0 : 1 }])
            .select();
          todayRecord = newRecs && newRecs[0];
          if (insErr) throw insErr;
        } else if (!registered) {
          const { data: updRecs, error: updErr } = await supabase
            .from('pengunjung')
            .update({ jumlah: todayRecord.jumlah + 1 })
            .eq('id', todayRecord.id)
            .select();
          todayRecord = updRecs && updRecs[0];
          if (updErr) throw updErr;
        }

        if (typeof window !== 'undefined' && !registered) {
          sessionStorage.setItem(sessionKey, 'true');
        }

        const { data: allVisits, error: sumErr } = await supabase
          .from('pengunjung')
          .select('jumlah');
        if (sumErr) throw sumErr;

        const totalCount = allVisits.reduce((acc, curr) => acc + curr.jumlah, 0);
        
        const { data: fullHistory } = await supabase
          .from('pengunjung')
          .select('*')
          .order('tanggal', { ascending: true });

        return { today: todayRecord.jumlah, total: totalCount, history: fullHistory || [] };
      } catch (err) {
        console.error("Supabase recordVisit error:", err);
      }
    }
    return localDb.recordVisit();
  }
};
export default supabase;
