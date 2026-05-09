import { Injectable } from '@nestjs/common';
import { ListeningProfile, NormalizedArtist, NormalizedTrack } from './types';

const TIME_RANGES = ['short_term', 'medium_term', 'long_term'] as const;
const WEIGHT_MAP: Record<string, number> = {
  short_term: 3,
  medium_term: 2,
  long_term: 1,
  recent: 2,
};

@Injectable()
export class SpotifyAdapter {
  async fetchListeningProfile(accessToken: string): Promise<ListeningProfile> {
    const headers = { Authorization: `Bearer ${accessToken}` };

    const [tracksByRange, artistsByRange, recentTracks] = await Promise.all([
      Promise.all(
        TIME_RANGES.map((range) =>
          this.fetchTopTracks(headers, range),
        ),
      ),
      Promise.all(
        TIME_RANGES.map((range) =>
          this.fetchTopArtists(headers, range),
        ),
      ),
      this.fetchRecentlyPlayed(headers),
    ]);

    const trackMap = new Map<string, NormalizedTrack>();

    for (let i = 0; i < TIME_RANGES.length; i++) {
      const weight = WEIGHT_MAP[TIME_RANGES[i]];
      for (const track of tracksByRange[i]) {
        const key = track.isrc || `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;
        const existing = trackMap.get(key);
        if (!existing || existing.weight < weight) {
          trackMap.set(key, { ...track, weight });
        }
      }
    }

    for (const track of recentTracks) {
      const key = track.isrc || `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;
      if (!trackMap.has(key)) {
        trackMap.set(key, { ...track, weight: WEIGHT_MAP.recent });
      }
    }

    const artistMap = new Map<string, NormalizedArtist>();
    for (const artists of artistsByRange) {
      for (const artist of artists) {
        if (!artistMap.has(artist.name.toLowerCase())) {
          artistMap.set(artist.name.toLowerCase(), artist);
        }
      }
    }

    return {
      tracks: Array.from(trackMap.values()),
      artists: Array.from(artistMap.values()),
    };
  }

  private async fetchTopTracks(
    headers: Record<string, string>,
    timeRange: string,
  ): Promise<NormalizedTrack[]> {
    const res = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`,
      { headers },
    );
    const data = await res.json();
    return (data.items || []).map((item: any) => this.normalizeTrack(item));
  }

  private async fetchTopArtists(
    headers: Record<string, string>,
    timeRange: string,
  ): Promise<NormalizedArtist[]> {
    const res = await fetch(
      `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=50`,
      { headers },
    );
    const data = await res.json();
    return (data.items || []).map((item: any) => this.normalizeArtist(item));
  }

  private async fetchRecentlyPlayed(
    headers: Record<string, string>,
  ): Promise<NormalizedTrack[]> {
    const res = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=50',
      { headers },
    );
    const data = await res.json();
    return (data.items || []).map((item: any) =>
      this.normalizeTrack(item.track),
    );
  }

  private normalizeTrack(item: any): NormalizedTrack {
    return {
      id: item.id,
      isrc: item.external_ids?.isrc || null,
      title: item.name,
      artist: item.artists?.[0]?.name || '',
      artistId: item.artists?.[0]?.id || '',
      album: item.album?.name || '',
      albumArt: item.album?.images?.[0]?.url || '',
      genres: [],
      popularity: item.popularity ?? null,
      platform: 'spotify',
      weight: 0,
    };
  }

  private normalizeArtist(item: any): NormalizedArtist {
    return {
      id: item.id,
      name: item.name,
      genres: item.genres || [],
      imageUrl: item.images?.[0]?.url || '',
      platform: 'spotify',
    };
  }
}
