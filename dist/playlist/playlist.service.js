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
exports.PlaylistService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../firebase/firebase.service");
let PlaylistService = class PlaylistService {
    firebase;
    constructor(firebase) {
        this.firebase = firebase;
    }
    async pushPlaylist(blendId, uid) {
        const db = this.firebase.firestore;
        const userDoc = await db.doc(`users/${uid}`).get();
        const user = userDoc.data();
        const platform = user.platform;
        const blendDoc = await db.doc(`blends/${blendId}`).get();
        const blend = blendDoc.data();
        const tracks = blend.result.playlist;
        const blendPartner = uid === blend.creatorUid ? blend.joinerName : blend.creatorName;
        const playlistName = `Blendify: ${blend.creatorName} × ${blend.joinerName}`;
        let playlistUrl;
        if (platform === 'spotify') {
            playlistUrl = await this.createSpotifyPlaylist(user.accessToken, user.platformUserId, playlistName, tracks);
        }
        else {
            playlistUrl = await this.createYtMusicPlaylist(user.accessToken, playlistName, tracks);
        }
        await db.doc(`blends/${blendId}`).update({
            [`playlistUrls.${platform}`]: playlistUrl,
        });
        return playlistUrl;
    }
    async createSpotifyPlaylist(accessToken, userId, name, tracks) {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        };
        const createRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name,
                description: 'Created with Blendify ✨',
                public: true,
            }),
        });
        const playlist = await createRes.json();
        const uris = tracks
            .map((t) => t.spotifyUri)
            .filter(Boolean);
        if (uris.length > 0) {
            await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ uris }),
            });
        }
        return playlist.external_urls?.spotify || '';
    }
    async createYtMusicPlaylist(accessToken, name, tracks) {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        };
        const createRes = await fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet,status', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                snippet: { title: name, description: 'Created with Blendify' },
                status: { privacyStatus: 'public' },
            }),
        });
        const playlist = await createRes.json();
        const videoIds = tracks.map((t) => t.ytMusicId).filter(Boolean);
        for (const videoId of videoIds) {
            await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    snippet: {
                        playlistId: playlist.id,
                        resourceId: { kind: 'youtube#video', videoId },
                    },
                }),
            });
        }
        return `https://music.youtube.com/playlist?list=${playlist.id}`;
    }
};
exports.PlaylistService = PlaylistService;
exports.PlaylistService = PlaylistService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], PlaylistService);
//# sourceMappingURL=playlist.service.js.map