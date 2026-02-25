# LinkFlow

<div align="center">

**Free & Open Source Link-in-Bio Platform with MCP Integration**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black)](https://nextjs.org)

[Features](#features) • [Quick Start](#quick-start) • [Docker](#docker-deployment) • [MCP Integration](#mcp-integration) • [Plugin Development](#plugin-development) • [Contributing](#contributing)

</div>

## About

LinkFlow is a modern, open-source link-in-bio platform that empowers users to create beautiful, customizable bio pages with integrated support for MCP (Model Context Protocol) tools. Built with Next.js, TypeScript, and a powerful plugin architecture, LinkFlow makes it easy to manage and share your important links with advanced customization options.

## Features

- **Beautiful Bio Pages**: Create stunning link-in-bio pages with customizable themes and layouts
- **Plugin Architecture**: Extend functionality with community-built plugins
- **MCP Integration**: Connect Claude and other AI models for intelligent link management
- **Custom Link Types**: Support for various link types including social icons, buttons, cards, and more
- **Theme Customization**: Full control over colors, fonts, and styling
- **Analytics**: Track clicks and visitor information (optional)
- **User Authentication**: Secure user accounts with JWT
- **API-First Design**: RESTful API for programmatic access
- **Docker Support**: Easy deployment with Docker and Docker Compose
- **Self-Hosted**: Run entirely on your own infrastructure
- **MIT License**: Free to use and modify

## Tech Stack

- **Frontend**: Next.js 14+, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js 20+, TypeScript
- **Database**: PostgreSQL 16+ (with SQLite option for development)
- **Plugin System**: TypeScript-based plugin SDK
- **Containerization**: Docker & Docker Compose
- **API Protocol**: REST + MCP (Model Context Protocol)

## Quick Start

### Prerequisites

- Node.js 20+ and npm/yarn
- PostgreSQL 16+ (or use the Docker setup)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/linkflow/linkflow.git
   cd linkflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Navigate to http://localhost:3000

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format

# Database migrations
npm run db:migrate
npm run db:seed

# Plugin development
npm run plugin:watch
npm run plugin:build
```

## Docker Deployment

### Using Docker Compose (Recommended)

The easiest way to deploy LinkFlow is using Docker Compose, which sets up both the application and database:

```bash
# Configure environment
cp .env.example .env

# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f web

# Stop services
docker-compose down
```

The application will be available at http://localhost:3000

### Using Docker Build

```bash
# Build the image
docker build -f docker/Dockerfile -t linkflow:latest .

# Run the container
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret-key \
  -e DATABASE_PATH=/app/data/linkflow.db \
  -v linkflow-data:/app/data \
  linkflow:latest
```

### Docker Compose Services

- **web**: LinkFlow Next.js application (port 3000)
- **postgres**: PostgreSQL database (port 5432)

Both services include:
- Health checks for reliability
- Volume persistence for data
- Network isolation
- Automatic restart on failure

### Environment Variables for Docker

Key variables defined in docker-compose.yml:

```yaml
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-in-production
DATABASE_PATH=/app/data/linkflow.db
DB_USER=linkflow
DB_PASSWORD=linkflow-dev-password
DB_NAME=linkflow
```

See `.env.example` for all available options.

## MCP Integration

LinkFlow supports the Model Context Protocol (MCP), allowing seamless integration with Claude and other AI assistants.

### Setting Up MCP

1. **Enable MCP** in your `.env.local`:
   ```
   MCP_ENABLED=true
   CLAUDE_API_KEY=sk-...
   ```

2. **Connect Claude**: Use the MCP server endpoint to connect Claude to your LinkFlow instance

3. **Available MCP Tools**: Plugins can register custom tools for Claude to use

### Using Claude with LinkFlow

Once connected, Claude can help you:
- Create and manage links
- Customize your bio page
- Install and configure plugins
- Analyze link performance
- Generate link descriptions and content

### Building MCP Tools

Plugins can register MCP tools for Claude:

```typescript
registerMCPTools: (context: PluginContext, tools: MCPToolDefinition[]) => {
  tools.push({
    name: "create-link",
    description: "Create a new link on the bio page",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        title: { type: "string" },
        description: { type: "string" }
      },
      required: ["url", "title"]
    }
  });
}
```

## Plugin Development

LinkFlow includes a comprehensive plugin SDK for extending functionality.

### Plugin Structure

```
plugins/my-plugin/
├── manifest.json          # Plugin metadata
└── src/
    └── index.ts          # Plugin implementation
```

### Manifest Example

```json
{
  "id": "my-plugin",
  "name": "My Custom Plugin",
  "version": "1.0.0",
  "description": "A custom plugin for LinkFlow",
  "author": "Your Name",
  "license": "MIT",
  "main": "src/index.ts",
  "permissions": ["links:read", "links:write", "ui:register"]
}
```

### Plugin Implementation

```typescript
import { definePlugin, PluginContext } from "@linkflow/plugin-sdk";

