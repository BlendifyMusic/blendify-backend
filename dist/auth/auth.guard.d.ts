import { CanActivate, ExecutionContext } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
export declare class FirebaseAuthGuard implements CanActivate {
    private firebase;
    constructor(firebase: FirebaseService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
