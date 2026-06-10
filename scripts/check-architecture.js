#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

function listFiles(dir) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    return entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

function read(filePath) {
  return readFileSync(filePath, 'utf8');
}

function relative(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, '/');
}

const checks = [
  {
    label: 'services must not handle HTTP or import database/presentation',
    dir: path.join(rootDir, 'backend', 'business', 'services'),
    rules: [
      /\b(req|res)\b|writeHead|\.end\(/,
      /supabase|createSupabaseConfig|getAdminClient|infrastructure\/database/,
      /presentation\//
    ]
  },
  {
    label: 'repositories must not import business or presentation code',
    dir: path.join(rootDir, 'backend', 'data', 'repositories'),
    rules: [
      /validationRules/,
      /business\//,
      /presentation\//
    ]
  },
  {
    label: 'controllers must not import repositories or database directly',
    dir: path.join(rootDir, 'backend', 'presentation', 'controllers'),
    rules: [
      /setModels/,
      /data\/repositories/,
      /infrastructure\/database/
    ]
  },
  {
    label: 'infrastructure must not import upper layers',
    dir: path.join(rootDir, 'backend', 'infrastructure'),
    rules: [
      /business\//,
      /presentation\//
    ]
  }
];

const failures = [];

for (const check of checks) {
  for (const filePath of listFiles(check.dir)) {
    const source = read(filePath);
    for (const rule of check.rules) {
      if (rule.test(source)) {
        failures.push(`${relative(filePath)} violates: ${check.label} (${rule})`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Architecture checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Architecture checks passed.');
