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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const Orm_1 = global[Symbol.for('ioc.use')]("Adonis/Lucid/Orm");
const Content_1 = __importDefault(require("./Content"));
const s3_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/s3"));
const client_s3_1 = require("@aws-sdk/client-s3");
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
const ReadLog_1 = __importDefault(require("./ReadLog"));
class Bab extends Orm_1.BaseModel {
    static async afterDeleteHook(bab) {
        await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: bab.audio, Bucket: 'ring-audio-01' }));
    }
}
__decorate([
    Orm_1.column({ isPrimary: true }),
    __metadata("design:type", Number)
], Bab.prototype, "id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Bab.prototype, "title", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Bab.prototype, "body", void 0);
__decorate([
    Orm_1.column({
        serialize: (value) => {
            return Route_1.default.makeSignedUrl('streamBab', {
                filename: value,
            }, {
                expiresIn: '30m',
            });
        },
    }),
    __metadata("design:type", String)
], Bab.prototype, "audio", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Bab.prototype, "contentId", void 0);
__decorate([
    Orm_1.belongsTo(() => Content_1.default),
    __metadata("design:type", Object)
], Bab.prototype, "content", void 0);
__decorate([
    Orm_1.hasMany(() => ReadLog_1.default),
    __metadata("design:type", Object)
], Bab.prototype, "reads", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Bab.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Bab.prototype, "updatedAt", void 0);
__decorate([
    Orm_1.afterDelete(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Bab]),
    __metadata("design:returntype", Promise)
], Bab, "afterDeleteHook", null);
exports.default = Bab;
//# sourceMappingURL=Bab.js.map