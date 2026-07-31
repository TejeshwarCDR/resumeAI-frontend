import { readFileSync } from 'node:fs';

const content = readFileSync('.env.example', 'utf8');
const entries = Object.fromEntries(
  content
    .split(/\r?\n/)
    .filter((line) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(line))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const requiredKeys = ['VITE_API_URL', 'VITE_WS_URL'];
const forbiddenPatterns = [
  /^DATABASE_URL$/,
  /SECRET/,
  /SERVICE_ROLE/,
  /NVIDIA/,
  /REDIS/,
  /^AWS_/,
  /^GITHUB_CLIENT_SECRET$/,
  /^JWT_/,
];

const missing = requiredKeys.filter((key) => !(key in entries));
if (missing.length > 0) {
  throw new Error(`.env.example is missing required keys: ${missing.join(', ')}`);
}

const forbidden = Object.keys(entries).filter((key) =>
  forbiddenPatterns.some((pattern) => pattern.test(key)),
);
if (forbidden.length > 0) {
  throw new Error(`.env.example exposes backend-only keys: ${forbidden.join(', ')}`);
}

const invalidPublicKeys = Object.keys(entries).filter((key) => !key.startsWith('VITE_'));
if (invalidPublicKeys.length > 0) {
  throw new Error(`Frontend .env.example keys must be VITE_-prefixed: ${invalidPublicKeys.join(', ')}`);
}

console.log('Frontend environment example is complete and safe.');
