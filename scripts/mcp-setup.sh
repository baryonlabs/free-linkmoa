#!/bin/bash
# Claude Desktop MCP 연결 설정 스크립트
# 실행 후 Claude Desktop 재시작 필요
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}▶ $1${NC}"; }
info() { echo -e "${CYAN}ℹ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="$ROOT_DIR/linkflow"
MCP_DIR="$APP_DIR/apps/mcp-server"
DB_PATH="$APP_DIR/apps/web/data/linkflow.db"

# Claude Desktop config 경로
if [[ "$OSTYPE" == "darwin"* ]]; then
  CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
else
  CLAUDE_CONFIG="$HOME/.config/Claude/claude_desktop_config.json"
fi

# ─────────────────────────────────────────
# 1. MCP 서버 빌드
# ─────────────────────────────────────────
log "MCP 서버 빌드 중..."
cd "$APP_DIR"
npm run build:mcp 2>/dev/null || (cd apps/mcp-server && npx tsc)

MCP_DIST="$MCP_DIR/dist/index.js"
if [ ! -f "$MCP_DIST" ]; then
  warn "빌드 실패. tsx로 직접 실행 모드 사용"
  MCP_CMD="npx"
  MCP_ARGS='["tsx", "'"$MCP_DIR/src/index.ts"'"]'
else
  MCP_CMD="node"
  MCP_ARGS='["'"$MCP_DIST"'"]'
fi

# ─────────────────────────────────────────
# 2. 토큰 발급 (로그인 필요)
# ─────────────────────────────────────────
echo ""
info "로컬 서버가 실행 중이어야 합니다 (npm run dev)"
echo ""
echo "MCP 연결에 필요한 JWT 토큰을 발급합니다."
echo "서버에 등록된 계정의 이메일/아이디와 비밀번호를 입력하세요:"
echo ""

read -p "이메일 또는 아이디: " EMAIL
read -s -p "비밀번호: " PASSWORD
echo ""

TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"emailOrUsername\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" \
  | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); try { const j=JSON.parse(d); if(j.token) { console.log(j.token) } else { process.stderr.write('로그인 실패: ' + JSON.stringify(j) + '\n'); process.exit(1); } } catch(e) { process.stderr.write('서버 응답 오류\n'); process.exit(1); }")

if [ -z "$TOKEN" ]; then
  warn "토큰 발급 실패. 서버가 실행 중인지 확인하세요."
  exit 1
fi

log "토큰 발급 성공!"

# ─────────────────────────────────────────
# 3. Claude Desktop 설정 업데이트
# ─────────────────────────────────────────
log "Claude Desktop 설정 업데이트 중..."

# config 디렉토리 생성
mkdir -p "$(dirname "$CLAUDE_CONFIG")"

# 기존 설정 읽기 or 초기화
if [ -f "$CLAUDE_CONFIG" ]; then
  EXISTING=$(cat "$CLAUDE_CONFIG")
else
  EXISTING='{}'
fi

# mcpServers 업데이트 (node -e로 JSON 병합)
NEW_CONFIG=$(node -e "
const existing = $EXISTING;
if (!existing.mcpServers) existing.mcpServers = {};
existing.mcpServers['free-linkmoa'] = {
  command: '$MCP_CMD',
  args: $MCP_ARGS,
  env: {
    LINKFLOW_TOKEN: '$TOKEN',
    DATABASE_PATH: '$DB_PATH'
  }
};
console.log(JSON.stringify(existing, null, 2));
")

echo "$NEW_CONFIG" > "$CLAUDE_CONFIG"

# ─────────────────────────────────────────
# 완료
# ─────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ MCP 설정 완료!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "다음 단계:"
echo "  1. Claude Desktop 완전히 종료 후 재시작"
echo "  2. 새 대화에서 'free-linkmoa MCP 연결됐어?' 확인"
echo ""
echo "Claude에게 말할 수 있는 것들:"
echo "  - '내 링크 목록 보여줘'"
echo "  - '새 링크 추가해줘: 제목=블로그, URL=https://...'"
echo "  - '링크 순서 바꿔줘'"
echo "  - '프로필 소개글 업데이트해줘'"
echo "  - '지난 7일 애널리틱스 요약해줘'"
echo ""
