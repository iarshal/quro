require('dotenv').config({ path: 'apps/web/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data: userAuth } = await supabase.auth.getUser();
  if (userAuth.error) {
    console.error("Auth error:", userAuth.error);
    // If not authenticated, we can't test RLS easily. Let's just try to insert and see if it's schema issue or RLS.
  }
  
  // Try inserting with a fake UUID
  const res = await supabase.from('messages').insert({
    conversation_id: '11111111-1111-1111-1111-111111111111',
    sender_id: '11111111-1111-1111-1111-111111111111',
    ciphertext: 'test',
    iv: 'test',
    tag: 'test',
    type: 'text',
    status: 'sent'
  });
  console.log("Insert result:", res);
}
test();
