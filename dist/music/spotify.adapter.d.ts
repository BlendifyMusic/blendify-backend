import { ListeningProfile } from './types';
export declare class SpotifyAdapter {
    fetchListeningProfile(accessToken: string): Promise<ListeningProfile>;
    private fetchTopTracks;
    private fetchTopArtists;
    private fetchRecentlyPlayed;
    private normalizeTrack;
    private normalizeArtist;
}
