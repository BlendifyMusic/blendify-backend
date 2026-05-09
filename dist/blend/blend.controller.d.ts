import { BlendService } from './blend.service';
export declare class BlendController {
    private blendService;
    constructor(blendService: BlendService);
    createBlend(req: any): Promise<{
        blendId: string;
    }>;
    getBlend(id: string): Promise<any>;
    joinBlend(id: string, req: any): Promise<{
        status: string;
        result: import("../music/types").BlendResult;
    }>;
}
