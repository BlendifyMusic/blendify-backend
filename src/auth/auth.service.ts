import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirebaseService } from '../firebase/firebase.service';
import { User } from '../entities/user.entity';
import { createHash } from 'crypto';
import { Platform } from '../music/types';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface LastfmSession {
  name: string;
  key: string;
  subscriber: number;
}

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private firebase: FirebaseService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  getLastfmAuthUrl(state: string): string {
    const params = new URLSearchParams({
      api_key: this.config.get('LASTFM_API_KEY')!,
      cb: `${this.config.get('LASTFM_CALLBACK_URI')}?state=${state}`,
    });
    return `https://www.last.fm/api/auth/?${params}`;
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

  async exchangeLastfmToken(token: string): Promise<LastfmSession> {
    const apiKey = this.config.get('LASTFM_API_KEY')!;
    const secret = this.config.get('LASTFM_SHARED_SECRET')!;

    const sigParams: Record<string, string> = {
      api_key: apiKey,
      method: 'auth.getSession',
      token,
    };
    const apiSig = this.lastfmSign(sigParams, secret);

    const params = new URLSearchParams({
      method: 'auth.getSession',
      api_key: apiKey,
      token,
      api_sig: apiSig,
      format: 'json',
    });

    const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${params}`);
    const data = await res.json();

    if (data.error) {
      throw new Error(`Last.fm auth failed: ${data.message}`);
    }

    return data.session;
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

  async getLastfmProfile(
    sessionKey: string,
  ): Promise<{ name: string; image: string }> {
    const apiKey = this.config.get('LASTFM_API_KEY')!;
    const params = new URLSearchParams({
      method: 'user.getInfo',
      api_key: apiKey,
      sk: sessionKey,
      format: 'json',
    });
    const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${params}`);
    const data = await res.json();
    const user = data.user;
    const images = user?.image || [];
    const imageUrl =
      images.find((i: any) => i.size === 'extralarge')?.['#text'] ||
      images.find((i: any) => i.size === 'large')?.['#text'] ||
      '';

    return { name: user?.name || '', image: imageUrl };
  }

  async getGoogleProfile(
    accessToken: string,
  ): Promise<{ sub: string; name: string; picture: string }> {
    const res = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google profile fetch failed: ${text}`);
    }
    return res.json();
  }

  async createOrUpdateUser(
    platform: Platform,
    platformUserId: string,
    displayName: string,
    avatarUrl: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    lastfmUsername?: string,
  ): Promise<string> {
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    let existing = await this.userRepo.findOne({
      where: { platform, platformUserId },
    });

    let uid: string;
    if (!existing) {
      const userRecord = await this.firebase.auth.createUser({ displayName });
      uid = userRecord.uid;
      existing = this.userRepo.create({
        uid,
        displayName,
        avatarUrl,
        platform,
        platformUserId,
        accessToken,
        refreshToken,
        tokenExpiresAt,
        lastfmUsername: lastfmUsername || null,
      });
      await this.userRepo.save(existing);
    } else {
      uid = existing.uid;
      existing.displayName = displayName;
      existing.avatarUrl = avatarUrl;
      existing.accessToken = accessToken;
      existing.refreshToken = refreshToken;
      existing.tokenExpiresAt = tokenExpiresAt;
      if (lastfmUsername) existing.lastfmUsername = lastfmUsername;
      await this.userRepo.save(existing);
    }

    return uid;
  }

  async createFirebaseToken(uid: string): Promise<string> {
    return this.firebase.auth.createCustomToken(uid);
  }

  private lastfmSign(
    params: Record<string, string>,
    secret: string,
  ): string {
    const keys = Object.keys(params).sort();
    let sig = '';
    for (const key of keys) {
      sig += key + params[key];
    }
    sig += secret;
    return createHash('md5').update(sig, 'utf8').digest('hex');
  }
}
