import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ListeningData } from './listening-data.entity';

@Entity('users')
export class User {
  @PrimaryColumn({ length: 128 })
  uid: string;

  @Column({ length: 255 })
  displayName: string;

  @Column({ length: 512, default: '' })
  avatarUrl: string;

  @Column({ length: 20 })
  platform: string;

  @Column({ length: 255 })
  platformUserId: string;

  @Column({ type: 'text' })
  accessToken: string;

  @Column({ type: 'text' })
  refreshToken: string;

  @Column({ type: 'datetime', nullable: true, default: null })
  tokenExpiresAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  lastfmUsername: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ListeningData, (ld) => ld.user)
  listeningData: ListeningData[];
}
