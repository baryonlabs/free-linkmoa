# LinkFlow Project Structure

This document outlines the complete project structure with descriptions of all created files.

## Root Level Files

### `.env.example`
Environment configuration template with all available variables documented. Includes:
- Server configuration (PORT, HOST, NODE_ENV)
- JWT authentication settings
- Database configuration (PostgreSQL)
- Plugin system configuration
- MCP integration settings
- Email and OAuth configuration
- Analytics and error tracking options
- Feature flags

### `.gitignore`
Git ignore rules for Node.js/Next.js projects including:
- Dependencies (node_modules)
- Build artifacts (.next, dist, build)
- Environment files (.env.local, .env.*.local)
- IDE files (.vscode, .idea)
- OS files (.DS_Store)
- Logs and runtime data
- Plugin development artifacts
- Database and Docker files

### `README.md`
Comprehensive documentation covering:
- Project overview and features
- Tech stack details
- Quick start guide
- Docker deployment instructions (Compose and standalone)
- MCP integration guide
- Plugin development guide
- API reference
- Configuration guide
- Contributing guidelines
- License information and roadmap

### `LICENSE`
MIT License text - free and open-source license allowing commercial and private use with proper attribution.

## Docker Configuration

### `docker/Dockerfile`
Multi-stage production Dockerfile with:
- **Stage 1 (dependencies)**: Node 20 Alpine base, installs all dependencies
- **Stage 2 (builder)**: Copies dependencies, builds Next.js app
- **Stage 3 (production)**: Slim production image with dumb-init for proper signal handling
- Non-root user (nextjs) for security
- Health checks for reliability
- Exposed port 3000

### `docker/docker-compose.yml`
Complete Docker Compose setup including:
- **web service**: LinkFlow application with volume mounts
- **postgres service**: PostgreSQL 16 database
- Environment variable configuration
- Health checks for both services
- Volume persistence (data, plugins, postgres)
- Network isolation
- Automatic restart policies

## Plugin SDK Package

### `packages/plugin-sdk/package.json`
NPM package configuration for the plugin SDK with:
- Name: @linkflow/plugin-sdk
- Version: 1.0.0
- Main entry: src/index.ts
- Build and dev scripts
- Dependencies configuration

### `packages/plugin-sdk/tsconfig.json`
TypeScript configuration for plugin SDK:
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- Declaration files generation
- Node module resolution

### `packages/plugin-sdk/src/index.ts`
Complete plugin SDK implementation (900+ lines) providing:

**Interfaces:**
- `PluginManifest`: Plugin metadata and configuration
- `DatabaseHelpers`: Database operations (links, plugin data)
- `PluginContext`: Runtime context with user, config, database, logger
- `PluginServer`: Server-side hooks (install, enable, disable, uninstall)
- `PluginClient`: Client-side hooks (UI components, themes)
- `MCPToolDefinition`: MCP tool schema definition
- `ThemeExtension`: Theme customization interface

**Key Exports:**
- `definePlugin()`: Helper function for type-safe plugin definition
- `PluginUtils`: Testing utilities including mock context and manifest validation
- Re-exports for convenience

**Features:**
- Full TypeScript support
- Comprehensive JSDoc comments
- Type-safe plugin development
- Testing utilities
- Extensible hook system

## Example Plugin: Social Icons

### `plugins/plugin-social-icons/manifest.json`
Plugin manifest with:
- Plugin identity: id, name, version, description
- Metadata: author, license, homepage, icon
- Permissions: links, data, UI, MCP tools
- Link types: social-icon definition
- Dependencies: React, Lucide React, Plugin SDK

### `plugins/plugin-social-icons/package.json`
NPM configuration for the plugin:
- Package name and versioning
- Main entry point (src/index.ts)
- Build and dev scripts
- Dependencies on React and Lucide icons
- TypeScript dev dependency

### `plugins/plugin-social-icons/tsconfig.json`
TypeScript configuration specific to plugin:
- ES2020 target with DOM lib
- JSX support (react-jsx)
- Declaration generation
- Module resolution for dependencies

### `plugins/plugin-social-icons/src/index.ts`
Complete plugin implementation (300+ lines) featuring:

**Supported Platforms:**
- Twitter, GitHub, LinkedIn, Instagram
- YouTube, TikTok, Facebook, Discord

**Server Lifecycle:**
- onInstall: Initializes configuration
- onEnable: Logs activation
- onDisable: Logs deactivation
- onUninstall: Cleans up plugin data

**Features:**
- Custom link type registration for social icons
- MCP tool registration (add, list, remove, configure)
- Request handler for API endpoints
- Platform management and validation
- HTML rendering for social icons

**MCP Tools:**
- add-social-icon: Add social profile link
- list-social-icons: List available platforms
- remove-social-icon: Remove social icon
- configure-social-icons: Customize display

**Client:**
- Component registration capability
- Theme extension capability
- Initialization hook

## File Purposes and Responsibilities

### SDK Files
The plugin SDK provides the foundation for plugin development with complete type safety and comprehensive interfaces.

### Docker Files
Production-ready Docker configuration for containerized deployment with database integration and health checks.

### Documentation
Comprehensive README and examples for users, developers, and administrators to understand and use LinkFlow.

### Configuration
Environment templates and Git ignore rules for proper project setup and deployment across environments.

### Example Plugin
Full-featured example demonstrating:
- Manifest creation
- Plugin lifecycle management
- Server-side hooks and registration
- MCP tool integration
- API endpoint handling
- Database usage

## Usage

1. **Plugin Development**: Use `packages/plugin-sdk/src/index.ts` as reference
2. **Plugin Example**: See `plugins/plugin-social-icons/` for complete implementation
3. **Deployment**: Use `docker/docker-compose.yml` for full setup
4. **Configuration**: Copy `.env.example` to `.env.local` and customize
5. **Documentation**: Reference `README.md` for all user-facing information

