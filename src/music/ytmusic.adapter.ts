import { Injectable } from '@nestjs/common';
import { ListeningProfile, NormalizedArtist, NormalizedTrack } from './types';

@Injectable()
export class YtMusicAdapter {
  async fetchListeningProfile(accessToken: string): Promise<ListeningProfile> {
    const headers = { Authorization: `Bearer ${accessToken}` };

    const likedVideos = await this.fetchLikedMusic(headers);
    const tracks = likedVideos.map((v, i) => this.normalizeTrack(v, i));

    const artistMap = new Map<string, NormalizedArtist>();
    for (const track of tracks) {
      const key = track.artist.toLowerCase();
      if (!artistMap.has(key)) {
        artistMap.set(key, {
          id: track.artistId,
          name: track.artist,
          genres: [],
          imageUrl: '',
          platform: 'ytmusic',
        });
      }
    }

    return {
      tracks,
      artists: Array.from(artistMap.values()),
    };
  }

  private async fetchLikedMusic(headers: Record<string, string>): Promise<any[]> {
    const videos: any[] = [];
    let pageToken = '';

    for (let page = 0; page < 4; page++) {
      const params = new URLSearchParams({
        part: 'snippet',
        playlistId: 'LM',
        maxResults: '50',
      });
      if (pageToken) params.set('pageToken', pageToken);

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?${params}`,
        { headers },
      );
      const data = await res.json();
      if (!data.items) break;

      videos.push(...data.items);
      pageToken = data.nextPageToken || '';
      if (!pageToken) break;
    }

    return videos;
  }

  private normalizeTrack(item: any, index: number): NormalizedTrack {
    const snippet = item.snippet || {};
    const { title, artist } = this.parseTitleArtist(
      snippet.title || '',
      snippet.videoOwnerChannelTitle || '',
    );

    return {
      id: snippet.resourceId?.videoId || `yt-${index}`,
      isrc: null,
      title,
      artist,
      artistId: snippet.videoOwnerChannelId || '',
      album: '',
      albumArt: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
      genres: [],
      popularity: null,
      platform: 'ytmusic',
      weight: 2,
    };
  }

  private parseTitleArtist(
    rawTitle: string,
    channelTitle: string,
  ): { title: string; artist: string } {
    const separators = [' - ', ' – ', ' — ', ' | '];
    for (const sep of separators) {
      if (rawTitle.includes(sep)) {
        const parts = rawTitle.split(sep);
        return {
          artist: parts[0].trim(),
          title: parts
            .slice(1)
            .join(sep)
            .replace(/\(Official.*?\)/gi, '')
            .replace(/\[Official.*?\]/gi, '')
            .replace(/\(Lyrics.*?\)/gi, '')
            .replace(/\(Audio.*?\)/gi, '')
            .trim(),
        };
      }
    }
    return {
      title: rawTitle
        .replace(/\(Official.*?\)/gi, '')
        .replace(/\[Official.*?\]/gi, '')
        .trim(),
      artist: channelTitle.replace(/ - Topic$/, '').trim(),
    };
  }
}
