import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import Head from 'next/head';

interface Theme {
  id: string;
  name: string;
  description: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  is_custom?: boolean;
}

const PRESET_THEMES: Theme[] = [
  {
    id: 'blue',
    name: 'Ocean Blue',
    description: 'Clean and professional blue theme',
    primary_color: '#3b82f6',
    secondary_color: '#0ea5e9',
    background_color: '#ffffff',
    text_color: '#1f2937',
  },
  {
    id: 'purple',
    name: 'Purple Dream',
    description: 'Modern purple gradient theme',
    primary_color: '#8b5cf6',
    secondary_color: '#ec4899',
    background_color: '#ffffff',
    text_color: '#1f2937',
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Dark theme for night owls',
    primary_color: '#60a5fa',
    secondary_color: '#818cf8',
    background_color: '#1f2937',
    text_color: '#f3f4f6',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange and pink',
    primary_color: '#f97316',
    secondary_color: '#ec4899',
    background_color: '#fef3c7',
    text_color: '#78350f',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural green tones',
    primary_color: '#10b981',
    secondary_color: '#34d399',
    background_color: '#ecfdf5',
    text_color: '#065f46',
  },
  {
    id: 'neon',
    name: 'Neon Lights',
    description: 'Vibrant neon colors',
    primary_color: '#06b6d4',
    secondary_color: '#d946ef',
    background_color: '#0f172a',
    text_color: '#f8fafc',
  },
];

export default function ThemesPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [activeTheme, setActiveTheme] = useState<string>('blue');
  const [customThemes, setCustomThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    primary_color: '#3b82f6',
    secondary_color: '#8b5cf6',
    background_color: '#ffffff',
    text_color: '#000000',
  });

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch themes
  useEffect(() => {
    if (!token) return;

    const fetchThemes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/themes', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setCustomThemes(data.custom || []);
          setActiveTheme(data.active || 'blue');
        }
      } catch (error) {
        console.error('Failed to fetch themes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchThemes();
  }, [token]);

  const handleApplyTheme = async (themeId: string) => {
    try {
      const response = await fetch('/api/themes/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ theme_id: themeId }),
      });

      if (response.ok) {
        setActiveTheme(themeId);
      }
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  };

  const handleSaveCustomTheme = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingTheme ? 'PUT' : 'POST';
      const endpoint = editingTheme ? `/api/themes/${editingTheme.id}` : '/api/themes';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const savedTheme = await response.json();
        if (editingTheme) {
          setCustomThemes(customThemes.map((t) => (t.id === savedTheme.id ? savedTheme : t)));
        } else {
          setCustomThemes([...customThemes, savedTheme]);
        }
        setShowEditor(false);
        setEditingTheme(null);
        setFormData({
          name: '',
          description: '',
          primary_color: '#3b82f6',
          secondary_color: '#8b5cf6',
          background_color: '#ffffff',
          text_color: '#000000',
        });
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
      alert('Failed to save theme');
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!confirm('Delete this custom theme?')) return;

    try {
      const response = await fetch(`/api/themes/${themeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setCustomThemes(customThemes.filter((t) => t.id !== themeId));
      }
    } catch (error) {
      console.error('Failed to delete theme:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout title="Themes">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading themes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const allThemes = [...PRESET_THEMES, ...customThemes];

  return (
    <>
      <Head>
        <title>Themes - LinkFlow</title>
      </Head>

      <DashboardLayout title="Themes">
        <div className="mb-8 flex justify-between items-center">
          <p className="text-slate-600 dark:text-slate-400">
            Customize the appearance of your profile
          </p>
          <button
            onClick={() => {
              setEditingTheme(null);
              setFormData({
                name: '',
                description: '',
                primary_color: '#3b82f6',
                secondary_color: '#8b5cf6',
                background_color: '#ffffff',
                text_color: '#000000',
              });
              setShowEditor(true);
            }}
            className="btn-primary"
          >
            + Create Custom Theme
          </button>
        </div>

        {/* Theme Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allThemes.map((theme) => (
            <div
              key={theme.id}
              className={`rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                activeTheme === theme.id
                  ? 'border-blue-500 shadow-lg'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {/* Preview */}
              <div
                className="h-48 p-4 flex flex-col items-center justify-center"
                style={{
                  backgroundColor: theme.background_color,
                  color: theme.text_color,
                }}
              >
                <div
                  className="px-4 py-2 rounded-lg text-white font-bold mb-2"
                  style={{ backgroundColor: theme.primary_color }}
                >
                  Link
                </div>
                <div
                  className="px-4 py-2 rounded-lg text-white font-bold"
                  style={{ backgroundColor: theme.secondary_color }}
                >
                  Link
                </div>
              </div>

              {/* Info */}
              <div className="bg-white dark:bg-slate-800 p-4 border-t border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                  {theme.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                  {theme.description}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApplyTheme(theme.id)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTheme === theme.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {activeTheme === theme.id ? '✓ Active' : 'Apply'}
                  </button>

                  {theme.is_custom && (
                    <>
                      <button
                        onClick={() => {
                          setEditingTheme(theme);
                          setFormData({
                            name: theme.name,
                            description: theme.description,
                            primary_color: theme.primary_color,
                            secondary_color: theme.secondary_color,
                            background_color: theme.background_color,
                            text_color: theme.text_color,
                          });
                          setShowEditor(true);
                        }}
                        className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTheme(theme.id)}
                        className="px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Theme Editor Modal */}
        {showEditor && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingTheme ? 'Edit Theme' : 'Create Custom Theme'}
                </h2>
                <button
                  onClick={() => setShowEditor(false)}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCustomTheme} className="p-6 space-y-6">
                {/* Left: Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Theme Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="input-base"
                      placeholder="My Awesome Theme"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input-base"
                      rows={2}
                      placeholder="Brief description of your theme"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Primary Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600"
                        />
                        <input
                          type="text"
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="input-base flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600"
                        />
                        <input
                          type="text"
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="input-base flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Background Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.background_color}
                          onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                          className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600"
                        />
                        <input
                          type="text"
                          value={formData.background_color}
                          onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                          className="input-base flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Text Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.text_color}
                          onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                          className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600"
                        />
                        <input
                          type="text"
                          value={formData.text_color}
                          onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                          className="input-base flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Live Preview
                    </p>
                    <div
                      className="p-6 rounded-lg flex flex-col items-center justify-center gap-2 min-h-32"
                      style={{
                        backgroundColor: formData.background_color,
                        color: formData.text_color,
                      }}
                    >
                      <button
                        type="button"
                        className="px-6 py-2 rounded-lg font-bold text-white"
                        style={{ backgroundColor: formData.primary_color }}
                      >
                        Primary Button
                      </button>
                      <button
                        type="button"
                        className="px-6 py-2 rounded-lg font-bold text-white"
                        style={{ backgroundColor: formData.secondary_color }}
                      >
                        Secondary Button
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowEditor(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingTheme ? 'Update' : 'Create'} Theme
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    </>
  );
}
