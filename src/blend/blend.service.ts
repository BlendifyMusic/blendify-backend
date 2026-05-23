import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { nanoid } from 'nanoid';
import { MusicService } from '../music/music.service';
import { AlgorithmService } from './algorithm.service';
import { User } from '../entities/user.entity';
import { Blend } from '../entities/blend.entity';
import { ListeningData } from '../entities/listening-data.entity';
import { BlendResult, ListeningProfile, Platform } from '../music/types';

@Injectable()
export class BlendService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Blend)
    private blendRepo: Repository<Blend>,
    @InjectRepository(ListeningData)
    private listeningDataRepo: Repository<ListeningData>,
    private music: MusicService,
    private algorithm: AlgorithmService,
  ) {}

  async createBlend(uid: string): Promise<string> {
    const user = await this.userRepo.findOne({ where: { uid } });
    if (!user) throw new NotFoundException('User not found');

    const profileKey =
      user.platform === 'lastfm' ? user.lastfmUsername! : user.accessToken;
    const profile = await this.music.fetchListeningProfile(
      user.platform as Platform,
      profileKey,
    );

    await this.storeListeningData(uid, profile);

    const blendId = nanoid(8);
    const blend = this.blendRepo.create({
      id: blendId,
      creatorUid: uid,
      creatorName: user.displayName,
      creatorAvatar: user.avatarUrl,
      creatorPlatform: user.platform,
      joinerUid: null,
      status: 'waiting',
      completedAt: null,
      result: null,
      playlistUrls: { lastfm: null, ytmusic: null },
    });
    await this.blendRepo.save(blend);

    return blendId;
  }

  async joinBlend(blendId: string, uid: string): Promise<BlendResult> {
    const blend = await this.blendRepo.findOne({ where: { id: blendId } });
    if (!blend) throw new NotFoundException('Blend not found');
    if (blend.status !== 'waiting') {
      throw new Error('Blend already completed or in progress');
    }

    blend.joinerUid = uid;
    blend.status = 'computing';
    await this.blendRepo.save(blend);

    const user = await this.userRepo.findOne({ where: { uid } });
    if (!user) throw new NotFoundException('User not found');

    const joinerProfileKey =
      user.platform === 'lastfm' ? user.lastfmUsername! : user.accessToken;
    const joinerProfile = await this.music.fetchListeningProfile(
      user.platform as Platform,
      joinerProfileKey,
    );

    await this.storeListeningData(uid, joinerProfile);

    const creatorProfile = await this.getStoredListeningData(blend.creatorUid);
    const result = this.algorithm.computeBlend(creatorProfile, joinerProfile);

    blend.status = 'ready';
    blend.completedAt = new Date();
    blend.result = result;
    blend.joinerName = user.displayName;
    blend.joinerAvatar = user.avatarUrl;
    blend.joinerPlatform = user.platform;
    await this.blendRepo.save(blend);

    return result;
  }

  async getBlend(blendId: string): Promise<any> {
    const blend = await this.blendRepo.findOne({ where: { id: blendId } });
    if (!blend) throw new NotFoundException('Blend not found');
    return blend;
  }

  streamBlendUpdates(blendId: string): Observable<{ data: any }> {
    return new Observable((subscriber) => {
      let lastStatus = '';
      const interval = setInterval(async () => {
        try {
          const blend = await this.blendRepo.findOne({ where: { id: blendId } });
          if (!blend) {
            subscriber.next({ data: { error: 'not_found' } });
            clearInterval(interval);
            subscriber.complete();
            return;
          }

          const payload = {
            status: blend.status,
            joinerName: blend.joinerName || null,
            joinerAvatar: blend.joinerAvatar || null,
          };

          if (blend.status !== lastStatus) {
            lastStatus = blend.status;
            subscriber.next({ data: payload });
          }

          if (blend.status === 'ready') {
            clearInterval(interval);
            subscriber.complete();
          }
        } catch {
          clearInterval(interval);
          subscriber.complete();
        }
      }, 2000);

      return () => clearInterval(interval);
    });
  }

  async getUserMusicData(uid: string): Promise<any> {
    const ld = await this.listeningDataRepo.findOne({
      where: { userUid: uid },
      order: { fetchedAt: 'DESC' },
    });
    if (!ld) return { tracks: [], artists: [] };

    return {
      tracks: (ld.tracks || []).slice(0, 20).map((t: any) => ({
        title: t.title,
        artist: t.artist,
        albumArt: t.albumArt,
        platform: t.platform,
      })),
      artists: (ld.artists || []).slice(0, 15).map((a: any) => ({
        name: a.name,
        imageUrl: a.imageUrl,
        genres: a.genres,
        platform: a.platform,
      })),
      fetchedAt: ld.fetchedAt,
    };
  }

  async getUserProfile(uid: string): Promise<any> {
    const user = await this.userRepo.findOne({ where: { uid } });
    if (!user) throw new NotFoundException('User not found');
    return {
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      platform: user.platform,
    };
  }

  private async storeListeningData(
    uid: string,
    profile: ListeningProfile,
  ): Promise<void> {
    const existing = await this.listeningDataRepo.findOne({
      where: { userUid: uid },
    });

    if (existing) {
      existing.tracks = profile.tracks;
      existing.artists = profile.artists;
      await this.listeningDataRepo.save(existing);
    } else {
      const ld = this.listeningDataRepo.create({
        userUid: uid,
        tracks: profile.tracks,
        artists: profile.artists,
      });
      await this.listeningDataRepo.save(ld);
    }
  }

  private async getStoredListeningData(
    uid: string,
  ): Promise<ListeningProfile> {
    const ld = await this.listeningDataRepo.findOne({
      where: { userUid: uid },
      order: { fetchedAt: 'DESC' },
    });
    if (!ld) throw new NotFoundException('Listening data not found');
    return { tracks: ld.tracks, artists: ld.artists };
  }
}
