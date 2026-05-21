import { Injectable } from '@nestjs/common';
import { LastfmAdapter } from './lastfm.adapter';
import { YtMusicAdapter } from './ytmusic.adapter';
import { ListeningProfile, Platform } from './types';

@Injectable()
export class MusicService {
  constructor(
    private lastfm: LastfmAdapter,
    private ytMusic: YtMusicAdapter,
  ) {}

  async fetchListeningProfile(
    platform: Platform,
    accessTokenOrUsername: string,
  ): Promise<ListeningProfile> {
    if (platform === 'lastfm') {
      return this.lastfm.fetchListeningProfile(accessTokenOrUsername);
    }
    return this.ytMusic.fetchListeningProfile(accessTokenOrUsername);
  }
}
