import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import Link from 'next/link';

interface SocialIcon {
  platform: string;
  url: string;
}

interface LinkItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  type: 'link' | 'youtube' | 'spotify' | 'social';
  animation_type?: string;
  is_highlighted?: boolean;
  is_scheduled?: boolean;
  scheduled_start?: string;
  scheduled_end?: string;
  enabled: boolean;
}

interface Theme {
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  border_radius?: number;
  button_style?: string;
  font_family?: string;
}

interface UserProfile {
  id: string;
  username: string;
  title?: string;
  bio?: string;
  avatar?: string;
  links: LinkItem[];
  social_icons?: SocialIcon[];
  theme?: Theme;
  email_subscription_enabled?: boolean;
  total_views?: number;
}

interface Props {
  profile: UserProfile;
  error?: string;
}

const SOCIAL_ICONS: Record<string, string> = {
  twitter: '𝕏',
  instagram: '📷',
  github: '🐙',
  youtube: '▶️',
  tiktok: '🎵',
  linkedin: '💼',
  facebook: 'f',
  twitch: '🎮',
  discord: '💬',
};

export default function PublicProfile({ profile, error }: Props) {
  const [clicked, setClicked] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Track page view
    trackEvent('pageview');
  }, [profile?.id]);

  const trackEvent = async (eventType: string, linkId?: string) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          event_type: eventType,
          link_id: linkId,
        }),
      });
    } catch (err) {
      console.error('Analytics tracking failed:', err);
    }
  };

  const handleLinkClick = (link: LinkItem) => {
    trackEvent('link_click', link.id);
    setClicked(link.id);
    setTimeout(() => window.open(link.url, '_blank'), 100);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribeStatus('loading');

    try {
      const response = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          email,
        }),
      });

      if (response.ok) {
        setSubscribeStatus('success');
        setEmail('');
        setTimeout(() => setSubscribeStatus('idle'), 3000);
      } else {
        setSubscribeStatus('error');
      }
    } catch (err) {
      setSubscribeStatus('error');
      console.error(err);
    }
  };

  const isLinkScheduled = (link: LinkItem): boolean => {
    if (!link.is_scheduled || !link.scheduled_start || !link.scheduled_end) return false;
    const now = new Date();
    const start = new Date(link.scheduled_start);
    const end = new Date(link.scheduled_end);
    return now >= start && now <= end;
  };

  const getAnimationClass = (animationType?: string): string => {
    const baseClass = 'hover:scale-105 transition-transform duration-200';
    switch (animationType) {
      case 'bounce':
        return baseClass + ' hover:animate-bounce';
      case 'pulse':
        return baseClass + ' hover:animate-pulse';
      default:
        return baseClass;
    }
  };

  if (error || !profile) {
    return (
      <>
        <Head>
          <title>Profile Not Found - LinkFlow</title>
        </Head>
        <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Profile Not Found</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{error || 'Profile not found'}</p>
            <Link href="/" className="btn-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  const themeVars = profile.theme
    ? {
        '--primary-color': profile.theme.primary_color || '#3b82f6',
        '--secondary-color': profile.theme.secondary_color || '#8b5cf6',
        '--background-color': profile.theme.background_color || '#ffffff',
        '--text-color': profile.theme.text_color || '#000000',
      }
    : {};

  return (
    <>
      <Head>
        <title>{profile.title || profile.username} - LinkFlow</title>
        <meta name="description" content={profile.bio || `Check out ${profile.username}'s LinkFlow page`} />
        <meta property="og:title" content={profile.title || profile.username} />
        <meta property="og:description" content={profile.bio || `Check out ${profile.username}'s LinkFlow page`} />
        {profile.avatar && <meta property="og:image" content={profile.avatar} />}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen" style={themeVars as React.CSSProperties}>
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-blue-50 to-transparent dark:from-slate-900 dark:to-slate-950 py-12 md:py-20">
          <div className="max-w-2xl mx-auto px-4 text-center">
            {/* Avatar */}
            {profile.avatar && (
              <img
                src={profile.avatar}
                alt={profile.username}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto mb-6 border-4 border-blue-100 dark:border-slate-800 object-cover"
              />
            )}

            {/* Profile Info */}
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              {profile.title || profile.username}
            </h1>
            {profile.bio && (
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 max-w-xl mx-auto">
                {profile.bio}
              </p>
            )}

            {/* Social Icons */}
            {profile.social_icons && profile.social_icons.length > 0 && (
              <div className="flex justify-center gap-4 mb-8">
                {profile.social_icons.map((social) => (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-slate-700 transition-colors duration-200"
                    title={social.platform}
                  >
                    {SOCIAL_ICONS[social.platform] || social.platform[0].toUpperCase()}
                  </a>
                ))}
              </div>
            )}

            {/* Stats */}
            {profile.total_views !== undefined && (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {profile.total_views.toLocaleString()} views
              </div>
            )}
          </div>
        </div>

        {/* Links Section */}
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="space-y-3">
            {profile.links.map((link) => {
              const shouldShow = link.enabled && (!link.is_scheduled || isLinkScheduled(link));

              if (!shouldShow) return null;

              if (link.type === 'youtube' && link.url.includes('youtube.com')) {
                return (
                  <div
                    key={link.id}
                    className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="aspect-video bg-black">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${new URL(link.url).searchParams.get('v')}`}
                        title={link.title}
                        allowFullScreen
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{link.title}</h3>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link)}
                  className={`
                    w-full p-4 text-center rounded-xl transition-all duration-200
                    bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                    hover:shadow-lg
                    ${link.is_highlighted ? 'ring-2 ring-blue-500 shadow-lg' : ''}
                    ${clicked === link.id ? 'scale-95' : ''}
                    ${getAnimationClass(link.animation_type)}
                  `}
                >
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {link.title}
                  </h3>
                  {link.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {link.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Email Subscription */}
        {profile.email_subscription_enabled && (
          <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Subscribe for Updates
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Get notified when new links are added
              </p>

              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={subscribeStatus === 'loading'}
                  className="input-base flex-1"
                />
                <button
                  type="submit"
                  disabled={subscribeStatus === 'loading'}
                  className="btn-primary whitespace-nowrap disabled:opacity-50"
                >
                  {subscribeStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>

              {subscribeStatus === 'success' && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-3">
                  Successfully subscribed!
                </p>
              )}
              {subscribeStatus === 'error' && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-3">
                  Something went wrong. Please try again.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
          <p>
            Made with <span className="text-red-500">❤️</span> by{' '}
            <a href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              LinkFlow
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { username } = context.params as { username: string };

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const response = await fetch(`${baseUrl}/api/profiles/${username}`);

    if (!response.ok) {
      return {
        props: {
          profile: null,
          error: 'Profile not found',
        },
      };
    }

    const profile = await response.json();

    return {
      props: {
        profile,
      },
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return {
      props: {
        profile: null,
        error: 'Failed to load profile',
      },
    };
  }
};
