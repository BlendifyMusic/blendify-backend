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
exports.AlgorithmService = void 0;
const common_1 = require("@nestjs/common");
const matcher_service_1 = require("./matcher.service");
let AlgorithmService = class AlgorithmService {
    matcher;
    constructor(matcher) {
        this.matcher = matcher;
    }
    computeBlend(creator, joiner) {
        const { shared, uniqueA, uniqueB } = this.matcher.findSharedTracks(creator.tracks, joiner.tracks);
        const sharedArtists = this.findSharedArtists(creator.artists, joiner.artists);
        const creatorGenres = this.buildGenreDistribution(creator.artists);
        const joinerGenres = this.buildGenreDistribution(joiner.artists);
        const allCreatorGenres = new Set(Object.keys(creatorGenres));
        const allJoinerGenres = new Set(Object.keys(joinerGenres));
        const sharedGenres = [...allCreatorGenres].filter((g) => allJoinerGenres.has(g));
        const creatorUniqueGenres = [...allCreatorGenres].filter((g) => !allJoinerGenres.has(g));
        const joinerUniqueGenres = [...allJoinerGenres].filter((g) => !allCreatorGenres.has(g));
        const trackOverlap = shared.length /
            Math.max(1, Math.min(creator.tracks.length, joiner.tracks.length));
        const artistOverlap = sharedArtists.length /
            Math.max(1, Math.min(creator.artists.length, joiner.artists.length));
        const genreOverlapScore = this.cosineSimilarity(creatorGenres, joinerGenres);
        const raw = (trackOverlap * 0.4 + artistOverlap * 0.3 + genreOverlapScore * 0.3) * 100;
        const compatibilityScore = Math.max(1, Math.min(99, Math.round(raw)));
        const playlist = this.generatePlaylist(shared, uniqueA, uniqueB);
        const creatorUniqueTastes = this.pickUniqueTastes(uniqueA, allJoinerGenres);
        const joinerUniqueTastes = this.pickUniqueTastes(uniqueB, allCreatorGenres);
        return {
            compatibilityScore,
            sharedArtists: sharedArtists.map((a) => ({
                name: a.name,
                imageUrl: a.imageUrl,
            })),
            sharedTracks: shared.slice(0, 10).map((t) => ({
                title: t.title,
                artist: t.artist,
                albumArt: t.albumArt,
            })),
            genreOverlap: {
                shared: sharedGenres.slice(0, 10),
                creatorUnique: creatorUniqueGenres.slice(0, 5),
                joinerUnique: joinerUniqueGenres.slice(0, 5),
            },
            genreDistribution: {
                creator: creatorGenres,
                joiner: joinerGenres,
            },
            uniqueTastes: {
                creator: creatorUniqueTastes,
                joiner: joinerUniqueTastes,
            },
            playlist,
        };
    }
    findSharedArtists(artistsA, artistsB) {
        const bNames = new Set(artistsB.map((a) => a.name.toLowerCase()));
        return artistsA.filter((a) => bNames.has(a.name.toLowerCase()));
    }
    buildGenreDistribution(artists) {
        const counts = {};
        let total = 0;
        for (const artist of artists) {
            for (const genre of artist.genres) {
                counts[genre] = (counts[genre] || 0) + 1;
                total++;
            }
        }
        if (total === 0)
            return {};
        const sorted = Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);
        const result = {};
        for (const [genre, count] of sorted) {
            result[genre] = Math.round((count / total) * 100);
        }
        return result;
    }
    cosineSimilarity(a, b) {
        const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
        let dot = 0;
        let magA = 0;
        let magB = 0;
        for (const key of allKeys) {
            const va = a[key] || 0;
            const vb = b[key] || 0;
            dot += va * vb;
            magA += va * va;
            magB += vb * vb;
        }
        const denom = Math.sqrt(magA) * Math.sqrt(magB);
        return denom === 0 ? 0 : dot / denom;
    }
    generatePlaylist(shared, uniqueA, uniqueB) {
        const playlist = [];
        const maxShared = Math.min(shared.length, 15);
        for (let i = 0; i < maxShared; i++) {
            playlist.push(this.toPlaylistTrack(shared[i], 'shared'));
        }
        const remaining = 30 - playlist.length;
        const perSide = Math.floor(remaining / 2);
        const sortedA = [...uniqueA].sort((a, b) => b.weight - a.weight);
        const sortedB = [...uniqueB].sort((a, b) => b.weight - a.weight);
        for (let i = 0; i < perSide && i < sortedA.length; i++) {
            playlist.push(this.toPlaylistTrack(sortedA[i], 'creator'));
        }
        for (let i = 0; i < perSide && i < sortedB.length; i++) {
            playlist.push(this.toPlaylistTrack(sortedB[i], 'joiner'));
        }
        return playlist.slice(0, 30);
    }
    toPlaylistTrack(track, source) {
        return {
            title: track.title,
            artist: track.artist,
            albumArt: track.albumArt,
            isrc: track.isrc,
            source,
            spotifyUri: track.platform === 'spotify' ? `spotify:track:${track.id}` : null,
            ytMusicId: track.platform === 'ytmusic' ? track.id : null,
        };
    }
    pickUniqueTastes(tracks, otherGenres) {
        const unique = tracks
            .filter((t) => !t.genres.some((g) => otherGenres.has(g)))
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 5);
        if (unique.length < 5) {
            const more = tracks
                .filter((t) => !unique.includes(t))
                .sort((a, b) => b.weight - a.weight)
                .slice(0, 5 - unique.length);
            unique.push(...more);
        }
        return unique.map((t) => ({
            title: t.title,
            artist: t.artist,
            albumArt: t.albumArt,
        }));
    }
};
exports.AlgorithmService = AlgorithmService;
exports.AlgorithmService = AlgorithmService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [matcher_service_1.MatcherService])
], AlgorithmService);
//# sourceMappingURL=algorithm.service.js.map