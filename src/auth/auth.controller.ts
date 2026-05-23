import { Controller, Get, Query, Res, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import { AuthService } from './auth.service';
import { MusicService } from '../music/music.service';
import { ListeningData } from '../entities/listening-data.entity';
import { Platform } from '../music/types';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
    private musicService: MusicService,
    @InjectRepository(ListeningData)
    private listeningDataRepo: Repository<ListeningData>,
  ) {}

  @Get('lastfm')
  lastfmAuth(@Query('blendId') blendId: string, @Res() res: Response) {
    const state = JSON.stringify({ nonce: nanoid(), blendId: blendId || null });
    const encodedState = Buffer.from(state).toString('base64url');
    return res.redirect(this.authService.getLastfmAuthUrl(encodedState));
  }

  @Get('ytmusic')
  ytMusicAuth(@Query('blendId') blendId: string, @Res() res: Response) {
    const state = JSON.stringify({ nonce: nanoid(), blendId: blendId || null });
    const encodedState = Buffer.from(state).toString('base64url');
    return res.redirect(this.authService.getYtMusicAuthUrl(encodedState));
  }

  @Get('callback/lastfm')
  async lastfmCallback(
    @Query('token') token: string,
    @Query('state') stateParam: string,
    @Res() res: Response,
  ) {
    if (!token) throw new BadRequestException('Missing Last.fm token');

    const state = JSON.parse(
      Buffer.from(stateParam, 'base64url').toString(),
    );

    const session = await this.authService.exchangeLastfmToken(token);
    const profile = await this.authService.getLastfmProfile(session.key);

    const uid = await this.authService.createOrUpdateUser(
      'lastfm',
      session.name,
      profile.name || session.name,
      profile.image,
      session.key,
      '',
      365 * 24 * 60 * 60,
      session.name,
    );

    await this.fetchAndStoreMusic(uid, 'lastfm', session.name);

    const firebaseToken = await this.authService.createFirebaseToken(uid);
    const frontendUrl = this.config.get('FRONTEND_URL');
    const redirectPath = state.blendId
      ? `/auth/callback?firebaseToken=${firebaseToken}&blendId=${state.blendId}`
      : `/auth/callback?firebaseToken=${firebaseToken}`;

    return res.redirect(`${frontendUrl}${redirectPath}`);
  }

  @Get('callback/ytmusic')
  async ytMusicCallback(
    @Query('code') code: string,
    @Query('state') stateParam: string,
    @Res() res: Response,
  ) {
    if (!code) throw new BadRequestException('Missing authorization code');

    const state = JSON.parse(
      Buffer.from(stateParam, 'base64url').toString(),
    );

    const tokens = await this.authService.exchangeGoogleCode(code);
    const profile = await this.authService.getGoogleProfile(
      tokens.access_token,
    );

    const uid = await this.authService.createOrUpdateUser(
      'ytmusic',
      profile.sub,
      profile.name,
      profile.picture || '',
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in,
    );

    await this.fetchAndStoreMusic(uid, 'ytmusic', tokens.access_token);

    const firebaseToken = await this.authService.createFirebaseToken(uid);
    const frontendUrl = this.config.get('FRONTEND_URL');
    const redirectPath = state.blendId
      ? `/auth/callback?firebaseToken=${firebaseToken}&blendId=${state.blendId}`
      : `/auth/callback?firebaseToken=${firebaseToken}`;

    return res.redirect(`${frontendUrl}${redirectPath}`);
  }

  private async fetchAndStoreMusic(
    uid: string,
    platform: Platform,
    accessTokenOrUsername: string,
  ): Promise<void> {
    try {
      const profile = await this.musicService.fetchListeningProfile(
        platform,
        accessTokenOrUsername,
      );

      const existing = await this.listeningDataRepo.findOne({
        where: { userUid: uid },
      });

      if (existing) {
        existing.tracks = profile.tracks;
        existing.artists = profile.artists;
        await this.listeningDataRepo.save(existing);
      } else {
        const ld = this.listeningDataRepo.create({
          userUid: uid,
          tracks: profile.tracks,
          artists: profile.artists,
        });
        await this.listeningDataRepo.save(ld);
      }
    } catch {
      // Don't block auth if music fetch fails
    }
  }
}
