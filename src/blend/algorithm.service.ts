import { Injectable } from '@nestjs/common';
import { MatcherService } from './matcher.service';
import {
  ListeningProfile,
  NormalizedArtist,
  NormalizedTrack,
  BlendResult,
  PlaylistTrack,
} from '../music/types';

@Injectable()
export class AlgorithmService {
  constructor(private matcher: MatcherService) {}

  computeBlend(
    creator: ListeningProfile,
    joiner: ListeningProfile,
  ): BlendResult {
    const { shared, uniqueA, uniqueB } = this.matcher.findSharedTracks(
      creator.tracks,
      joiner.tracks,
    );

    const sharedArtists = this.findSharedArtists(
      creator.artists,
      joiner.artists,
    );

    const creatorGenres = this.buildGenreDistribution(creator.artists);
    const joinerGenres = this.buildGenreDistribution(joiner.artists);

    const allCreatorGenres = new Set(Object.keys(creatorGenres));
    const allJoinerGenres = new Set(Object.keys(joinerGenres));
    const sharedGenres = [...allCreatorGenres].filter((g) =>
      allJoinerGenres.has(g),
    );
    const creatorUniqueGenres = [...allCreatorGenres].filter(
      (g) => !allJoinerGenres.has(g),
    );
    const joinerUniqueGenres = [...allJoinerGenres].filter(
      (g) => !allCreatorGenres.has(g),
    );

    const trackOverlap =
      shared.length /
      Math.max(
        1,
        Math.min(creator.tracks.length, joiner.tracks.length),
      );
    const artistOverlap =
      sharedArtists.length /
      Math.max(
        1,
        Math.min(creator.artists.length, joiner.artists.length),
      );
    const genreOverlapScore = this.cosineSimilarity(
      creatorGenres,
      joinerGenres,
    );

    const raw = (trackOverlap * 0.4 + artistOverlap * 0.3 + genreOverlapScore * 0.3) * 100;
    const compatibilityScore = Math.max(1, Math.min(99, Math.round(raw)));

    const playlist = this.generatePlaylist(shared, uniqueA, uniqueB);

    const creatorUniqueTastes = this.pickUniqueTastes(uniqueA, allJoinerGenres);
    const joinerUniqueTastes = this.pickUniqueTastes(uniqueB, allCreatorGenres);

    return {
      compatibilityScore,
      sharedArtists: sharedArtists.map((a) => ({
        name: a.name,
        imageUrl: a.imageUrl,
      })),
      sharedTracks: shared.slice(0, 10).map((t) => ({
        title: t.title,
        artist: t.artist,
        albumArt: t.albumArt,
      })),
      genreOverlap: {
        shared: sharedGenres.slice(0, 10),
        creatorUnique: creatorUniqueGenres.slice(0, 5),
        joinerUnique: joinerUniqueGenres.slice(0, 5),
      },
      genreDistribution: {
        creator: creatorGenres,
        joiner: joinerGenres,
      },
      uniqueTastes: {
        creator: creatorUniqueTastes,
        joiner: joinerUniqueTastes,
      },
      playlist,
    };
  }

  private findSharedArtists(
    artistsA: NormalizedArtist[],
    artistsB: NormalizedArtist[],
  ): NormalizedArtist[] {
    const bNames = new Set(artistsB.map((a) => a.name.toLowerCase()));
    return artistsA.filter((a) => bNames.has(a.name.toLowerCase()));
  }

  private buildGenreDistribution(
    artists: NormalizedArtist[],
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    let total = 0;
    for (const artist of artists) {
      for (const genre of artist.genres) {
        counts[genre] = (counts[genre] || 0) + 1;
        total++;
      }
    }
    if (total === 0) return {};

    const sorted = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    const result: Record<string, number> = {};
    for (const [genre, count] of sorted) {
      result[genre] = Math.round((count / total) * 100);
    }
    return result;
  }

  private cosineSimilarity(
    a: Record<string, number>,
    b: Record<string, number>,
  ): number {
    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (const key of allKeys) {
      const va = a[key] || 0;
      const vb = b[key] || 0;
      dot += va * vb;
      magA += va * va;
      magB += vb * vb;
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  }

  private generatePlaylist(
    shared: NormalizedTrack[],
    uniqueA: NormalizedTrack[],
    uniqueB: NormalizedTrack[],
  ): PlaylistTrack[] {
    const playlist: PlaylistTrack[] = [];
    const maxShared = Math.min(shared.length, 15);

    for (let i = 0; i < maxShared; i++) {
      playlist.push(this.toPlaylistTrack(shared[i], 'shared'));
    }

    const remaining = 30 - playlist.length;
    const perSide = Math.floor(remaining / 2);

    const sortedA = [...uniqueA].sort((a, b) => b.weight - a.weight);
    const sortedB = [...uniqueB].sort((a, b) => b.weight - a.weight);

    for (let i = 0; i < perSide && i < sortedA.length; i++) {
      playlist.push(this.toPlaylistTrack(sortedA[i], 'creator'));
    }
    for (let i = 0; i < perSide && i < sortedB.length; i++) {
      playlist.push(this.toPlaylistTrack(sortedB[i], 'joiner'));
    }

    return playlist.slice(0, 30);
  }

  private toPlaylistTrack(
    track: NormalizedTrack,
    source: 'shared' | 'creator' | 'joiner',
  ): PlaylistTrack {
    return {
      title: track.title,
      artist: track.artist,
      albumArt: track.albumArt,
      isrc: track.isrc,
      source,
      lastfmUrl: track.platform === 'lastfm' ? track.id : null,
      ytMusicId: track.platform === 'ytmusic' ? track.id : null,
    };
  }

  private pickUniqueTastes(
    tracks: NormalizedTrack[],
    otherGenres: Set<string>,
  ): { title: string; artist: string; albumArt: string }[] {
    const unique = tracks
      .filter((t) => !t.genres.some((g) => otherGenres.has(g)))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);

    if (unique.length < 5) {
      const more = tracks
        .filter((t) => !unique.includes(t))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5 - unique.length);
      unique.push(...more);
    }

    return unique.map((t) => ({
      title: t.title,
      artist: t.artist,
      albumArt: t.albumArt,
    }));
  }
}
