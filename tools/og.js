// Renders the link-preview images (Open Graph, 1200×630):
//   ru — tools/og-site.html → og-image-ru.png in the site root (home, all projects, privacy)
//   en — the same cover in English → og-image-en.png, for the future /en/ pages; rendered only on request: node tools/og.js en
//   cases — tools/og.html?k=<key> → assets/og/<key>.png
//   en-<key> — the same cases in English: tools/og.en.html?k=<key> → assets/og/en/<key>.png (used by the /en/ case pages)
// Run with the dev server up (launch config «home», port 5173; another port: OG_BASE=http://localhost:<port>): node tools/og.js [key …], e.g. node tools/og.js ru
// Rerun after changing a case title, its metric or its cover drawing (in both og.html and og.en.html).
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE = process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = process.env.OG_BASE || 'http://localhost:5173';
const root = path.join(__dirname, '..');
fs.mkdirSync(path.join(root, 'assets', 'og', 'en'), { recursive: true });

const cases = ['control', 'planning', 'docs', 'tv', 'invino'];
const targets = {
  ru: ['tools/og-site.html?lang=ru', 'og-image-ru.png'],
  en: ['tools/og-site.html?lang=en', 'og-image-en.png'],
  ...Object.fromEntries(cases.map(k => [k, [`tools/og.html?k=${k}`, `assets/og/${k}.png`]])),
  ...Object.fromEntries(cases.map(k => [`en-${k}`, [`tools/og.en.html?k=${k}`, `assets/og/en/${k}.png`]])),
};
const onRequest = ['en'];
const keys = process.argv.slice(2);
for (const key of keys.length ? keys : Object.keys(targets).filter(k => !onRequest.includes(k))) {
  if (!targets[key]) throw new Error(`Нет превью «${key}». Есть: ${Object.keys(targets).join(', ')}`);
  const [page, out] = targets[key];
  const file = path.join(root, out);
  execFileSync(EDGE, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1200,630', '--virtual-time-budget=6000',
    `--screenshot=${file}`, `${BASE}/${page}`,
  ], { stdio: 'ignore' });
  console.log(out, fs.statSync(file).size, 'bytes');
}
