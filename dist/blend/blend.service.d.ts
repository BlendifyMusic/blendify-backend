import { FirebaseService } from '../firebase/firebase.service';
import { MusicService } from '../music/music.service';
import { AlgorithmService } from './algorithm.service';
import { BlendResult } from '../music/types';
export declare class BlendService {
    private firebase;
    private music;
    private algorithm;
    constructor(firebase: FirebaseService, music: MusicService, algorithm: AlgorithmService);
    createBlend(uid: string): Promise<string>;
    joinBlend(blendId: string, uid: string): Promise<BlendResult>;
    getBlend(blendId: string): Promise<any>;
    private storeListeningData;
    private getStoredListeningData;
}
