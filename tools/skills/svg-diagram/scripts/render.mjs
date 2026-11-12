#!/usr/bin/env node
/**
 * render.mjs —— 把 SVG 截成 PNG，供模型自己"看"一眼（零 npm 依赖，用本机 chrome）
 *
 * 用法： node scripts/render.mjs <file.svg> [out.png] [scale]
 *   scale 默认 2（高分屏清楚）
 *
 * 找不到 chrome 时会尝试 chromium / microsoft-edge；都没有则打印提示退出 2。
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const [, , file, outArg, scaleArg] = process.argv;
if (!file) {
  console.error('用法: node scripts/render.mjs <file.svg> [out.png] [scale]');
  process.exit(2);
}
if (!existsSync(file)) {
  console.error(`文件不存在: ${file}`);
  process.exit(2);
}

const src = readFileSync(file, 'utf8');
const vb = (src.match(/viewBox="([^"]+)"/) || [])[1];
let W = 720;
let H = 400;
if (vb) {
  const p = vb.trim().split(/[\s,]+/).map(Number);
  if (p.length === 4) {
    W = Math.ceil(p[2]);
    H = Math.ceil(p[3]);
  }
}

const scale = Number(scaleArg || 2);
const out = outArg || file.replace(/\.svg$/i, '.png');
const abs = resolve(file);

const candidates = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'];
let bin = null;
for (const c of candidates) {
  try {
    execFileSync('which', [c], { stdio: 'pipe' });
    bin = c;
    break;
  } catch {}
}
if (!bin) {
  console.error('✗ 找不到 chrome/chromium。可改用 rsvg-convert 或手动打开 SVG 检查。');
  process.exit(2);
}

try {
  execFileSync(
    bin,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--default-background-color=ffffff',
      `--force-device-scale-factor=${scale}`,
      `--window-size=${W},${H}`,
      `--screenshot=${resolve(out)}`,
      `file://${abs}`,
    ],
    { stdio: 'pipe', timeout: 60000 }
  );
  console.log(`✓ ${out}  (${W}×${H} @${scale}x, 来自 ${bin})`);
} catch (e) {
  console.error(`✗ 截图失败：${e.message}`);
  process.exit(1);
}
