"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Trash2, Sparkles, HelpCircle, Bot, User, RefreshCw } from 'lucide-react';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Halo! Saya **Salama AI**, asisten cerdas yang dikembangkan oleh Muhamad Ikbal Wambes dari Universitas Khairun Ternate untuk Duta Bahasa Maluku Utara 2026. Ada yang bisa saya bantu tentang bahasa atau budaya daerah **Ternate** dan **Sula** hari ini? 😊'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('ternate');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Save/load session history
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('salama_chat_history');
      if (stored) {
        try {
          setMessages(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const saveHistory = (history) => {
    setMessages(history);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('salama_chat_history', JSON.stringify(history));
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text
    };

    const newMessages = [...messages, userMessage];
    saveHistory(newMessages);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          selectedLanguage: selectedLanguage
        })
      });

      const data = await response.json();

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.text || 'Maaf, terjadi kendala saat memproses jawaban Anda.'
      };

      saveHistory([...newMessages, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Terjadi kegagalan koneksi. Pastikan API Key di `.env.local` telah dimasukkan dengan benar.'
      };
      saveHistory([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const initial = [
      {
        id: Date.now(),
        role: 'assistant',
        content: `Halo! Saya **Salama AI**, asisten cerdas yang dikembangkan oleh Muhamad Ikbal Wambes dari Universitas Khairun Ternate untuk Duta Bahasa Maluku Utara 2026. Ada yang bisa saya bantu tentang bahasa atau budaya daerah **${selectedLanguage === 'ternate' ? 'Ternate' : 'Sula'}** hari ini? 😊`
      }
    ];
    saveHistory(initial);
  };

  const quickPrompts = selectedLanguage === 'ternate' ? [
    'Apa arti kata fola dalam bahasa Ternate?',
    'Bagaimana menyebut gunung Gamalama dalam kalimat?',
    'Berikan percakapan sapaan bahasa Ternate sehari-hari.',
    'Apa perbedaan dialek Melayu Ternate dan Tidore?'
  ] : [
    'Apa arti kata pia dalam bahasa Sula?',
    'Bagaimana menerjemahkan "kita makan padi bersama" ke bahasa Sula?',
    'Sebutkan 1 sampai 5 dalam bahasa Sula.',
    'Berikan contoh kalimat menggunakan kata kahi.'
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in-up">
      
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-950/40 p-4 border border-white/5 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl">
            <Bot className="h-5 w-5 text-slate-950 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center">
              Asisten Virtual Salama<span className="text-gradient-gold font-black ml-1.5">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              Ditenagai oleh Google Gemini 2.0 Flash
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          {/* Bahasa Context Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setSelectedLanguage('ternate')}
              className={`px-4 py-1.5 rounded-lg font-bold transition-all duration-300 ${
                selectedLanguage === 'ternate'
                  ? 'bg-ocean-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Konteks Ternate
            </button>
            <button
              onClick={() => setSelectedLanguage('sula')}
              className={`px-4 py-1.5 rounded-lg font-bold transition-all duration-300 ${
                selectedLanguage === 'sula'
                  ? 'bg-gold-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Konteks Sula
            </button>
          </div>

          <button
            onClick={handleReset}
            title="Reset Percakapan"
            className="p-2.5 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 text-slate-400 hover:text-rose-500 rounded-xl transition-all duration-200"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left column: Quick prompts */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-5 rounded-2xl glass-panel border border-white/5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 flex items-center">
              <HelpCircle className="h-4 w-4 mr-1.5 text-gold-500" />
              Ide Pertanyaan:
            </h3>
            <div className="flex flex-col space-y-2">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={loading}
                  className="text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-gold-500/30 text-[11px] font-medium leading-relaxed text-slate-300 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Main Chat Box */}
        <div className="lg:col-span-3 flex flex-col h-[520px] rounded-3xl glass-panel border border-white/10 overflow-hidden shadow-2xl">
          
          {/* Chat message list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => {
              const isAi = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isAi ? 'justify-start' : 'justify-end'} animate-fade-in-up`}
                >
                  <div className={`flex items-start max-w-[85%] space-x-2.5 ${isAi ? '' : 'flex-row-reverse space-x-reverse'}`}>
                    
                    {/* Avatar */}
                    <div className={`p-2 rounded-xl flex-shrink-0 border ${
                      isAi 
                        ? 'bg-gradient-to-br from-gold-500 to-gold-600 border-gold-400/20 text-slate-950' 
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}>
                      {isAi ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>

                    {/* Bubble Content */}
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${
                      isAi
                        ? 'bg-gradient-to-br from-ocean-950/90 to-ocean-900/60 border-ocean-500/10 text-slate-100 shadow'
                        : 'bg-white/5 border-white/5 text-slate-200'
                    }`}>
                      {/* Simplistic Markdown support for bold text & line breaks */}
                      <p className="whitespace-pre-wrap">
                        {msg.content.split('\n').map((line, lIdx) => (
                          <span key={lIdx} className="block">
                            {line.split('**').map((part, pIdx) => 
                              pIdx % 2 === 1 ? <strong key={pIdx} className="text-gold-400 font-extrabold">{part}</strong> : part
                            )}
                          </span>
                        ))}
                      </p>
                    </div>

                  </div>
                </div>
              );
            })}

            {/* AI Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start max-w-[80%] space-x-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 border border-gold-400/20 text-slate-950 flex-shrink-0 animate-spin">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-ocean-950/80 border border-ocean-500/10 text-slate-400 text-xs font-semibold flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>Salama AI sedang merangkum jawaban...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat input box */}
          <div className="p-4 border-t border-white/5 bg-slate-950/60 flex items-center space-x-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Tanyakan tentang bahasa ${selectedLanguage === 'ternate' ? 'Ternate' : 'Sula'}...`}
              disabled={loading}
              className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all duration-300 disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || loading}
              className="p-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow shadow-gold-500/10 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
