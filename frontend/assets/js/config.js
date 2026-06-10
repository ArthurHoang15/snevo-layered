/**
 * Frontend Configuration - Safe defaults for source control.
 * Local and production builds can overwrite this file from environment values.
 */

window.SUPABASE_URL = window.SUPABASE_URL || 'https://your-project-id.supabase.co';
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'your-anon-key';
window.API_BASE_URL = window.API_BASE_URL || 'http://localhost:3001';
window.GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || '';

const isValidSupabaseUrl = Boolean(
  window.SUPABASE_URL &&
  !window.SUPABASE_URL.includes('your-project-id') &&
  window.SUPABASE_URL.startsWith('https://')
);
const isValidSupabaseKey = Boolean(
  window.SUPABASE_ANON_KEY &&
  window.SUPABASE_ANON_KEY !== 'your-anon-key' &&
  window.SUPABASE_ANON_KEY.length > 50
);
const isValidGoogleClientId = Boolean(
  window.GOOGLE_CLIENT_ID &&
  window.GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')
);

window.APP_CONFIG = {
  name: 'Snevo',
  version: '1.0.0',
  environment: 'development',
  buildTime: 'source-default',
  features: {
    googleAuth: isValidGoogleClientId && isValidSupabaseUrl && isValidSupabaseKey,
    emailVerification: isValidSupabaseUrl && isValidSupabaseKey,
    passwordReset: isValidSupabaseUrl && isValidSupabaseKey,
    supabaseAuth: isValidSupabaseUrl && isValidSupabaseKey
  },
  validation: {
    supabaseUrl: isValidSupabaseUrl,
    supabaseKey: isValidSupabaseKey,
    googleClientId: isValidGoogleClientId
  }
};

if (!isValidSupabaseUrl || !isValidSupabaseKey) {
  console.warn('Supabase frontend configuration is using safe placeholder values.');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SUPABASE_URL: window.SUPABASE_URL,
    SUPABASE_ANON_KEY: window.SUPABASE_ANON_KEY,
    API_BASE_URL: window.API_BASE_URL,
    APP_CONFIG: window.APP_CONFIG,
    GOOGLE_CLIENT_ID: window.GOOGLE_CLIENT_ID
  };
}
