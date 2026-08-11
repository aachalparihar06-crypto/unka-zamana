const CLIENT_ID = '2212bdd13b7c4619afc407ed8eb6f037';

// Determine redirect URI dynamically based on current page url
export function getRedirectUri() {
  // e.g. "http://localhost:5173/unka-zamana/" or "https://aachalparihar06-crypto.github.io/unka-zamana/"
  return window.location.origin + window.location.pathname;
}

function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values).map((x) => possible[x % possible.length]).join('');
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(a) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function redirectToSpotifyAuth() {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64urlencode(hashed);
  
  const state = generateRandomString(16);
  
  localStorage.setItem('spotify_code_verifier', codeVerifier);
  localStorage.setItem('spotify_auth_state', state);
  
  const scope = 'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state';
  
  const args = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: scope,
    redirect_uri: getRedirectUri(),
    state: state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge
  });
  
  window.location = 'https://accounts.spotify.com/authorize?' + args;
}

export async function getAccessToken(code) {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');
  const redirectUri = getRedirectUri();
  
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: CLIENT_ID,
    code_verifier: codeVerifier
  });
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to exchange token: ${errText}`);
  }
  
  const data = await response.json();
  
  // Store tokens and expiry info
  localStorage.setItem('spotify_access_token', data.access_token);
  localStorage.setItem('spotify_refresh_token', data.refresh_token);
  // Expiry is in seconds, convert to absolute timestamp (ms)
  const expiresAt = Date.now() + data.expires_in * 1000;
  localStorage.setItem('spotify_expires_at', expiresAt.toString());
  
  return data.access_token;
}

export async function refreshSpotifyToken() {
  const refreshToken = localStorage.getItem('spotify_refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID
  });
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  });
  
  if (!response.ok) {
    // If refresh fails, clear tokens to force re-auth
    clearSpotifyAuth();
    const errText = await response.text();
    throw new Error(`Failed to refresh token: ${errText}`);
  }
  
  const data = await response.json();
  localStorage.setItem('spotify_access_token', data.access_token);
  if (data.refresh_token) {
    localStorage.setItem('spotify_refresh_token', data.refresh_token);
  }
  const expiresAt = Date.now() + data.expires_in * 1000;
  localStorage.setItem('spotify_expires_at', expiresAt.toString());
  
  return data.access_token;
}

export function clearSpotifyAuth() {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_expires_at');
  localStorage.removeItem('spotify_code_verifier');
  localStorage.removeItem('spotify_auth_state');
}

export async function getSpotifyUserProfile(accessToken) {
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch Spotify user profile');
  }
  
  return await response.json();
}

export async function getValidAccessToken() {
  const token = localStorage.getItem('spotify_access_token');
  const expiresAt = localStorage.getItem('spotify_expires_at');
  
  if (!token || !expiresAt) {
    return null;
  }
  
  // If token is expired or expiring in next 60 seconds, refresh it
  if (Date.now() > parseInt(expiresAt) - 60000) {
    try {
      return await refreshSpotifyToken();
    } catch (e) {
      console.error('Failed to auto-refresh token:', e);
      return null;
    }
  }
  
  return token;
}
