// Снимки playground для превью-блока в кейсе: assets/re-instance/playground-ru.png и playground-en.png (1120×700).
// Запускается с поднятым локальным сервером (node tools/serve.js, другой порт — OG_BASE=http://localhost:<порт>);
// нужен Microsoft Edge (EDGE=<путь>, как у tools/og.js). Playground открывается в режиме ?demo: поиск выполнен, открыт
// Card · Alpine lake. Перерисуйте снимки после изменений в playground или в плагине.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE = process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = process.env.OG_BASE || 'http://localhost:5173';
const root = path.join(__dirname, '..');
const langs = process.argv.slice(2).length ? process.argv.slice(2) : ['ru', 'en'];
for (const lang of langs) {
  const out = path.join(root, 'assets', 're-instance', `playground-${lang}.png`);
  execFileSync(EDGE, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1120,700', '--virtual-time-budget=14000',
    `--screenshot=${out}`, `${BASE}/assets/re-instance/playground.html?lang=${lang}&fit=1&demo=1`,
  ], { stdio: 'ignore' });
  console.log(path.relative(root, out), fs.statSync(out).size, 'bytes');
}
