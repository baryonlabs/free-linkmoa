# LinkFlow MCP Server

A Model Context Protocol (MCP) server for LinkFlow that allows LLMs like Claude to manage a user's LinkFlow page via natural language.

## Overview

This MCP server provides tools for managing every aspect of a LinkFlow profile:

- **Profile Management** - Get/update profile info, title, bio, avatar, social links, SEO
- **Link Management** - Create, read, update, delete, and reorder links
- **Theme Management** - List, apply, create, and customize themes
- **Analytics** - Track views, clicks, device types, geographic data, and link performance
- **Plugins** - Install, configure, and manage plugins
- **Subscribers** - Manage email subscribers and export data

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Set the required environment variables:

- `LINKFLOW_TOKEN` - User's JWT authentication token
- `JWT_SECRET` - Secret key used to sign JWTs (must match web app)
- `DATABASE_PATH` - Path to the SQLite database (optional, defaults to web app database)

## Building

```bash
npm run build
```

## Running

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Available Tools

### Profile Tools

- `get_profile` - Get current user's profile information
- `update_profile` - Update profile fields (title, bio, avatar, social links, theme, SEO)

### Link Management Tools

- `list_links` - List all user's links with pagination and ordering
- `create_link` - Create a new link with optional scheduling and UTM parameters
- `update_link` - Update an existing link
- `delete_link` - Delete a link
- `reorder_links` - Bulk reorder links by position

### Theme Tools

- `list_themes` - List builtin and custom themes
- `apply_theme` - Apply a theme to the user's profile
- `create_theme` - Create a custom theme
- `update_theme` - Update a custom theme configuration

### Analytics Tools

- `get_analytics` - Get profile-wide analytics (views, clicks, top links, devices, countries)
- `get_link_analytics` - Get detailed analytics for a specific link

### Plugin Tools

- `list_plugins` - List installed plugins
- `install_plugin` - Install a new plugin with configuration
- `uninstall_plugin` - Remove an installed plugin
- `configure_plugin` - Update plugin configuration

### Subscriber Tools

- `list_subscribers` - List email subscribers with pagination
- `export_subscribers` - Export all subscribers as CSV

## Authentication

The MCP server uses JWT authentication. The `LINKFLOW_TOKEN` environment variable should contain a valid JWT token for the user. The token is verified against the configured `JWT_SECRET`.

## Database

The server connects to the same SQLite database as the LinkFlow web application. The database path is configured via the `DATABASE_PATH` environment variable, defaulting to the web app's database location.

## Error Handling

All tools include comprehensive error handling and return meaningful error messages when operations fail.

## Development

```bash
# Watch TypeScript files
npm run watch

# Build and start
npm run build
npm start
```

## Project Structure

```
src/
├── index.ts           # Main MCP server entry point
├── utils/
│   ├── auth.ts       # JWT token verification
│   └── db.ts         # Database connection and types
└── tools/
    ├── profile.ts    # Profile management
    ├── links.ts      # Link CRUD operations
    ├── themes.ts     # Theme management
    ├── analytics.ts  # Analytics queries
    ├── plugins.ts    # Plugin management
    └── subscribers.ts # Subscriber management
```

## Notes

- All user data is scoped to the authenticated user
- The server verifies user access before returning or modifying any data
- Database operations use prepared statements to prevent SQL injection
- The server supports concurrent access with SQLite WAL mode
