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
exports.PlaylistController = void 0;
const common_1 = require("@nestjs/common");
const playlist_service_1 = require("./playlist.service");
const auth_guard_1 = require("../auth/auth.guard");
let PlaylistController = class PlaylistController {
    playlistService;
    constructor(playlistService) {
        this.playlistService = playlistService;
    }
    async pushPlaylist(blendId, req) {
        const url = await this.playlistService.pushPlaylist(blendId, req.user.uid);
        return { playlistUrl: url };
    }
};
exports.PlaylistController = PlaylistController;
__decorate([
    (0, common_1.Post)(':blendId/push'),
    (0, common_1.UseGuards)(auth_guard_1.FirebaseAuthGuard),
    __param(0, (0, common_1.Param)('blendId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PlaylistController.prototype, "pushPlaylist", null);
exports.PlaylistController = PlaylistController = __decorate([
    (0, common_1.Controller)('playlist'),
    __metadata("design:paramtypes", [playlist_service_1.PlaylistService])
], PlaylistController);
//# sourceMappingURL=playlist.controller.js.map