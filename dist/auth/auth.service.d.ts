import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../firebase/firebase.service';
import { Platform } from '../music/types';
interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
}
export declare class AuthService {
    private config;
    private firebase;
    constructor(config: ConfigService, firebase: FirebaseService);
    getSpotifyAuthUrl(state: string): string;
    getYtMusicAuthUrl(state: string): string;
    exchangeSpotifyCode(code: string): Promise<TokenResponse>;
    exchangeGoogleCode(code: string): Promise<TokenResponse>;
    getSpotifyProfile(accessToken: string): Promise<{
        id: string;
        display_name: string;
        images: {
            url: string;
        }[];
    }>;
    getGoogleProfile(accessToken: string): Promise<{
        sub: string;
        name: string;
        picture: string;
    }>;
    createOrUpdateUser(platform: Platform, platformUserId: string, displayName: string, avatarUrl: string, accessToken: string, refreshToken: string, expiresIn: number): Promise<string>;
    createFirebaseToken(uid: string): Promise<string>;
    refreshSpotifyToken(refreshToken: string): Promise<TokenResponse>;
}
export {};
