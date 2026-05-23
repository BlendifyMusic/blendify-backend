import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('blends')
export class Blend {
  @PrimaryColumn({ length: 16 })
  id: string;

  @Column({ length: 128 })
  creatorUid: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creatorUid' })
  creator: User;

  @Column({ length: 255 })
  creatorName: string;

  @Column({ length: 512, default: '' })
  creatorAvatar: string;

  @Column({ length: 20 })
  creatorPlatform: string;

  @Column({ type: 'varchar', length: 128, nullable: true, default: null })
  joinerUid: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'joinerUid' })
  joiner: User | null;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  joinerName: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true, default: null })
  joinerAvatar: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, default: null })
  joinerPlatform: string | null;

  @Column({ length: 20, default: 'waiting' })
  status: string;

  @Column({ type: 'json', nullable: true })
  result: any;

  @Column({ type: 'json', nullable: true })
  playlistUrls: Record<string, string | null> | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true, default: null })
  completedAt: Date | null;
}
