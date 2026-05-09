import { SpotifyAdapter } from './spotify.adapter';
import { YtMusicAdapter } from './ytmusic.adapter';
import { ListeningProfile, Platform } from './types';
export declare class MusicService {
    private spotify;
    private ytMusic;
    constructor(spotify: SpotifyAdapter, ytMusic: YtMusicAdapter);
    fetchListeningProfile(platform: Platform, accessToken: string): Promise<ListeningProfile>;
}
