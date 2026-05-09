import { Controller, Post, Param, Req, UseGuards } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { FirebaseAuthGuard } from '../auth/auth.guard';

@Controller('playlist')
export class PlaylistController {
  constructor(private playlistService: PlaylistService) {}

  @Post(':blendId/push')
  @UseGuards(FirebaseAuthGuard)
  async pushPlaylist(@Param('blendId') blendId: string, @Req() req: any) {
    const url = await this.playlistService.pushPlaylist(blendId, req.user.uid);
    return { playlistUrl: url };
  }
}
