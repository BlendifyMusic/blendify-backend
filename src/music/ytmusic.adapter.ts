import { Injectable, Logger } from '@nestjs/common';
import { ListeningProfile, NormalizedArtist, NormalizedTrack } from './types';

@Injectable()
export class YtMusicAdapter {
  private readonly logger = new Logger(YtMusicAdapter.name);

  async fetchListeningProfile(accessToken: string): Promise<ListeningProfile> {
    const headers = { Authorization: `Bearer ${accessToken}` };

    const videos = await this.fetchMusicVideos(headers);
    this.logger.log(`Fetched ${videos.length} videos from YouTube`);

    const tracks = videos.map((v, i) => this.normalizeTrack(v, i));

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

  private async fetchMusicVideos(headers: Record<string, string>): Promise<any[]> {
    const allVideos: any[] = [];

    const playlistIds = ['LM', 'LL'];
    for (const playlistId of playlistIds) {
      const videos = await this.fetchPlaylist(headers, playlistId);
      this.logger.log(`Playlist ${playlistId}: ${videos.length} items`);
      allVideos.push(...videos);
      if (allVideos.length > 0) break;
    }

    if (allVideos.length === 0) {
      const searchResults = await this.fetchLikedVideos(headers);
      this.logger.log(`Liked videos (ratings): ${searchResults.length} items`);
      allVideos.push(...searchResults);
    }

    if (allVideos.length === 0) {
      const channelVideos = await this.fetchSubscriptionBasedMusic(headers);
      this.logger.log(`Subscription-based music: ${channelVideos.length} items`);
      allVideos.push(...channelVideos);
    }

    return allVideos;
  }

  private async fetchPlaylist(headers: Record<string, string>, playlistId: string): Promise<any[]> {
    const videos: any[] = [];
    let pageToken = '';

    for (let page = 0; page < 4; page++) {
      const params = new URLSearchParams({
        part: 'snippet',
        playlistId,
        maxResults: '50',
      });
      if (pageToken) params.set('pageToken', pageToken);

      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?${params}`,
          { headers },
        );
        const data = await res.json();
        this.logger.log(`Playlist ${playlistId} page ${page}: ${JSON.stringify(data.error || { items: data.items?.length || 0 })}`);

        if (data.error || !data.items) break;

        videos.push(...data.items);
        pageToken = data.nextPageToken || '';
        if (!pageToken) break;
      } catch (e) {
        this.logger.error(`Playlist ${playlistId} fetch error: ${e}`);
        break;
      }
    }

    return videos;
  }

  private async fetchLikedVideos(headers: Record<string, string>): Promise<any[]> {
    const videos: any[] = [];
    let pageToken = '';

    for (let page = 0; page < 4; page++) {
      const params = new URLSearchParams({
        part: 'snippet',
        myRating: 'like',
        maxResults: '50',
        videoCategoryId: '10',
      });
      if (pageToken) params.set('pageToken', pageToken);

      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?${params}`,
          { headers },
        );
        const data = await res.json();
        if (data.error || !data.items) break;

        const mapped = data.items.map((item: any) => ({
          snippet: {
            ...item.snippet,
            resourceId: { videoId: item.id },
          },
        }));
        videos.push(...mapped);
        pageToken = data.nextPageToken || '';
        if (!pageToken) break;
      } catch {
        break;
      }
    }

    return videos;
  }

  private async fetchSubscriptionBasedMusic(headers: Record<string, string>): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        part: 'snippet',
        type: 'video',
        videoCategoryId: '10',
        maxResults: '50',
        q: 'music',
        relevanceLanguage: 'en',
      });

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${params}`,
        { headers },
      );
      const data = await res.json();
      if (data.error || !data.items) return [];

      return data.items.map((item: any) => ({
        snippet: {
          ...item.snippet,
          resourceId: { videoId: item.id?.videoId },
          videoOwnerChannelTitle: item.snippet?.channelTitle,
          videoOwnerChannelId: item.snippet?.channelId,
        },
      }));
    } catch {
      return [];
    }
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
