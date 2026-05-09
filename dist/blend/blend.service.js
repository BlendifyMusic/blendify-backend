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
exports.BlendService = void 0;
const common_1 = require("@nestjs/common");
const nanoid_1 = require("nanoid");
const firebase_service_1 = require("../firebase/firebase.service");
const music_service_1 = require("../music/music.service");
const algorithm_service_1 = require("./algorithm.service");
let BlendService = class BlendService {
    firebase;
    music;
    algorithm;
    constructor(firebase, music, algorithm) {
        this.firebase = firebase;
        this.music = music;
        this.algorithm = algorithm;
    }
    async createBlend(uid) {
        const blendId = (0, nanoid_1.nanoid)(8);
        const db = this.firebase.firestore;
        const userDoc = await db.doc(`users/${uid}`).get();
        if (!userDoc.exists)
            throw new common_1.NotFoundException('User not found');
        const user = userDoc.data();
        const profile = await this.music.fetchListeningProfile(user.platform, user.accessToken);
        await this.storeListeningData(uid, profile);
        await db.doc(`blends/${blendId}`).set({
            id: blendId,
            creatorUid: uid,
            creatorName: user.displayName,
            creatorAvatar: user.avatarUrl,
            creatorPlatform: user.platform,
            joinerUid: null,
            status: 'waiting',
            createdAt: new Date(),
            completedAt: null,
            result: null,
            playlistUrls: { spotify: null, ytmusic: null },
        });
        return blendId;
    }
    async joinBlend(blendId, uid) {
        const db = this.firebase.firestore;
        const blendDoc = await db.doc(`blends/${blendId}`).get();
        if (!blendDoc.exists)
            throw new common_1.NotFoundException('Blend not found');
        const blend = blendDoc.data();
        if (blend.status !== 'waiting') {
            throw new Error('Blend already completed or in progress');
        }
        await db.doc(`blends/${blendId}`).update({
            joinerUid: uid,
            status: 'computing',
        });
        const userDoc = await db.doc(`users/${uid}`).get();
        const user = userDoc.data();
        const joinerProfile = await this.music.fetchListeningProfile(user.platform, user.accessToken);
        await this.storeListeningData(uid, joinerProfile);
        const creatorProfile = await this.getStoredListeningData(blend.creatorUid);
        const result = this.algorithm.computeBlend(creatorProfile, joinerProfile);
        await db.doc(`blends/${blendId}`).update({
            status: 'ready',
            completedAt: new Date(),
            result,
            joinerName: user.displayName,
            joinerAvatar: user.avatarUrl,
            joinerPlatform: user.platform,
        });
        return result;
    }
    async getBlend(blendId) {
        const doc = await this.firebase.firestore.doc(`blends/${blendId}`).get();
        if (!doc.exists)
            throw new common_1.NotFoundException('Blend not found');
        return doc.data();
    }
    async storeListeningData(uid, profile) {
        const db = this.firebase.firestore;
        await db.doc(`users/${uid}/listeningData/merged`).set({
            fetchedAt: new Date(),
            tracks: profile.tracks,
            artists: profile.artists,
        });
    }
    async getStoredListeningData(uid) {
        const doc = await this.firebase.firestore
            .doc(`users/${uid}/listeningData/merged`)
            .get();
        const data = doc.data();
        return { tracks: data.tracks, artists: data.artists };
    }
};
exports.BlendService = BlendService;
exports.BlendService = BlendService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        music_service_1.MusicService,
        algorithm_service_1.AlgorithmService])
], BlendService);
//# sourceMappingURL=blend.service.js.map