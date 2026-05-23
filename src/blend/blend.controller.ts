import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { BlendService } from './blend.service';
import { FirebaseAuthGuard } from '../auth/auth.guard';

interface MessageEvent {
  data: string | object;
}

@Controller('blend')
export class BlendController {
  constructor(private blendService: BlendService) {}

  @Get('user/music-data')
  @UseGuards(FirebaseAuthGuard)
  async getUserMusicData(@Req() req: any) {
    return this.blendService.getUserMusicData(req.user.uid);
  }

  @Get('user/profile')
  @UseGuards(FirebaseAuthGuard)
  async getUserProfile(@Req() req: any) {
    return this.blendService.getUserProfile(req.user.uid);
  }

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async createBlend(@Req() req: any) {
    const blendId = await this.blendService.createBlend(req.user.uid);
    return { blendId };
  }

  @Sse(':id/events')
  blendEvents(@Param('id') id: string): Observable<MessageEvent> {
    return this.blendService.streamBlendUpdates(id);
  }

  @Get(':id')
  async getBlend(@Param('id') id: string) {
    return this.blendService.getBlend(id);
  }

  @Post(':id/join')
  @UseGuards(FirebaseAuthGuard)
  async joinBlend(@Param('id') id: string, @Req() req: any) {
    const result = await this.blendService.joinBlend(id, req.user.uid);
    return { status: 'ready', result };
  }
}
