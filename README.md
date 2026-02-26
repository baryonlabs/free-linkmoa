# Free Linkmoa 🔗

> AI-Native 링크 관리 서비스 — 다양한 배포 방식 실습

인스타, 유튜브, GitHub 등 내 링크를 한 곳에 모아서 관리하는 서비스를
**Claude Code(AI)로 직접 편집**하고 다양한 방법으로 배포해봅니다.

```
사용자: "GitHub 링크 추가해줘"  →  Claude가 직접 API 호출 or config.yml 수정 후 배포
```

---

## 폴더 구조

```
free-linkmoa/
│
├── 📁 gh-pages/               # 실습 0: GitHub Pages 정적 사이트
│   ├── config.yml             #   ✏️ 여기만 수정하면 끝 (프로필, 링크, 테마)
│   └── build.mjs              #   YAML → HTML 빌드 스크립트
│
├── 📁 linkflow/               # 실습 1: Vercel + Turso 풀스택 앱
│   └── apps/web/              #   Next.js 앱 (API, 대시보드, 공개 프로필)
│
├── 📁 practices/              # 향후 실습 공간
│   ├── 02-fly-io/             #   실습 2: Fly.io 컨테이너 배포 (예정)
│   ├── 03-cloudflare-pages/   #   실습 3: Cloudflare Pages + D1 (예정)
│   └── 04-docker-compose/     #   실습 4: 로컬 Docker 풀스택 (예정)
│
├── 📁 scripts/                # 공용 설정 스크립트
│   ├── turso-setup.sh         #   Turso DB 생성 + 스키마 마이그레이션
│   ├── mcp-setup.sh           #   Claude Desktop MCP 서버 연결
│   └── deploy.sh              #   배포 헬퍼
│
├── vercel.json                # Vercel 배포 설정 (실습 1)
└── README.md
```

---

## 실습 목록

| # | 방식 | 폴더 | 배포 URL | 상태 |
|---|------|------|----------|------|
| 0 | GitHub Pages (정적) | `gh-pages/` | [baryonlabs.github.io/free-linkmoa](https://baryonlabs.github.io/free-linkmoa/) | ✅ 완료 |
| 1 | Vercel + Turso | `linkflow/` | [free-linkmoa.vercel.app](https://free-linkmoa.vercel.app) | ✅ 완료 |
| 2 | Fly.io | `practices/02-fly-io/` | - | 🔜 예정 |
| 3 | Cloudflare Pages + D1 | `practices/03-cloudflare-pages/` | - | 🔜 예정 |
| 4 | Docker Compose | `practices/04-docker-compose/` | - | 🔜 예정 |

---

## AI-Native 사용법 (linkflow skill)

Claude Code에서 자연어로 직접 링크/프로필을 편집합니다.

### GitHub Pages 수정 (정적 사이트)

```
"소개글을 '안녕하세요'로 바꿔줘"
"GitHub 링크 추가해줘"
"배경색 보라색으로 바꿔줘"
```
→ Claude가 `gh-pages/config.yml` 수정 → git push → 자동 배포 (약 1분)

### Vercel 앱 수정 (풀스택)

```
"유튜브 링크 추가해줘"
"프로필 이름 바꿔줘"
"다크 테마로 변경해줘"
```
→ Claude가 `linkflow.sh` 스크립트로 API 직접 호출

### 처음 설정

```bash
# Vercel 앱 로그인 (처음 한 번만)
bash ~/.claude/skills/linkflow/scripts/linkflow.sh login

# 상태 확인
bash ~/.claude/skills/linkflow/scripts/linkflow.sh status
```

---

## 실습 0: GitHub Pages 시작하기

```bash
# 1. config.yml 수정 (이름, 소개, 링크, 테마 색상)
code gh-pages/config.yml

# 2. 로컬에서 미리보기
cd gh-pages && npm install && node build.mjs
open ../out/index.html

# 3. 배포 (push하면 자동)
git add gh-pages/config.yml
git commit -m "링크 업데이트"
git push origin main
```

**`config.yml` 편집 포인트:**
```yaml
profile:
  name: "내 이름"
  bio: "내 소개"
  avatar: "https://github.com/MY_USERNAME.png"

theme:
  background: "#0f172a"   # 배경색
  accent: "#6366f1"       # 강조색

links:
  - title: "GitHub"
    url: "https://github.com/MY_USERNAME"
    icon: "github"
    enabled: true
```

---

## 실습 1: Vercel + Turso 시작하기

```bash
# 1. Turso DB 생성 + 스키마 적용
bash scripts/turso-setup.sh

# 2. Vercel 환경변수 설정 후 배포
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
vercel env add JWT_SECRET
vercel deploy --prod --cwd linkflow/apps/web
```

자세한 내용: [DEPLOY.md](./DEPLOY.md)

---

## 새 실습 추가하는 법

```bash
# 예: 실습 5 추가
mkdir -p practices/05-my-practice
cp practices/02-fly-io/.gitkeep practices/05-my-practice/ 2>/dev/null || true

# 이 README의 실습 목록 테이블에 추가
```

각 실습 폴더에는:
- `README.md` — 해당 실습 설명
- `vercel.json` / `fly.toml` / `docker-compose.yml` 등 배포 설정
- `src/` 또는 앱 소스 (기존 `linkflow/apps/web` 복사 또는 심볼릭 링크)

---

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, TypeScript
- **DB**: Turso (LibSQL / SQLite edge)
- **Auth**: JWT + bcryptjs
- **AI 편집**: Claude Code + linkflow skill

---

Built with ❤️ by [Baryon Labs](https://github.com/baryonlabs) — Public Build · Open Source · Vibe Coding
