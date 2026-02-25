# LinkFlow MCP Server - Usage Examples

This document provides examples of how to use each tool in the LinkFlow MCP server.

## Setup

Before using the server, set up your environment:

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Add your credentials to .env
# LINKFLOW_TOKEN=your-jwt-token-here
# JWT_SECRET=your-secret-key

# 4. Build the server
npm run build

# 5. Start the server
npm start
```

## Profile Tools

### Get Profile

Retrieve current user's profile information.

```
Tool: get_profile
Args: {}

Example Response:
{
  "id": "user-123",
  "username": "john_doe",
  "email": "john@example.com",
  "avatar_url": "https://example.com/avatar.jpg",
  "bio": "Web developer and content creator",
  "title": "Full Stack Developer",
  "social_links": {
    "twitter": "https://twitter.com/johndoe",
    "instagram": "https://instagram.com/johndoe",
    "github": "https://github.com/johndoe"
  },
  "theme_id": "theme-dark-1",
  "seo_title": "John Doe - Full Stack Developer",
  "seo_description": "Check out my links and projects",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-02-20T14:45:00Z"
}
```

### Update Profile

Update any profile fields.

```
Tool: update_profile
Args: {
  "title": "Senior Full Stack Developer",
  "bio": "Building amazing web experiences",
  "avatar_url": "https://example.com/new-avatar.jpg",
  "social_links": {
    "twitter": "https://twitter.com/johndoe",
    "linkedin": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe"
  },
  "seo_title": "John Doe - Senior Developer"
}

Response: Updated profile object (same format as get_profile)
```

## Link Management Tools

### List Links

Get all links for the user, ordered by position.

```
Tool: list_links
Args: {}

Example Response:
[
  {
    "id": "link-1",
    "user_id": "user-123",
    "title": "My Blog",
    "url": "https://blog.example.com",
    "description": "Check out my latest articles",
    "type": "website",
    "icon_url": "https://example.com/icons/blog.png",
    "animation_type": "fade",
    "highlight": true,
    "position": 1,
    "scheduled_from": null,
    "scheduled_to": null,
    "utm_source": "linkflow",
    "utm_medium": "profile",
    "utm_campaign": null,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-02-20T14:45:00Z"
  },
  {
    "id": "link-2",
    "user_id": "user-123",
    "title": "Twitter",
    "url": "https://twitter.com/johndoe",
    "description": null,
    "type": "social",
    "icon_url": "https://example.com/icons/twitter.png",
    "animation_type": null,
    "highlight": false,
    "position": 2,
    ...
  }
]
```

### Create Link

Create a new link with optional parameters.

```
Tool: create_link
Args: {
  "title": "My YouTube Channel",
  "url": "https://youtube.com/@johndoe",
  "description": "Subscribe for web development tutorials",
  "type": "social",
  "icon_url": "https://example.com/icons/youtube.png",
  "animation_type": "slide",
  "highlight": true,
  "utm_source": "linkflow",
  "utm_medium": "profile",
  "utm_campaign": "youtube_promo"
}

Response: Created link object with all fields
```

### Update Link

Update an existing link.

```
Tool: update_link
Args: {
  "id": "link-1",
  "title": "My Updated Blog",
  "description": "New articles every week",
  "highlight": false
}

Response: Updated link object
```

### Delete Link

Remove a link.

```
Tool: delete_link
Args: {
  "id": "link-1"
}

Response:
{
  "success": true,
  "message": "Link deleted successfully"
}
```

### Reorder Links

Bulk reorder multiple links.

```
Tool: reorder_links
Args: {
  "links": [
    { "id": "link-2", "position": 1 },
    { "id": "link-3", "position": 2 },
    { "id": "link-1", "position": 3 }
  ]
}

Response:
{
  "success": true,
  "message": "Links reordered successfully"
}
```

## Theme Tools

### List Themes

Get all available themes (builtin and custom).

```
Tool: list_themes
Args: {}

