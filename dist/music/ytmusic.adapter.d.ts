import { ListeningProfile } from './types';
export declare class YtMusicAdapter {
    fetchListeningProfile(accessToken: string): Promise<ListeningProfile>;
    private fetchLikedMusic;
    private normalizeTrack;
    private parseTitleArtist;
}
