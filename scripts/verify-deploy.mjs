import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const required = ['index.html', 'start.html', 'intake-personal.html', 'intake-company.html', 'submitted.html', 'dashboard.html', 'assets/app.js', 'assets/styles.css'];
const forbidden = /(?:^|\/)(?:Kliendibaas|client-data)(?:\/|$)|\.(?:pdf|csv|xlsx?|docx?|zip)$/i;

async function walk(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path.join(directory, entry.name), relative));
    else files.push(relative);
  }
  return files;
}

const files = await walk(dist);
for (const file of required) {
  if (!files.includes(file)) throw new Error(`Missing deploy file: ${file}`);
}
for (const file of files) {
  if (forbidden.test(file)) throw new Error(`Forbidden deploy file: ${file}`);
  const text = await readFile(path.join(dist, file), 'utf8').catch(() => '');
  if (/^(<<<<<<<|=======|>>>>>>>)/m.test(text)) throw new Error(`Merge conflict in deploy: ${file}`);
}
console.log(`Deploy verified: ${files.length} files, ${required.length} required files present.`);
