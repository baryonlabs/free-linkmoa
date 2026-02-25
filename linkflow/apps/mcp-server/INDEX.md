# LinkFlow MCP Server - Complete Index

## Project Overview

A fully functional Model Context Protocol (MCP) server that enables LLMs like Claude to manage LinkFlow profiles through natural language commands.

**Location:** `/sessions/adoring-intelligent-wozniak/linkflow/apps/mcp-server`

## Documentation Guide

### Getting Started
1. **QUICKSTART.md** - Start here! 5-minute setup guide
2. **README.md** - Complete documentation and features

### Examples & Usage
3. **EXAMPLES.md** - 30+ detailed usage examples for all 19 tools

### Technical Details
4. **IMPLEMENTATION.md** - Architecture, code structure, and technical decisions
5. **CHECKLIST.md** - Complete implementation verification checklist

### Project Files
6. **INDEX.md** - This file

## Source Code Structure

### Main Server Entry
- **src/index.ts** (169 lines)
  - Server initialization with MCP protocol
  - Tool registration and routing
  - Request/response handling
  - Error handling with MCP format

### Utilities
- **src/utils/auth.ts** (73 lines)
  - JWT token verification
  - User ID extraction
  - Access control validation

- **src/utils/db.ts** (113 lines)
  - SQLite connection management
  - Database types and interfaces
  - WAL mode configuration

### Tools (6 modules, 1,266 lines)

#### Profile Management
- **src/tools/profile.ts** (144 lines)
  - `get_profile` - Retrieve user profile
  - `update_profile` - Update profile fields

#### Link Management
- **src/tools/links.ts** (389 lines)
  - `list_links` - Get all user links
  - `create_link` - Create new link with scheduling
  - `update_link` - Modify link properties
  - `delete_link` - Remove link
  - `reorder_links` - Bulk reorder links

#### Theme Management
- **src/tools/themes.ts** (222 lines)
  - `list_themes` - Browse builtin and custom themes
  - `apply_theme` - Set active theme
  - `create_theme` - Create custom theme
  - `update_theme` - Modify custom theme

#### Analytics
- **src/tools/analytics.ts** (230 lines)
  - `get_analytics` - Profile-wide analytics
  - `get_link_analytics` - Link-specific analytics

#### Plugin Management
- **src/tools/plugins.ts** (191 lines)
  - `list_plugins` - Show installed plugins
  - `install_plugin` - Install new plugin
  - `uninstall_plugin` - Remove plugin
  - `configure_plugin` - Update configuration

#### Subscriber Management
- **src/tools/subscribers.ts** (91 lines)
  - `list_subscribers` - Get subscribers with pagination
  - `export_subscribers` - Export as CSV

## Configuration Files

- **package.json** - Dependencies and npm scripts
- **tsconfig.json** - TypeScript compiler configuration
- **.env.example** - Environment variables template
- **.gitignore** - Git ignore patterns

## Tools Overview (19 Total)

### By Category

| Category | Count | Tools |
|----------|-------|-------|
| Profile | 2 | get_profile, update_profile |
| Links | 5 | list_links, create_link, update_link, delete_link, reorder_links |
| Themes | 4 | list_themes, apply_theme, create_theme, update_theme |
| Analytics | 2 | get_analytics, get_link_analytics |
| Plugins | 4 | list_plugins, install_plugin, uninstall_plugin, configure_plugin |
| Subscribers | 2 | list_subscribers, export_subscribers |
| **Total** | **19** | **All listed above** |

## Key Features

### Authentication
- JWT token verification via environment variable
- User ID extraction from token payload
- Database user validation
- Per-operation access control

### Database
- SQLite with WAL mode for concurrent access
- Type-safe operations with TypeScript interfaces
- Prepared statements prevent SQL injection
- User-scoped data access

### Security
- All operations scoped to authenticated user
- Prepared statements for all queries
- Access validation before modifications
- Meaningful error messages

### Performance
- Connection pooling via singleton pattern
- Prepared statement caching
- Transaction support for atomic operations
- Pagination support for large datasets

## Quick Commands

### Setup
```bash
npm install
cp .env.example .env
# Edit .env with credentials
```

### Development
```bash
npm run watch      # Watch TypeScript files
npm run dev        # Run with auto-reload
npm run build      # Compile TypeScript
```

### Production
```bash
npm run build      # Build TypeScript
npm start          # Start the server
```

## Environment Variables

### Required
- `LINKFLOW_TOKEN` - User's JWT authentication token
- `JWT_SECRET` - Secret key for signing JWTs

### Optional
- `DATABASE_PATH` - Path to SQLite database
- `NODE_ENV` - Environment mode (development/production)

## Tool Usage Pattern

Each tool follows a consistent pattern:

```typescript
// Tool Definition
{
  name: "tool_name",
  description: "What the tool does",
  inputSchema: {
    type: "object",
    properties: { /* ... */ },
    required: [/* ... */]
  }
}

// Handler Function
function handleToolName(args: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const db = getDatabase();
  // ... implementation
  return result;
}
```

All tools:
- Validate input arguments
- Verify user ownership of data
- Use prepared statements
- Return proper MCP response format
- Include comprehensive error handling

## Data Models

### User
```
id, username, email, password_hash
avatar_url, bio, title
social_links (JSON), theme_id
seo_title, seo_description
created_at, updated_at
```

### Link
```
id, user_id, title, url
description, type, icon_url
animation_type, highlight, position
scheduled_from, scheduled_to
utm_source, utm_medium, utm_campaign
created_at, updated_at
```

### Theme
```
id, user_id, name
config (JSON), is_builtin
created_at, updated_at
```

### Analytics
```
id, user_id, link_id
event_type, device_type, browser
country, referrer
created_at
```

### Subscriber
```
id, user_id, email, name
subscribed_at
```

### Plugin
```
id, user_id, plugin_name
config (JSON)
installed_at
```

## File Sizes

| File | Lines | Purpose |
|------|-------|---------|
| src/index.ts | 169 | Main server entry |
| src/utils/auth.ts | 73 | Authentication |
| src/utils/db.ts | 113 | Database connection |
| src/tools/profile.ts | 144 | Profile operations |
| src/tools/links.ts | 389 | Link management |
| src/tools/themes.ts | 222 | Theme operations |
| src/tools/analytics.ts | 230 | Analytics queries |
| src/tools/plugins.ts | 191 | Plugin management |
| src/tools/subscribers.ts | 91 | Subscriber management |
| **Total** | **1,621** | **All TypeScript** |

## Integration with Claude

This MCP server integrates with Claude via the MCP protocol:

1. Server runs on stdio
2. Sends/receives MCP protocol messages
3. Lists available tools
4. Executes tool calls with arguments
5. Returns results in MCP format

## Getting Help

1. **Quick Start?** → Read QUICKSTART.md
2. **Usage Examples?** → Read EXAMPLES.md
3. **Technical Details?** → Read IMPLEMENTATION.md
4. **Setup Instructions?** → Read README.md
5. **Verification?** → Read CHECKLIST.md

## Next Steps

1. Read QUICKSTART.md for setup
2. Configure your environment variables
3. Build: `npm run build`
4. Run: `npm start`
5. Use with Claude or compatible LLM client

---

**Status:** Complete and ready for production use
**Last Updated:** February 2026
