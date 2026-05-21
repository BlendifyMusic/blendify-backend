import { Module } from '@nestjs/common';
import { MusicService } from './music.service';
import { LastfmAdapter } from './lastfm.adapter';
import { YtMusicAdapter } from './ytmusic.adapter';

@Module({
  providers: [MusicService, LastfmAdapter, YtMusicAdapter],
  exports: [MusicService],
})
export class MusicModule {}
