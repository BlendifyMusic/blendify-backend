import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Blend } from '../entities/blend.entity';
import { PlaylistTrack, Platform } from '../music/types';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Blend)
    private blendRepo: Repository<Blend>,
  ) {}

  async pushPlaylist(blendId: string, uid: string): Promise<string> {
    const user = await this.userRepo.findOneOrFail({ where: { uid } });
    const blend = await this.blendRepo.findOneOrFail({ where: { id: blendId } });
    const platform = user.platform as Platform;
    const tracks: PlaylistTrack[] = blend.result.playlist;
    const playlistName = `Blendify: ${blend.creatorName} × ${blend.joinerName}`;

    if (platform === 'ytmusic') {
      const playlistUrl = await this.createYtMusicPlaylist(
        user.accessToken,
        playlistName,
        tracks,
      );
      blend.playlistUrls = { ...blend.playlistUrls, ytmusic: playlistUrl };
      await this.blendRepo.save(blend);
      return playlistUrl;
    }

    const trackList = tracks
      .map((t) => `${t.artist} - ${t.title}`)
      .join('\n');
    return `data:text/plain,${encodeURIComponent(trackList)}`;
  }

  private async createYtMusicPlaylist(
    accessToken: string,
    name: string,
    tracks: PlaylistTrack[],
  ): Promise<string> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const createRes = await fetch(
      'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          snippet: { title: name, description: 'Created with Blendify' },
          status: { privacyStatus: 'public' },
        }),
      },
    );
    const playlist = await createRes.json();

    const videoIds = tracks.map((t) => t.ytMusicId).filter(Boolean);
    for (const videoId of videoIds) {
      await fetch(
        'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            snippet: {
              playlistId: playlist.id,
              resourceId: { kind: 'youtube#video', videoId },
            },
          }),
        },
      );
    }

    return `https://music.youtube.com/playlist?list=${playlist.id}`;
  }
}
