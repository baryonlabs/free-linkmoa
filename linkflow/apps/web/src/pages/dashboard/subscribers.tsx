import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import Head from 'next/head';

interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
}

export default function SubscribersPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch subscribers
  useEffect(() => {
    if (!token) return;

    const fetchSubscribers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/subscribers', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          setSubscribers(await response.json());
        }
      } catch (error) {
        console.error('Failed to fetch subscribers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribers();
  }, [token]);

  const handleRemoveSubscriber = async (subscriberId: string) => {
    if (!confirm('Remove this subscriber?')) return;

    try {
      const response = await fetch(`/api/subscribers/${subscriberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSubscribers(subscribers.filter((s) => s.id !== subscriberId));
      }
    } catch (error) {
      console.error('Failed to remove subscriber:', error);
      alert('Failed to remove subscriber');
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout title="Subscribers">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading subscribers...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Subscribers - LinkFlow</title>
      </Head>

      <DashboardLayout title="Subscribers">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Total Subscribers: {subscribers.length}
            </h2>
          </div>

          {subscribers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                No subscribers yet
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Enable email subscriptions on your profile to get subscribers
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-3 bg-slate-50 dark:bg-slate-700/50 font-semibold text-slate-900 dark:text-white text-sm">
                <div>Email</div>
                <div>Subscribed Date</div>
                <div>Action</div>
              </div>

              {subscribers.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors items-center"
                >
                  <div className="text-slate-900 dark:text-white break-all">
                    {subscriber.email}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(subscriber.subscribed_at).toLocaleDateString()} at{' '}
                    {new Date(subscriber.subscribed_at).toLocaleTimeString()}
                  </div>
                  <button
                    onClick={() => handleRemoveSubscriber(subscriber.id)}
                    className="text-sm px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors w-fit"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
