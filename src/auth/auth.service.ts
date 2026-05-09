import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../firebase/firebase.service';
import { Platform } from '../music/types';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private firebase: FirebaseService,
  ) {}

  getSpotifyAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.get('SPOTIFY_CLIENT_ID')!,
      scope:
        'user-top-read user-read-recently-played playlist-modify-public playlist-modify-private',
      redirect_uri: this.config.get('SPOTIFY_REDIRECT_URI')!,
      state,
    });
    return `https://accounts.spotify.com/authorize?${params}`;
  }

  getYtMusicAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.get('GOOGLE_CLIENT_ID')!,
      scope: 'https://www.googleapis.com/auth/youtube.readonly openid profile email',
      redirect_uri: this.config.get('GOOGLE_REDIRECT_URI')!,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async exchangeSpotifyCode(code: string): Promise<TokenResponse> {
    const redirectUri = this.config.get('SPOTIFY_REDIRECT_URI')!;
    console.log('Spotify token exchange with redirect_uri:', redirectUri);

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${this.config.get('SPOTIFY_CLIENT_ID')}:${this.config.get('SPOTIFY_CLIENT_SECRET')}`,
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const text = await res.text();
    console.log('Spotify token response status:', res.status);
    console.log('Spotify token response:', text.substring(0, 200));
    if (!res.ok) {
      console.error('Spotify token exchange failed:', res.status, text);
      throw new Error(`Spotify token exchange failed: ${text}`);
    }
    return JSON.parse(text);
  }

  async exchangeGoogleCode(code: string): Promise<TokenResponse> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.get('GOOGLE_CLIENT_ID')!,
        client_secret: this.config.get('GOOGLE_CLIENT_SECRET')!,
        redirect_uri: this.config.get('GOOGLE_REDIRECT_URI')!,
      }),
    });
    return res.json();
  }

  async getSpotifyProfile(
    accessToken: string,
  ): Promise<{ id: string; display_name: string; images: { url: string }[] }> {
    console.log('Fetching Spotify profile with token:', accessToken?.substring(0, 10) + '...');
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const text = await res.text();
    if (!res.ok) {
      console.error('Spotify profile fetch failed:', res.status, text);
      throw new Error(`Spotify profile fetch failed: ${text}`);
    }
    return JSON.parse(text);
  }

  async getGoogleProfile(
    accessToken: string,
  ): Promise<{ sub: string; name: string; picture: string }> {
    const res = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const text = await res.text();
    console.log('Google profile response:', text.substring(0, 300));
    if (!res.ok) {
      throw new Error(`Google profile fetch failed: ${text}`);
    }
    return JSON.parse(text);
  }

  async createOrUpdateUser(
    platform: Platform,
    platformUserId: string,
    displayName: string,
    avatarUrl: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
  ): Promise<string> {
    const db = this.firebase.firestore;
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('platform', '==', platform)
      .where('platformUserId', '==', platformUserId)
      .limit(1)
      .get();

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
    const userData = {
      displayName,
      avatarUrl,
      platform,
      platformUserId,
      accessToken,
      refreshToken,
      tokenExpiresAt,
    };

    let uid: string;
    if (snapshot.empty) {
      const userRecord = await this.firebase.auth.createUser({ displayName });
      uid = userRecord.uid;
      await usersRef.doc(uid).set({ ...userData, createdAt: new Date() });
    } else {
      uid = snapshot.docs[0].id;
      await usersRef.doc(uid).update(userData);
    }

    return uid;
  }

  async createFirebaseToken(uid: string): Promise<string> {
    return this.firebase.auth.createCustomToken(uid);
  }

  async refreshSpotifyToken(refreshToken: string): Promise<TokenResponse> {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${this.config.get('SPOTIFY_CLIENT_ID')}:${this.config.get('SPOTIFY_CLIENT_SECRET')}`,
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    return res.json();
  }
}
