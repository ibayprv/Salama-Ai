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

console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? 'Found' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Testing SELECT...');
  const { data: selectData, error: selectError } = await supabase
    .from('kata')
    .select('*')
    .limit(1);
  console.log('SELECT result:', selectData ? `Found ${selectData.length} records` : 'No data');
  if (selectError) console.error('SELECT error:', selectError);

  console.log('\nTesting INSERT...');
  const testWord = {
    kata: 'test_word_temp',
    bahasa: 'ternate',
    dialek: 'ternate',
    arti: 'test',
    kelas_kata: 'kata_benda',
    contoh: 'test',
    status: 'aktif'
  };
  const { data: insertData, error: insertError } = await supabase
    .from('kata')
    .insert([testWord])
    .select();
  console.log('INSERT result:', insertData);
  if (insertError) console.error('INSERT error:', insertError);
}

run();
