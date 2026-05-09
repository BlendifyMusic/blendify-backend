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

  @Get('spotify')
  spotifyAuth(@Query('blendId') blendId: string, @Res() res: Response) {
    const state = JSON.stringify({ nonce: nanoid(), blendId: blendId || null });
    const encodedState = Buffer.from(state).toString('base64url');
    return res.redirect(this.authService.getSpotifyAuthUrl(encodedState));
  }

  @Get('ytmusic')
  ytMusicAuth(@Query('blendId') blendId: string, @Res() res: Response) {
    const state = JSON.stringify({ nonce: nanoid(), blendId: blendId || null });
    const encodedState = Buffer.from(state).toString('base64url');
    return res.redirect(this.authService.getYtMusicAuthUrl(encodedState));
  }

  @Get('callback/spotify')
  async spotifyCallback(
    @Query('code') code: string,
    @Query('state') stateParam: string,
    @Res() res: Response,
  ) {
    return this.handleCallback('spotify', code, stateParam, res);
  }

  @Get('callback/ytmusic')
  async ytMusicCallback(
    @Query('code') code: string,
    @Query('state') stateParam: string,
    @Res() res: Response,
  ) {
    return this.handleCallback('ytmusic', code, stateParam, res);
  }

  private async handleCallback(
    platform: Platform,
    code: string,
    stateParam: string,
    res: Response,
  ) {
    if (!code) throw new BadRequestException('Missing authorization code');

    const state = JSON.parse(
      Buffer.from(stateParam, 'base64url').toString(),
    );

    const tokens =
      platform === 'spotify'
        ? await this.authService.exchangeSpotifyCode(code)
        : await this.authService.exchangeGoogleCode(code);

    let platformUserId: string;
    let displayName: string;
    let avatarUrl: string;

    if (platform === 'spotify') {
      const profile = await this.authService.getSpotifyProfile(
        tokens.access_token,
      );
      platformUserId = profile.id;
      displayName = profile.display_name;
      avatarUrl = profile.images?.[0]?.url || '';
    } else {
      const profile = await this.authService.getGoogleProfile(
        tokens.access_token,
      );
      platformUserId = profile.sub;
      displayName = profile.name;
      avatarUrl = profile.picture || '';
    }

    const uid = await this.authService.createOrUpdateUser(
      platform,
      platformUserId,
      displayName,
      avatarUrl,
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
