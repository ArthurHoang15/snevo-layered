import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

// Storage buckets are queried from the storage schema or through storage API
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

const { data: buckets, error } = await adminClient.storage.listBuckets();
if (error) {
  console.error('Error listing buckets:', error);
} else {
  console.log('Available buckets:', buckets);
}
