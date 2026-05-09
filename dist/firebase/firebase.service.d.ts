import { OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
export declare class FirebaseService implements OnModuleInit {
    private config;
    private app;
    constructor(config: ConfigService);
    onModuleInit(): void;
    get auth(): import("firebase-admin/auth").Auth;
    get firestore(): admin.firestore.Firestore;
}
