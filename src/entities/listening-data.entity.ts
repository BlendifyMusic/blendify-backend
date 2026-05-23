import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('listening_data')
export class ListeningData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 128 })
  userUid: string;

  @ManyToOne(() => User, (u) => u.listeningData)
  @JoinColumn({ name: 'userUid' })
  user: User;

  @Column({ type: 'json' })
  tracks: any[];

  @Column({ type: 'json' })
  artists: any[];

  @CreateDateColumn()
  fetchedAt: Date;
}
