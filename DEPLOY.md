# 배포 & 운영 가이드

> 배포 5분 · AI로 수정 · 유지비용 0원

---

## 어떤 방식으로 배포할까?

링크인바이오 특성상 **"수정이 얼마나 잦냐"** 에 따라 최적 방식이 다릅니다.

| | GitHub Pages | Vercel | Cloudflare Pages | Fly.io | Render |
|---|:---:|:---:|:---:|:---:|:---:|
| **비용** | 완전 무료 | 완전 무료 | 완전 무료 | 무료(크레딧) | 무료(제한) |
| **서버** | ❌ 없음 | 서버리스 | 서버리스/엣지 | 컨테이너 VM | 컨테이너 |
| **DB (SQLite)** | ❌ | ❌ | ❌ | ✅ 영구 볼륨 | ❌ |
| **외부 DB 필요** | ❌ | Turso/Neon | Turso/D1 | 필요없음 | Turso/Neon |
| **콜드 스타트** | 없음(정적) | ~수백ms | ~수십ms(엣지) | ~수초 | 슬립 후 ~30초 |
| **커스텀 도메인** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **자동 배포 (git push)** | ✅ Actions | ✅ | ✅ | ❌ 수동 | ✅ |
| **대시보드·Auth** | ❌ 별도 구현 | ✅ | ✅ | ✅ | ✅ |
| **신용카드** | 불필요 | 불필요 | 불필요 | 필요(본인확인) | 불필요 |
| **추천 용도** | 정적 프로필 | 동적 전체 | 빠른 동적 | 현재 코드 그대로 | 백업 옵션 |

---

## Option A — GitHub Pages (진짜 0원, 가장 단순)

> **핵심 아이디어**: 링크 데이터를 DB 대신 `links.yml` 파일에 저장
> → 파일 수정 → `git push` → GitHub Actions가 빌드 → Pages 배포

```
links.yml 수정 (Claude MCP 또는 직접 편집)
       ↓
  git push
       ↓
  GitHub Actions (빌드·렌더링)
       ↓
  GitHub Pages (정적 HTML 서빙)
```

### 언제 이 방식이 맞나?

- 링크가 하루에 한두 번 이하로 바뀜
- 대시보드 UI보단 파일 편집이 편함
- 실시간 클릭 애널리틱스가 굳이 필요 없음
- **신용카드 없이 진짜 공짜** 원함

### 구조 (기존 앱과 별개)

```yaml
# profile.yml
name: "홍길동"
bio: "개발자 & 크리에이터"
avatar: "https://..."

links:
  - title: "인스타그램"
    url: "https://instagram.com/..."
    icon: "instagram"
  - title: "블로그"
    url: "https://myblog.com"
    icon: "link"
  - title: "유튜브"
    url: "https://youtube.com/..."
    icon: "youtube"
```

### GitHub Actions 워크플로우

`.github/workflows/pages.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
    paths: ['profile.yml', 'links.yml', 'theme.yml']

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci && npm run build:static
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./out
      - uses: actions/deploy-pages@v4
```

### MCP로 수정하는 방법 (파일 방식)

```
Claude에게: "인스타그램 링크 추가해줘"
     ↓
MCP가 links.yml 파일 직접 수정
     ↓
git commit & push (자동)
     ↓
GitHub Actions 트리거 → Pages 배포
```

Claude Desktop 설정:
```json
{
  "mcpServers": {
    "free-linkmoa-pages": {
      "command": "node",
      "args": ["/path/to/linkflow/apps/mcp-server/dist/index.js"],
      "env": {
        "MODE": "file",
        "LINKS_FILE": "/path/to/free-linkmoa/links.yml",
        "REPO_PATH": "/path/to/free-linkmoa",
        "AUTO_COMMIT": "true"
      }
    }
  }
}
```

### 한계

- 실시간 클릭 수 집계 없음 (Google Analytics 스크립트로 보완 가능)
- 로그인/대시보드 UI 없음 → 파일 편집 또는 MCP만 사용
- 배포 반영까지 ~1분 소요 (Actions 실행 시간)

---

## Option B — Vercel + Turso (현재 코드 최소 수정)

> Next.js는 Vercel이 만들었기 때문에 궁합이 최고
> SQLite 대신 Turso(libSQL) 사용 → 영구 무료 클라우드 DB

```
git push → Vercel 자동 빌드·배포 (수십 초)
Turso DB → 전 세계 엣지 복제, 무료 티어 500 DBs / 9GB
```

### 무료 한도

| 서비스 | 무료 한도 |
|-------|---------|
| Vercel | 100GB 대역폭, Serverless 실행 |
| Turso | DB 500개, 용량 9GB, 월 10억 읽기 |

### 설정

```bash
# Turso CLI 설치
curl -sSfL https://get.tur.so/install.sh | bash

# DB 생성
turso db create free-linkmoa

# 연결 URL + 토큰 발급
turso db show free-linkmoa --url
turso db tokens create free-linkmoa

# Vercel 환경변수 설정
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
```

`lib/db.ts`를 `@libsql/client`로 교체:
```typescript
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
```

### MCP 연결 방법

Turso는 HTTP API를 지원하므로 원격 MCP도 가능:
```json
{
  "mcpServers": {
    "free-linkmoa": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "TURSO_DATABASE_URL": "libsql://...",
        "TURSO_AUTH_TOKEN": "...",
        "LINKFLOW_TOKEN": "..."
      }
    }
  }
}
```

---

## Option C — Cloudflare Pages + D1 (엣지, 가장 빠름)

> Cloudflare 글로벌 엣지 네트워크 + D1(SQLite 호환 DB)
> 한국 사용자 응답속도 최고

