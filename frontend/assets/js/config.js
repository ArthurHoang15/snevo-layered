/**
 * Frontend Configuration - Development with Environment Variables (Injected)
 * Generated from .env for development use by scripts/dev-config.js
 */

// Supabase Configuration
window.SUPABASE_URL = 'https://qkczwdombbgqkgjbawai.supabase.co/';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrY3p3ZG9tYmJncWtnamJhd2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzI0ODgsImV4cCI6MjA5NjUwODQ4OH0.Vj985-4CHsUHIne3KFg2OiN6PmVO1sPfJsUbyZYzEgk';

// API Configuration
window.API_BASE_URL = 'http://localhost:3001';

// Google OAuth Configuration
window.GOOGLE_CLIENT_ID = '1047890779053-pvlfdvs7ggphuvbscmoodpfnumdlhavk.apps.googleusercontent.com';

// Validate configuration and determine feature availability
const isValidSupabaseUrl = 'https://qkczwdombbgqkgjbawai.supabase.co/' && !'https://qkczwdombbgqkgjbawai.supabase.co/'.includes('your-project-id') && 'https://qkczwdombbgqkgjbawai.supabase.co/'.startsWith('https://');
const isValidSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrY3p3ZG9tYmJncWtnamJhd2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzI0ODgsImV4cCI6MjA5NjUwODQ4OH0.Vj985-4CHsUHIne3KFg2OiN6PmVO1sPfJsUbyZYzEgk' && !'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrY3p3ZG9tYmJncWtnamJhd2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzI0ODgsImV4cCI6MjA5NjUwODQ4OH0.Vj985-4CHsUHIne3KFg2OiN6PmVO1sPfJsUbyZYzEgk'.includes('your-anon-key') && 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrY3p3ZG9tYmJncWtnamJhd2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzI0ODgsImV4cCI6MjA5NjUwODQ4OH0.Vj985-4CHsUHIne3KFg2OiN6PmVO1sPfJsUbyZYzEgk'.length > 50;
const isValidGoogleClientId = '1047890779053-pvlfdvs7ggphuvbscmoodpfnumdlhavk.apps.googleusercontent.com' && '1047890779053-pvlfdvs7ggphuvbscmoodpfnumdlhavk.apps.googleusercontent.com'.includes('.apps.googleusercontent.com');

// App Configuration with dynamic feature detection
window.APP_CONFIG = {
    name: 'Snevo',
    version: '1.0.0',
    environment: 'development',
    buildTime: '2026-06-09T05:19:36.771Z',
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

// Development info
console.log('🔧 Development configuration loaded');
console.log('📊 Supabase URL:', window.SUPABASE_URL);
console.log('🔑 Google Auth:', window.APP_CONFIG.features.googleAuth ? 'enabled' : 'disabled');

// Validation warnings
if (window.SUPABASE_URL.includes('your-project-id')) {
    console.warn('⚠️  Please set SUPABASE_URL in your .env file');
}
if (window.SUPABASE_ANON_KEY === 'your-anon-key') {
    console.warn('⚠️  Please set SUPABASE_ANON_KEY in your .env file');
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_URL: window.SUPABASE_URL,
        SUPABASE_ANON_KEY: window.SUPABASE_ANON_KEY,
        API_BASE_URL: window.API_BASE_URL,
        APP_CONFIG: window.APP_CONFIG,
        GOOGLE_CLIENT_ID: window.GOOGLE_CLIENT_ID
    };
}
