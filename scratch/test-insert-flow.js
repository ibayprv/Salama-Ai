const fs = require('fs');
const path = require('path');

// Mock browser window for sessionStorage check inside supabase.js
global.window = {};
global.sessionStorage = {
  getItem: () => 'true',
  setItem: () => {}
};

// Set env vars manually for Next.js mock
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const cleanLine = line.trim();
  if (cleanLine && !cleanLine.startsWith('#')) {
    const parts = cleanLine.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  }
});

const { db } = require('../src/lib/supabase');

async function run() {
  console.log('Testing insertWord with dialek: "ternate" (which should be denormalized to "melayu_ternate" under the hood)...');
  const word1 = {
    kata: 'oho_test_insert',
    bahasa: 'ternate',
    dialek: 'ternate',
    arti: 'makan',
    kelas_kata: 'kata_kerja',
    contoh: 'Oho test insert.',
    status: 'aktif'
  };

  const res1 = await db.insertWord(word1);
  if (res1.error) {
    console.error('❌ Insert failed:', res1.error);
  } else {
    console.log('✅ Insert Succeeded!', res1.data);
    
    // Clean up
    console.log('Cleaning up inserted test word...');
    const createdId = res1.data[0].id;
    await db.deleteWord(createdId);
    console.log('Cleaned up successfully.');
  }

  console.log('\nTesting insertWord with dialek: "sula" (which should be denormalized to "sula_standar" under the hood)...');
  const word2 = {
    kata: 'pia_test_insert',
    bahasa: 'sula',
    dialek: 'sula',
    arti: 'baik',
    kelas_kata: 'kata_sifat',
    contoh: 'Pia test insert.',
    status: 'aktif'
  };

  const res2 = await db.insertWord(word2);
  if (res2.error) {
    console.error('❌ Insert failed:', res2.error);
  } else {
    console.log('✅ Insert Succeeded!', res2.data);
    
    // Clean up
    console.log('Cleaning up inserted test word...');
    const createdId = res2.data[0].id;
    await db.deleteWord(createdId);
    console.log('Cleaned up successfully.');
  }
}

run();
