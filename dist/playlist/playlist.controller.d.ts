import { PlaylistService } from './playlist.service';
export declare class PlaylistController {
    private playlistService;
    constructor(playlistService: PlaylistService);
    pushPlaylist(blendId: string, req: any): Promise<{
        playlistUrl: string;
    }>;
}
