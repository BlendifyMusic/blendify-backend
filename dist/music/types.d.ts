export type Platform = 'spotify' | 'ytmusic';
export interface NormalizedTrack {
    id: string;
    isrc: string | null;
    title: string;
    artist: string;
    artistId: string;
    album: string;
    albumArt: string;
    genres: string[];
    popularity: number | null;
    platform: Platform;
    weight: number;
}
export interface NormalizedArtist {
    id: string;
    name: string;
    genres: string[];
    imageUrl: string;
    platform: Platform;
}
export interface ListeningProfile {
    tracks: NormalizedTrack[];
    artists: NormalizedArtist[];
}
export interface BlendResult {
    compatibilityScore: number;
    sharedArtists: {
        name: string;
        imageUrl: string;
    }[];
    sharedTracks: {
        title: string;
        artist: string;
        albumArt: string;
    }[];
    genreOverlap: {
        shared: string[];
        creatorUnique: string[];
        joinerUnique: string[];
    };
    genreDistribution: {
        creator: Record<string, number>;
        joiner: Record<string, number>;
    };
    uniqueTastes: {
        creator: {
            title: string;
            artist: string;
            albumArt: string;
        }[];
        joiner: {
            title: string;
            artist: string;
            albumArt: string;
        }[];
    };
    playlist: PlaylistTrack[];
}
export interface PlaylistTrack {
    title: string;
    artist: string;
    albumArt: string;
    isrc: string | null;
    source: 'shared' | 'creator' | 'joiner';
    spotifyUri: string | null;
    ytMusicId: string | null;
}
