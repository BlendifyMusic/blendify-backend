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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const firebase_service_1 = require("../firebase/firebase.service");
let AuthService = class AuthService {
    config;
    firebase;
    constructor(config, firebase) {
        this.config = config;
        this.firebase = firebase;
    }
    getSpotifyAuthUrl(state) {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.config.get('SPOTIFY_CLIENT_ID'),
            scope: 'user-top-read user-read-recently-played playlist-modify-public playlist-modify-private',
            redirect_uri: this.config.get('SPOTIFY_REDIRECT_URI'),
            state,
        });
        return `https://accounts.spotify.com/authorize?${params}`;
    }
    getYtMusicAuthUrl(state) {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.config.get('GOOGLE_CLIENT_ID'),
            scope: 'https://www.googleapis.com/auth/youtube.readonly',
            redirect_uri: this.config.get('GOOGLE_REDIRECT_URI'),
            access_type: 'offline',
            prompt: 'consent',
            state,
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    }
    async exchangeSpotifyCode(code) {
        const res = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${this.config.get('SPOTIFY_CLIENT_ID')}:${this.config.get('SPOTIFY_CLIENT_SECRET')}`).toString('base64')}`,
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: this.config.get('SPOTIFY_REDIRECT_URI'),
            }),
        });
        return res.json();
    }
    async exchangeGoogleCode(code) {
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: this.config.get('GOOGLE_CLIENT_ID'),
                client_secret: this.config.get('GOOGLE_CLIENT_SECRET'),
                redirect_uri: this.config.get('GOOGLE_REDIRECT_URI'),
            }),
        });
        return res.json();
    }
    async getSpotifyProfile(accessToken) {
        const res = await fetch('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return res.json();
    }
    async getGoogleProfile(accessToken) {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
        return res.json();
    }
    async createOrUpdateUser(platform, platformUserId, displayName, avatarUrl, accessToken, refreshToken, expiresIn) {
        const db = this.firebase.firestore;
        const usersRef = db.collection('users');
        const snapshot = await usersRef
            .where('platform', '==', platform)
            .where('platformUserId', '==', platformUserId)
            .limit(1)
            .get();
        const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
        const userData = {
            displayName,
            avatarUrl,
            platform,
            platformUserId,
            accessToken,
            refreshToken,
            tokenExpiresAt,
        };
        let uid;
        if (snapshot.empty) {
            const userRecord = await this.firebase.auth.createUser({ displayName });
            uid = userRecord.uid;
            await usersRef.doc(uid).set({ ...userData, createdAt: new Date() });
        }
        else {
            uid = snapshot.docs[0].id;
            await usersRef.doc(uid).update(userData);
        }
        return uid;
    }
    async createFirebaseToken(uid) {
        return this.firebase.auth.createCustomToken(uid);
    }
    async refreshSpotifyToken(refreshToken) {
        const res = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${this.config.get('SPOTIFY_CLIENT_ID')}:${this.config.get('SPOTIFY_CLIENT_SECRET')}`).toString('base64')}`,
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
        });
        return res.json();
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        firebase_service_1.FirebaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map