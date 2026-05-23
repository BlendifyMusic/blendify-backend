import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaylistController } from './playlist.controller';
import { PlaylistService } from './playlist.service';
import { User } from '../entities/user.entity';
import { Blend } from '../entities/blend.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Blend])],
  controllers: [PlaylistController],
  providers: [PlaylistService],
})
export class PlaylistModule {}
