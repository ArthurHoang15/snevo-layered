#!/usr/bin/env node

/**
 * Development Configuration Inspector
 * Local development serves /assets/js/config.js at runtime from backend/server.js.
 * This script intentionally does not write to frontend/assets/js/config.js.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { loadEnvironment } from '../backend/infrastructure/utils/environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

loadEnvironment(rootDir);

const FRONTEND_ENV_VARS = {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    API_BASE_URL: process.env.API_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3001',
    APP_NAME: process.env.APP_NAME || 'Snevo',
    APP_VERSION: process.env.APP_VERSION || '1.0.0',
    NODE_ENV: 'development',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || ''
};

function maskValue(key, value) {
    if (!value) return 'not set';
    if (key === 'SUPABASE_URL') {
        return 'configured';
    }
    if (key === 'GOOGLE_CLIENT_ID') {
        return value.includes('.apps.googleusercontent.com') ? 'configured (valid format)' : 'configured (check format)';
    }
    if (key.includes('KEY') || key.includes('SECRET')) {
        return value.length > 8 ? `***${value.slice(-4)}` : '***';
    }
    return value;
}

function validateConfig() {
    const warnings = [];

    if (!FRONTEND_ENV_VARS.SUPABASE_URL || FRONTEND_ENV_VARS.SUPABASE_URL.includes('your-project-id')) {
        warnings.push('SUPABASE_URL is missing or still uses the placeholder value.');
    }

    if (!FRONTEND_ENV_VARS.SUPABASE_ANON_KEY || FRONTEND_ENV_VARS.SUPABASE_ANON_KEY === 'your-anon-key') {
        warnings.push('SUPABASE_ANON_KEY is missing or still uses the placeholder value.');
    }

    if (
        FRONTEND_ENV_VARS.GOOGLE_CLIENT_ID &&
        !FRONTEND_ENV_VARS.GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')
    ) {
        warnings.push('GOOGLE_CLIENT_ID does not look like a Google OAuth web client id.');
    }

    return warnings;
}

console.log('Development frontend config is served at runtime by backend/server.js.');
console.log('No source-controlled files were written.');
console.log('');
console.log('Environment variables loaded from process env, .env, or local.env:');

Object.entries(FRONTEND_ENV_VARS).forEach(([key, value]) => {
    console.log(`  ${key}: ${maskValue(key, value)}`);
});

const warnings = validateConfig();
if (warnings.length > 0) {
    console.log('');
    console.warn('Configuration warnings:');
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
}
