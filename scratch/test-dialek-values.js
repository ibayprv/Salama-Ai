const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const cleanLine = line.trim();
  if (cleanLine && !cleanLine.startsWith('#')) {
    const parts = cleanLine.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val;
    }
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDialect(dialekVal) {
  console.log(`Testing insert with dialek: "${dialekVal}"...`);
  const testWord = {
    kata: 'test_temp_' + dialekVal,
    bahasa: 'ternate',
    dialek: dialekVal,
    arti: 'test',
    kelas_kata: 'kata_benda',
    contoh: 'test',
    status: 'aktif'
  };
  const { data, error } = await supabase
    .from('kata')
    .insert([testWord])
    .select();
  
  if (error) {
    console.log(`❌ Failed with error: ${error.message} (Code: ${error.code})`);
  } else {
    console.log(`✅ Success! Inserted ID: ${data[0].id}`);
    // Clean up
    await supabase.from('kata').delete().eq('id', data[0].id);
  }
}

async function run() {
  const dialeks = ['melayu_ternate', 'sula_standar', 'ternate', 'sula', 'tidore'];
  for (const d of dialeks) {
    await testDialect(d);
  }
}

run();
