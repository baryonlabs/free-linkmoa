# 배포 & 운영 가이드

> 배포 5분 · AI로 수정 · 유지비용 0원

---

## 빠른 시작

```bash
# 1. 의존성 설치
cd linkflow && npm install

# 2. 로컬 실행
npm run dev          # 웹앱 → localhost:3000
npm run dev:mcp      # MCP 서버 (별도 터미널)

# 3. Fly.io 무료 배포
../scripts/deploy.sh fly

# 4. Claude MCP 연결
../scripts/mcp-setup.sh
```

---

## 1. 무료 배포 (Fly.io)

### 왜 Fly.io인가?

| 항목 | 내용 |
|------|------|
| VM | shared-cpu-1x × 3대 무료 |
| 메모리 | 256MB |
| 스토리지 | 3GB 영구 볼륨 (SQLite 저장) |
| 트래픽 | 160GB/월 무료 |
| 비용 | **0원** (개인 프로젝트 범위) |
| 자동 슬립 | 트래픽 없으면 슬립 → 비용 절감 |

### 첫 배포

```bash
# flyctl 설치 (Mac)
brew install flyctl

# 로그인 (GitHub 계정 사용 가능)
fly auth login

# 배포 (linkflow/ 디렉토리에서)
cd linkflow
fly launch --name free-linkmoa --region nrt   # 첫 실행만

# 이후 업데이트
fly deploy
```

### 자동 배포 스크립트

```bash
# 처음부터 끝까지 자동
./scripts/deploy.sh fly
```

### 환경 변수 설정

```bash
# JWT 시크릿 (필수)
fly secrets set JWT_SECRET="$(openssl rand -hex 64)"

# 확인
fly secrets list
```

### 배포 후 확인

```bash
fly status          # 앱 상태
fly logs            # 실시간 로그
fly ssh console     # SSH 접속
```

---

## 2. Claude MCP로 AI 수정

앱을 배포한 뒤 Claude Desktop에 MCP를 연결하면
**자연어로 링크 관리**가 가능합니다.

### 자동 설정

```bash
# 로컬 서버 실행 후
npm run dev &

# MCP 설정 (토큰 자동 발급 + Claude 설정)
./scripts/mcp-setup.sh
```

### 수동 설정

`~/Library/Application Support/Claude/claude_desktop_config.json`에 추가:

```json
{
  "mcpServers": {
    "free-linkmoa": {
      "command": "node",
      "args": ["/절대경로/linkflow/apps/mcp-server/dist/index.js"],
      "env": {
        "LINKFLOW_TOKEN": "로그인-후-발급받은-JWT",
        "DATABASE_PATH": "/절대경로/linkflow/apps/web/data/linkflow.db"
      }
    }
  }
}
```

### Claude에게 할 수 있는 것들

```
"내 링크 목록 보여줘"
"새 링크 추가해줘 - 제목: 블로그, URL: https://myblog.com"
"인스타그램 링크를 맨 위로 올려줘"
"프로필 소개글을 '개발자 & 크리에이터'로 바꿔줘"
"지난 30일 클릭 통계 요약해줘"
"Dark Mode 테마로 바꿔줘"
"구독자 목록 CSV로 내보내줘"
```

### MCP 사용 가능한 도구 목록

| 카테고리 | 도구 |
|---------|------|
| 링크 | 조회, 생성, 수정, 삭제, 순서 변경 |
| 프로필 | 조회, 업데이트 |
| 테마 | 목록, 적용, 생성 |
| 애널리틱스 | 요약, 링크별 통계 |
| 플러그인 | 목록, 설치, 제거 |
| 구독자 | 목록, CSV 내보내기 |

---

## 3. 스크립트 수정

MCP 없이 CLI로 빠르게 수정하는 방법입니다.

### 링크 관리 (REST API)

```bash
# 토큰 발급
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"내이메일","password":"비밀번호"}' \
  | jq -r '.token')

# 링크 목록
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/links | jq

# 새 링크 추가
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"블로그","url":"https://myblog.com"}' \
  http://localhost:3000/api/links

# 링크 수정 (ID 필요)
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"새 제목"}' \
  http://localhost:3000/api/links/링크ID

# 링크 삭제
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/links/링크ID
```

### 코드 수정 후 재배포

```bash
# 수정 → 테스트 → 배포 한 번에
git add -A && git commit -m "fix: 수정 내용" && \
cd linkflow && fly deploy
```

### Fly.io 원격 SQLite 접근

```bash
# 프로덕션 DB 직접 쿼리 (주의해서 사용)
fly ssh console -C "node -e \"
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('/app/data/linkflow.db');
const links = db.prepare('SELECT title, url FROM links LIMIT 10').all();
console.table(links);
\""
```

---

## 4. 유지비용 0원 달성

### 아키텍처

```
[사용자 브라우저]
      ↓
[Fly.io 무료 VM] ← 트래픽 없으면 자동 슬립
      ↓
[SQLite 파일] ← Fly.io 영구 볼륨 (1GB 무료)
```

### 비용 분석

| 서비스 | 무료 한도 | 초과 시 비용 |
|-------|---------|------------|
| Fly.io VM | 3대 × 256MB | $0.0001/s |
| Fly.io 볼륨 | 3GB | $0.15/GB/월 |
| 대역폭 | 160GB/월 | $0.02/GB |
| 도메인 | fly.dev 서브도메인 무료 | 커스텀 도메인 $10/년 |

**개인 link-in-bio 페이지 = 월 0원**

### 비용이 발생하는 경우

- 월 방문자 10만+ (대역폭 초과)
- 파일 저장이 3GB 초과
- 고가용성이 필요해 상시 실행 설정 시

### 슬립 설정 확인

`fly.toml`에서 확인:
```toml
auto_stop_machines = "stop"  # 슬립 활성화
min_machines_running = 0     # 평시 0대 → 비용 0
```

---

## 5. 커스텀 도메인 연결 (선택)

```bash
# 도메인 연결
fly certs create yourdomain.com

# DNS 설정 (도메인 레지스트라에서)
# CNAME: @ → free-linkmoa.fly.dev
# 또는 A레코드: @ → fly.io IP

# SSL 자동 발급 확인
fly certs show yourdomain.com
```

---

## 6. 문제 해결

### 배포 실패

```bash
fly logs --tail          # 실시간 로그 확인
fly doctor               # 설정 검사
fly status               # VM 상태 확인
```

### DB 초기화 필요

```bash
fly ssh console -C "rm /app/data/linkflow.db"
fly machine restart
```

### MCP 연결 안 됨

```bash
# 토큰 재발급
./scripts/mcp-setup.sh

# Claude Desktop 완전 종료 후 재시작
# (Cmd+Q 또는 작업관리자에서 종료)
```

---

## 전체 흐름 요약

```
코드 수정
  → git commit & push
  → fly deploy (자동 빌드 & 배포)
  → 확인: fly logs

일상 운영
  → Claude에게 자연어로 요청 (MCP)
  → 또는 REST API 직접 호출
  → 대시보드 접속: https://free-linkmoa.fly.dev/dashboard
```

---

Built with ❤️ by [Baryon Labs](https://github.com/baryonlabs) · [Issues](https://github.com/baryonlabs/free-linkmoa/issues)
