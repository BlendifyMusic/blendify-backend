import { MatcherService } from './matcher.service';
import { ListeningProfile, BlendResult } from '../music/types';
export declare class AlgorithmService {
    private matcher;
    constructor(matcher: MatcherService);
    computeBlend(creator: ListeningProfile, joiner: ListeningProfile): BlendResult;
    private findSharedArtists;
    private buildGenreDistribution;
    private cosineSimilarity;
    private generatePlaylist;
    private toPlaylistTrack;
    private pickUniqueTastes;
}
