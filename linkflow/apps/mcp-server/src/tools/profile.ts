import { getCurrentUserId } from '../utils/auth.js';
import { getDatabase, User } from '../utils/db.js';

export const profileTools = [
  {
    name: 'get_profile',
    description: 'Get the current user profile information',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'update_profile',
    description: 'Update the current user profile information',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Professional title or headline',
        },
        bio: {
          type: 'string',
          description: 'User biography',
        },
        avatar_url: {
          type: 'string',
          description: 'URL to avatar image',
        },
        social_links: {
          type: 'object',
          description: 'Social media links object (e.g., {twitter: "", instagram: ""})',
        },
        theme_id: {
          type: 'string',
          description: 'ID of the theme to apply',
        },
        seo_title: {
          type: 'string',
          description: 'SEO title for the profile page',
        },
        seo_description: {
          type: 'string',
          description: 'SEO description for the profile page',
        },
      },
      required: [],
    },
  },
];

export function handleGetProfile() {
  const userId = getCurrentUserId();
  const db = getDatabase();

  const user = db
    .prepare(
      `SELECT id, username, email, avatar_url, bio, title, social_links,
       theme_id, seo_title, seo_description, created_at, updated_at
       FROM users WHERE id = ?`
    )
    .get(userId) as User | undefined;

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar_url: user.avatar_url || null,
    bio: user.bio || null,
    title: user.title || null,
    social_links: user.social_links ? JSON.parse(user.social_links) : {},
    theme_id: user.theme_id || null,
    seo_title: user.seo_title || null,
    seo_description: user.seo_description || null,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export function handleUpdateProfile(args: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const db = getDatabase();

  const updates: Record<string, unknown> = {};
  const params: unknown[] = [];

  if (args.title !== undefined) {
    updates.title = '?';
    params.push(args.title);
  }
  if (args.bio !== undefined) {
    updates.bio = '?';
    params.push(args.bio);
  }
  if (args.avatar_url !== undefined) {
    updates.avatar_url = '?';
    params.push(args.avatar_url);
  }
  if (args.social_links !== undefined) {
    updates.social_links = '?';
    params.push(JSON.stringify(args.social_links));
  }
  if (args.theme_id !== undefined) {
    updates.theme_id = '?';
    params.push(args.theme_id);
  }
  if (args.seo_title !== undefined) {
    updates.seo_title = '?';
    params.push(args.seo_title);
  }
  if (args.seo_description !== undefined) {
    updates.seo_description = '?';
    params.push(args.seo_description);
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('No fields to update');
  }

  const updateStr = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(', ');

  params.push(userId);

  const stmt = db.prepare(
    `UPDATE users SET ${updateStr}, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  );
  const result = stmt.run(...params);

  if (result.changes === 0) {
    throw new Error('Failed to update profile');
  }

  // Return updated profile
  return handleGetProfile();
}
