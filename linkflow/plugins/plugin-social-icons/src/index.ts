import {
  definePlugin,
  PluginContext,
  PluginServer,
  PluginClient,
  MCPToolDefinition,
} from "@linkflow/plugin-sdk";

const SOCIAL_PLATFORMS = {
  twitter: { name: "Twitter", icon: "twitter", url: "https://twitter.com" },
  github: { name: "GitHub", icon: "github", url: "https://github.com" },
  linkedin: { name: "LinkedIn", icon: "linkedin", url: "https://linkedin.com" },
  instagram: { name: "Instagram", icon: "instagram", url: "https://instagram.com" },
  youtube: { name: "YouTube", icon: "youtube", url: "https://youtube.com" },
  tiktok: { name: "TikTok", icon: "tiktok", url: "https://tiktok.com" },
  facebook: { name: "Facebook", icon: "facebook", url: "https://facebook.com" },
  discord: { name: "Discord", icon: "discord", url: "https://discord.com" },
};

const server: PluginServer = {
  onInstall: async (context: PluginContext) => {
    context.logger.info("Social Icons Plugin installed", {
      userId: context.userId,
      pluginId: context.pluginId,
    });

    await context.database.setPluginData(context.userId, "social-icons-config", {
      displayStyle: "grid",
      size: "medium",
      animation: "hover-scale",
      spacing: "normal",
    });
  },

  onEnable: async (context: PluginContext) => {
    context.logger.info("Social Icons Plugin enabled", {
      userId: context.userId,
    });
  },

  onDisable: async (context: PluginContext) => {
    context.logger.info("Social Icons Plugin disabled", {
      userId: context.userId,
    });
  },

  onUninstall: async (context: PluginContext) => {
    context.logger.info("Social Icons Plugin uninstalled", {
      userId: context.userId,
    });

    await context.database.deletePluginData(context.userId, "social-icons-config");
  },

  registerLinkType: (context: PluginContext, registerFn) => {
    registerFn(context, {
      id: "social-icon",
      name: "Social Icon",
      description: "A social media profile link with icon",
      schema: {
        type: "object",
        properties: {
          platform: {
            type: "string",
            enum: Object.keys(SOCIAL_PLATFORMS),
            description: "Social media platform",
          },
          username: {
            type: "string",
            description: "Social media username or handle",
          },
          url: {
            type: "string",
            description: "Direct URL to profile",
          },
          label: {
            type: "string",
            description: "Custom label for the link",
          },
        },
        required: ["platform", "username"],
      },
      icon: "icons/social.svg",
      validate: (data: any) => {
        return (
          data &&
          Object.keys(SOCIAL_PLATFORMS).includes(data.platform) &&
          typeof data.username === "string" &&
          data.username.length > 0
        );
      },
      render: (data: any) => {
        const platform = SOCIAL_PLATFORMS[data.platform];
        if (!platform) return "";

        const url = data.url || `${platform.url}/${data.username}`;
        const label = data.label || platform.name;

        return `
          <a href="${url}" target="_blank" rel="noopener noreferrer"
             class="social-icon social-icon--${data.platform}"
             title="${label}">
            <span class="sr-only">${label}</span>
            <i class="icon-${platform.icon}"></i>
          </a>
        `;
      },
    });
  },

  registerMCPTools: (context: PluginContext, registerFn) => {
    const tools: MCPToolDefinition[] = [
      {
        name: "add-social-icon",
        description: "Add a social media icon to your link-in-bio profile",
        inputSchema: {
          type: "object",
          properties: {
            platform: {
              type: "string",
              enum: Object.keys(SOCIAL_PLATFORMS),
              description: "The social media platform",
            },
            username: {
              type: "string",
              description: "Your username on that platform",
            },
            label: {
              type: "string",
              description: "Custom display label (optional)",
            },
          },
          required: ["platform", "username"],
        },
      },
      {
        name: "list-social-icons",
        description: "List all available social media platforms supported by the plugin",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "remove-social-icon",
        description: "Remove a social media icon from your profile",
        inputSchema: {
          type: "object",
          properties: {
            linkId: {
              type: "string",
              description: "The ID of the social icon link to remove",
            },
          },
          required: ["linkId"],
        },
      },
      {
        name: "configure-social-icons",
        description: "Configure the display style and animation of social icons",
        inputSchema: {
          type: "object",
          properties: {
            displayStyle: {
              type: "string",
              enum: ["grid", "row", "column"],
              description: "How to arrange the social icons",
            },
            size: {
              type: "string",
              enum: ["small", "medium", "large"],
              description: "Size of the social icons",
            },
            animation: {
              type: "string",
              enum: ["none", "hover-scale", "bounce", "pulse"],
              description: "Animation effect on hover",
            },
            spacing: {
              type: "string",
              enum: ["compact", "normal", "spacious"],
              description: "Space between icons",
            },
          },
        },
      },
    ];

    registerFn(context, tools);
  },

  handleRequest: async (
    context: PluginContext,
    method: string,
    path: string,
    body?: any
  ) => {
    context.logger.debug(`Handling ${method} request to ${path}`, { body });

    if (method === "GET" && path === "/platforms") {
      return {
        success: true,
        platforms: SOCIAL_PLATFORMS,
      };
    }

    if (method === "GET" && path === "/config") {
      const config = await context.database.getPluginData(
        context.userId,
        "social-icons-config"
      );
      return {
        success: true,
        config: config || {},
      };
    }

    if (method === "POST" && path === "/config") {
      await context.database.setPluginData(
        context.userId,
        "social-icons-config",
        body
      );
      return {
        success: true,
        message: "Configuration updated",
      };
    }

    return {
      success: false,
      error: "Not found",
    };
  },
};

const client: PluginClient = {
  onClientReady: () => {
    console.log("Social Icons Plugin client ready");
  },

  registerComponent: (component) => {
    console.log(`Registered component: ${component.id}`);
  },

  registerThemeExtension: (theme) => {
    console.log(`Registered theme extension: ${theme.id}`);
  },
};

export default definePlugin({
  server,
  client,
});

export { SOCIAL_PLATFORMS };
