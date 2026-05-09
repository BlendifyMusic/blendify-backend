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
exports.MusicService = void 0;
const common_1 = require("@nestjs/common");
const spotify_adapter_1 = require("./spotify.adapter");
const ytmusic_adapter_1 = require("./ytmusic.adapter");
let MusicService = class MusicService {
    spotify;
    ytMusic;
    constructor(spotify, ytMusic) {
        this.spotify = spotify;
        this.ytMusic = ytMusic;
    }
    async fetchListeningProfile(platform, accessToken) {
        if (platform === 'spotify') {
            return this.spotify.fetchListeningProfile(accessToken);
        }
        return this.ytMusic.fetchListeningProfile(accessToken);
    }
};
exports.MusicService = MusicService;
exports.MusicService = MusicService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [spotify_adapter_1.SpotifyAdapter,
        ytmusic_adapter_1.YtMusicAdapter])
], MusicService);
//# sourceMappingURL=music.service.js.map