"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YtMusicAdapter = void 0;
const common_1 = require("@nestjs/common");
let YtMusicAdapter = class YtMusicAdapter {
    async fetchListeningProfile(accessToken) {
        const headers = { Authorization: `Bearer ${accessToken}` };
        const likedVideos = await this.fetchLikedMusic(headers);
        const tracks = likedVideos.map((v, i) => this.normalizeTrack(v, i));
        const artistMap = new Map();
        for (const track of tracks) {
            const key = track.artist.toLowerCase();
            if (!artistMap.has(key)) {
                artistMap.set(key, {
                    id: track.artistId,
                    name: track.artist,
                    genres: [],
                    imageUrl: '',
                    platform: 'ytmusic',
                });
            }
        }
        return {
            tracks,
            artists: Array.from(artistMap.values()),
        };
    }
    async fetchLikedMusic(headers) {
        const videos = [];
        let pageToken = '';
        for (let page = 0; page < 4; page++) {
            const params = new URLSearchParams({
                part: 'snippet',
                playlistId: 'LM',
                maxResults: '50',
            });
            if (pageToken)
                params.set('pageToken', pageToken);
            const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`, { headers });
            const data = await res.json();
            if (!data.items)
                break;
            videos.push(...data.items);
            pageToken = data.nextPageToken || '';
            if (!pageToken)
                break;
        }
        return videos;
    }
    normalizeTrack(item, index) {
        const snippet = item.snippet || {};
        const { title, artist } = this.parseTitleArtist(snippet.title || '', snippet.videoOwnerChannelTitle || '');
        return {
            id: snippet.resourceId?.videoId || `yt-${index}`,
            isrc: null,
            title,
            artist,
            artistId: snippet.videoOwnerChannelId || '',
            album: '',
            albumArt: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
            genres: [],
            popularity: null,
            platform: 'ytmusic',
            weight: 2,
        };
    }
    parseTitleArtist(rawTitle, channelTitle) {
        const separators = [' - ', ' – ', ' — ', ' | '];
        for (const sep of separators) {
            if (rawTitle.includes(sep)) {
                const parts = rawTitle.split(sep);
                return {
                    artist: parts[0].trim(),
                    title: parts
                        .slice(1)
                        .join(sep)
                        .replace(/\(Official.*?\)/gi, '')
                        .replace(/\[Official.*?\]/gi, '')
                        .replace(/\(Lyrics.*?\)/gi, '')
                        .replace(/\(Audio.*?\)/gi, '')
                        .trim(),
                };
            }
        }
        return {
            title: rawTitle
                .replace(/\(Official.*?\)/gi, '')
                .replace(/\[Official.*?\]/gi, '')
                .trim(),
            artist: channelTitle.replace(/ - Topic$/, '').trim(),
        };
    }
};
exports.YtMusicAdapter = YtMusicAdapter;
exports.YtMusicAdapter = YtMusicAdapter = __decorate([
    (0, common_1.Injectable)()
], YtMusicAdapter);
//# sourceMappingURL=ytmusic.adapter.js.map