import { GoogleGenerativeAI } from '@google/generative-ai';
import { seedWords } from '@/lib/seedData';

// Read GEMINI_API_KEY from environment variable (set in Vercel dashboard)
const apiKey = process.env.GEMINI_API_KEY || '';

// ==================== SMART OFFLINE FALLBACK ====================
// This function searches the local dictionary database when the AI API is unavailable.
function generateOfflineResponse(userMessage, selectedLanguage) {
  const query = userMessage.toLowerCase().trim();
  const lang = (selectedLanguage || 'ternate').toLowerCase();

  // Filter words by selected language
  const langWords = seedWords.filter(w => w.bahasa.toLowerCase() === lang);

  // Search for matching words in the query
  const matches = langWords.filter(w =>
    query.includes(w.kata.toLowerCase()) ||
    query.includes(w.arti.toLowerCase())
  );

  // If we found matches, return formatted dictionary results
  if (matches.length > 0) {
    const responseList = matches.map(w =>
      `📖 **${w.kata}** _(${w.kelas_kata.replace('kata_', '')})_ = **${w.arti}**\n   Dialek: ${w.dialek.replace(/_/g, ' ')}\n   Contoh: _${w.contoh}_`
    ).join('\n\n');

    return `### 📡 Mode Kamus Lokal Aktif\n\nSaat ini layanan AI utama sedang tidak tersedia, namun saya berhasil menemukan kata yang Anda cari dari database kamus kami:\n\n${responseList}\n\n---\n💡 Ingin mencari kata lain? Ketik saja di sini, atau buka menu **Kamus** untuk menjelajahi seluruh kosakata.`;
  }

  // Greeting detection
  if (query.match(/^(halo|hai|hi|hello|hey|salam|selamat)/)) {
    const sampleWords = langWords.slice(0, 5).map(w => `**${w.kata}** = ${w.arti}`).join(', ');
    return `### 👋 Halo! Saya Salama AI\n\nSaat ini layanan AI utama sedang tidak tersedia, namun saya tetap bisa membantu Anda mencari arti kata dari database kamus lokal kami!\n\n**Coba tanyakan arti kata-kata ini:**\n${sampleWords}\n\nKetik kata dalam bahasa ${selectedLanguage || 'Ternate'} atau bahasa Indonesia, dan saya akan mencarikannya untuk Anda! 😊`;
  }

  // No matches found — suggest popular words
  const suggestions = langWords.slice(0, 6).map(w => `**${w.kata}** (${w.arti})`).join(', ');
  return `### 📡 Mode Kamus Lokal Aktif\n\nMaaf, saya tidak menemukan kata yang cocok dengan pertanyaan Anda di database kamus lokal.\n\n**Coba tanyakan salah satu kata berikut:**\n${suggestions}\n\nAtau buka menu **Kamus** untuk menjelajahi seluruh ${langWords.length} kosakata bahasa ${selectedLanguage || 'Ternate'} yang tersedia. 📚`;
}

// ==================== MAIN API ROUTE ====================
export async function POST(req) {
  // Parse request body ONCE at the top level so both try and catch can access it
  let messages, selectedLanguage, latestMessage;

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

    // If API key is not configured, go directly to offline fallback
    if (!apiKey || !apiKey.startsWith('AIza')) {
      console.warn('[Salama AI] No valid GEMINI_API_KEY found. Using offline fallback.');
      const fallbackText = generateOfflineResponse(latestMessage, selectedLanguage);
      return new Response(JSON.stringify({ text: fallbackText }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ---- AI Path: Use Gemini API ----

    // Get vocabulary context for injection
    const langWords = seedWords.filter(
      w => w.bahasa.toLowerCase() === (selectedLanguage || 'ternate').toLowerCase()
    ).slice(0, 100);

    const contextText = langWords
      .map(w =>
        `- Kata: "${w.kata}", Arti: "${w.arti}", Kelas Kata: "${w.kelas_kata}", Dialek: "${w.dialek}", Contoh: "${w.contoh}"`
      )
      .join('\n');

    // System prompt for Gemini
    const systemInstruction = `
Anda adalah Salama AI, asisten virtual cerdas yang dikembangkan oleh Muhamad Ikbal Wambes dari Universitas Khairun Ternate sebagai bagian dari program kerja Duta Bahasa Maluku Utara 2026.
Tugas utama Anda adalah menjadi ahli bahasa dan budaya daerah Ternate dan Sula untuk membantu pengguna belajar, menerjemahkan, dan memahami percakapan serta konteks bahasa daerah tersebut.

Berikut adalah database kata resmi bahasa ${selectedLanguage || 'Ternate/Sula'} yang kami miliki:
${contextText}

ATURAN PENTING:
1. Jika pengguna bertanya tentang kata yang ada dalam database di atas, berikan arti, kelas kata, dialek, dan contoh kalimat PERSIS seperti data di atas.
2. Jika pengguna menanyakan kata yang TIDAK ADA dalam database, gunakan pengetahuan luas Anda sebagai pakar linguistik Ternate/Sula. Nyatakan dengan sopan bahwa kata tersebut tidak ada dalam database utama kamus kami, namun berikan penjelasan seakurat mungkin.
3. Bantu pengguna menerjemahkan kalimat, berikan contoh percakapan sehari-hari, jelaskan asal-usul dialek, serta berikan konteks budaya yang relevan.
4. Gunakan bahasa Indonesia yang interaktif, penuh rasa hormat, dan motivasi tinggi untuk melestarikan bahasa daerah Maluku Utara. Akhiri jawaban dengan sentuhan lokal bila relevan (seperti "Suba" atau salam khas lainnya).
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

    const responseText = result.response.text();

    return new Response(JSON.stringify({ text: responseText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Salama AI] Gemini API Error:', error.message);

    // Use the offline fallback with the already-parsed message
    const fallbackText = latestMessage
      ? generateOfflineResponse(latestMessage, selectedLanguage)
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
