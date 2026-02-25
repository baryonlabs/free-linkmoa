/**
 * free-linkmoa GitHub Pages 빌드 스크립트
 * config.yml → out/index.html 정적 HTML 생성
 *
 * 사용: node build.mjs
 * 출력: ../out/index.html
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config 로드 ──────────────────────────────────────────────────────────────
const config = yaml.load(readFileSync(join(__dirname, 'config.yml'), 'utf8'));

const { profile = {}, theme = {}, links = [] } = config;

// ── 기본 테마 ────────────────────────────────────────────────────────────────
const t = {
  background: '#0f172a',
  text: '#f8fafc',
  button_bg: '#1e293b',
  button_text: '#f8fafc',
  button_hover: '#334155',
  accent: '#6366f1',
  ...theme,
};

// ── 아이콘 맵 ────────────────────────────────────────────────────────────────
const ICONS = {
  instagram: '📸',
  github: '🐙',
  youtube: '▶️',
  twitter: '𝕏',
  x: '𝕏',
  tiktok: '🎵',
  linkedin: '💼',
  facebook: 'f',
  discord: '💬',
  twitch: '🎮',
  email: '📧',
  blog: '📝',
  link: '🔗',
};

const icon = (name) => ICONS[name?.toLowerCase()] ?? '🔗';
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── HTML 조각 생성 ───────────────────────────────────────────────────────────
const avatarHtml = profile.avatar
  ? `<img src="${esc(profile.avatar)}" alt="${esc(profile.name)}" class="avatar">`
  : `<div class="avatar-placeholder">😊</div>`;

const bioHtml = profile.bio ? `<p class="bio">${esc(profile.bio)}</p>` : '';

const linksHtml = links
  .filter((l) => l.enabled !== false)
  .map(
    (l) =>
      `<a href="${esc(l.url)}" class="link-btn" target="_blank" rel="noopener noreferrer">` +
      `<span class="icon">${icon(l.icon)}</span>` +
      `<span>${esc(l.title)}</span>` +
      `</a>`
  )
  .join('\n      ');

// ── CSS ─────────────────────────────────────────────────────────────────────
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: ${t.background};
    color: ${t.text};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 3rem 1rem 4rem;
  }
  .page { width: 100%; max-width: 580px; }
  .profile { text-align: center; margin-bottom: 2.25rem; }
  .avatar {
    width: 96px; height: 96px; border-radius: 50%;
    object-fit: cover; display: block; margin: 0 auto 1rem;
    border: 3px solid ${t.accent};
  }
  .avatar-placeholder {
    width: 96px; height: 96px; border-radius: 50%;
    background: ${t.button_bg}; margin: 0 auto 1rem;
    display: flex; align-items: center; justify-content: center;
    font-size: 2.5rem; border: 3px solid ${t.accent};
  }
  h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }
  .bio { opacity: 0.7; font-size: 0.95rem; line-height: 1.6; }
  .links { display: flex; flex-direction: column; gap: 0.75rem; }
  .link-btn {
    display: flex; align-items: center; justify-content: center; gap: 0.6rem;
    padding: 1rem 1.5rem;
    background: ${t.button_bg}; color: ${t.button_text};
    text-decoration: none; border-radius: 12px;
    font-size: 1rem; font-weight: 500;
    transition: background 0.2s, transform 0.15s;
  }
  .link-btn:hover { background: ${t.button_hover}; transform: translateY(-2px); }
  .link-btn:active { transform: translateY(0); }
  .icon { font-size: 1.2rem; }
  footer { text-align: center; margin-top: 3rem; font-size: 0.78rem; opacity: 0.35; }
  footer a { color: inherit; text-decoration: none; }
`.trim();

// ── 최종 HTML ────────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(profile.name)}</title>
  <meta name="description" content="${esc(profile.bio || profile.name)}">
  <meta property="og:title" content="${esc(profile.name)}">
  <meta property="og:description" content="${esc(profile.bio || '')}">
  ${profile.avatar ? `<meta property="og:image" content="${esc(profile.avatar)}">` : ''}
  <style>${css}</style>
</head>
<body>
  <div class="page">
    <div class="profile">
      ${avatarHtml}
      <h1>${esc(profile.name)}</h1>
      ${bioHtml}
    </div>
    <div class="links">
      ${linksHtml}
    </div>
    <footer>
      <a href="https://github.com/baryonlabs/free-linkmoa">Powered by free-linkmoa</a>
    </footer>
  </div>
</body>
</html>`;

// ── 파일 저장 ────────────────────────────────────────────────────────────────
const outDir = join(__dirname, '..', 'out');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'index.html'), html, 'utf8');

console.log('✅ Built: out/index.html');
console.log(`   profile: ${profile.name}`);
console.log(`   links: ${links.filter((l) => l.enabled !== false).length}개`);
