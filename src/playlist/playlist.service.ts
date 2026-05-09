import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { PlaylistTrack, Platform } from '../music/types';

@Injectable()
export class PlaylistService {
  constructor(private firebase: FirebaseService) {}

  async pushPlaylist(
    blendId: string,
    uid: string,
  ): Promise<string> {
    const db = this.firebase.firestore;
    const userDoc = await db.doc(`users/${uid}`).get();
    const user = userDoc.data()!;
    const platform = user.platform as Platform;

    const blendDoc = await db.doc(`blends/${blendId}`).get();
    const blend = blendDoc.data()!;
    const tracks: PlaylistTrack[] = blend.result.playlist;

    const blendPartner =
      uid === blend.creatorUid ? blend.joinerName : blend.creatorName;
    const playlistName = `Blendify: ${blend.creatorName} × ${blend.joinerName}`;

    let playlistUrl: string;

    if (platform === 'spotify') {
      playlistUrl = await this.createSpotifyPlaylist(
        user.accessToken,
        user.platformUserId,
        playlistName,
        tracks,
      );
    } else {
      playlistUrl = await this.createYtMusicPlaylist(
        user.accessToken,
        playlistName,
        tracks,
      );
    }

    await db.doc(`blends/${blendId}`).update({
      [`playlistUrls.${platform}`]: playlistUrl,
    });

    return playlistUrl;
  }

  private async createSpotifyPlaylist(
    accessToken: string,
    userId: string,
    name: string,
    tracks: PlaylistTrack[],
  ): Promise<string> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const createRes = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name,
          description: 'Created with Blendify ✨',
          public: true,
        }),
      },
    );
    const playlist = await createRes.json();

    const uris = tracks
      .map((t) => t.spotifyUri)
      .filter(Boolean);

    if (uris.length > 0) {
      await fetch(
        `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ uris }),
        },
      );
    }

    return playlist.external_urls?.spotify || '';
  }

  private async createYtMusicPlaylist(
    accessToken: string,
    name: string,
    tracks: PlaylistTrack[],
  ): Promise<string> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const createRes = await fetch(
      'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          snippet: { title: name, description: 'Created with Blendify' },
          status: { privacyStatus: 'public' },
        }),
      },
    );
    const playlist = await createRes.json();

    const videoIds = tracks.map((t) => t.ytMusicId).filter(Boolean);
    for (const videoId of videoIds) {
      await fetch(
        'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            snippet: {
              playlistId: playlist.id,
              resourceId: { kind: 'youtube#video', videoId },
            },
          }),
        },
      );
    }

    return `https://music.youtube.com/playlist?list=${playlist.id}`;
  }
}
