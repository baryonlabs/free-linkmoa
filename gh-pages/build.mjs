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
  background: '#0a0f1e',
  text: '#f8fafc',
  button_bg: '#0f2044',
  button_text: '#f8fafc',
  button_hover: '#1a3a6e',
  accent: '#3b82f6',
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
  carrot: '🥕',
  huggingface: '🤗',
  inflearn: '🎓',
  home: '🏠',
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
  .map((l) => {
    const thumbHtml = l.thumbnail
      ? `<div class="link-thumb"><img src="${esc(l.thumbnail)}" alt="${esc(l.title)}" class="thumb-img"></div>`
      : `<div class="link-thumb thumb-emoji"><span>${icon(l.icon)}</span></div>`;
    return (
      `<a href="${esc(l.url)}" class="link-btn" target="_blank" rel="noopener noreferrer">` +
      thumbHtml +
      `<span class="link-title">${esc(l.title)}</span>` +
      `<span class="link-arrow">›</span>` +
      `</a>`
    );
  })
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

  /* ── 3D 카드 ── */
  .link-btn {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.85rem 1.25rem 0.85rem 0.85rem;
    background: ${t.button_bg};
    color: ${t.button_text};
    text-decoration: none;
    border-radius: 16px;
    font-size: 1rem;
    font-weight: 500;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.07);
    box-shadow:
      0 4px 16px rgba(0,0,0,0.4),
      inset 0 1px 0 rgba(255,255,255,0.07);
    transition:
      transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 0.25s ease,
      border-color 0.25s ease;
    transform-style: preserve-3d;
    will-change: transform;
    cursor: pointer;
  }
  /* 유리 반짝임 오버레이 */
  .link-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%);
    opacity: 0;
    transition: opacity 0.25s;
    pointer-events: none;
  }
  .link-btn:hover::before { opacity: 1; }
  .link-btn:active {
    transform: perspective(600px) translateY(-1px) scale(0.98) !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
  }

  /* ── 썸네일 ── */
  .link-thumb {
    width: 52px; height: 52px;
    border-radius: 12px;
    flex-shrink: 0;
    overflow: hidden;
    background: rgba(255,255,255,0.09);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .thumb-img {
    width: 100%; height: 100%;
    object-fit: cover;
  }
  .thumb-emoji span {
    font-size: 2rem;
    line-height: 1;
  }

  .link-title { flex: 1; }
  .link-arrow {
    font-size: 1.4rem;
    opacity: 0.35;
    transition: opacity 0.2s, transform 0.2s;
  }
  .link-btn:hover .link-arrow {
    opacity: 0.85;
    transform: translateX(4px);
  }

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

  <!-- 마우스 추적 3D 틸트 효과 -->
  <script>
    document.querySelectorAll('.link-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        btn.style.transform = \`perspective(600px) rotateY(\${x * 14}deg) rotateX(\${-y * 8}deg) translateY(-5px) scale(1.01)\`;
        btn.style.boxShadow = \`\${-x * 12}px \${(-y * 10) + 22}px 40px rgba(0,0,0,0.5), 0 8px 20px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)\`;
        btn.style.borderColor = 'rgba(255,255,255,0.18)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
        btn.style.boxShadow = '';
        btn.style.borderColor = '';
      });
    });
  </script>
</body>
</html>`;

// ── 파일 저장 ────────────────────────────────────────────────────────────────
const outDir = join(__dirname, '..', 'out');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'index.html'), html, 'utf8');

console.log('✅ Built: out/index.html');
console.log(`   profile: ${profile.name}`);
console.log(`   links: ${links.filter((l) => l.enabled !== false).length}개`);