Example Response:
[
  {
    "id": "theme-dark-1",
    "name": "Dark Modern",
    "is_builtin": true,
    "config": {
      "background": "#000000",
      "text": "#ffffff",
      "primary": "#3b82f6",
      "font_family": "Inter"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": "custom-theme-1",
    "name": "My Custom Theme",
    "is_builtin": false,
    "config": { ... },
    "created_at": "2024-02-15T10:30:00Z",
    "updated_at": "2024-02-20T14:45:00Z"
  }
]
```

### Apply Theme

Set active theme for the profile.

```
Tool: apply_theme
Args: {
  "theme_id": "theme-dark-1"
}

Response:
{
  "success": true,
  "message": "Theme \"Dark Modern\" applied successfully",
  "theme_id": "theme-dark-1"
}
```

### Create Theme

Create a custom theme.

```
Tool: create_theme
Args: {
  "name": "Neon Vibes",
  "config": {
    "background": "#0a0e27",
    "text": "#ffffff",
    "primary": "#00ff88",
    "secondary": "#ff006e",
    "accent": "#ffd60a",
    "font_family": "Poppins",
    "border_radius": "12px",
    "shadow": true
  }
}

Response: Created theme object
```

### Update Theme

Update an existing custom theme.

```
Tool: update_theme
Args: {
  "theme_id": "custom-theme-1",
  "config": {
    "background": "#0a0e27",
    "text": "#ffffff",
    "primary": "#00ff88"
  }
}

Response: Updated theme object
```

## Analytics Tools

### Get Profile Analytics

Get aggregate analytics for the entire profile.

```
Tool: get_analytics
Args: {
  "days": 30
}

Example Response:
{
  "period_days": 30,
  "total_views": 1542,
  "total_clicks": 287,
  "top_links": [
    {
      "link_id": "link-2",
      "title": "My Blog",
      "url": "https://blog.example.com",
      "clicks": 145
    },
    {
      "link_id": "link-3",
      "title": "Twitter",
      "url": "https://twitter.com/johndoe",
      "clicks": 89
    }
  ],
  "device_breakdown": [
    { "device_type": "mobile", "count": 1200 },
    { "device_type": "desktop", "count": 300 },
    { "device_type": "tablet", "count": 42 }
  ],
  "top_countries": [
    { "country": "United States", "count": 800 },
    { "country": "India", "count": 350 },
    { "country": "United Kingdom", "count": 220 }
  ],
  "top_browsers": [
    { "browser": "Chrome", "count": 900 },
    { "browser": "Safari", "count": 350 },
    { "browser": "Firefox", "count": 150 }
  ]
}
```

### Get Link Analytics

Get detailed analytics for a specific link.

```
Tool: get_link_analytics
Args: {
  "link_id": "link-2",
  "days": 30
}

Example Response:
{
  "link_id": "link-2",
  "link_title": "My Blog",
  "link_url": "https://blog.example.com",
  "period_days": 30,
  "total_clicks": 145,
  "total_views": 487,
  "device_breakdown": [
    { "device": "mobile", "count": 350 },
    { "device": "desktop", "count": 120 },
    { "device": "tablet", "count": 17 }
  ],
  "countries": [
    { "country": "United States", "count": 300 },
    { "country": "India", "count": 100 },
    { "country": "United Kingdom", "count": 87 }
  ],
  "browsers": [
    { "browser": "Chrome", "count": 280 },
    { "browser": "Safari", "count": 120 },
    { "browser": "Firefox", "count": 87 }
  ],
  "recent_events": [
    {
      "event_type": "click",
      "device_type": "mobile",
      "country": "United States",
      "browser": "Chrome",
      "created_at": "2024-02-24T15:30:00Z"
    }
    // ... more events
  ]
}
```

## Plugin Tools

### List Plugins

Get all installed plugins.

```
Tool: list_plugins
Args: {}

Example Response:
[
  {
    "id": "plugin-1",
    "plugin_name": "email-capture",
    "config": {
      "form_title": "Subscribe to my newsletter",
      "button_text": "Subscribe",
      "success_message": "Thanks for subscribing!"
    },
    "installed_at": "2024-02-15T10:30:00Z"
  },
  {
    "id": "plugin-2",
    "plugin_name": "calendar-booking",
    "config": {
      "calendar_id": "cal-123",
      "availability_hours": "9-17"
    },
    "installed_at": "2024-02-10T08:00:00Z"
  }
]
```

### Install Plugin

Install a new plugin.

```
Tool: install_plugin
Args: {
  "plugin_name": "video-embed",
  "config": {
    "video_url": "https://youtube.com/embed/abc123",
    "autoplay": false,
    "width": "100%"
  }
}

Response: Installed plugin object
```

### Uninstall Plugin

Remove an installed plugin.

```
Tool: uninstall_plugin
Args: {
  "plugin_id": "plugin-1"
}

Response:
{
  "success": true,
  "message": "Plugin \"email-capture\" uninstalled successfully"
}
```

### Configure Plugin

Update plugin settings.

```
Tool: configure_plugin
Args: {
  "plugin_id": "plugin-2",
  "config": {
    "calendar_id": "cal-456",
    "availability_hours": "10-18",
    "timezone": "EST"
  }
}

Response: Updated plugin object
```

## Subscriber Tools

### List Subscribers

Get email subscribers with pagination.

```
Tool: list_subscribers
Args: {
  "limit": 50,
  "offset": 0
}

Example Response:
{
  "subscribers": [
    {
      "id": "sub-1",
      "email": "jane@example.com",
      "name": "Jane Smith",
      "subscribed_at": "2024-02-20T10:30:00Z"
    },
    {
      "id": "sub-2",
      "email": "bob@example.com",
      "name": "Bob Johnson",
      "subscribed_at": "2024-02-18T14:15:00Z"
    }
  ],
  "total": 247,
  "limit": 50,
  "offset": 0
}
```

### Export Subscribers

Export all subscribers as CSV.

```
Tool: export_subscribers
Args: {}

Example Response:
{
  "csv": "Email,Name,Subscribed At\n\"jane@example.com\",\"Jane Smith\",\"2024-02-20T10:30:00Z\"\n\"bob@example.com\",\"Bob Johnson\",\"2024-02-18T14:15:00Z\"\n...",
  "total_subscribers": 247,
  "filename": "subscribers-2024-02-25.csv"
}
```

## Common Workflow Examples

### Example 1: Update Profile and Add Links

```
1. get_profile
   → Review current profile

2. update_profile with new title and bio
   → Update profile information

3. create_link for Blog
4. create_link for YouTube
5. create_link for Twitter
   → Add three new links

6. reorder_links
   → Arrange links in desired order

7. get_profile
   → Verify changes
```

### Example 2: Manage Theme

```
1. list_themes
   → Browse available themes

2. apply_theme with chosen theme_id
   → Apply a builtin theme

3. list_subscribers (optional)
   → See who's visiting your updated page

4. get_analytics
   → Check if new theme affects engagement
```

### Example 3: Analytics Review

```
1. get_analytics with days=7
   → Get last week's performance

2. get_link_analytics for top-performing links
   → Analyze specific links

3. Identify top-performing links and highlight them
4. update_link to set highlight=true for top links
```

### Example 4: Newsletter Setup

```
1. install_plugin with email-capture
   → Set up email collection

2. list_subscribers
   → View collected emails

3. export_subscribers
   → Download CSV for external use

4. get_analytics
   → Track email signup conversion rate
```
