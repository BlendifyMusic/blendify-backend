"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlendModule = void 0;
const common_1 = require("@nestjs/common");
const blend_controller_1 = require("./blend.controller");
const blend_service_1 = require("./blend.service");
const algorithm_service_1 = require("./algorithm.service");
const matcher_service_1 = require("./matcher.service");
const music_module_1 = require("../music/music.module");
let BlendModule = class BlendModule {
};
exports.BlendModule = BlendModule;
exports.BlendModule = BlendModule = __decorate([
    (0, common_1.Module)({
        imports: [music_module_1.MusicModule],
        controllers: [blend_controller_1.BlendController],
        providers: [blend_service_1.BlendService, algorithm_service_1.AlgorithmService, matcher_service_1.MatcherService],
        exports: [blend_service_1.BlendService],
    })
], BlendModule);
//# sourceMappingURL=blend.module.js.map