// ============================================
// LinkFlow - Shared Type Definitions
// ============================================

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  avatar_url: string | null;
  title: string | null;
  bio: string | null;
  custom_logo_url: string | null;
  social_links: SocialLinks;
  theme_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  custom_css: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  github?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  facebook?: string;
  spotify?: string;
  twitch?: string;
  discord?: string;
  email?: string;
  website?: string;
  [key: string]: string | undefined;
}

export type LinkType = 'standard' | 'embed' | 'email' | 'phone' | 'header' | 'custom';
export type AnimationType = 'none' | 'fade' | 'bounce' | 'slide' | 'glow' | 'pulse' | 'shake';

export interface Link {
  id: string;
  user_id: string;
  title: string;
  url: string;
  description: string | null;
  icon_url: string | null;
  thumbnail_url: string | null;
  type: LinkType;
  position: number;
  enabled: boolean;
  scheduled_from: string | null;
  scheduled_to: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  custom_css: string | null;
  animation_type: AnimationType;
  highlight: boolean;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export type ButtonStyle = 'solid' | 'outline' | 'ghost' | 'gradient' | 'shadow' | 'rounded';
export type LinkPreviewStyle = 'card' | 'minimal' | 'large' | 'hidden';

export interface ThemeConfig {
  colors: {
    background: string;
    backgroundGradient?: string;
    backgroundImage?: string;
    backgroundVideo?: string;
    text: string;
    textSecondary: string;
    buttonBg: string;
    buttonText: string;
    buttonHover: string;
    accent: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    titleSize: string;
    bodySize: string;
    buttonSize: string;
  };
  layout: {
    maxWidth: string;
    padding: string;
    gap: string;
    borderRadius: string;
  };
  button: {
    style: ButtonStyle;
    shadow: boolean;
    fullWidth: boolean;
  };
  link: {
    style: LinkPreviewStyle;
    showThumbnail: boolean;
    showDescription: boolean;
    showIcon: boolean;
  };
  advanced?: {
    customCSS?: string;
    enableAnimations?: boolean;
    enableBlur?: boolean;
  };
}

export interface Theme {
  id: string;
  user_id: string | null;
  name: string;
  type: 'builtin' | 'custom';
  config: ThemeConfig;
  preview_url: string | null;
  created_at: string;
  updated_at: string;
}

export type AnalyticsEventType = 'page_view' | 'link_click';

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  link_id: string | null;
  event_type: AnalyticsEventType;
  referrer: string | null;
  user_agent: string | null;
  country: string | null;
  city: string | null;
  device_type: 'mobile' | 'tablet' | 'desktop' | null;
  browser: string | null;
  os: string | null;
  created_at: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  clickRate: number;
  topLinks: { link_id: string; title: string; clicks: number }[];
  deviceBreakdown: { device: string; count: number }[];
  locationBreakdown: { country: string; count: number }[];
  referrerBreakdown: { referrer: string; count: number }[];
  viewsOverTime: { date: string; views: number; clicks: number }[];
}

export interface Subscriber {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  metadata: Record<string, unknown>;
  subscribed_at: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  license: string;
  repository?: string;
  compatibility: {
    min_version: string;
    max_version: string;
  };
  hooks: {
    link_types?: string[];
    theme_features?: string[];
    analytics_providers?: string[];
  };
  permissions: {
    database_tables?: string[];
    file_system_access?: boolean;
  };
  entry_points: {
    backend?: string;
    frontend?: string;
    config_ui?: string;
  };
  default_config: Record<string, unknown>;
}

export interface PluginInstallation {
  id: string;
  user_id: string;
  plugin_id: string;
  plugin_name: string;
  version: string;
  config: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthTokenPayload {
  userId: string;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}
