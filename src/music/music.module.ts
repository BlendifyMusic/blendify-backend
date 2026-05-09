import { Module } from '@nestjs/common';
import { MusicService } from './music.service';
import { SpotifyAdapter } from './spotify.adapter';
import { YtMusicAdapter } from './ytmusic.adapter';

@Module({
  providers: [MusicService, SpotifyAdapter, YtMusicAdapter],
  exports: [MusicService],
})
export class MusicModule {}
