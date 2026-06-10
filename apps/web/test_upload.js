const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('../../.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if(key) acc[key] = val.join('=');
  return acc;
}, {});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const fileContent = "dummy audio data";
  const { data, error } = await supabase.storage.from('chat-media').upload(`test-${Date.now()}.png`, fileContent, { contentType: 'image/png' });
  console.log("Upload test:", data, error);
}
run();
