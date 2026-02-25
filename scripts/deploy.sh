#!/bin/bash
# free-linkmoa 배포 스크립트
# 사용법: ./scripts/deploy.sh [fly|docker|local]
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}▶ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="$ROOT_DIR/linkflow"

MODE="${1:-fly}"

# ─────────────────────────────────────────
# Fly.io 배포 (권장 - 무료)
# ─────────────────────────────────────────
deploy_fly() {
  log "Fly.io 배포 시작..."

  # flyctl 설치 확인
  if ! command -v fly &> /dev/null; then
    warn "flyctl이 없습니다. 설치 중..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
      brew install flyctl 2>/dev/null || curl -L https://fly.io/install.sh | sh
    else
      curl -L https://fly.io/install.sh | sh
    fi
  fi

  cd "$APP_DIR"

  # 첫 배포 여부 확인
  if ! fly status &>/dev/null; then
    log "최초 배포 - 앱 생성 중..."
    fly launch --no-deploy --name free-linkmoa --region nrt

    # 환경 변수 설정
    warn "JWT_SECRET 설정 중..."
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    fly secrets set JWT_SECRET="$JWT_SECRET"

    # 볼륨 생성
    log "영구 스토리지 볼륨 생성..."
    fly volumes create linkflow_data --size 1 --region nrt
  fi

  log "빌드 및 배포 중..."
  fly deploy --dockerfile docker/Dockerfile

  APP_URL=$(fly status --json 2>/dev/null | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const j=JSON.parse(d); console.log('https://'+j.Hostname)" 2>/dev/null || echo "https://free-linkmoa.fly.dev")

  echo ""
  echo -e "${GREEN}✅ 배포 완료!${NC}"
  echo -e "   URL: ${GREEN}$APP_URL${NC}"
  echo ""
  echo "다음 단계:"
  echo "  1. $APP_URL 접속 → 회원가입"
  echo "  2. ./scripts/mcp-setup.sh 실행 → Claude MCP 연결"
}

# ─────────────────────────────────────────
# Docker Compose 로컬 배포
# ─────────────────────────────────────────
deploy_docker() {
  log "Docker Compose로 로컬 실행..."

  if ! command -v docker &> /dev/null; then
    error "Docker가 설치되어 있지 않습니다."
  fi

  cd "$APP_DIR"

  # .env 파일 생성
  if [ ! -f .env ]; then
    cp .env.example .env
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    sed -i.bak "s/your-super-secret-jwt-key-change-in-production/$JWT_SECRET/" .env
    rm -f .env.bak
    log ".env 파일 생성됨"
  fi

  docker compose -f docker/docker-compose.yml up -d --build

  echo ""
  echo -e "${GREEN}✅ 실행 완료!${NC}"
  echo -e "   URL: ${GREEN}http://localhost:3000${NC}"
}

# ─────────────────────────────────────────
# 로컬 개발 서버
# ─────────────────────────────────────────
deploy_local() {
  log "로컬 개발 서버 시작..."

  cd "$APP_DIR"

  if [ ! -f apps/web/.env.local ]; then
    cp .env.example apps/web/.env.local
    log ".env.local 생성됨 - 필요시 수정하세요"
  fi

  if [ ! -d node_modules ]; then
    log "패키지 설치 중..."
    npm install
  fi

  log "서버 시작: http://localhost:3000"
  npm run dev
}

# ─────────────────────────────────────────
# 실행
# ─────────────────────────────────────────
case "$MODE" in
  fly)     deploy_fly ;;
  docker)  deploy_docker ;;
  local)   deploy_local ;;
  *)
    echo "사용법: $0 [fly|docker|local]"
    echo ""
    echo "  fly    - Fly.io 무료 배포 (권장)"
    echo "  docker - Docker Compose 로컬 실행"
    echo "  local  - npm dev 로컬 개발"
    exit 1
    ;;
esac
