#!/bin/bash
# Vercel + Turso 설정 스크립트 (실습 1)
# 실행: ./scripts/turso-setup.sh
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}▶ $1${NC}"; }
info() { echo -e "${CYAN}ℹ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

DB_NAME="${1:-free-linkmoa}"

# ─────────────────────────────────────────
# 1. Turso CLI 설치 확인
# ─────────────────────────────────────────
if ! command -v turso &>/dev/null; then
  warn "turso CLI가 없습니다. 설치 중..."
  curl -sSfL https://get.tur.so/install.sh | bash
  export PATH="$HOME/.turso:$PATH"
fi

# ─────────────────────────────────────────
# 2. 로그인
# ─────────────────────────────────────────
log "Turso 로그인 확인..."
turso auth login 2>/dev/null || true

# ─────────────────────────────────────────
# 3. DB 생성
# ─────────────────────────────────────────
log "Turso DB 생성: $DB_NAME"
turso db create "$DB_NAME" --if-not-exists 2>/dev/null || turso db create "$DB_NAME"

# ─────────────────────────────────────────
# 4. 스키마 마이그레이션
# ─────────────────────────────────────────
log "스키마 마이그레이션 실행..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/../linkflow/apps/web/src/lib/schema.sql"

# schema.sql이 없으면 db.ts에서 추출
if [ ! -f "$SCHEMA_FILE" ]; then
  cat > /tmp/linkflow-schema.sql << 'SCHEMA'
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avatar_url TEXT, title TEXT, bio TEXT, custom_logo_url TEXT,
  social_links TEXT DEFAULT '{}', theme_id TEXT,
  seo_title TEXT, seo_description TEXT, custom_css TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, url TEXT NOT NULL DEFAULT '',
  description TEXT, icon_url TEXT, thumbnail_url TEXT,
  type TEXT DEFAULT 'standard', position INTEGER DEFAULT 0, enabled INTEGER DEFAULT 1,
  scheduled_from DATETIME, scheduled_to DATETIME,
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, custom_css TEXT,
  animation_type TEXT DEFAULT 'none', highlight INTEGER DEFAULT 0, click_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS themes (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, type TEXT DEFAULT 'custom', config TEXT NOT NULL, preview_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  link_id TEXT REFERENCES links(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, referrer TEXT, user_agent TEXT,
  country TEXT, city TEXT, device_type TEXT, browser TEXT, os TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL, name TEXT, metadata TEXT DEFAULT '{}',
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, email)
);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_position ON links(user_id, position);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
SCHEMA
  SCHEMA_FILE="/tmp/linkflow-schema.sql"
fi

turso db shell "$DB_NAME" < "$SCHEMA_FILE"
log "스키마 마이그레이션 완료!"

# ─────────────────────────────────────────
# 5. 연결 정보 출력
# ─────────────────────────────────────────
DB_URL=$(turso db show "$DB_NAME" --url)
DB_TOKEN=$(turso db tokens create "$DB_NAME")

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Turso DB 준비 완료!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Vercel 환경변수로 설정하세요:"
echo ""
echo -e "  ${CYAN}TURSO_DATABASE_URL${NC}=${DB_URL}"
echo -e "  ${CYAN}TURSO_AUTH_TOKEN${NC}=${DB_TOKEN}"
echo ""
echo "Vercel CLI로 설정:"
echo "  vercel env add TURSO_DATABASE_URL"
echo "  vercel env add TURSO_AUTH_TOKEN"
echo ""
echo "로컬 개발용 .env.local:"
echo "  echo \"TURSO_DATABASE_URL=${DB_URL}\" >> linkflow/apps/web/.env.local"
echo "  echo \"TURSO_AUTH_TOKEN=${DB_TOKEN}\" >> linkflow/apps/web/.env.local"
echo ""
echo "다음 단계:"
echo "  1. vercel --cwd linkflow deploy"
echo "  2. 배포된 URL에서 회원가입"
echo "  3. ./scripts/mcp-setup.sh 으로 MCP 연결"
