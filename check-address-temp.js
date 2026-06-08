import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbSchema = process.env.DB_SCHEMA || 'db_nike';

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: dbSchema }
});

const { data, error } = await adminClient.rpc('get_table_columns', { table_name: 'addresses' });
if (error) {
  // If rpc doesn't exist, we can use a direct sql query or select a dummy record, or read schema.sql to see if there's any other schema.
  console.log('RPC get_table_columns failed, trying raw select...');
  // We can query using RPC if we have raw sql execution RPC, or try to insert a dummy and see error messages.
  // Wait, let's just select columns from information_schema.columns if we can? Supabase doesn't let us query info_schema via REST unless it is exposed.
  // But wait! Is there a SQL query we can run? No direct raw SQL via REST client unless an RPC like 'exec_sql' exists.
  // Let's just try to insert a dummy record with all fields and see which ones fail, or print keys from another table or look at schema.sql.
  // Wait, let's write code to fetch column names by inspecting the postgrest API description if possible! Or let's see if we can run a SQL query by checking the schema.sql trigger/functions.
}
// Let's print table column info by trying to insert a dummy address record.
const dummy = {
  user_id: '32d11d21-fa4c-47db-b6bf-cdbba06984c0',
  street: 'test street',
  city: 'test city',
  state: 'test state',
  country: 'Vietnam',
  zip_code: '12345'
};
const { data: insData, error: insErr } = await adminClient.from('addresses').insert([dummy]).select();
console.log('Insert attempt output:', { insData, insErr });
if (insData && insData.length > 0) {
  console.log('Columns of addresses:', Object.keys(insData[0]));
  // Clean up
  await adminClient.from('addresses').delete().eq('address_id', insData[0].address_id);
}
