# LinkFlow MCP Server - Quick Start Guide

## Overview

This is a fully functional Model Context Protocol (MCP) server that allows Claude and other LLMs to manage a LinkFlow profile using natural language commands.

## What's Included

- **19 MCP Tools** for complete LinkFlow management
- **1,621 Lines of TypeScript** production-ready code
- **Full Authentication** with JWT token verification
- **SQLite Database** integration with the web app
- **Comprehensive Documentation** with examples

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and add your credentials:
# LINKFLOW_TOKEN=your-jwt-token-here
# JWT_SECRET=your-secret-key
```

### 3. Build
```bash
npm run build
```

### 4. Run
```bash
npm start
```

The server is now running and ready to receive MCP protocol requests via stdio.

## Available Tools

### Profile Management (2 tools)
- **get_profile** - Get your profile info
- **update_profile** - Update title, bio, avatar, links, etc.

### Link Management (5 tools)
- **list_links** - See all your links
- **create_link** - Add a new link
- **update_link** - Edit a link
- **delete_link** - Remove a link
- **reorder_links** - Rearrange links

### Themes (4 tools)
- **list_themes** - Browse available themes
- **apply_theme** - Apply a theme
- **create_theme** - Design a custom theme
- **update_theme** - Modify a custom theme

### Analytics (2 tools)
- **get_analytics** - View profile-wide stats
- **get_link_analytics** - Check individual link performance

### Plugins (4 tools)
- **list_plugins** - See installed plugins
- **install_plugin** - Add a new plugin
- **uninstall_plugin** - Remove a plugin
- **configure_plugin** - Update plugin settings

### Subscribers (2 tools)
- **list_subscribers** - View email subscribers
- **export_subscribers** - Download as CSV

## Usage Examples

### Example 1: Update Your Profile
```
Claude: "Update my profile title to 'Senior Developer' and add my GitHub to social links"

This will call:
1. update_profile with new title and social_links
```

### Example 2: Create Links
```
Claude: "Add three links: my blog at example.com, Twitter at twitter.com/me, and my GitHub at github.com/me"

This will call:
1. create_link for blog
2. create_link for Twitter
3. create_link for GitHub
```

### Example 3: Check Analytics
```
Claude: "Show me my profile analytics for the last 7 days"

This will call:
1. get_analytics with days=7
2. Returns views, clicks, top links, device breakdown, etc.
```

### Example 4: Apply a Theme
```
Claude: "Change my profile to the Dark Modern theme"

This will call:
1. list_themes to find available themes
2. apply_theme with the theme ID
```

## Environment Variables

Required:
- `LINKFLOW_TOKEN` - Your JWT authentication token

Optional:
- `JWT_SECRET` - Secret key (defaults to dev key)
- `DATABASE_PATH` - Path to SQLite database
- `NODE_ENV` - Environment mode

## File Structure

```
src/
├── index.ts           ← Main server
├── utils/
│   ├── auth.ts       ← JWT verification
│   └── db.ts         ← Database connection
└── tools/
    ├── profile.ts    ← Profile operations
    ├── links.ts      ← Link management
    ├── themes.ts     ← Theme operations
    ├── analytics.ts  ← Analytics queries
    ├── plugins.ts    ← Plugin management
    └── subscribers.ts ← Subscriber management
```

## Documentation

- **README.md** - Full setup and overview
- **IMPLEMENTATION.md** - Technical architecture details
- **EXAMPLES.md** - 30+ detailed usage examples
- **CHECKLIST.md** - Complete implementation verification
- **QUICKSTART.md** - This file

## Development

Watch TypeScript files:
```bash
npm run watch
```

Run in development mode:
```bash
npm run dev
```

## Key Features

✅ Complete LinkFlow management via natural language
✅ JWT authentication with token verification
✅ SQLite database integration
✅ User-scoped data access control
✅ SQL injection prevention (prepared statements)
✅ Comprehensive error handling
✅ Production-ready code
✅ Full TypeScript implementation

## Support

For detailed information:
- See **README.md** for installation details
- See **EXAMPLES.md** for tool usage examples
- See **IMPLEMENTATION.md** for technical details

## Next Steps

1. Install dependencies: `npm install`
2. Configure your credentials in `.env`
3. Build the project: `npm run build`
4. Start the server: `npm start`
5. Use with Claude or other MCP-compatible LLM clients

Your LinkFlow MCP Server is ready to go!
