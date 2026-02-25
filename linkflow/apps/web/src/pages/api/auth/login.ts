import { NextApiRequest, NextApiResponse } from 'next';
import { loginUser } from '@/lib/auth';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emailOrUsername, password } = req.body;

    // Validate input
    if (!emailOrUsername || typeof emailOrUsername !== 'string') {
      return res.status(400).json({ error: 'Email or username is required' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Login user
    const result = loginUser(emailOrUsername, password);

    if (!result.success) {
      return res.status(401).json({ error: (result as { success: false; error: string }).error });
    }

    // Set httpOnly cookie with token
    const ok = result as { success: true; token: string; user: { id: string; username: string; email: string } };
    res.setHeader(
      'Set-Cookie',
      serialize('token', ok.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      })
    );

    return res.status(200).json({
      token: ok.token,
      user: ok.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
