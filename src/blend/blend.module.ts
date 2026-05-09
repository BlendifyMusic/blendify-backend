import { Module } from '@nestjs/common';
import { BlendController } from './blend.controller';
import { BlendService } from './blend.service';
import { AlgorithmService } from './algorithm.service';
import { MatcherService } from './matcher.service';
import { MusicModule } from '../music/music.module';

@Module({
  imports: [MusicModule],
  controllers: [BlendController],
  providers: [BlendService, AlgorithmService, MatcherService],
  exports: [BlendService],
})
export class BlendModule {}