```
git push → Cloudflare Pages 자동 빌드
D1 Database → Cloudflare 엣지 SQLite, 무료 5GB
```

### 무료 한도

| 서비스 | 무료 한도 |
|-------|---------|
| Cloudflare Pages | 무제한 요청, 500 빌드/월 |
| D1 Database | 5GB 저장, 월 250만 읽기 |
| Workers | 10만 요청/일 |

### 설정

```bash
# Wrangler CLI 설치
npm install -g wrangler
wrangler login

# D1 DB 생성
wrangler d1 create free-linkmoa

# next.config.js → Edge runtime 설정 필요
```

> **주의**: Next.js Edge Runtime은 `node:sqlite` 미지원 → `@cloudflare/d1` 드라이버 필요

---

## Option D — Fly.io (현재 코드 그대로)

기존 설정 그대로 사용. SQLite 파일을 영구 볼륨에 저장.

```bash
brew install flyctl && fly auth login
cd linkflow
fly launch --name free-linkmoa --region nrt
fly secrets set JWT_SECRET="$(openssl rand -hex 64)"
fly volumes create linkflow_data --size 1 --region nrt
fly deploy
```

> **주의**: 신용카드 등록 필요 (청구 안 되지만 본인 확인 목적)
> 무료 allowance 안에서는 0원

---

## Option E — Render (신용카드 불필요, 백업 옵션)

```bash
# render.yaml 생성 후 GitHub 연동
services:
  - type: web
    name: free-linkmoa
    runtime: docker
    dockerfilePath: ./linkflow/docker/Dockerfile
    plan: free
    envVars:
      - key: JWT_SECRET
        generateValue: true
```

> **주의**: 무료 플랜은 15분 비활성 후 슬립, 재시작 ~30초
> 영구 디스크 없음 → SQLite 재시작마다 초기화 (Turso 연동 필요)

---

## 유사 프로젝트 비교

| 프로젝트 | 방식 | 특징 |
|---------|------|------|
| **Linktree** | SaaS | 유료, 비공개 |
| **Bento.me** | SaaS | 무료, 위젯형 |
| **bio.link** | SaaS | 무료, 단순 |
| **LinkStack** | 셀프호스팅 | PHP, Docker |
| **Lynx** | 셀프호스팅 | Go, 가볍다 |
| **Dub.co** | SaaS+오픈소스 | 단축URL+바이오 |
| **Milkdown/Notion** | 문서형 | 링크 정리 목적 |
| **free-linkmoa** | **오픈소스+MCP** | **AI 네이티브 수정** ← |

free-linkmoa가 차별화되는 점: **Claude MCP로 자연어 관리**

---

## 결론: 어떤 걸 선택할까?

```
"신용카드 없이 완전 무료 + 가끔 수정"
  → GitHub Pages (Option A)
     links.yml 수정 → git push → 자동 배포

"대시보드 UI + 자동 git push 배포 + 완전 무료"
  → Vercel + Turso (Option B)
     코드 약간 수정 필요 (node:sqlite → @libsql/client)

"현재 코드 그대로 + 전 세계 빠름"
  → Cloudflare Pages + D1 (Option C)
     엣지 런타임 설정 필요

"현재 코드 그대로 + 설정 최소"
  → Fly.io (Option D) ← 지금 fly.toml 있음
     신용카드 필요
```

---

## 2. Claude MCP로 AI 수정

앱을 배포한 뒤 Claude Desktop에 MCP를 연결하면
**자연어로 링크 관리**가 가능합니다.

### 자동 설정

```bash
npm run dev &
./scripts/mcp-setup.sh
```

### 수동 설정

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "free-linkmoa": {
      "command": "node",
      "args": ["/절대경로/linkflow/apps/mcp-server/dist/index.js"],
      "env": {
        "LINKFLOW_TOKEN": "JWT토큰",
        "DATABASE_PATH": "/절대경로/linkflow/apps/web/data/linkflow.db"
      }
    }
  }
}
```

### Claude에게 말할 수 있는 것들

```
"내 링크 목록 보여줘"
"새 링크 추가해줘 - 제목: 블로그, URL: https://myblog.com"
"인스타그램 링크를 맨 위로 올려줘"
"프로필 소개글을 '개발자 & 크리에이터'로 바꿔줘"
"지난 30일 클릭 통계 요약해줘"
"Dark Mode 테마로 바꿔줘"
"구독자 목록 CSV로 내보내줘"
```

### MCP 도구 목록

| 카테고리 | 도구 |
|---------|------|
| 링크 | 조회, 생성, 수정, 삭제, 순서 변경 |
| 프로필 | 조회, 업데이트 |
| 테마 | 목록, 적용, 생성 |
| 애널리틱스 | 요약, 링크별 통계 |
| 플러그인 | 목록, 설치, 제거 |
| 구독자 | 목록, CSV 내보내기 |

---

## 3. REST API로 직접 수정

```bash
# 토큰 발급
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"이메일","password":"비밀번호"}' \
  | jq -r '.token')

# 링크 목록
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/links | jq

# 새 링크 추가
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"블로그","url":"https://myblog.com"}' \
  http://localhost:3000/api/links

# 수정
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"새 제목"}' \
  http://localhost:3000/api/links/링크ID

# 삭제
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/links/링크ID
```

---

## 4. 문제 해결

```bash
# Fly.io 로그
fly logs --tail

# MCP 재연결
./scripts/mcp-setup.sh
# → Claude Desktop 재시작 필요

# DB 리셋 (Fly.io)
fly ssh console -C "rm /app/data/linkflow.db && exit"
fly machine restart
```

---

Built with ❤️ by [Baryon Labs](https://github.com/baryonlabs) · [Issues](https://github.com/baryonlabs/free-linkmoa/issues)
