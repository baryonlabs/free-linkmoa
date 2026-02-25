# LinkFlow MCP Server Implementation

## Project Structure

```
mcp-server/
├── src/
│   ├── index.ts                 # Main MCP server entry point
│   ├── utils/
│   │   ├── auth.ts             # JWT authentication & token verification
│   │   └── db.ts               # SQLite database connection and TypeScript types
│   └── tools/
│       ├── profile.ts          # Profile management (get/update)
│       ├── links.ts            # Link CRUD operations (list/create/update/delete/reorder)
│       ├── themes.ts           # Theme management (list/apply/create/update)
│       ├── analytics.ts        # Analytics queries (profile & link-level)
│       ├── plugins.ts          # Plugin management (list/install/uninstall/configure)
│       └── subscribers.ts      # Subscriber management (list/export)
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore patterns
├── README.md                   # User documentation
└── IMPLEMENTATION.md           # This file
```

## Key Features

### 1. Authentication (src/utils/auth.ts)
- JWT token verification using `LINKFLOW_TOKEN` environment variable
- Automatic user ID extraction from token payload
- Database user validation
- Access control verification per request

### 2. Database Connection (src/utils/db.ts)
- SQLite connection with WAL mode for concurrent access
- Singleton pattern for database connection
- Default path: `../../apps/web/data/linkflow.db`
- Configurable via `DATABASE_PATH` env variable
- Type definitions for all data models

### 3. Tool Categories

#### Profile Tools (2 tools)
- `get_profile` - Retrieve user profile with all metadata
- `update_profile` - Update title, bio, avatar, social links, theme, SEO fields

#### Link Management Tools (5 tools)
- `list_links` - Get all user's links ordered by position
- `create_link` - Create new link with optional scheduling and UTM params
- `update_link` - Modify existing link properties
- `delete_link` - Remove a link
- `reorder_links` - Bulk reorder links by position

#### Theme Tools (4 tools)
- `list_themes` - List builtin and custom themes with full configs
- `apply_theme` - Set active theme for user profile
- `create_theme` - Create custom theme with full configuration
- `update_theme` - Modify existing custom theme

#### Analytics Tools (2 tools)
- `get_analytics` - Profile-wide analytics (views, clicks, devices, countries, browsers)
- `get_link_analytics` - Per-link detailed analytics with event history

#### Plugin Tools (4 tools)
- `list_plugins` - Get all installed plugins with configs
- `install_plugin` - Install new plugin with initial configuration
- `uninstall_plugin` - Remove installed plugin
- `configure_plugin` - Update plugin configuration

#### Subscriber Tools (2 tools)
- `list_subscribers` - Get subscribers with pagination
- `export_subscribers` - Export all subscribers as CSV format

### Total: 19 MCP tools

## Authentication Flow

1. User provides JWT token via `LINKFLOW_TOKEN` environment variable
2. Token is verified using `JWT_SECRET` from config
3. User ID extracted from token payload
4. Every tool operation scoped to authenticated user
5. Database queries verify user ownership of data

## Database Operations

All database operations:
- Use prepared statements to prevent SQL injection
- Verify user ownership before access/modification
- Support concurrent access via SQLite WAL mode
- Include proper error handling and validation
- Return meaningful error messages on failure

## Tool Implementation Pattern

Each tool follows a consistent pattern:

```typescript
// Tool definition
{
  name: "tool_name",
  description: "What the tool does",
  inputSchema: {
    type: "object",
    properties: { ... },
    required: [...]
  }
}

// Handler function
export function handleToolName(args: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const db = getDatabase();

  // Validation
  // Database operations
  // Error handling

  return { ... };
}
```

## Error Handling

All errors are caught and returned in MCP format:

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"error\": \"error message\"}"
    }
  ],
  "isError": true
}
```

## Configuration

Required environment variables:
- `LINKFLOW_TOKEN` - User's JWT token
- `JWT_SECRET` - Secret used to sign JWTs (must match web app)

Optional:
- `DATABASE_PATH` - Path to SQLite database
- `NODE_ENV` - Environment (development/production)

## Building & Deployment

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run server
npm start
```

The server connects via stdio and is ready to receive MCP protocol requests.

## Data Models

### User
- id, username, email, password_hash
- avatar_url, bio, title
- social_links (JSON), theme_id
- seo_title, seo_description
- created_at, updated_at

### Link
- id, user_id, title, url
- description, type, icon_url
- animation_type, highlight, position
- scheduled_from, scheduled_to
- utm_source, utm_medium, utm_campaign
- created_at, updated_at

### Theme
- id, user_id (null for builtin), name
- config (JSON), is_builtin
- created_at, updated_at

### Analytics
- id, user_id, link_id (optional)
- event_type (view/click)
- device_type, browser, country, referrer
- created_at

### Subscriber
- id, user_id, email, name
- subscribed_at

### Plugin
- id, user_id, plugin_name
- config (JSON), installed_at

## Security Considerations

1. All data scoped to authenticated user
2. JWT token verification on every request
3. Prepared statements prevent SQL injection
4. Database access control via user_id checks
5. Sensitive data not logged to console
6. Error messages don't leak sensitive information

## Performance Optimizations

1. SQLite WAL mode for concurrent access
2. Prepared statement caching
3. Efficient queries with proper indexes
4. Pagination support for large datasets
5. Transaction support for atomic operations

## Future Enhancements

Potential additions:
- Bulk operations for batch updates
- Advanced analytics with time-series data
- Custom reporting tools
- Integration webhooks
- Rate limiting and throttling
- Caching layer for frequently accessed data
