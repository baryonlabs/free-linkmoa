#!/bin/bash
# Claude Desktop → LinkFlow Vercel MCP 연결 스크립트
# 실행 후 Claude Desktop 재시작 필요
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}▶ $1${NC}"; }
info() { echo -e "${CYAN}ℹ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
MCP_DIR="$ROOT_DIR/linkflow/apps/mcp-server"

# ── Vercel URL 설정 ──────────────────────────────────────────────────────────
LINKFLOW_URL="${LINKFLOW_URL:-https://free-linkmoa.vercel.app}"
info "Vercel 앱: $LINKFLOW_URL"

# ── Claude Desktop config 경로 ───────────────────────────────────────────────
if [[ "$OSTYPE" == "darwin"* ]]; then
  CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
else
  CLAUDE_CONFIG="$HOME/.config/Claude/claude_desktop_config.json"
fi

# ── MCP 서버 빌드 ────────────────────────────────────────────────────────────
log "MCP 서버 빌드 중..."
cd "$MCP_DIR"
npm install --silent 2>/dev/null || true
npx tsc --noEmit 2>/dev/null && npx tsc 2>/dev/null || warn "TypeScript 빌드 스킵"

MCP_DIST="$MCP_DIR/dist/index.js"
if [ -f "$MCP_DIST" ]; then
  MCP_CMD="node"
  MCP_ARGS="[\"$MCP_DIST\"]"
else
  MCP_CMD="npx"
  MCP_ARGS="[\"tsx\", \"$MCP_DIR/src/index.ts\"]"
fi

# ── 로그인 및 토큰 발급 ──────────────────────────────────────────────────────
echo ""
log "Vercel 앱 로그인..."
echo "  $LINKFLOW_URL 계정 정보를 입력하세요:"
echo ""
read -p "이메일 또는 아이디: " EMAIL
read -s -p "비밀번호: " PASSWORD
echo ""

TOKEN=$(curl -sf -X POST "$LINKFLOW_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"emailOrUsername\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['token'])" 2>/dev/null) \
  || { warn "로그인 실패. 이메일/비밀번호를 확인하세요."; exit 1; }

log "로그인 성공! 토큰 발급됨"

# ── Claude Desktop 설정 업데이트 ─────────────────────────────────────────────
log "Claude Desktop 설정 업데이트..."
mkdir -p "$(dirname "$CLAUDE_CONFIG")"

EXISTING=$([ -f "$CLAUDE_CONFIG" ] && cat "$CLAUDE_CONFIG" || echo '{}')

NEW_CONFIG=$(node -e "
const cfg = $EXISTING;
if (!cfg.mcpServers) cfg.mcpServers = {};
cfg.mcpServers['free-linkmoa'] = {
  command: '$MCP_CMD',
  args: $MCP_ARGS,
  env: {
    LINKFLOW_URL: '$LINKFLOW_URL',
    LINKFLOW_TOKEN: '$TOKEN'
  }
};
console.log(JSON.stringify(cfg, null, 2));
")

echo "$NEW_CONFIG" > "$CLAUDE_CONFIG"

# ── 완료 ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ MCP 설정 완료!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "다음 단계:"
echo "  1. Claude Desktop 완전히 종료 후 재시작"
echo "  2. 새 대화에서 'free-linkmoa 링크 목록 보여줘' 확인"
echo ""
echo "사용 예시:"
echo "  - '내 링크 목록 보여줘'"
echo "  - 'YouTube 링크 추가해줘: https://youtube.com/@...'"
echo "  - '링크 3개 한번에 추가해줘: [GitHub, LinkedIn, 블로그]'"
echo "  - '프로필 소개글을 바꿔줘'"
echo "  - '링크 순서 바꿔줘'"
echo ""
