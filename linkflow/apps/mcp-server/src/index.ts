import {
  Server,
  StdioServerTransport,
  Tool,
} from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { profileTools, handleGetProfile, handleUpdateProfile } from './tools/profile.js';
import {
  linkTools,
  handleListLinks,
  handleCreateLink,
  handleUpdateLink,
  handleDeleteLink,
  handleReorderLinks,
} from './tools/links.js';
import {
  themeTools,
  handleListThemes,
  handleApplyTheme,
  handleCreateTheme,
  handleUpdateTheme,
} from './tools/themes.js';
import {
  analyticsTools,
  handleGetAnalytics,
  handleGetLinkAnalytics,
} from './tools/analytics.js';
import {
  pluginTools,
  handleListPlugins,
  handleInstallPlugin,
  handleUninstallPlugin,
  handleConfigurePlugin,
} from './tools/plugins.js';
import {
  subscriberTools,
  handleListSubscribers,
  handleExportSubscribers,
} from './tools/subscribers.js';

const server = new Server(
  {
    name: 'linkflow-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Combine all tools
const allTools: Tool[] = [
  ...profileTools,
  ...linkTools,
  ...themeTools,
  ...analyticsTools,
  ...pluginTools,
  ...subscriberTools,
];

// Handle tools/list requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools,
  };
});

// Handle tools/call requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = request.params.arguments || {};

  try {
    let result: unknown;

    // Profile tools
    if (toolName === 'get_profile') {
      result = handleGetProfile();
    } else if (toolName === 'update_profile') {
      result = handleUpdateProfile(args);
    }
    // Link tools
    else if (toolName === 'list_links') {
      result = handleListLinks();
    } else if (toolName === 'create_link') {
      result = handleCreateLink(args);
    } else if (toolName === 'update_link') {
      result = handleUpdateLink(args);
    } else if (toolName === 'delete_link') {
      result = handleDeleteLink(args);
    } else if (toolName === 'reorder_links') {
      result = handleReorderLinks(args);
    }
    // Theme tools
    else if (toolName === 'list_themes') {
      result = handleListThemes();
    } else if (toolName === 'apply_theme') {
      result = handleApplyTheme(args);
    } else if (toolName === 'create_theme') {
      result = handleCreateTheme(args);
    } else if (toolName === 'update_theme') {
      result = handleUpdateTheme(args);
    }
    // Analytics tools
    else if (toolName === 'get_analytics') {
      result = handleGetAnalytics(args);
    } else if (toolName === 'get_link_analytics') {
      result = handleGetLinkAnalytics(args);
    }
    // Plugin tools
    else if (toolName === 'list_plugins') {
      result = handleListPlugins();
    } else if (toolName === 'install_plugin') {
      result = handleInstallPlugin(args);
    } else if (toolName === 'uninstall_plugin') {
      result = handleUninstallPlugin(args);
    } else if (toolName === 'configure_plugin') {
      result = handleConfigurePlugin(args);
    }
    // Subscriber tools
    else if (toolName === 'list_subscribers') {
      result = handleListSubscribers(args);
    } else if (toolName === 'export_subscribers') {
      result = handleExportSubscribers();
    } else {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: `Unknown tool: ${toolName}` }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }),
        },
      ],
      isError: true,
    };
  }
});

// Connect via stdio
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('LinkFlow MCP Server running on stdio');
}

main().catch(console.error);
