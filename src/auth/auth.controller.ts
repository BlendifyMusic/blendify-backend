import { Controller, Get, Query, Res, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import { AuthService } from './auth.service';
import { Platform } from '../music/types';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
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
      365 * 24 * 60 * 60, // Last.fm sessions don't expire
      session.name,
    );

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

    const firebaseToken = await this.authService.createFirebaseToken(uid);
    const frontendUrl = this.config.get('FRONTEND_URL');
    const redirectPath = state.blendId
      ? `/auth/callback?firebaseToken=${firebaseToken}&blendId=${state.blendId}`
      : `/auth/callback?firebaseToken=${firebaseToken}`;

    return res.redirect(`${frontendUrl}${redirectPath}`);
  }
}
