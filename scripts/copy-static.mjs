import { copyFile, cp, mkdir } from 'node:fs/promises';

const pages = [
  'start.html',
  'intake-personal.html',
  'intake-company.html',
  'submitted.html',
  'dashboard.html',
];

await mkdir('dist/assets', { recursive: true });
await Promise.all(pages.map((page) => copyFile(page, `dist/${page}`)));
await cp('assets', 'dist/assets', { recursive: true });
await cp('markets', 'dist/markets', { recursive: true });
await cp('rules', 'dist/rules', { recursive: true });
await cp('config', 'dist/config', { recursive: true });
