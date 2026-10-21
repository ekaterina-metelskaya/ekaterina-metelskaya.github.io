// Renders the link-preview images (Open Graph, 1200×630) from tools/og.html into assets/og/*.png.
// Run with the dev server up (launch config «home», port 5173): node tools/og.js
// Rerun after changing a case title, its metric or its cover drawing.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE = process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = process.env.OG_BASE || 'http://localhost:5173';
const out = path.join(__dirname, '..', 'assets', 'og');
fs.mkdirSync(out, { recursive: true });

for (const key of ['home', 'control', 'planning', 'docs', 'tv', 'invino']) {
  const file = path.join(out, `${key}.png`);
  execFileSync(EDGE, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1200,630', '--virtual-time-budget=6000',
    `--screenshot=${file}`, `${BASE}/tools/og.html?k=${key}`,
  ], { stdio: 'ignore' });
  console.log(key, fs.statSync(file).size, 'bytes');
}
