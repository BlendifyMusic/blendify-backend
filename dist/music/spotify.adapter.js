"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotifyAdapter = void 0;
const common_1 = require("@nestjs/common");
const TIME_RANGES = ['short_term', 'medium_term', 'long_term'];
const WEIGHT_MAP = {
    short_term: 3,
    medium_term: 2,
    long_term: 1,
    recent: 2,
};
let SpotifyAdapter = class SpotifyAdapter {
    async fetchListeningProfile(accessToken) {
        const headers = { Authorization: `Bearer ${accessToken}` };
        const [tracksByRange, artistsByRange, recentTracks] = await Promise.all([
            Promise.all(TIME_RANGES.map((range) => this.fetchTopTracks(headers, range))),
            Promise.all(TIME_RANGES.map((range) => this.fetchTopArtists(headers, range))),
            this.fetchRecentlyPlayed(headers),
        ]);
        const trackMap = new Map();
        for (let i = 0; i < TIME_RANGES.length; i++) {
            const weight = WEIGHT_MAP[TIME_RANGES[i]];
            for (const track of tracksByRange[i]) {
                const key = track.isrc || `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;
                const existing = trackMap.get(key);
                if (!existing || existing.weight < weight) {
                    trackMap.set(key, { ...track, weight });
                }
            }
        }
        for (const track of recentTracks) {
            const key = track.isrc || `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;
            if (!trackMap.has(key)) {
                trackMap.set(key, { ...track, weight: WEIGHT_MAP.recent });
            }
        }
        const artistMap = new Map();
        for (const artists of artistsByRange) {
            for (const artist of artists) {
                if (!artistMap.has(artist.name.toLowerCase())) {
                    artistMap.set(artist.name.toLowerCase(), artist);
                }
            }
        }
        return {
            tracks: Array.from(trackMap.values()),
            artists: Array.from(artistMap.values()),
        };
    }
    async fetchTopTracks(headers, timeRange) {
        const res = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`, { headers });
        const data = await res.json();
        return (data.items || []).map((item) => this.normalizeTrack(item));
    }
    async fetchTopArtists(headers, timeRange) {
        const res = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=50`, { headers });
        const data = await res.json();
        return (data.items || []).map((item) => this.normalizeArtist(item));
    }
    async fetchRecentlyPlayed(headers) {
        const res = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', { headers });
        const data = await res.json();
        return (data.items || []).map((item) => this.normalizeTrack(item.track));
    }
    normalizeTrack(item) {
        return {
            id: item.id,
            isrc: item.external_ids?.isrc || null,
            title: item.name,
            artist: item.artists?.[0]?.name || '',
            artistId: item.artists?.[0]?.id || '',
            album: item.album?.name || '',
            albumArt: item.album?.images?.[0]?.url || '',
            genres: [],
            popularity: item.popularity ?? null,
            platform: 'spotify',
            weight: 0,
        };
    }
    normalizeArtist(item) {
        return {
            id: item.id,
            name: item.name,
            genres: item.genres || [],
            imageUrl: item.images?.[0]?.url || '',
            platform: 'spotify',
        };
    }
};
exports.SpotifyAdapter = SpotifyAdapter;
exports.SpotifyAdapter = SpotifyAdapter = __decorate([
    (0, common_1.Injectable)()
], SpotifyAdapter);
//# sourceMappingURL=spotify.adapter.js.map