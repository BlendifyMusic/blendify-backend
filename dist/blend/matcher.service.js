"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatcherService = void 0;
const common_1 = require("@nestjs/common");
let MatcherService = class MatcherService {
    findSharedTracks(tracksA, tracksB) {
        const shared = [];
        const matchedB = new Set();
        const uniqueA = [];
        for (const trackA of tracksA) {
            let matched = false;
            for (let j = 0; j < tracksB.length; j++) {
                if (matchedB.has(j))
                    continue;
                if (this.tracksMatch(trackA, tracksB[j])) {
                    shared.push({
                        ...trackA,
                        weight: trackA.weight + tracksB[j].weight,
                        spotifyUri: trackA.platform === 'spotify' ? trackA.id : tracksB[j].platform === 'spotify' ? tracksB[j].id : null,
                        ytMusicId: trackA.platform === 'ytmusic' ? trackA.id : tracksB[j].platform === 'ytmusic' ? tracksB[j].id : null,
                    });
                    matchedB.add(j);
                    matched = true;
                    break;
                }
            }
            if (!matched)
                uniqueA.push(trackA);
        }
        const uniqueB = tracksB.filter((_, i) => !matchedB.has(i));
        shared.sort((a, b) => b.weight - a.weight);
        return { shared, uniqueA, uniqueB };
    }
    tracksMatch(a, b) {
        if (a.isrc && b.isrc && a.isrc === b.isrc)
            return true;
        const titleA = this.normalize(a.title);
        const titleB = this.normalize(b.title);
        const artistA = this.normalize(a.artist);
        const artistB = this.normalize(b.artist);
        return (this.diceCoefficient(titleA, titleB) >= 0.85 &&
            this.diceCoefficient(artistA, artistB) >= 0.85);
    }
    normalize(s) {
        return s
            .toLowerCase()
            .replace(/\(feat\..*?\)/g, '')
            .replace(/\(ft\..*?\)/g, '')
            .replace(/\(with.*?\)/g, '')
            .replace(/\[.*?\]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    diceCoefficient(a, b) {
        if (a === b)
            return 1;
        if (a.length < 2 || b.length < 2)
            return 0;
        const bigramsA = new Map();
        for (let i = 0; i < a.length - 1; i++) {
            const bigram = a.substring(i, i + 2);
            bigramsA.set(bigram, (bigramsA.get(bigram) || 0) + 1);
        }
        let intersection = 0;
        for (let i = 0; i < b.length - 1; i++) {
            const bigram = b.substring(i, i + 2);
            const count = bigramsA.get(bigram) || 0;
            if (count > 0) {
                bigramsA.set(bigram, count - 1);
                intersection++;
            }
        }
        return (2 * intersection) / (a.length - 1 + (b.length - 1));
    }
};
exports.MatcherService = MatcherService;
exports.MatcherService = MatcherService = __decorate([
    (0, common_1.Injectable)()
], MatcherService);
//# sourceMappingURL=matcher.service.js.map