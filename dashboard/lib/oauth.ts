/**
 * OAuth providers configuration and helpers.
 *
 * Configured via env vars, e.g.:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
 *
 * Callback URL convention: /api/auth/oauth/<provider>/callback
 */

import { randomBytes, createHash } from 'crypto';

export interface OAuthUserInfo {
  providerId: string;
  email: string;
  name: string | null;
}

interface OAuthProviderConfig {
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientId: string | undefined;
  clientSecret: string | undefined;
  scope: string;
}

const PROVIDERS: Record<string, OAuthProviderConfig> = {
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    scope: 'openid email profile',
  },
  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    scope: 'read:user user:email',
  },
};

export function getOAuthProvider(name: string): OAuthProviderConfig | null {
  const p = PROVIDERS[name];
  if (!p || !p.clientId || !p.clientSecret) return null;
  return p;
}

export function buildAuthorizeUrl(
  provider: string,
  redirectUri: string
): { url: string; state: string } | null {
  const config = getOAuthProvider(provider);
  if (!config) return null;

  const state = randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId!,
    redirect_uri: redirectUri,
    scope: config.scope,
    state,
  });

  return { url: `${config.authorizeUrl}?${params.toString()}`, state };
}

export function hashState(state: string): string {
  return createHash('sha256').update(state).digest('hex');
}

export async function exchangeCodeForUser(
  provider: string,
  code: string,
  redirectUri: string
): Promise<OAuthUserInfo | null> {
  const config = getOAuthProvider(provider);
  if (!config) return null;

  // Exchange code for access token
  const tokenRes = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.clientId!,
      client_secret: config.clientSecret!,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) return null;

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) return null;

  // Fetch user profile
  const userRes = await fetch(config.userInfoUrl, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) return null;

  const profile = await userRes.json();

  if (provider === 'google') {
    return {
      providerId: String(profile.id),
      email: profile.email,
      name: profile.name ?? null,
    };
  }

  if (provider === 'github') {
    // GitHub may not return an email in /user — try /user/emails
    let email: string | undefined = profile.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;
        email = emails.find((e) => e.primary && e.verified)?.email;
      }
    }
    if (!email) return null;
    return {
      providerId: String(profile.id),
      email,
      name: profile.name ?? profile.login ?? null,
    };
  }

  return null;
}
