import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import Head from 'next/head';

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  is_installed: boolean;
  icon?: string;
}

export default function PluginsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch plugins
  useEffect(() => {
    if (!token) return;

    const fetchPlugins = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/plugins', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          setPlugins(await response.json());
        }
      } catch (error) {
        console.error('Failed to fetch plugins:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlugins();
  }, [token]);

  const handleInstallPlugin = async (pluginId: string) => {
    try {
      const response = await fetch(`/api/plugins/${pluginId}/install`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setPlugins(
          plugins.map((p) =>
            p.id === pluginId ? { ...p, is_installed: true } : p
          )
        );
      }
    } catch (error) {
      console.error('Failed to install plugin:', error);
      alert('Failed to install plugin');
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    if (!confirm('Are you sure you want to uninstall this plugin?')) return;

    try {
      const response = await fetch(`/api/plugins/${pluginId}/uninstall`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setPlugins(
          plugins.map((p) =>
            p.id === pluginId ? { ...p, is_installed: false } : p
          )
        );
      }
    } catch (error) {
      console.error('Failed to uninstall plugin:', error);
      alert('Failed to uninstall plugin');
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout title="Plugins">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading plugins...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Plugins - LinkFlow</title>
      </Head>

      <DashboardLayout title="Plugins">
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Extend LinkFlow functionality with plugins
        </p>

        {plugins.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No plugins available yet
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Check back soon for available plugins
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plugins.map((plugin) => (
              <div
                key={plugin.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {plugin.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      v{plugin.version} by {plugin.author}
                    </p>
                  </div>
                  {plugin.icon && (
                    <div className="text-3xl">{plugin.icon}</div>
                  )}
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  {plugin.description}
                </p>

                <button
                  onClick={() =>
                    plugin.is_installed
                      ? handleUninstallPlugin(plugin.id)
                      : handleInstallPlugin(plugin.id)
                  }
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    plugin.is_installed
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plugin.is_installed ? 'Uninstall' : 'Install'}
                </button>
              </div>
            ))}
          </div>
        )}
      </DashboardLayout>
    </>
  );
}
