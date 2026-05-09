import { FirebaseService } from '../firebase/firebase.service';
export declare class PlaylistService {
    private firebase;
    constructor(firebase: FirebaseService);
    pushPlaylist(blendId: string, uid: string): Promise<string>;
    private createSpotifyPlaylist;
    private createYtMusicPlaylist;
}
