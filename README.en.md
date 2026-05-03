<div align="center">
  <img src="https://github.com/Baryon-ai.png" width="80" height="80" style="border-radius:50%" alt="Baryon Labs">

  # Free Linkmoa

  AI-native link-in-bio builder with YAML editing, automatic deployment, and MCP control

  [![Deploy GitHub Pages](https://github.com/baryonlabs/free-linkmoa/actions/workflows/pages.yml/badge.svg)](https://github.com/baryonlabs/free-linkmoa/actions/workflows/pages.yml)
  [![Sync to Vercel](https://github.com/baryonlabs/free-linkmoa/actions/workflows/sync-content.yml/badge.svg)](https://github.com/baryonlabs/free-linkmoa/actions/workflows/sync-content.yml)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](linkflow/LICENSE)

  [한국어](./README.md) · [GitHub Pages Demo](https://baryonlabs.github.io/free-linkmoa/) · [Vercel Demo](https://free-linkmoa.vercel.app) · [Workflow Guide](./docs/workflow.md)
</div>

---

## What is Free Linkmoa?

Free Linkmoa is a public build project for making a personal link-in-bio page that can be edited by hand, through Claude Code, or through an MCP server.

It has two working tracks:

| Track | URL | Best for |
|------|-----|----------|
| **GitHub Pages** | [baryonlabs.github.io/free-linkmoa](https://baryonlabs.github.io/free-linkmoa/) | A static profile generated from `gh-pages/config.yml` |
| **Vercel + Turso** | [free-linkmoa.vercel.app](https://free-linkmoa.vercel.app) | A full-stack app with auth, dashboard, API, analytics, and SQLite Edge DB |

The core idea is simple:

```text
"Add this link to my profile"
        ↓
Claude Code edits YAML or calls the API
        ↓
GitHub Actions / Vercel deploy the update
        ↓
Your public link page is live
```

## Screenshots

| GitHub Pages | Vercel Profile | Vercel Dashboard |
|:---:|:---:|:---:|
| [![GitHub Pages](docs/images/github-pages.png)](https://baryonlabs.github.io/free-linkmoa/) | [![Vercel Profile](docs/images/vercel-profile-aiswai2.png)](https://free-linkmoa.vercel.app/aiswai2) | [![Vercel Dashboard](docs/images/vercel-dashboard.png)](https://free-linkmoa.vercel.app/dashboard) |
| Static page from YAML | Public profile page | Link management dashboard |

## Features

### YAML CMS

Edit one file to change the profile, links, icons, thumbnails, and theme. The GitHub Pages version is built from `gh-pages/config.yml`; the Vercel sync flow reads from `linkflow/content.yml`.

### Automatic deploys

Push to `main` and GitHub Actions builds the static page. The Vercel track can also sync YAML content into the Turso database through the provided workflow and scripts.

### AI-native editing

Use Claude Code to make natural-language changes like:

```text
"Change my bio to 'AI로 세상을 바꾸는 개발자'"
"Add my Instagram link: https://instagram.com/..."
"Disable the YouTube link"
"Make the background purple"
```

Claude updates the right file, commits the change, and lets the deployment pipeline publish it.

### Full-stack dashboard

The Vercel app includes registration, login, profile editing, link CRUD, drag-and-drop ordering, theme settings, subscriber export, analytics pages, and public profile routes.

### MCP server

The included MCP server connects Claude Desktop to the Vercel API, so you can manage links through conversation instead of clicking through a dashboard.

### 3D link cards

The static site includes mouse-tracked card tilt, thumbnails or emoji fallbacks, and a focused profile layout for creator links.

## Architecture

```mermaid
flowchart LR
  User[User] --> Pages[GitHub Pages<br/>Static link page]
  User --> Vercel[Vercel<br/>Next.js app]

  Editor[Author / Claude Code] --> YAML[config.yml / content.yml]
  YAML --> Actions[GitHub Actions]
  Actions --> Build[Static HTML build]
  Build --> Pages

  Actions --> Sync[Content sync]
  Sync --> API[Vercel API]
  API --> DB[(Turso<br/>SQLite Edge DB)]
  Vercel --> API
  API --> Dashboard[Dashboard / public profile]

  Claude[Claude Desktop] --> MCP[MCP Server]
  MCP --> API
```

## Process Pipeline

### Static site deployment

```mermaid
sequenceDiagram
  participant Human as Human or Claude Code
  participant YAML as gh-pages/config.yml
  participant Git as GitHub
  participant Actions as GitHub Actions
  participant Site as GitHub Pages

  Human->>YAML: Edit profile, links, and theme
  Human->>Git: Commit and push
  Git->>Actions: Run pages.yml
  Actions->>Actions: Parse YAML and generate HTML
  Actions->>Site: Deploy static files
  Site-->>Human: Public link page is updated
```

### Full-stack content sync

```mermaid
sequenceDiagram
  participant Human as Human or Claude Code
  participant Content as linkflow/content.yml
  participant Actions as GitHub Actions
  participant API as Vercel API
  participant DB as Turso DB
  participant App as Next.js App

  Human->>Content: Edit content
  Human->>Actions: Push triggers sync-content.yml
  Actions->>API: Send sync request
  API->>DB: Store profile and links
  App->>DB: Read public profile and dashboard data
  App-->>Human: Changes are visible
```

## Quick Start

### GitHub Pages

Fork or clone this repository:

```bash
git clone https://github.com/YOUR_USERNAME/free-linkmoa.git
cd free-linkmoa
```

Edit `gh-pages/config.yml`:

```yaml
profile:
  name: "내 이름"
  bio: "내 소개글"
  avatar: "https://github.com/MY_USERNAME.png"

links:
  - title: "GitHub"
    url: "https://github.com/MY_USERNAME"
    icon: "github"
    thumbnail: "https://github.com/MY_USERNAME.png"
    enabled: true
```

Preview locally:

```bash
cd gh-pages
npm install
node build.mjs
open ../out/index.html
```

Deploy by pushing to `main`:

```bash
git add gh-pages/config.yml
git commit -m "Update my profile"
git push origin main
```

Then enable `Settings -> Pages -> Source: GitHub Actions` in your repository.

### Vercel + Turso

Create the database and apply the schema:

```bash
bash scripts/turso-setup.sh
```

Configure Vercel environment variables:

```bash
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
vercel env add JWT_SECRET
vercel deploy --prod --cwd linkflow/apps/web
```

After that, edit `linkflow/content.yml` and push. GitHub Actions can sync the content into the Vercel app database.

More deployment detail is in [DEPLOY.md](./DEPLOY.md).

## MCP Usage

Set up Claude Desktop once:

```bash
bash scripts/mcp-setup.sh
```

Restart Claude Desktop, then manage links with natural language:

| Request | MCP tool | Result |
|---------|----------|--------|
| `내 링크 목록 보여줘` | `list_links` | Lists all links |
| `YouTube 링크 추가해줘: https://...` | `create_link` | Creates a link |
| `GitHub 링크 설명 바꿔줘` | `update_link` | Updates a link |
| `링크 3개 한번에 추가해줘` | `create_link` x 3 | Adds links in parallel |
| `프로필 소개글 수정해줘` | `update_profile` | Updates profile data |
| `링크 순서 바꿔줘` | `reorder_links` | Reorders links |

```text
Claude Desktop -> stdio -> MCP Server -> HTTPS -> Vercel API -> Turso DB
```

## Project Layout

```text
free-linkmoa/
├── gh-pages/                 # Static GitHub Pages version
│   ├── config.yml            # Profile, links, and theme content
│   └── build.mjs             # YAML -> HTML builder
├── linkflow/                 # Vercel + Turso full-stack app
│   ├── content.yml           # YAML content synced to the app
│   ├── apps/web/             # Next.js app, API, dashboard, public profile
│   └── apps/mcp-server/      # Claude Desktop MCP server
├── practices/                # Future deployment exercises
├── docs/                     # Workflow and supporting docs
├── scripts/                  # Setup, deploy, sync, and MCP scripts
└── .github/workflows/        # GitHub Pages and Vercel sync workflows
```

## Practice Tracks

| # | Method | Folder | Deployment | Status |
|---|--------|--------|------------|--------|
| 0 | GitHub Pages | `gh-pages/` | [baryonlabs.github.io/free-linkmoa](https://baryonlabs.github.io/free-linkmoa/) | Done |
| 1 | Vercel + Turso | `linkflow/` | [free-linkmoa.vercel.app](https://free-linkmoa.vercel.app) | Done |
| 2 | Fly.io | `practices/02-fly-io/` | Planned | Planned |
| 3 | Cloudflare Pages + D1 | `practices/03-cloudflare-pages/` | Planned | Planned |
| 4 | Docker Compose | `practices/04-docker-compose/` | Planned | Planned |

## Tech Stack

| Area | Technology |
|------|------------|
| Static site | Vanilla HTML/CSS/JS, js-yaml |
| Full-stack app | Next.js 14, TypeScript, Tailwind CSS |
| Database | Turso, LibSQL, SQLite Edge |
| Auth | JWT, bcryptjs |
| Deployment | GitHub Pages, Vercel |
| Automation | GitHub Actions |
| AI editing | Claude Code, linkflow skill |
| MCP server | `@modelcontextprotocol/sdk`, tsx |

## Documentation

- [Workflow guide](./docs/workflow.md)
- [Deployment guide](./DEPLOY.md)
- [Linkflow quickstart](./linkflow/QUICKSTART.md)
- [MCP server guide](./linkflow/apps/mcp-server/README.md)

## Motivation

This project started because we needed a concrete example for teaching and practicing vibe coding. A real, deployed, editable service is more useful than a toy demo because it makes the boundary clearer: what should AI do, and what should the human review, decide, and direct?

While building Free Linkmoa, another point became clear. Good AI coding is not just prompt writing. You also need practical CS knowledge and a working understanding of product development. Data models, APIs, authentication, deployment, automation, and operations are the knowledge that let you review AI-generated code and steer it in the right direction.

That is why this repository can be used both as a link-in-bio example and as a sample project for an AI coding CS curriculum.

## AI Coding CS Curriculum

| Module | Topic | What this project teaches |
|--------|-------|---------------------------|
| 1 | Decomposing a product into code | Breaking a link-in-bio service into profile, links, themes, analytics, and deployment units |
| 2 | Static web foundations | Building the `gh-pages/` static page with HTML, CSS, and JavaScript |
| 3 | Data representation | Using YAML as a human-readable CMS for structured content |
| 4 | Build pipelines | How `build.mjs` transforms YAML into HTML and writes the `out/` artifact |
| 5 | Git and automatic deployment | How commit, push, GitHub Actions, and GitHub Pages connect |
| 6 | Frontend app structure | Next.js pages, components, Tailwind styling, and dashboard screens |
| 7 | API design | Designing REST-style APIs for link CRUD, profile updates, ordering, analytics, and subscribers |
| 8 | Databases | Storing and querying users, links, themes, and analytics in Turso/SQLite |
| 9 | Auth and sessions | JWT, password hashing, current-user checks, and protected APIs |
| 10 | Deployment environments | Vercel environment variables, production deploys, and Edge SQLite connections |
| 11 | Automatic sync | Detecting `content.yml` changes through GitHub Actions and syncing them to the Vercel API |
| 12 | MCP and agent tools | How Claude Desktop calls real service APIs through an MCP server |
| 13 | AI code review | Reviewing AI changes through diffs, tests, types, and security concerns |
| 14 | Operational thinking | Diagnosing logs, health checks, failed deploys, missing env vars, and sync issues |

The recommended learning path is not to understand the whole codebase at once. Start by editing `gh-pages/config.yml` and experiencing the deploy flow, then move into the APIs and dashboard in `linkflow/apps/web`, and finally connect the MCP server and automation scripts.

## Related Links

- [Baryon Labs YouTube](https://www.youtube.com/@codcatprofessor/shorts)

## Copyright and Course Use

The copyright for this code and documentation belongs to Baryon Labs.

Free Linkmoa is used as a course example at [vibecamp.us](https://vibecamp.us) for teaching vibe coding and AI coding. The course uses this repository to show how to build, deploy, and iteratively modify a link-in-bio service with AI while learning the practical CS knowledge needed to review and guide AI-generated code.

> **For teams and organizations that want to learn AI-native development in depth**
>
> This project is also introduced at **[ai-native.vibecamp.us](https://ai-native.vibecamp.us)** as an **AI-native development example**.
> Teams or organizations that want to apply this workflow in practice can **contact Baryon Labs or VibeCamp.**

The project is licensed under MIT. See [linkflow/LICENSE](linkflow/LICENSE).

<div align="center">
  Built by <a href="https://labs.baryon.ai">Baryon Labs</a><br>
  VibeCamp Course Example · Public Build · Open Source · AI-Native
</div>
