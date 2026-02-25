import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import Head from 'next/head';

interface LinkItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  type: 'link' | 'youtube' | 'spotify' | 'social';
  animation_type?: string;
  is_highlighted?: boolean;
  enabled: boolean;
  position: number;
  clicks?: number;
}

interface Stats {
  total_views: number;
  total_clicks: number;
  ctr: number;
  subscriber_count: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    type: 'link' as 'link' | 'youtube' | 'spotify' | 'social',
    animation_type: 'none',
    is_highlighted: false,
  });

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch data
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [linksRes, statsRes] = await Promise.all([
          fetch('/api/links', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/analytics/summary', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (linksRes.ok) {
          setLinks(await linksRes.json());
        }
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleOpenModal = (link?: LinkItem) => {
    if (link) {
      setEditingLink(link);
      setFormData({
        title: link.title,
        url: link.url,
        description: link.description || '',
        type: link.type as 'link' | 'youtube' | 'spotify' | 'social',
        animation_type: link.animation_type || 'none',
        is_highlighted: link.is_highlighted || false,
      });
    } else {
      setEditingLink(null);
      setFormData({
        title: '',
        url: '',
        description: '',
        type: 'link',
        animation_type: 'none',
        is_highlighted: false,
      });
    }
    setShowModal(true);
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingLink ? 'PUT' : 'POST';
      const endpoint = editingLink ? `/api/links/${editingLink.id}` : '/api/links';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const savedLink = await response.json();
        if (editingLink) {
          setLinks(links.map((l) => (l.id === savedLink.id ? savedLink : l)));
        } else {
          setLinks([...links, savedLink]);
        }
        setShowModal(false);
      } else {
        alert('Failed to save link');
      }
    } catch (error) {
      console.error('Error saving link:', error);
      alert('An error occurred');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setLinks(links.filter((l) => l.id !== linkId));
      } else {
        alert('Failed to delete link');
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('An error occurred');
    }
  };

  const handleToggleLink = async (linkId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: !enabled }),
      });

      if (response.ok) {
        const updated = await response.json();
        setLinks(links.map((l) => (l.id === linkId ? updated : l)));
      }
    } catch (error) {
      console.error('Error toggling link:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout title="Links">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - LinkFlow</title>
      </Head>

      <DashboardLayout title="Links">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Total Views</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {stats.total_views.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Total Clicks</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {stats.total_clicks.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Click Rate</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {(stats.ctr * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Subscribers</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {stats.subscriber_count.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Links Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Links</h2>
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary"
            >
              + Add New Link
            </button>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {links.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-500 dark:text-slate-400 mb-4">No links yet. Create your first link!</p>
                <button
                  onClick={() => handleOpenModal()}
                  className="btn-primary"
                >
                  Create Link
                </button>
              </div>
            ) : (
              links.map((link) => (
                <div
                  key={link.id}
                  className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200 flex items-start gap-4"
                >
                  {/* Drag Handle */}
                  <div className="text-slate-400 dark:text-slate-600 cursor-grab mt-1">
                    ⋮⋮
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                      {link.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate mb-2">
                      {link.url}
                    </p>
                    {link.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {link.description}
                      </p>
                    )}
                    <div className="flex gap-4 mt-3 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        {link.clicks || 0} clicks
                      </span>
                      {link.is_highlighted && (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          ★ Highlighted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleLink(link.id, link.enabled)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        link.enabled
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {link.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleOpenModal(link)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg max-w-md w-full">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingLink ? 'Edit Link' : 'Create New Link'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveLink} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="input-base"
                    placeholder="My Awesome Link"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                    className="input-base"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-base"
                    placeholder="Brief description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="input-base"
                  >
                    <option value="link">Link</option>
                    <option value="youtube">YouTube</option>
                    <option value="spotify">Spotify</option>
                    <option value="social">Social</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Animation
                  </label>
                  <select
                    value={formData.animation_type}
                    onChange={(e) => setFormData({ ...formData, animation_type: e.target.value })}
                    className="input-base"
                  >
                    <option value="none">None</option>
                    <option value="bounce">Bounce</option>
                    <option value="pulse">Pulse</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="highlighted"
                    checked={formData.is_highlighted}
                    onChange={(e) => setFormData({ ...formData, is_highlighted: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <label htmlFor="highlighted" className="text-sm text-slate-700 dark:text-slate-300">
                    Highlight this link
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingLink ? 'Update' : 'Create'}
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
