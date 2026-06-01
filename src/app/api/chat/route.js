import { GoogleGenerativeAI } from '@google/generative-ai';
import { seedWords } from '@/lib/seedData';
import { db } from '@/lib/supabase';

// Read GEMINI_API_KEY from environment variable (set in Vercel dashboard)
const apiKey = process.env.GEMINI_API_KEY || '';

// ==================== SMART OFFLINE FALLBACK ====================
// This function searches the local dictionary database when the AI API is unavailable.
function generateOfflineResponse(userMessage, selectedLanguage, allWords = []) {
  const query = userMessage.toLowerCase().trim();
  const lang = (selectedLanguage || 'ternate').toLowerCase();

  // Search across ALL vocabulary words to pro-actively detect the correct regional language
  const matches = allWords.filter(w =>
    query.includes(w.kata.toLowerCase()) ||
    query.includes(w.arti.toLowerCase())
  );

  // If we found matches, return formatted dictionary results with clear language classification
  if (matches.length > 0) {
    const responseList = matches.map(w => {
      const bahasaText = w.bahasa.toLowerCase() === 'sula' ? 'SULA' : 'TERNATE';
      const kelasText = w.kelas_kata ? w.kelas_kata.replace('kata_', '') : 'umum';
      const dialekText = w.dialek ? w.dialek.replace(/_/g, ' ') : '';
      return `📖 **${w.kata}** (${kelasText}) = **${w.arti}**\nBahasa Daerah: **Bahasa ${bahasaText}** (Dialek: ${dialekText})\nContoh: ${w.contoh}`;
    }).join('\n\n');

    return `📡 Mode Kamus Lokal Aktif\n\nSaat ini layanan AI utama sedang tidak tersedia, namun saya berhasil menemukan kata yang Anda cari dari database kamus kami:\n\n${responseList}\n\n💡 Ingin mencari kata lain? Ketik saja di sini, atau buka menu **Kamus** untuk menjelajahi seluruh kosakata.`;
  }

  // Filter words by selected language for generic responses
  const langWords = allWords.filter(w => w.bahasa.toLowerCase() === lang);
  const activeWords = langWords.length > 0 ? langWords : allWords;

  // Greeting detection
  if (query.match(/^(halo|hai|hi|hello|hey|salam|selamat)/)) {
    const sampleWords = activeWords.slice(0, 5).map(w => `**${w.kata}** = ${w.arti}`).join(', ');
    return `👋 Halo! Saya Salama AI\n\nSaat ini layanan AI utama sedang tidak tersedia, namun saya tetap bisa membantu Anda mencari arti kata dari database kamus lokal kami!\n\nCoba tanyakan arti kata-kata ini:\n${sampleWords}\n\nKetik kata dalam bahasa ${selectedLanguage || 'Ternate'} atau bahasa Indonesia, dan saya akan mencarikannya untuk Anda! 😊`;
  }

  // No matches found — suggest popular words
  const suggestions = activeWords.slice(0, 6).map(w => `**${w.kata}** (${w.arti})`).join(', ');
  return `📡 Mode Kamus Lokal Aktif\n\nMaaf, saya tidak menemukan kata yang cocok dengan pertanyaan Anda di database kamus lokal.\n\nCoba tanyakan salah satu kata berikut:\n${suggestions}\n\nAtau buka menu **Kamus** untuk menjelajahi seluruh ${activeWords.length} kosakata bahasa ${selectedLanguage || 'Ternate'} yang tersedia. 📚`;
}

