import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { MusicModule } from './music/music.module';
import { BlendModule } from './blend/blend.module';
import { PlaylistModule } from './playlist/playlist.module';
import { User } from './entities/user.entity';
import { Blend } from './entities/blend.entity';
import { ListeningData } from './entities/listening-data.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USERNAME', 'root'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_DATABASE', 'blendify'),
        entities: [User, Blend, ListeningData],
        synchronize: config.get('DB_SYNC', 'true') === 'true',
      }),
    }),
    FirebaseModule,
    AuthModule,
    MusicModule,
    BlendModule,
    PlaylistModule,
  ],
})
export class AppModule {}
