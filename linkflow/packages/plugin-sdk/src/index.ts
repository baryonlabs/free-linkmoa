/**
 * LinkFlow Plugin SDK
 * Provides interfaces and utilities for building LinkFlow plugins
 */

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  homepage?: string;
  repository?: string;
  icon?: string;
  main: string;
  permissions: string[];
  dependencies?: Record<string, string>;
  linkTypes?: Array<{
    id: string;
    name: string;
    description: string;
    icon?: string;
  }>;
}

export interface DatabaseHelpers {
  getUserLinks: (userId: string) => Promise<any[]>;
  createLink: (userId: string, link: any) => Promise<any>;
  updateLink: (userId: string, linkId: string, updates: any) => Promise<any>;
  deleteLink: (userId: string, linkId: string) => Promise<boolean>;
  getPluginData: (userId: string, key: string) => Promise<any>;
  setPluginData: (userId: string, key: string, value: any) => Promise<void>;
  deletePluginData: (userId: string, key: string) => Promise<boolean>;
}

export interface PluginContext {
  /**
   * ID of the user who installed/owns this plugin instance
   */
  userId: string;

  /**
   * Unique identifier of this plugin
   */
  pluginId: string;

  /**
   * Plugin-specific configuration
   */
  config: Record<string, any>;

  /**
   * Database helper methods for data persistence
   */
  database: DatabaseHelpers;

  /**
   * Logger instance for the plugin
   */
  logger: {
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, error?: any) => void;
    debug: (message: string, data?: any) => void;
  };

  /**
   * Plugin's environment variables
   */
  env: Record<string, string | undefined>;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface PluginServer {
  /**
   * Called when the plugin is installed
   */
  onInstall?: (context: PluginContext) => Promise<void>;

  /**
   * Called when the plugin is enabled
   */
  onEnable?: (context: PluginContext) => Promise<void>;

  /**
   * Called when the plugin is disabled
   */
  onDisable?: (context: PluginContext) => Promise<void>;

  /**
   * Called when the plugin is uninstalled
   */
  onUninstall?: (context: PluginContext) => Promise<void>;

  /**
   * Register a custom link type that can be added to link-in-bio pages
   */
  registerLinkType?: (
    context: PluginContext,
    linkType: {
      id: string;
      name: string;
      description: string;
      schema: Record<string, any>;
      icon?: string;
      validate?: (data: any) => boolean;
      render?: (data: any) => string;
    }
  ) => void;

  /**
   * Register MCP (Model Context Protocol) tools for Claude integration
   */
  registerMCPTools?: (
    context: PluginContext,
    tools: MCPToolDefinition[]
  ) => void;

  /**
   * Handle API requests (optional custom endpoints)
   */
  handleRequest?: (
    context: PluginContext,
    method: string,
    path: string,
    body?: any
  ) => Promise<any>;
}

export interface ComponentDefinition {
  id: string;
  name: string;
  component: any;
  props?: Record<string, any>;
}

export interface ThemeExtension {
  id: string;
  name: string;
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
  components?: Record<string, any>;
}

export interface PluginClient {
  /**
   * Register a custom React component for use in the UI
   */
  registerComponent?: (component: ComponentDefinition) => void;

  /**
   * Register theme customizations
   */
  registerThemeExtension?: (theme: ThemeExtension) => void;

  /**
   * Handle client-side initialization
   */
  onClientReady?: () => void;
}

export interface PluginDefinition {
  server?: PluginServer;
  client?: PluginClient;
}

/**
 * Helper function to define a LinkFlow plugin
 * Provides type-safe plugin definition with both server and client capabilities
 */
export function definePlugin(definition: PluginDefinition): PluginDefinition {
  return definition;
}

/**
 * Plugin development utilities
 */
export namespace PluginUtils {
  /**
   * Validate a PluginManifest
   */
  export function validateManifest(manifest: any): manifest is PluginManifest {
    return (
      manifest &&
      typeof manifest.id === "string" &&
      typeof manifest.name === "string" &&
      typeof manifest.version === "string" &&
      typeof manifest.description === "string" &&
      typeof manifest.author === "string" &&
      typeof manifest.license === "string" &&
      Array.isArray(manifest.permissions) &&
      typeof manifest.main === "string"
    );
  }

  /**
   * Create a mock PluginContext for testing
   */
  export function createMockContext(
    overrides?: Partial<PluginContext>
  ): PluginContext {
    return {
      userId: "test-user-123",
      pluginId: "test-plugin",
      config: {},
      logger: {
        info: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.debug,
      },
      env: {},
      database: {
        getUserLinks: async () => [],
        createLink: async () => ({}),
        updateLink: async () => ({}),
        deleteLink: async () => true,
        getPluginData: async () => null,
        setPluginData: async () => {},
        deletePluginData: async () => true,
      },
      ...overrides,
    };
  }
}

// Re-export plugin manifest type for convenience
export type { PluginManifest };
