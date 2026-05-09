"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlendController = void 0;
const common_1 = require("@nestjs/common");
const blend_service_1 = require("./blend.service");
const auth_guard_1 = require("../auth/auth.guard");
let BlendController = class BlendController {
    blendService;
    constructor(blendService) {
        this.blendService = blendService;
    }
    async createBlend(req) {
        const blendId = await this.blendService.createBlend(req.user.uid);
        return { blendId };
    }
    async getBlend(id) {
        return this.blendService.getBlend(id);
    }
    async joinBlend(id, req) {
        const result = await this.blendService.joinBlend(id, req.user.uid);
        return { status: 'ready', result };
    }
};
exports.BlendController = BlendController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(auth_guard_1.FirebaseAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BlendController.prototype, "createBlend", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BlendController.prototype, "getBlend", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    (0, common_1.UseGuards)(auth_guard_1.FirebaseAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BlendController.prototype, "joinBlend", null);
exports.BlendController = BlendController = __decorate([
    (0, common_1.Controller)('blend'),
    __metadata("design:paramtypes", [blend_service_1.BlendService])
], BlendController);
//# sourceMappingURL=blend.controller.js.map