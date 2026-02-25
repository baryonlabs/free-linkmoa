import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import Head from 'next/head';

interface LinkPerformance {
  id: string;
  title: string;
  clicks: number;
  views: number;
  ctr: number;
}

interface DeviceData {
  type: string;
  count: number;
  percentage: number;
}

interface Referrer {
  source: string;
  count: number;
}

interface AnalyticsData {
  total_views: number;
  total_clicks: number;
  click_rate: number;
  top_links: LinkPerformance[];
  devices: DeviceData[];
  top_referrers: Referrer[];
}

type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch analytics
  useEffect(() => {
    if (!token) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/summary?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          setData(await response.json());
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token, timeRange]);

  if (authLoading || loading) {
    return (
      <DashboardLayout title="Analytics">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Analytics - LinkFlow</title>
      </Head>

      <DashboardLayout title="Analytics">
        {/* Time Range Selector */}
        <div className="mb-8 flex gap-2 flex-wrap">
          {(['24h', '7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {range === '24h'
                ? '24 Hours'
                : range === '7d'
                  ? '7 Days'
                  : range === '30d'
                    ? '30 Days'
                    : range === '90d'
                      ? '90 Days'
                      : 'All Time'}
            </button>
          ))}
        </div>

        {data && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">
                  Total Views
                </p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white">
                  {data.total_views.toLocaleString()}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">
                  Total Clicks
                </p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white">
                  {data.total_clicks.toLocaleString()}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">
                  Click Rate
                </p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white">
                  {(data.click_rate * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Top Performing Links */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-8">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Top Performing Links
                </h2>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {data.top_links.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                    No click data yet
                  </div>
                ) : (
                  data.top_links.map((link) => (
                    <div key={link.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {link.title}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {link.clicks} clicks • {link.views} views
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600 dark:text-blue-400">
                            {(link.ctr * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            CTR
                          </p>
                        </div>
                      </div>

                      {/* Bar Chart */}
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min((link.ctr * 100) || 0, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                  Device Breakdown
                </h2>
                <div className="space-y-4">
                  {data.devices.map((device) => (
                    <div key={device.type}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {device.type}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {device.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${device.percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {device.count.toLocaleString()} visits
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Referrers */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                  Top Referrers
                </h2>
                <div className="space-y-3">
                  {data.top_referrers.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400">No referrer data yet</p>
                  ) : (
                    data.top_referrers.map((referrer) => (
                      <div
                        key={referrer.source}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                      >
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                          {referrer.source || 'Direct'}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white ml-2">
                          {referrer.count}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </DashboardLayout>
    </>
  );
}
