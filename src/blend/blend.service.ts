import { Injectable, NotFoundException } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { FirebaseService } from '../firebase/firebase.service';
import { MusicService } from '../music/music.service';
import { AlgorithmService } from './algorithm.service';
import { BlendResult, ListeningProfile, Platform } from '../music/types';

@Injectable()
export class BlendService {
  constructor(
    private firebase: FirebaseService,
    private music: MusicService,
    private algorithm: AlgorithmService,
  ) {}

  async createBlend(uid: string): Promise<string> {
    const blendId = nanoid(8);
    const db = this.firebase.firestore;

    const userDoc = await db.doc(`users/${uid}`).get();
    if (!userDoc.exists) throw new NotFoundException('User not found');

    const user = userDoc.data()!;
    const profile = await this.music.fetchListeningProfile(
      user.platform as Platform,
      user.accessToken,
    );

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

  async joinBlend(blendId: string, uid: string): Promise<BlendResult> {
    const db = this.firebase.firestore;

    const blendDoc = await db.doc(`blends/${blendId}`).get();
    if (!blendDoc.exists) throw new NotFoundException('Blend not found');

    const blend = blendDoc.data()!;
    if (blend.status !== 'waiting') {
      throw new Error('Blend already completed or in progress');
    }

    await db.doc(`blends/${blendId}`).update({
      joinerUid: uid,
      status: 'computing',
    });

    const userDoc = await db.doc(`users/${uid}`).get();
    const user = userDoc.data()!;
    const joinerProfile = await this.music.fetchListeningProfile(
      user.platform as Platform,
      user.accessToken,
    );

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

  async getBlend(blendId: string): Promise<any> {
    const doc = await this.firebase.firestore.doc(`blends/${blendId}`).get();
    if (!doc.exists) throw new NotFoundException('Blend not found');
    return doc.data();
  }

  private async storeListeningData(
    uid: string,
    profile: ListeningProfile,
  ): Promise<void> {
    const db = this.firebase.firestore;
    await db.doc(`users/${uid}/listeningData/merged`).set({
      fetchedAt: new Date(),
      tracks: profile.tracks,
      artists: profile.artists,
    });
  }

  private async getStoredListeningData(
    uid: string,
  ): Promise<ListeningProfile> {
    const doc = await this.firebase.firestore
      .doc(`users/${uid}/listeningData/merged`)
      .get();
    const data = doc.data()!;
    return { tracks: data.tracks, artists: data.artists };
  }
}
