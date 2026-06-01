"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Award, Timer, ArrowRight, RefreshCw, CheckCircle, XCircle, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { db } from '@/lib/supabase';

export default function Kuis() {
  // Game states: 'lobby' | 'loading' | 'playing' | 'ended'
  const [gameState, setGameState] = useState('lobby');
  const [quizLanguage, setQuizLanguage] = useState('campuran');
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState(null); // index of selected answer (0-3)
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizHistory, setQuizHistory] = useState([]); // tracks { question, selected, correct, isCorrect }
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef(null);

  // Word pool from database
  const [wordPool, setWordPool] = useState([]);
  const [loadError, setLoadError] = useState('');

  // Initialize and clean timer
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // Timer Tick Logic
  useEffect(() => {
    if (gameState !== 'playing') return;

    if (timeLeft === 0) {
      handleTimeOut();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, gameState]);

  // Generate 10 random questions dynamically from LIVE DATABASE
  const startQuiz = async () => {
    setLoadError('');
    setGameState('loading');

    try {
      // Fetch the latest vocabulary from Supabase database
      const res = await db.getWords();
      let allWords = res.data || [];

      if (allWords.length < 4) {
        setLoadError('Data kosakata di database tidak cukup untuk memulai kuis (minimal 4 kata).');
        setGameState('lobby');
        return;
      }

      // Filter words by language selection
      let pool = allWords;
      if (quizLanguage !== 'campuran') {
        pool = allWords.filter(w => w.bahasa.toLowerCase() === quizLanguage);
      }

      if (pool.length < 4) {
        setLoadError(`Kosakata bahasa ${quizLanguage} tidak cukup untuk membuat kuis (ditemukan ${pool.length}, minimal 4).`);
        setGameState('lobby');
        return;
      }

      setWordPool(pool);

      // Shuffle pool
      const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
      
      // Select up to 10 words (or fewer if pool is small)
      const questionCount = Math.min(10, shuffledPool.length);
      const selectedWords = shuffledPool.slice(0, questionCount);

      // Build question objects
      const newQuestions = selectedWords.map((word) => {
        // 1. Question phrasing
        const isReverse = Math.random() > 0.5; // Translate local to Indo or Indo to local
        
        let questionText = "";
        let correctAnswer = "";

        if (isReverse) {
          questionText = `Apakah padanan kata dari bahasa Indonesia "${word.arti}" dalam bahasa ${word.bahasa === 'ternate' ? 'Ternate' : 'Sula'}?`;
          correctAnswer = word.kata;
        } else {
          questionText = `Apa arti kata "${word.kata}" dalam bahasa ${word.bahasa === 'ternate' ? 'Ternate' : 'Sula'}?`;
          correctAnswer = word.arti;
        }

        // 2. Generate 3 distractor answers from pool
        const distractors = [];
        const distractorPool = pool.filter(w => w.id !== word.id);
        
        const shuffledDistractors = distractorPool
          .map(w => isReverse ? w.kata : w.arti)
          .filter((val, idx, self) => self.indexOf(val) === idx) // unique options only
          .sort(() => 0.5 - Math.random());

        // Take first 3
        distractors.push(...shuffledDistractors.slice(0, 3));

        // 3. Assemble and shuffle 4 options
        const options = [correctAnswer, ...distractors].sort(() => 0.5 - Math.random());

        return {
          id: word.id,
          word: word,
          questionText,
          correctAnswer,
          options,
          isReverse
        };
      });

      setQuestions(newQuestions);
      setCurrentIdx(0);
      setScore(0);
      setCorrectCount(0);
      setSelectedAns(null);
      setHasAnswered(false);
      setQuizHistory([]);
      setTimeLeft(15);
      setGameState('playing');
    } catch (err) {
      console.error('Gagal memuat data kuis:', err);
      setLoadError('Terjadi kesalahan saat memuat data kosakata. Periksa koneksi internet Anda.');
      setGameState('lobby');
    }
  };

  const handleTimeOut = () => {
    // Time limit hit
    handleAnswerSelect(-1); // -1 signifies no answer
  };

  const handleAnswerSelect = (optIdx) => {
    if (hasAnswered) return;
    clearInterval(timerRef.current);

    setHasAnswered(true);
    setSelectedAns(optIdx);

    const currentQ = questions[currentIdx];
    const selectedText = optIdx === -1 ? 'Waktu Habis' : currentQ.options[optIdx];
    const isCorrect = selectedText === currentQ.correctAnswer;

    let points = 0;
    if (isCorrect) {
      points = 10;
      setCorrectCount(prev => prev + 1);
      setScore(prev => prev + 10);
    }

    setQuizHistory(prev => [
      ...prev,
      {
        question: currentQ.questionText,
        selected: selectedText,
        correct: currentQ.correctAnswer,
        isCorrect: isCorrect
      }
    ]);
  };

  const nextQuestion = () => {
    const totalQuestions = questions.length;
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedAns(null);
      setHasAnswered(false);
      setTimeLeft(15);
    } else {
      endQuiz();
    }
  };

  const endQuiz = async () => {
    setGameState('ended');
    
    // Save quiz score
    try {
      const payload = {
        bahasa_kuis: quizLanguage,
        skor: score,
        total_soal: questions.length
      };
      await db.insertQuizScore(payload);
    } catch (err) {
      console.error("Gagal menyimpan skor kuis:", err);
    }
  };

  const totalQuestions = questions.length;
  const maxScore = totalQuestions * 10;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      
      {/* ================= LOBBY SCREEN ================= */}
      {gameState === 'lobby' && (
        <div className="p-8 sm:p-12 rounded-3xl glass-panel border border-white/10 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/10 rounded-full blur-2xl" />
          
          <div className="space-y-4">
            <div className="mx-auto p-4 bg-gradient-to-br from-gold-500 to-gold-600 w-fit rounded-2xl shadow-lg border border-gold-300/20">
              <Award className="h-10 w-10 text-slate-950 animate-bounce" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
              Kuis Evaluasi <span className="text-gradient-gold">Bahasa Daerah</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Uji kemampuan bahasa Ternate dan Sula Anda secara seru! Jawab 10 soal kosakata pilihan ganda dalam batas waktu 15 detik per soal. Soal diambil langsung dari kosakata terbaru di database.
            </p>
          </div>

          {/* Kategori Selector */}
          <div className="space-y-3 max-w-sm mx-auto">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Pilih Kategori Kuis:</span>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                { slug: 'campuran', name: 'Bahasa Campuran', desc: 'Kosakata Ternate & Sula acak' },
                { slug: 'ternate', name: 'Bahasa Ternate', desc: 'Dialek Melayu Ternate & Tidore' },
                { slug: 'sula', name: 'Bahasa Sula', desc: 'Bahasa daerah Sula standar' }
              ].map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setQuizLanguage(cat.slug)}
                  className={`p-4 rounded-xl text-left border transition-all duration-300 flex justify-between items-center ${
                    quizLanguage === cat.slug
                      ? 'bg-gradient-to-r from-ocean-950 to-ocean-900 border-gold-500/80 shadow-md shadow-gold-500/5'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <span className={`text-sm font-bold block ${quizLanguage === cat.slug ? 'text-gold-400' : 'text-white'}`}>
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{cat.desc}</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    quizLanguage === cat.slug ? 'border-gold-500 bg-gold-500/10' : 'border-slate-600'
                  }`}>
                    {quizLanguage === cat.slug && <div className="w-1.5 h-1.5 rounded-full bg-gold-500" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {loadError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs font-bold text-center max-w-sm mx-auto">
              {loadError}
            </div>
          )}

          <button
            onClick={startQuiz}
            className="w-full max-w-sm py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-black rounded-2xl transition-all duration-300 text-sm uppercase tracking-wider shadow-lg hover:scale-105 border border-gold-300/30"
          >
            Mulai Kuis Sekarang
          </button>
        </div>
      )}

      {/* ================= LOADING SCREEN ================= */}
      {gameState === 'loading' && (
        <div className="p-12 rounded-3xl glass-panel border border-white/10 text-center space-y-4">
          <Loader2 className="h-10 w-10 text-gold-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-bold">Memuat soal kuis dari database terbaru...</p>
        </div>
      )}

      {/* ================= PLAYING SCREEN ================= */}
      {gameState === 'playing' && questions.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6 relative">
          
          {/* Header Stats */}
          <div className="flex justify-between items-center pb-4 border-b border-white/5">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Kuis Bahasa {quizLanguage}</span>
              <span className="text-lg font-bold text-white">Soal {currentIdx + 1} <span className="text-xs text-slate-500">dari {totalQuestions}</span></span>
            </div>

            {/* Timer visual circle */}
            <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-white/5 shadow-inner">
              <Timer className={`h-5 w-5 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gold-500'}`} />
              <span className={`text-sm font-extrabold ${timeLeft <= 5 ? 'text-red-500' : 'text-white'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Time Progress Bar */}
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full transition-all duration-1000 ${
                timeLeft <= 5 ? 'bg-red-500' : 'bg-gradient-to-r from-ocean-500 to-gold-500'
              }`}
              style={{ width: `${(timeLeft / 15) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="py-6 text-center space-y-3">
            <div className="inline-flex p-2 bg-white/5 border border-white/5 rounded-xl text-xs font-semibold text-slate-400">
              <Zap className="h-4 w-4 text-gold-500 mr-1.5 animate-bounce" /> Poin Soal: 10
            </div>
            <p className="text-lg sm:text-2xl font-extrabold text-white leading-relaxed px-4">
              {questions[currentIdx].questionText}
            </p>
          </div>

          {/* Answer Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions[currentIdx].options.map((option, optIdx) => {
              const currentQ = questions[currentIdx];
              const isSelected = selectedAns === optIdx;
              const isCorrectText = option === currentQ.correctAnswer;
              
              let btnClass = "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-slate-200";
              let iconElement = null;

              if (hasAnswered) {
                if (isCorrectText) {
                  btnClass = "bg-emerald-500/10 border-emerald-500/80 text-emerald-400 shadow-md shadow-emerald-500/5";
                  iconElement = <CheckCircle className="h-5 w-5 text-emerald-500" />;
                } else if (isSelected) {
                  btnClass = "bg-rose-500/10 border-rose-500/80 text-rose-400 shadow-md shadow-rose-500/5";
                  iconElement = <XCircle className="h-5 w-5 text-rose-500" />;
                } else {
                  btnClass = "bg-white/5 border-white/5 text-slate-500 opacity-60";
                }
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleAnswerSelect(optIdx)}
                  disabled={hasAnswered}
                  className={`p-4 rounded-xl text-left border font-bold text-sm tracking-wide transition-all duration-300 flex justify-between items-center ${btnClass} disabled:cursor-not-allowed`}
                >
                  <span className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 text-xs">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{option}</span>
                  </span>
                  {iconElement}
                </button>
              );
            })}
          </div>

          {/* Time Out Alert */}
          {hasAnswered && selectedAns === -1 && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center text-red-500 text-xs font-bold justify-center">
              <XCircle className="h-4 w-4 mr-2" />
              <span>Waktu habis! Anda melewatkan pertanyaan ini.</span>
            </div>
          )}

          {/* Next Button Footer */}
          {hasAnswered && (
            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                onClick={nextQuestion}
                className="px-8 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-lg hover:scale-105"
              >
                <span>{currentIdx < totalQuestions - 1 ? 'Soal Berikutnya' : 'Selesai & Lihat Skor'}</span>
                <ArrowRight className="h-4 w-4 text-slate-950" />
              </button>
            </div>
          )}

        </div>
      )}

      {/* ================= ENDED SCREEN ================= */}
      {gameState === 'ended' && (
        <div className="p-8 sm:p-12 rounded-3xl glass-panel border border-white/10 space-y-8">
          
          {/* Main Score Showcase */}
          <div className="text-center space-y-4">
            <div className="mx-auto p-4 bg-gradient-to-br from-gold-500 to-gold-600 w-fit rounded-full shadow-lg border border-gold-300/20">
              <Award className="h-12 w-12 text-slate-950 animate-pulse" />
            </div>
            
            <h1 className="text-3xl font-extrabold text-white">Sesi Kuis Selesai!</h1>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              {score >= maxScore * 0.8
                ? 'Luar biasa! Pemahaman bahasa daerah Anda sangat matang dan mengesankan. Anda layak menjadi pelestari bahasa daerah!' 
                : score >= maxScore * 0.5
                  ? 'Bagus sekali! Kemampuan Anda sudah lumayan baik. Mari terus asah lagi.'
                  : 'Jangan menyerah! Belajar terus dan coba kuis lagi untuk menguasai kosakata.'
              }
            </p>

            {/* Score Big Display */}
            <div className="py-6 inline-flex flex-col items-center justify-center p-8 bg-slate-950/80 border border-white/10 rounded-2xl shadow-inner min-w-[200px]">
              <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Skor Akhir</span>
              <span className="text-5xl font-black text-gold-500 mt-2">{score} <span className="text-xl text-slate-500 font-medium">/ {maxScore}</span></span>
              <span className="text-xs font-semibold text-emerald-500 mt-2 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" /> {correctCount} dari {totalQuestions} Soal Benar
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => setGameState('lobby')}
              className="py-3 px-8 bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Kembali ke Menu Utama</span>
            </button>
            <button
              onClick={startQuiz}
              className="py-3 px-8 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 shadow-lg border border-gold-300/30"
            >
              <span>Main Lagi</span>
            </button>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-4 pt-6 border-t border-white/5">
            <h3 className="text-lg font-bold text-white">Tinjauan Hasil Kuis</h3>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {quizHistory.map((hist, i) => (
                <div 
                  key={i} 
                  className={`p-4 rounded-xl border flex items-start space-x-3 transition-colors ${
                    hist.isCorrect 
                      ? 'bg-emerald-500/5 border-emerald-500/20' 
                      : 'bg-rose-500/5 border-rose-500/20'
                  }`}
                >
                  <div className="pt-0.5">
                    {hist.isCorrect 
                      ? <CheckCircle className="h-5 w-5 text-emerald-500" />
                      : <XCircle className="h-5 w-5 text-rose-500" />
                    }
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <p className="text-xs font-bold text-white">{i + 1}. {hist.question}</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Jawaban Anda:</span>
                        <span className={`font-semibold ${hist.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>{hist.selected}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Jawaban Benar:</span>
                        <span className="font-semibold text-emerald-400">{hist.correct}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
