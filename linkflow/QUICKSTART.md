# LinkFlow Quick Start Guide

## What Was Created

This package contains a complete, production-ready LinkFlow project setup with:

- **Plugin SDK** (`packages/plugin-sdk/`) - Framework for building plugins
- **Example Plugin** (`plugins/plugin-social-icons/`) - Social media icons plugin
- **Docker Setup** (`docker/`) - Production containerization
- **Documentation** - Comprehensive README and guides
- **Configuration** - Environment variables and git ignore rules

## 10-Minute Setup

### 1. Prerequisites
```bash
# Install Node.js 20+ from https://nodejs.org
# Install Docker & Docker Compose from https://docker.com
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your settings (optional for development)
```

### 3. Run with Docker (Recommended)
```bash
docker-compose up -d
# App available at http://localhost:3000
# Database at localhost:5432
```

### 4. Run Locally (Development)
```bash
npm install
npm run dev
# Open http://localhost:3000
```

## File Structure

```
linkflow/
├── packages/plugin-sdk/           # Plugin development SDK
│   └── src/index.ts              # Main SDK with interfaces
├── plugins/plugin-social-icons/   # Example plugin
│   ├── manifest.json             # Plugin metadata
│   └── src/index.ts              # Plugin implementation
├── docker/                        # Docker configuration
│   ├── Dockerfile                # Multi-stage production image
│   └── docker-compose.yml        # Complete stack setup
├── .env.example                  # Environment template
├── .gitignore                    # Git rules
├── README.md                     # Full documentation
└── LICENSE                       # MIT License
```

## Plugin Development

### Using the SDK

```typescript
import { definePlugin, PluginContext } from "@linkflow/plugin-sdk";

export default definePlugin({
  server: {
    onInstall: async (context: PluginContext) => {
      // Plugin installed
    },

    registerMCPTools: (context, registerFn) => {
      registerFn(context, [
        {
          name: "my-tool",
          description: "A custom tool for Claude",
          inputSchema: { /* ... */ }
        }
      ]);
    }
  }
});
```

### Plugin Manifest

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "What it does",
  "author": "Your Name",
  "license": "MIT",
  "main": "src/index.ts",
  "permissions": ["links:read", "mcp:tools"]
}
```

See `plugins/plugin-social-icons/` for a complete example.

## Docker Deployment

### Quick Start
```bash
docker-compose up -d
```

### Services
- **web**: LinkFlow app (port 3000)
- **postgres**: Database (port 5432)

### View Logs
```bash
docker-compose logs -f web
```

### Stop Services
```bash
docker-compose down
```

## API Quick Reference

```bash
# Register
POST /api/auth/register { email, password }

# Login
POST /api/auth/login { email, password }

# Create Link
POST /api/links { url, title, description }

# List Links
GET /api/links

# Update Link
PATCH /api/links/:id { title, url, ... }

# Delete Link
DELETE /api/links/:id
```

## MCP Integration

### Enable MCP
```env
MCP_ENABLED=true
CLAUDE_API_KEY=sk-...
```

### Use with Claude
Plugins can register tools that Claude can use:

```typescript
registerMCPTools: (context, registerFn) => {
  registerFn(context, [
    {
      name: "add-link",
      description: "Add a link to your profile",
      inputSchema: { /* JSON schema */ }
    }
  ]);
}
```

Claude can then use these tools to help manage your LinkFlow profile.

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Environment Variables

Key variables (see `.env.example` for all):

```env
# Server
NODE_ENV=production
PORT=3000

# JWT
JWT_SECRET=your-secret-key

# Database
DATABASE_URL=postgresql://user:pass@localhost/linkflow

# MCP
MCP_ENABLED=true
CLAUDE_API_KEY=sk-...

# Plugins
PLUGINS_PATH=./plugins
PLUGINS_ENABLED=true
```

## SDK Interfaces

### PluginContext
```typescript
{
  userId: string;           // User ID
  pluginId: string;        // Plugin ID
  config: {};              // Plugin config
  database: DatabaseHelpers;
  logger: Logger;
  env: Record<string, string>;
}
```

### PluginServer
```typescript
{
  onInstall?: (context) => Promise<void>;
  onEnable?: (context) => Promise<void>;
  onDisable?: (context) => Promise<void>;
  onUninstall?: (context) => Promise<void>;
  registerLinkType?: (context, registerFn) => void;
  registerMCPTools?: (context, registerFn) => void;
  handleRequest?: (context, method, path, body) => Promise<any>;
}
```

## Key Features

- **Open Source**: MIT License, free to use and modify
- **Plugin System**: TypeScript-based plugin SDK
- **MCP Integration**: Connect Claude for AI-powered management
- **Docker Ready**: Production-ready containerization
- **Type Safe**: Full TypeScript support
- **Database**: PostgreSQL for production
- **Self-Hosted**: Run on your infrastructure

## Troubleshooting

### Docker Issues
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs web

# Rebuild containers
docker-compose down -v
docker-compose up -d --build
```

### Build Issues
```bash
# Clear node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Build again
npm run build
```

### Database Issues
```bash
# Run migrations
npm run db:migrate

# Seed data
npm run db:seed
```

## Next Steps

1. **Customize Environment**: Edit `.env.local` with your settings
2. **Build Plugins**: Use `plugin-social-icons` as reference
3. **Deploy**: Use Docker Compose for production
4. **Integrate Claude**: Enable MCP to use AI features
5. **Share Links**: Create your bio page and share!

## Resources

- **Full Documentation**: See `README.md`
- **File Details**: See `STRUCTURE.md`
- **Plugin SDK**: See `packages/plugin-sdk/src/index.ts`
- **Example Plugin**: See `plugins/plugin-social-icons/src/index.ts`
- **License**: See `LICENSE` file (MIT)

## Support

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Full API reference in README
- **Examples**: Example plugin implementation included
- **MIT License**: Free to use, modify, and distribute

---

**Happy Building! 🚀**
