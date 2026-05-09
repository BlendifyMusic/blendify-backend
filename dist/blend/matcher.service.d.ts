import { NormalizedTrack } from '../music/types';
export declare class MatcherService {
    findSharedTracks(tracksA: NormalizedTrack[], tracksB: NormalizedTrack[]): {
        shared: NormalizedTrack[];
        uniqueA: NormalizedTrack[];
        uniqueB: NormalizedTrack[];
    };
    private tracksMatch;
    private normalize;
    private diceCoefficient;
}
