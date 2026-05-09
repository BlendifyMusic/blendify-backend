"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nanoid_1 = require("nanoid");
const auth_service_1 = require("./auth.service");
let AuthController = class AuthController {
    authService;
    config;
    constructor(authService, config) {
        this.authService = authService;
        this.config = config;
    }
    spotifyAuth(blendId, res) {
        const state = JSON.stringify({ nonce: (0, nanoid_1.nanoid)(), blendId: blendId || null });
        const encodedState = Buffer.from(state).toString('base64url');
        return res.redirect(this.authService.getSpotifyAuthUrl(encodedState));
    }
    ytMusicAuth(blendId, res) {
        const state = JSON.stringify({ nonce: (0, nanoid_1.nanoid)(), blendId: blendId || null });
        const encodedState = Buffer.from(state).toString('base64url');
        return res.redirect(this.authService.getYtMusicAuthUrl(encodedState));
    }
    async spotifyCallback(code, stateParam, res) {
        return this.handleCallback('spotify', code, stateParam, res);
    }
    async ytMusicCallback(code, stateParam, res) {
        return this.handleCallback('ytmusic', code, stateParam, res);
    }
    async handleCallback(platform, code, stateParam, res) {
        if (!code)
            throw new common_1.BadRequestException('Missing authorization code');
        const state = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
        const tokens = platform === 'spotify'
            ? await this.authService.exchangeSpotifyCode(code)
            : await this.authService.exchangeGoogleCode(code);
        let platformUserId;
        let displayName;
        let avatarUrl;
        if (platform === 'spotify') {
            const profile = await this.authService.getSpotifyProfile(tokens.access_token);
            platformUserId = profile.id;
            displayName = profile.display_name;
            avatarUrl = profile.images?.[0]?.url || '';
        }
        else {
            const profile = await this.authService.getGoogleProfile(tokens.access_token);
            platformUserId = profile.sub;
            displayName = profile.name;
            avatarUrl = profile.picture || '';
        }
        const uid = await this.authService.createOrUpdateUser(platform, platformUserId, displayName, avatarUrl, tokens.access_token, tokens.refresh_token, tokens.expires_in);
        const firebaseToken = await this.authService.createFirebaseToken(uid);
        const frontendUrl = this.config.get('FRONTEND_URL');
        const redirectPath = state.blendId
            ? `/auth/callback?firebaseToken=${firebaseToken}&blendId=${state.blendId}`
            : `/auth/callback?firebaseToken=${firebaseToken}`;
        return res.redirect(`${frontendUrl}${redirectPath}`);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('spotify'),
    __param(0, (0, common_1.Query)('blendId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "spotifyAuth", null);
__decorate([
    (0, common_1.Get)('ytmusic'),
    __param(0, (0, common_1.Query)('blendId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "ytMusicAuth", null);
__decorate([
    (0, common_1.Get)('callback/spotify'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "spotifyCallback", null);
__decorate([
    (0, common_1.Get)('callback/ytmusic'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "ytMusicCallback", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map