import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bbvajqsrqpzlsfvfxumt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_3ivis4bD_iOCeTi-JcKJRQ_l5Umo2ne';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

async function test() {
  const { data, error } = await supabase.from('items').insert({
    category_id: '3c51da05-fe74-4318-b439-e373733d123b',
    name: 'Test',
    price: 10,
    preparation_time_minutes: 20
  });
  console.log('Insert Error:', error);
}
test();
