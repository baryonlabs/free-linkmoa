# Claude Code로 링크모아 만들기 — 실습 워크플로우

> 이 문서는 `free-linkmoa` 프로젝트를 Claude Code(AI)로 구축하는 과정을 단계별로 설명합니다.
> 인프런 챌린지 **"앱 커팅"시대! 나를 위한 앱 만들고 공유하기** 실습 자료

---

## AI-Native 개발이란?

코드를 직접 쓰는 대신, **자연어로 Claude에게 요청**하면 Claude가 파일을 읽고, 수정하고, 배포까지 처리합니다.

```
[나]  "GitHub 링크 추가해줘"
  ↓
[Claude]  config.yml 읽기 → 수정 → git commit → git push
  ↓
[GitHub Actions]  자동 빌드 → GitHub Pages 배포 (약 1분)
```

---

## 실습 1: GitHub Pages 링크모아 만들기

### 핵심 파일: `gh-pages/config.yml`

```yaml
profile:
  name: "내 이름"
  bio: "내 소개글"
  avatar: "https://github.com/MY_USERNAME.png"

theme:
  background: "#0a0f1e"   # 배경색
  accent: "#3b82f6"       # 강조색 (버튼 테두리)

links:
  - title: "GitHub"
    url: "https://github.com/MY_USERNAME"
    icon: "github"
    thumbnail: "https://github.com/MY_USERNAME.png"  # 선택: 썸네일 이미지
    enabled: true
```

### 사용한 프롬프트 → 결과

| 프롬프트 | Claude가 한 일 |
|---------|---------------|
| `"바리온랩스 링크모아 만들어줘"` | config.yml 전체 재작성 + commit + push |
| `"인프런 URL 바꿔줘 https://..."` | URL 한 줄 교체 + commit + push |
| `"챌린지 링크 추가해줘 https://..."` | 새 링크 블록 추가 + commit + push |
| `"3D 효과 넣고 썸네일 추가해줘"` | build.mjs 전체 재설계 + CSS/JS 추가 |

### 지원 아이콘

| 이름 | 이모지 | 이름 | 이모지 |
|------|--------|------|--------|
| `github` | 🐙 | `youtube` | ▶️ |
| `linkedin` | 💼 | `instagram` | 📸 |
| `carrot` | 🥕 | `huggingface` | 🤗 |
| `inflearn` | 🎓 | `home` | 🏠 |
| `email` | 📧 | `link` | 🔗 |

---

## 실습 2: Vercel + Turso 풀스택 링크모아

### 두 가지 편집 방법

**방법 A — content.yml 편집 (GitHub Pages 방식과 동일)**

```
linkflow/content.yml 수정 → git push → GitHub Actions → Vercel API 호출 → DB 반영
```

**방법 B — API 직접 호출 (linkflow skill)**

```bash
bash ~/.claude/skills/linkflow/scripts/linkflow.sh add-link "제목" "URL" "설명"
```

### content.yml 구조

```yaml
profile:
  title: "이름"
  bio: "소개글"
  avatar_url: "https://..."

links:
  - title: "링크 제목"
    url: "https://..."
    type: link          # link | youtube | spotify | social
    description: "설명"
    enabled: true
```

---

## 핵심 학습 포인트

### 1. 파일 기반 CMS 패턴
YAML 파일 하나가 전체 사이트의 콘텐츠를 제어합니다.
→ 코드 없이 콘텐츠만 수정해서 배포 가능

### 2. GitHub Actions 자동화
```yaml
on:
  push:
    branches: [main]
    paths:
      - 'gh-pages/config.yml'   # 이 파일이 바뀌면 자동 빌드
```
→ `git push` 하나로 모든 배포 완료

### 3. 3D UI 핵심 코드

```javascript
// 마우스 위치를 -0.5 ~ 0.5로 정규화
const x = (e.clientX - rect.left) / rect.width - 0.5;
const y = (e.clientY - rect.top) / rect.height - 0.5;

// perspective로 3D 공간 만들고 회전 적용
btn.style.transform = `
  perspective(600px)
  rotateY(${x * 14}deg)
  rotateX(${-y * 8}deg)
  translateY(-5px)
`;
```

---

## 실습 과제

1. **내 프로필로 교체**: `config.yml`에서 이름, 소개, 아바타 변경
2. **링크 추가**: Claude에게 `"링크 추가해줘 https://..."` 요청
3. **테마 변경**: `"배경색을 보라색으로 바꿔줘"` 요청
4. **썸네일 등록**: `thumbnail: "https://..."` 필드 추가

---

## 관련 링크

- [GitHub Pages 라이브](https://baryonlabs.github.io/free-linkmoa/)
- [Vercel 앱 라이브](https://free-linkmoa.vercel.app)
- [소스코드](https://github.com/baryonlabs/free-linkmoa)
- [인프런 챌린지](https://www.inflearn.com/challenge/quot%EC%95%B1-%EC%BB%A4%ED%8C%85quot%EC%8B%9C%EB%8C%80-%EB%82%98%EB%A5%BC-%EC%9C%84%ED%95%9C?cid=341120)
