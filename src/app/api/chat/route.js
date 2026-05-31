import { GoogleGenerativeAI } from '@google/generative-ai';
import { seedWords } from '@/lib/seedData';

// We can read GEMINI_API_KEY from environment
const apiKey = process.env.GEMINI_API_KEY || '';

export async function POST(req) {
  try {
    const { messages, selectedLanguage } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If API key is not configured, throw error early to trigger the smart fallback
    if (!apiKey) {
      throw new Error("API Key belum dikonfigurasi.");
    }

    // Get vocabulary context for injection
    const langWords = seedWords.filter(
      w => w.bahasa.toLowerCase() === (selectedLanguage || 'ternate').toLowerCase()
    ).slice(0, 100); // Take first 100 words of the language to prevent context overflow

    const contextText = langWords
      .map(
        w =>
          `- Kata: "${w.kata}", Arti: "${w.arti}", Kelas Kata: "${w.kelas_kata}", Dialek: "${w.dialek}", Contoh: "${w.contoh}"`
      )
      .join('\n');

    // System prompt for Gemini
    const systemInstruction = `
Anda adalah Salama AI, asisten virtual cerdas yang dikembangkan oleh Muhamad Ikbal Wambes dari Universitas Khairun Ternate sebagai bagian dari program kerja Duta Bahasa Maluku Utara 2026.
Tugas utama Anda adalah menjadi ahli bahasa dan budaya daerah Ternate dan Sula untuk membantu pengguna belajar, menerjemahkan, dan memahami percakapan serta konteks bahasa daerah tersebut.

Berikut adalah database kata resmi bahasa ${selectedLanguage || 'Ternate/Sula'} yang kami miliki untuk membantu Anda menjawab pertanyaan dengan akurat:
${contextText}

ATURAN PENTING:
1. Jika pengguna bertanya tentang kata yang ada dalam database di atas, berikan arti, kelas kata, dialek, dan contoh kalimat PERSIS seperti data di atas.
2. Jika pengguna menanyakan kata yang TIDAK ADA dalam database di atas, gunakan pengetahuan luas Anda sebagai pakar linguistik Ternate/Sula untuk memberikan arti kata tersebut. Nyatakan dengan sopan bahwa kata tersebut tidak ada dalam database utama kamus kami, namun berikan penjelasannya secara akurat.
3. Bantu pengguna menerjemahkan kalimat, berikan contoh percakapan sehari-hari, jelaskan asal-usul dialek (seperti Melayu Ternate, Tidore, dan Sula Standar), serta berikan konteks budaya yang relevan dengan ramah dan sopan.
4. Gunakan bahasa Indonesia yang interaktif, penuh rasa hormat, dan motivasi tinggi untuk melestarikan bahasa daerah Maluku Utara. Akhiri ulasan dengan sentuhan lokal bila relevan (seperti "Suba" atau salam khas lainnya).
`;

    // Initialize Gemini Client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Menggunakan gemini-2.0-flash (gratis penuh di free tier)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemInstruction,
    });

    // Format chat history for Gemini API
    const contents = [];
    
    // Convert history
    const history = messages.slice(0, -1);
    const latestMessage = messages[messages.length - 1].content;

    // Filter history to ensure it starts with a 'user' message
    const cleanHistory = [];
    let foundFirstUser = false;
    for (const msg of history) {
      if (msg.role === 'user') {
        foundFirstUser = true;
      }
      if (foundFirstUser) {
        cleanHistory.push(msg);
      }
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

    // Generate content
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
    console.warn("Gemini API Error, initiating smart fallback:", error.message);
    
    try {
      const { messages } = await req.json();
      const latestMessage = messages[messages.length - 1].content.toLowerCase();
      
      // Look for matches in seedWords
      const matches = seedWords.filter(w => 
        latestMessage.includes(w.kata.toLowerCase()) || 
        latestMessage.includes(w.arti.toLowerCase())
      );
      
      if (matches.length > 0) {
        const responseList = matches.map(w => 
          `• **${w.kata}** (${w.kelas_kata.replace('kata_', '')}) = **${w.arti}**\n  *Dialek:* ${w.dialek.replace('_', ' ')}\n  *Contoh:* _${w.contoh}_`
        ).join('\n\n');
        
        return new Response(
          JSON.stringify({ 
            text: `### 📡 Mode Cadangan Aktif (Sistem Offline)\n\nMaaf, kuota layanan AI utama sedang penuh atau kunci API tidak terpasang di Vercel. Namun, saya berhasil mencari arti kata yang Anda maksud langsung dari database kamus kami:\n\n${responseList}\n\nAda kata lain yang ingin Anda terjemahkan? Silakan ketik di sini atau cari di menu **Cari Kamus**.`
          }), 
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Default offline message if no words match
      return new Response(
        JSON.stringify({ 
          text: `### 📡 Mode Cadangan Aktif (Sistem Offline)\n\nMaaf, saat ini layanan AI utama kami sedang penuh atau kunci API belum terpasang di Vercel.\n\n**Saran Kata Pencarian:**\nCobalah ketik kata seperti **"fola"**, **"kie"**, **"aho"**, atau **"tagi"** agar saya bisa membantu menerjemahkannya secara instan dari database lokal kami. Anda juga bisa mencari seluruh kosakata secara lengkap pada menu **Cari Kamus**.`
        }), 
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (fallbackErr) {
      return new Response(
        JSON.stringify({ 
          text: "Maaf, sistem AI Salama sedang sibuk atau kuota API telah habis. Namun jangan khawatir, Anda tetap bisa mencari arti kata secara instan melalui tab **Cari Kata** di menu Kamus kami yang selalu aktif 100%!",
          error: error.message 
        }), 
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}