export default definePlugin({
  server: {
    onInstall: async (context: PluginContext) => {
      context.logger.info("Plugin installed");
    },

    registerLinkType: (context, registerFn) => {
      registerFn(context, {
        id: "my-link-type",
        name: "My Link Type",
        description: "Custom link type",
        schema: { /* JSON schema */ },
        validate: (data) => true,
        render: (data) => "<div>...</div>"
      });
    },

    registerMCPTools: (context, registerFn) => {
      registerFn(context, [
        {
          name: "my-tool",
          description: "A custom tool",
          inputSchema: { /* JSON schema */ }
        }
      ]);
    }
  },

  client: {
    onClientReady: () => {
      console.log("Plugin client initialized");
    }
  }
});
```

### Plugin SDK

The `@linkflow/plugin-sdk` package provides:

- **PluginContext**: User, configuration, and database access
- **PluginServer**: Server-side hooks and registration methods
- **PluginClient**: Client-side component registration
- **MCPToolDefinition**: Tool definitions for Claude integration
- **definePlugin()**: Helper function for type-safe plugin definition
- **PluginUtils**: Testing and validation utilities

See `packages/plugin-sdk/src/index.ts` for complete API documentation.

### Building and Testing Plugins

```bash
# In plugin directory
npm install
npm run build
npm run dev      # Watch mode

# Test with mock context
npm test
```

### Plugin Permissions

Common permissions:
- `links:read` - Read user's links
- `links:write` - Create/update links
- `links:delete` - Delete links
- `data:read` - Read plugin data
- `data:write` - Write plugin data
- `ui:register` - Register UI components
- `mcp:tools` - Register MCP tools

## Project Structure

```
linkflow/
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   ├── (auth)/              # Authentication pages
│   ├── (app)/               # Main application
│   └── layout.tsx           # Root layout
├── packages/
│   └── plugin-sdk/          # Plugin SDK package
├── plugins/
│   └── plugin-social-icons/ # Example plugin
├── docker/
│   ├── Dockerfile           # Production Docker image
│   └── docker-compose.yml   # Docker Compose configuration
├── public/                  # Static assets
├── lib/                     # Utility functions
├── components/              # React components
├── styles/                  # Global styles
├── .env.example            # Environment variables template
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## API Reference

LinkFlow provides a RESTful API for programmatic access:

```bash
# Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh

# Links
GET    /api/links              # List user's links
POST   /api/links              # Create a new link
PATCH  /api/links/:id          # Update a link
DELETE /api/links/:id          # Delete a link

# Bio Page
GET    /api/bio                # Get bio page configuration
PATCH  /api/bio                # Update bio page

# Plugins
GET    /api/plugins            # List installed plugins
POST   /api/plugins/:id/enable
POST   /api/plugins/:id/disable
DELETE /api/plugins/:id        # Uninstall plugin

# Analytics
GET    /api/analytics/links    # Get link click statistics
GET    /api/analytics/visitors # Get visitor information
```

Full API documentation available at `/api/docs` when running the application.

## Configuration

All configuration is managed through environment variables in `.env.local`:

- **Node Environment**: `NODE_ENV` (development/production)
- **Server**: `PORT`, `HOST`
- **JWT**: `JWT_SECRET`, `JWT_EXPIRATION`
- **Database**: `DATABASE_URL`, `DATABASE_PATH`
- **Plugins**: `PLUGINS_PATH`, `PLUGINS_ENABLED`
- **MCP**: `MCP_ENABLED`, `CLAUDE_API_KEY`
- **Email**: SMTP configuration for notifications
- **Analytics**: Analytics provider and API keys
- **Social Login**: OAuth credentials (optional)

See `.env.example` for all available options with descriptions.

## Contributing

We welcome contributions from the community! Please follow these guidelines:

1. **Fork the repository** on GitHub
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and commit them: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request** with a clear description

### Development Setup

```bash
# Install dependencies
npm install

# Create .env.local from template
cp .env.example .env.local

# Run development server
npm run dev

# Run tests
npm test

# Format and lint
npm run format && npm run lint
```

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write tests for new features
- Update documentation as needed

### Reporting Issues

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS, etc.)

## License

LinkFlow is released under the MIT License. See the [LICENSE](LICENSE) file for details.

You are free to:
- Use LinkFlow for personal, educational, and commercial projects
- Modify and distribute LinkFlow
- Use it in closed-source applications

Just include the original license and copyright notice.

## Support

- **Documentation**: https://docs.linkflow.app
- **Community**: https://community.linkflow.app
- **Issues**: https://github.com/linkflow/linkflow/issues
- **Discussions**: https://github.com/linkflow/linkflow/discussions
- **Email**: support@linkflow.app

## Acknowledgments

LinkFlow is built with love and open-source software. Special thanks to:
- The Next.js community
- Contributors and plugin developers
- Users providing feedback and feature requests

## Roadmap

Planned features and improvements:
- Custom domain support
- Advanced analytics and reporting
- Team collaboration features
- Link scheduling and automation
- A/B testing capabilities
- Integration marketplace
- Mobile apps (iOS/Android)
- Real-time collaboration

Follow our [GitHub Projects](https://github.com/linkflow/linkflow/projects) for the latest roadmap updates.

---

Built with ❤️ by the LinkFlow team and community
