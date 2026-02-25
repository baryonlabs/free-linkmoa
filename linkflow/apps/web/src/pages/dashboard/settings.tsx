import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import Head from 'next/head';

interface UserSettings {
  username: string;
  email: string;
  title?: string;
  bio?: string;
  avatar?: string;
  social_links?: {
    twitter?: string;
    instagram?: string;
    github?: string;
    youtube?: string;
    tiktok?: string;
    linkedin?: string;
  };
  seo_title?: string;
  seo_description?: string;
  api_token?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, token, logout, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserSettings>>({});
  const [showApiToken, setShowApiToken] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch settings
  useEffect(() => {
    if (!token) return;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setSettings(data);
          setFormData(data);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [token]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updated = await response.json();
        setSettings(updated);
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.new !== passwordForm.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwordForm.current,
          new_password: passwordForm.new,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setPasswordForm({ current: '', new: '', confirm: '' });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        logout();
        router.push('/');
      } else {
        setMessage({ type: 'error', text: 'Failed to delete account' });
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Settings - LinkFlow</title>
      </Head>

      <DashboardLayout title="Settings">
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Profile Settings
          </h2>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username || ''}
                  disabled
                  className="input-base opacity-50 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Display Title
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Designer & Developer"
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={formData.avatar || ''}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="input-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell people about yourself"
                rows={4}
                className="input-base"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Social Links */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Social Links
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveSettings(e);
            }}
            className="space-y-4"
          >
            {[
              { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/username' },
              { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
              { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
              { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
              { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@username' },
              { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
            ].map((social) => (
              <div key={social.key}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {social.label}
                </label>
                <input
                  type="url"
                  value={formData.social_links?.[social.key as keyof typeof formData.social_links] || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      social_links: {
                        ...(formData.social_links || {}),
                        [social.key]: e.target.value,
                      },
                    })
                  }
                  placeholder={social.placeholder}
                  className="input-base"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Social Links'}
            </button>
          </form>
        </div>

        {/* SEO Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            SEO Settings
          </h2>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Page Title
              </label>
              <input
                type="text"
                value={formData.seo_title || ''}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                placeholder="My LinkFlow Page"
                className="input-base"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Shown in search results and browser tabs
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Page Description
              </label>
              <textarea
                value={formData.seo_description || ''}
                onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                placeholder="Brief description for search engines"
                rows={3}
                className="input-base"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Shown in search results (max 160 characters)
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save SEO Settings'}
            </button>
          </form>
        </div>

        {/* Security */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Security
          </h2>

          {/* Change Password */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  required
                  className="input-base"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  required
                  className="input-base"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  required
                  className="input-base"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* API Token */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              API Token for MCP Integration
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Use this token to authenticate MCP requests
            </p>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 flex items-center justify-between">
              <code className="text-sm font-mono text-slate-900 dark:text-white truncate">
                {showApiToken ? settings?.api_token : '••••••••••••••••'}
              </code>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowApiToken(!showApiToken)}
                  className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                >
                  {showApiToken ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (settings?.api_token) {
                      navigator.clipboard.writeText(settings.api_token);
                      setMessage({ type: 'success', text: 'Token copied to clipboard' });
                    }
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">
            Danger Zone
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-6">
            These actions cannot be undone
          </p>

          <button
            onClick={handleDeleteAccount}
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </DashboardLayout>
    </>
  );
}
