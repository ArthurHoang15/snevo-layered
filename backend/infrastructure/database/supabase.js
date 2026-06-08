import { createClient } from '@supabase/supabase-js';

export class SupabaseConfig {
  constructor() {
    this.url = null;
    this.anonKey = null;
    this.serviceKey = null;
    this.client = null;
    this.adminClient = null;
    this.initialized = false;
  }

  init() {
    if (!this.url || !this.anonKey) {
      this.url = process.env.SUPABASE_URL;
      this.anonKey = process.env.SUPABASE_ANON_KEY;
      this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    }

    if (!this.url || !this.anonKey) {
      console.warn('Supabase configuration missing - environment variables not set');
      return null;
    }

    const schema = process.env.DB_SCHEMA || 'db_nike';

    this.client = createClient(this.url, this.anonKey, {
      db: {
        schema
      }
    });

    if (this.serviceKey) {
      this.adminClient = createClient(this.url, this.serviceKey, {
        db: {
          schema
        }
      });
    }

    this.initialized = true;
    return this.client;
  }

  getClient() {
    if (!this.initialized) {
      this.init();
    }

    return this.client;
  }

  getAdminClient() {
    if (!this.initialized) {
      this.init();
    }

    if (!this.adminClient) {
      throw new Error('Admin client not configured');
    }

    return this.adminClient;
  }
}

export const supabaseConfig = new SupabaseConfig();

export default function createSupabaseConfig() {
  return supabaseConfig;
}

// Attach singleton methods to the function for backward compatibility
createSupabaseConfig.getClient = () => supabaseConfig.getClient();
createSupabaseConfig.getAdminClient = () => supabaseConfig.getAdminClient();
createSupabaseConfig.init = () => supabaseConfig.init();

