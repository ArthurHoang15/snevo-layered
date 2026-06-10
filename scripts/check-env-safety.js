#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const allowedEnvFiles = new Set(['.env.example']);
const textExtensions = new Set([
  '.js',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.html',
  '.css',
  '.sql',
  '.txt',
  '.conf',
  '.dockerignore',
  '.gcloudignore',
  '.gitignore'
]);

function listTrackedFiles() {
  const output = execFileSync('git', ['ls-files'], { encoding: 'utf8' });
  return output.split(/\r?\n/).filter(Boolean);
}

function isEnvFile(filePath) {
  const baseName = path.basename(filePath);
  return baseName === '.env' || baseName.endsWith('.env') || baseName.startsWith('.env.');
}

function isProbablyText(filePath) {
  const baseName = path.basename(filePath);
  const extension = path.extname(filePath);
  return textExtensions.has(extension) || textExtensions.has(baseName);
}

const secretPatterns = [
  {
    name: 'JWT-like token',
    pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/
  },
  {
    name: 'Supabase service role assignment',
    pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*(?!your-|<|$)[^\s'"]+/i
  },
  {
    name: 'Google OAuth client id',
    pattern: /\b\d{8,}-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com\b/
  }
];

const failures = [];
const trackedFiles = listTrackedFiles();

for (const filePath of trackedFiles) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const baseName = path.basename(normalizedPath);

  if (isEnvFile(normalizedPath) && !allowedEnvFiles.has(baseName)) {
    failures.push(`${normalizedPath}: environment files must not be tracked`);
    continue;
  }

  if (!isProbablyText(normalizedPath)) continue;

  const content = readFileSync(normalizedPath, 'utf8');
  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(content)) {
      failures.push(`${normalizedPath}: possible ${name}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Environment safety check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Environment safety check passed.');
