import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlendController } from './blend.controller';
import { BlendService } from './blend.service';
import { AlgorithmService } from './algorithm.service';
import { MatcherService } from './matcher.service';
import { MusicModule } from '../music/music.module';
import { User } from '../entities/user.entity';
import { Blend } from '../entities/blend.entity';
import { ListeningData } from '../entities/listening-data.entity';

@Module({
  imports: [MusicModule, TypeOrmModule.forFeature([User, Blend, ListeningData])],
  controllers: [BlendController],
  providers: [BlendService, AlgorithmService, MatcherService],
  exports: [BlendService],
})
export class BlendModule {}
