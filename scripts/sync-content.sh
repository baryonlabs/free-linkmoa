#!/bin/bash
# content.yml → Vercel 앱 API 동기화 스크립트
# 사용: ./scripts/sync-content.sh [content.yml 경로]
#
# 환경변수:
#   LINKFLOW_URL      - Vercel 앱 URL (기본: https://free-linkmoa.vercel.app)
#   LINKFLOW_EMAIL    - 로그인 이메일/사용자명
#   LINKFLOW_PASSWORD - 로그인 비밀번호
#   LINKFLOW_TOKEN    - (선택) 이미 있으면 로그인 생략

set -e

CONTENT_FILE="${1:-linkflow/content.yml}"
API_URL="${LINKFLOW_URL:-https://free-linkmoa.vercel.app}"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}▶ $1${NC}"; }
info() { echo -e "${CYAN}  $1${NC}"; }
err()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

# ── 파일 확인 ──────────────────────────────────────────────────────────────
[ -f "$CONTENT_FILE" ] || err "파일 없음: $CONTENT_FILE"
log "콘텐츠 파일: $CONTENT_FILE"

# ── Python3 + PyYAML 확인 ──────────────────────────────────────────────────
if ! python3 -c "import yaml" 2>/dev/null; then
  log "PyYAML 설치 중..."
  pip3 install pyyaml -q
fi

# ── 토큰 획득 ──────────────────────────────────────────────────────────────
if [ -z "$LINKFLOW_TOKEN" ]; then
  [ -z "$LINKFLOW_EMAIL" ]    && err "LINKFLOW_EMAIL 환경변수가 필요합니다"
  [ -z "$LINKFLOW_PASSWORD" ] && err "LINKFLOW_PASSWORD 환경변수가 필요합니다"

  log "로그인 중..."
  LOGIN_RESP=$(curl -sf -X POST "${API_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"emailOrUsername\":\"${LINKFLOW_EMAIL}\",\"password\":\"${LINKFLOW_PASSWORD}\"}")

  LINKFLOW_TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null) \
    || err "로그인 실패: $LOGIN_RESP"
  info "로그인 성공"
fi

AUTH_HEADER="Authorization: Bearer ${LINKFLOW_TOKEN}"

# ── YAML 파싱 후 API 호출 ──────────────────────────────────────────────────
python3 << PYEOF
import yaml, json, urllib.request, urllib.error, sys, os

url = "${API_URL}"
token = "${LINKFLOW_TOKEN}"
headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}

def api(method, path, data=None):
    req = urllib.request.Request(
        f"{url}{path}",
        data=json.dumps(data).encode() if data else None,
        headers=headers,
        method=method
    )
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  ❌ {method} {path} → {e.code}: {body}", file=sys.stderr)
        return None

with open("${CONTENT_FILE}") as f:
    content = yaml.safe_load(f)

# ── 프로필 동기화 ────────────────────────────────────────────────────────
profile = content.get("profile", {})
if profile:
    print(f"▶ 프로필 동기화: {profile.get('title','')}")
    result = api("PATCH", "/api/profile", profile)
    if result:
        print(f"  ✅ 프로필 업데이트 완료")

# ── 링크 동기화 ──────────────────────────────────────────────────────────
links_in_yml = content.get("links", [])
if not links_in_yml:
    print("  (링크 없음, 건너뜀)")
    sys.exit(0)

print(f"▶ 링크 동기화 ({len(links_in_yml)}개)")

# 기존 링크 조회
existing = api("GET", "/api/links") or []
existing_by_url = {l["url"]: l for l in existing}
existing_by_title = {l["title"]: l for l in existing}

new_ids = []
for i, link in enumerate(links_in_yml):
    title = link.get("title", "")
    link_url = link.get("url", "")

    # URL 또는 제목으로 기존 링크 매칭
    matched = existing_by_url.get(link_url) or existing_by_title.get(title)

    payload = {
        "title": title,
        "url": link_url,
        "type": link.get("type", "link"),
        "description": link.get("description", ""),
        "enabled": link.get("enabled", True),
        "position": i,
    }

    if matched:
        result = api("PATCH", f"/api/links/{matched['id']}", payload)
        if result:
            print(f"  ✅ 수정: {title}")
            new_ids.append(matched["id"])
    else:
        result = api("POST", "/api/links", payload)
        if result:
            print(f"  ✅ 추가: {title}")
            new_ids.append(result["id"])

# content.yml에 없는 기존 링크는 비활성화 (삭제 아님)
for ex in existing:
    if ex["id"] not in new_ids and ex.get("enabled"):
        api("PATCH", f"/api/links/{ex['id']}", {"enabled": False})
        print(f"  ⏸️  비활성화: {ex['title']} (content.yml에 없음)")

print(f"\n✅ 동기화 완료 → {url}/dashboard")
PYEOF
