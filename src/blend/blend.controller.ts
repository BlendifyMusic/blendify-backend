import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BlendService } from './blend.service';
import { FirebaseAuthGuard } from '../auth/auth.guard';

@Controller('blend')
export class BlendController {
  constructor(private blendService: BlendService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async createBlend(@Req() req: any) {
    const blendId = await this.blendService.createBlend(req.user.uid);
    return { blendId };
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
