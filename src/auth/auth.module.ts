import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { ListeningData } from '../entities/listening-data.entity';
import { MusicModule } from '../music/music.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, ListeningData]), MusicModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
