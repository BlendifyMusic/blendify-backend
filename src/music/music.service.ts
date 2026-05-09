import { Injectable } from '@nestjs/common';
import { SpotifyAdapter } from './spotify.adapter';
import { YtMusicAdapter } from './ytmusic.adapter';
import { ListeningProfile, Platform } from './types';

@Injectable()
export class MusicService {
  constructor(
    private spotify: SpotifyAdapter,
    private ytMusic: YtMusicAdapter,
  ) {}

  async fetchListeningProfile(
    platform: Platform,
    accessToken: string,
  ): Promise<ListeningProfile> {
    if (platform === 'spotify') {
      return this.spotify.fetchListeningProfile(accessToken);
    }
    return this.ytMusic.fetchListeningProfile(accessToken);
  }
}
