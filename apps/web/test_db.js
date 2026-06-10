const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('../../.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if(key) acc[key] = val.join('=');
  return acc;
}, {});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const testMsg = {
    sender_id: '9471f801-ffb7-479c-b29c-9c716ebc1002',
    receiver_id: '9471f801-ffb7-479c-b29c-9c716ebc1002',
    media_url: 'http://test.com/audio.webm',
    content: '[Voice Message]',
    type: 'voice',
    status: 'sent'
  };
  const { data, error } = await supabase.from('messages').insert(testMsg).select().single();
  console.log("DB Insert Test:", data, error);
}
run();
