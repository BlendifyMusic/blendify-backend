import { Injectable } from '@nestjs/common';
import { NormalizedTrack } from '../music/types';

@Injectable()
export class MatcherService {
  findSharedTracks(
    tracksA: NormalizedTrack[],
    tracksB: NormalizedTrack[],
  ): { shared: NormalizedTrack[]; uniqueA: NormalizedTrack[]; uniqueB: NormalizedTrack[] } {
    const shared: NormalizedTrack[] = [];
    const matchedB = new Set<number>();

    const uniqueA: NormalizedTrack[] = [];

    for (const trackA of tracksA) {
      let matched = false;

      for (let j = 0; j < tracksB.length; j++) {
        if (matchedB.has(j)) continue;
        if (this.tracksMatch(trackA, tracksB[j])) {
          shared.push({
            ...trackA,
            weight: trackA.weight + tracksB[j].weight,
            spotifyUri: trackA.platform === 'spotify' ? trackA.id : tracksB[j].platform === 'spotify' ? tracksB[j].id : null,
            ytMusicId: trackA.platform === 'ytmusic' ? trackA.id : tracksB[j].platform === 'ytmusic' ? tracksB[j].id : null,
          } as any);
          matchedB.add(j);
          matched = true;
          break;
        }
      }

      if (!matched) uniqueA.push(trackA);
    }

    const uniqueB = tracksB.filter((_, i) => !matchedB.has(i));

    shared.sort((a, b) => b.weight - a.weight);
    return { shared, uniqueA, uniqueB };
  }

  private tracksMatch(a: NormalizedTrack, b: NormalizedTrack): boolean {
    if (a.isrc && b.isrc && a.isrc === b.isrc) return true;

    const titleA = this.normalize(a.title);
    const titleB = this.normalize(b.title);
    const artistA = this.normalize(a.artist);
    const artistB = this.normalize(b.artist);

    return (
      this.diceCoefficient(titleA, titleB) >= 0.85 &&
      this.diceCoefficient(artistA, artistB) >= 0.85
    );
  }

  private normalize(s: string): string {
    return s
      .toLowerCase()
      .replace(/\(feat\..*?\)/g, '')
      .replace(/\(ft\..*?\)/g, '')
      .replace(/\(with.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private diceCoefficient(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;

    const bigramsA = new Map<string, number>();
    for (let i = 0; i < a.length - 1; i++) {
      const bigram = a.substring(i, i + 2);
      bigramsA.set(bigram, (bigramsA.get(bigram) || 0) + 1);
    }

    let intersection = 0;
    for (let i = 0; i < b.length - 1; i++) {
      const bigram = b.substring(i, i + 2);
      const count = bigramsA.get(bigram) || 0;
      if (count > 0) {
        bigramsA.set(bigram, count - 1);
        intersection++;
      }
    }

    return (2 * intersection) / (a.length - 1 + (b.length - 1));
  }
}
