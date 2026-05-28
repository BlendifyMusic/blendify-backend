import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Blend } from '../entities/blend.entity';
import { PlaylistTrack, Platform } from '../music/types';

@Injectable()
export class PlaylistService {
  private readonly logger = new Logger(PlaylistService.name);

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
      const resolvedTracks = await this.resolveYtMusicIds(
        user.accessToken,
        tracks,
      );
      const playlistUrl = await this.createYtMusicPlaylist(
        user.accessToken,
        playlistName,
        resolvedTracks,
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

  private async resolveYtMusicIds(
    accessToken: string,
    tracks: PlaylistTrack[],
  ): Promise<PlaylistTrack[]> {
    const resolved: PlaylistTrack[] = [];

    for (const track of tracks) {
      if (track.ytMusicId) {
        resolved.push(track);
        continue;
      }

      const videoId = await this.searchYtMusic(
        accessToken,
        `${track.artist} ${track.title}`,
      );
      resolved.push({ ...track, ytMusicId: videoId });
    }

    return resolved;
  }

  private async searchYtMusic(
    accessToken: string,
    query: string,
  ): Promise<string | null> {
    try {
      const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        videoCategoryId: '10',
        maxResults: '1',
      });

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const data = await res.json();

      if (data.error || !data.items?.length) {
        this.logger.warn(`No YT result for: ${query}`);
        return null;
      }

      return data.items[0].id?.videoId || null;
    } catch (e) {
      this.logger.error(`YT search failed for "${query}": ${e}`);
      return null;
    }
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

    if (playlist.error) {
      this.logger.error(`Playlist creation failed: ${JSON.stringify(playlist.error)}`);
      throw new Error(`Failed to create playlist: ${playlist.error.message}`);
    }

    const videoIds = tracks.map((t) => t.ytMusicId).filter(Boolean);
    for (const videoId of videoIds) {
      const addRes = await fetch(
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
      const addData = await addRes.json();
      if (addData.error) {
        this.logger.warn(`Failed to add ${videoId}: ${addData.error.message}`);
      }
    }

    return `https://music.youtube.com/playlist?list=${playlist.id}`;
  }
}
