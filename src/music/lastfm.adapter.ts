import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ListeningProfile, NormalizedArtist, NormalizedTrack } from './types';

const PERIODS = ['7day', '1month', '6month', 'overall'] as const;
const PERIOD_WEIGHTS: Record<string, number> = {
  '7day': 4,
  '1month': 3,
  '6month': 2,
  overall: 1,
};

const GENRE_CACHE = new Map<string, string[]>();

@Injectable()
export class LastfmAdapter {
  private apiKey: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get('LASTFM_API_KEY')!;
  }

  async fetchListeningProfile(username: string): Promise<ListeningProfile> {
    const [tracksByPeriod, artistsByPeriod] = await Promise.all([
      Promise.all(PERIODS.map((p) => this.fetchTopTracks(username, p))),
      Promise.all(PERIODS.map((p) => this.fetchTopArtists(username, p))),
    ]);

    const trackMap = new Map<string, NormalizedTrack>();
    for (let i = 0; i < PERIODS.length; i++) {
      const weight = PERIOD_WEIGHTS[PERIODS[i]];
      for (const track of tracksByPeriod[i]) {
        const key = track.mbid || `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;
        const existing = trackMap.get(key);
        if (!existing || existing.weight < weight) {
          trackMap.set(key, { ...track, weight });
        }
      }
    }

    const artistMap = new Map<string, NormalizedArtist>();
    for (let i = 0; i < PERIODS.length; i++) {
      for (const artist of artistsByPeriod[i]) {
        const key = artist.name.toLowerCase();
        if (!artistMap.has(key)) {
          artistMap.set(key, artist);
        }
      }
    }

    const artists = Array.from(artistMap.values());
    await this.enrichGenres(artists.slice(0, 30));

    for (const track of trackMap.values()) {
      const artist = artistMap.get(track.artist.toLowerCase());
      if (artist) track.genres = artist.genres;
    }

    return {
      tracks: Array.from(trackMap.values()),
      artists,
    };
  }

  private async fetchTopTracks(
    username: string,
    period: string,
  ): Promise<NormalizedTrack[]> {
    const data = await this.apiCall('user.getTopTracks', {
      user: username,
      period,
      limit: '50',
    });
    const items = data?.toptracks?.track || [];
    return items.map((item: any) => this.normalizeTrack(item));
  }

  private async fetchTopArtists(
    username: string,
    period: string,
  ): Promise<NormalizedArtist[]> {
    const data = await this.apiCall('user.getTopArtists', {
      user: username,
      period,
      limit: '50',
    });
    const items = data?.topartists?.artist || [];
    return items.map((item: any) => this.normalizeArtist(item));
  }

  private async enrichGenres(artists: NormalizedArtist[]): Promise<void> {
    const toFetch = artists.filter((a) => {
      const cached = GENRE_CACHE.get(a.name.toLowerCase());
      if (cached) {
        a.genres = cached;
        return false;
      }
      return true;
    });

    // Respect 5 req/sec rate limit — batch in groups of 4
    for (let i = 0; i < toFetch.length; i += 4) {
      const batch = toFetch.slice(i, i + 4);
      const results = await Promise.all(
        batch.map((a) => this.fetchArtistTags(a.name)),
      );
      for (let j = 0; j < batch.length; j++) {
        batch[j].genres = results[j];
        GENRE_CACHE.set(batch[j].name.toLowerCase(), results[j]);
      }
      if (i + 4 < toFetch.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  private async fetchArtistTags(artistName: string): Promise<string[]> {
    try {
      const data = await this.apiCall('artist.getTopTags', {
        artist: artistName,
      });
      const tags = data?.toptags?.tag || [];
      return tags
        .slice(0, 5)
        .map((t: any) => t.name?.toLowerCase())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  private normalizeTrack(item: any): NormalizedTrack {
    const images = item.image || [];
    const albumArt =
      images.find((i: any) => i.size === 'extralarge')?.['#text'] ||
      images.find((i: any) => i.size === 'large')?.['#text'] ||
      '';

    return {
      id: item.mbid || item.url || '',
      isrc: null,
      title: item.name || '',
      artist: item.artist?.name || '',
      artistId: item.artist?.mbid || '',
      album: '',
      albumArt,
      genres: [],
      popularity: item.playcount ? parseInt(item.playcount, 10) : null,
      platform: 'lastfm',
      weight: 0,
      mbid: item.mbid || null,
    };
  }

  private normalizeArtist(item: any): NormalizedArtist {
    const images = item.image || [];
    const imageUrl =
      images.find((i: any) => i.size === 'extralarge')?.['#text'] ||
      images.find((i: any) => i.size === 'large')?.['#text'] ||
      '';

    return {
      id: item.mbid || item.url || '',
      name: item.name || '',
      genres: [],
      imageUrl,
      platform: 'lastfm',
    };
  }

  private async apiCall(
    method: string,
    params: Record<string, string>,
  ): Promise<any> {
    const query = new URLSearchParams({
      method,
      api_key: this.apiKey,
      format: 'json',
      ...params,
    });
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?${query}`,
    );
    if (!res.ok) {
      throw new Error(`Last.fm API error: ${res.status}`);
    }
    return res.json();
  }
}