// ==================== MAIN API ROUTE ====================
export async function POST(req) {
  // Parse request body ONCE at the top level so both try and catch can access it
  let messages, selectedLanguage, latestMessage;
  let allWords = [];

  try {
    const body = await req.json();
    messages = body.messages;
    selectedLanguage = body.selectedLanguage;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    latestMessage = messages[messages.length - 1].content;

    // Fetch live words from database/Supabase
    try {
      const dbRes = await db.getWords();
      if (dbRes && dbRes.data && dbRes.data.length > 0) {
        allWords = dbRes.data;
      } else {
        allWords = seedWords;
      }
    } catch (e) {
      console.warn('[Salama AI Chat API] Failed to fetch live words, falling back to seed words:', e);
      allWords = seedWords;
    }

    // If API key is not configured or invalid format, go directly to offline fallback
    if (!apiKey || (!apiKey.startsWith('AIza') && !apiKey.startsWith('AQ'))) {
      console.warn('[Salama AI] No valid GEMINI_API_KEY found. Using offline fallback.');
      const fallbackText = generateOfflineResponse(latestMessage, selectedLanguage, allWords);
      return new Response(JSON.stringify({ text: fallbackText }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ---- AI Path: Use Gemini API ----

    // Get vocabulary context for injection (both Sula and Ternate for cross-language search support)
    const contextText = allWords
      .map(w =>
        `- Kata: "${w.kata}", Bahasa: "${w.bahasa}", Arti: "${w.arti}", Kelas Kata: "${w.kelas_kata}", Dialek: "${w.dialek}", Contoh: "${w.contoh}"`
      )
      .join('\n');

    // System prompt for Gemini
    const systemInstruction = `
Anda adalah Salama AI, asisten virtual cerdas yang dikembangkan oleh Muhamad Ikbal Wambes dari Universitas Khairun Ternate sebagai bagian dari program kerja Duta Bahasa Maluku Utara 2026.
Tugas utama Anda adalah menjadi ahli bahasa dan budaya daerah Ternate dan Sula untuk membantu pengguna belajar, menerjemahkan, dan memahami percakapan serta konteks bahasa daerah tersebut.

Berikut adalah database kata resmi bahasa Ternate & Sula yang kami miliki saat ini:
${contextText}

ATURAN PENTING:
1. Jika pengguna bertanya tentang kata yang ada dalam database di atas, berikan arti, kelas kata, dialek, dan contoh kalimat PERSIS seperti data di atas. Selalu sebutkan secara JELAS apakah kata tersebut termasuk dalam Bahasa Ternate atau Bahasa Sula.
2. Jika pengguna menanyakan kata yang TIDAK ADA dalam database, gunakan pengetahuan luas Anda sebagai pakar linguistik Ternate/Sula. Nyatakan dengan sopan bahwa kata tersebut tidak ada dalam database utama kamus kami, namun berikan penjelasan seakurat mungkin, termasuk secara proaktif mengklasifikasikan kata tersebut termasuk bahasa daerah mana (Ternate atau Sula).
3. Klasifikasikan bahasa daerah secara proaktif. Jika pengguna mencari kata (seperti 'alo'), beri tahu pengguna secara ramah dan tegas bahasa daerah apa itu (Ternate atau Sula) karena pengguna mungkin tidak mengetahuinya.
4. Bantu pengguna menerjemahkan kalimat, berikan contoh percakapan sehari-hari, jelaskan asal-usul dialek, serta berikan konteks budaya yang relevan.
5. Gunakan bahasa Indonesia yang interaktif, penuh rasa hormat, dan motivasi tinggi untuk melestarikan bahasa daerah Maluku Utara. Akhiri jawaban dengan sentuhan lokal bila relevan (seperti "Suba" atau salam khas lainnya).
6. JANGAN menggunakan format heading markdown (###). Gunakan teks biasa saja. Gunakan **bold** untuk penekanan kata penting.
`;

    // Initialize Gemini Client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemInstruction,
    });

    // Format chat history for Gemini API
    const contents = [];
    const history = messages.slice(0, -1);

    // Filter history to ensure it starts with a 'user' message
    const cleanHistory = [];
    let foundFirstUser = false;
    for (const msg of history) {
      if (msg.role === 'user') foundFirstUser = true;
      if (foundFirstUser) cleanHistory.push(msg);
    }

    for (const msg of cleanHistory) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: latestMessage }]
    });

    // Generate content from Gemini
    const result = await model.generateContent({
      contents: contents,
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7,
      }
    });

    // Clean up any markdown headings and hashtags from the AI response
    let responseText = result.response.text();
    responseText = responseText.replace(/^#{1,6}\s+/gm, '');
    responseText = responseText.replace(/#/g, '');

    return new Response(JSON.stringify({ text: responseText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Salama AI] Gemini API Error:', error.message);

    // Use the offline fallback with the already-parsed message
    const fallbackText = latestMessage
      ? generateOfflineResponse(latestMessage, selectedLanguage, allWords)
      : 'Maaf, terjadi kesalahan pada sistem. Silakan coba lagi atau gunakan menu **Kamus** untuk mencari kata secara langsung.';

    return new Response(
      JSON.stringify({ text: fallbackText }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
