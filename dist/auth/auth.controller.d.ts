import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    private config;
    constructor(authService: AuthService, config: ConfigService);
    spotifyAuth(blendId: string, res: Response): void;
    ytMusicAuth(blendId: string, res: Response): void;
    spotifyCallback(code: string, stateParam: string, res: Response): Promise<void>;
    ytMusicCallback(code: string, stateParam: string, res: Response): Promise<void>;
    private handleCallback;
}
