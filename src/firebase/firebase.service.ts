import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: admin.app.App;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length === 0) {
      this.app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: this.config.get('FIREBASE_PROJECT_ID'),
      });
    } else {
      this.app = admin.apps[0]!;
    }
  }

  get auth() {
    return this.app.auth();
  }
}
