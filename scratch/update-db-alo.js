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

async function run() {
  console.log('Searching for word "alo" in Ternate language...');
  const { data, error } = await supabase
    .from('kata')
    .select('*')
    .eq('kata', 'alo')
    .eq('bahasa', 'ternate');

  if (error) {
    console.error('❌ Failed to fetch "alo":', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ Word "alo" in Ternate not found in database. Nothing to update.');
    return;
  }

  console.log('Found word "alo":', data[0]);

  console.log('Updating "alo" meaning to "dingin" in database...');
  const { data: updated, error: updErr } = await supabase
    .from('kata')
    .update({
      arti: 'dingin',
      kelas_kata: 'kata_sifat',
      contoh: 'Aho alo ena lami-lami. (Air dingin itu sangat segar.)'
    })
    .eq('id', data[0].id)
    .select();

  if (updErr) {
    console.error('❌ Failed to update "alo":', updErr.message);
  } else {
    console.log('✅ Successfully updated "alo" in database:', updated[0]);
  }
}

run();
