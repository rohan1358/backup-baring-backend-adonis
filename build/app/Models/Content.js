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
const Bab_1 = __importDefault(require("./Bab"));
const Category_1 = __importDefault(require("./Category"));
const s3_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/s3"));
const client_s3_1 = require("@aws-sdk/client-s3");
const Author_1 = __importDefault(require("./Author"));
const Like_1 = __importDefault(require("./Like"));
const notification_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/notification"));
class Content extends Orm_1.BaseModel {
    serializeExtras() {
        return {
            babs_count: this.$extras.babs_count,
            total: this.$extras.total,
            is_liked: this.$extras.is_liked,
        };
    }
    static async beforeDeleteHook(content) {
        const bab = await Bab_1.default.findBy('content_id', content.id);
        await bab?.delete();
    }
    static async afterCreateContent(content) {
        notification_1.default.messaging()
            .sendToTopic('newRelease', {
            notification: {
                title: 'Rilisan Baru',
                body: content.title,
            },
        })
            .then(() => { });
    }
    static async afterDeleteHook(content) {
        await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: content.cover, Bucket: 'covers-01' }));
        if (content.audio) {
            await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: content.audio, Bucket: 'plot-audio-01' }));
        }
    }
}
__decorate([
    Orm_1.column({ isPrimary: true }),
    __metadata("design:type", Number)
], Content.prototype, "id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Content.prototype, "title", void 0);
__decorate([
    Orm_1.column({
        serialize: (value) => {
            return '/api/stream/cover/' + value;
        },
    }),
    __metadata("design:type", String)
], Content.prototype, "cover", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Content.prototype, "synopsis", void 0);
__decorate([
    Orm_1.column({
        serialize: (value) => {
            if (value) {
                return '/api/stream/synopsis/' + value;
            }
            return null;
        },
    }),
    __metadata("design:type", String)
], Content.prototype, "audio", void 0);
__decorate([
    Orm_1.hasMany(() => Bab_1.default),
    __metadata("design:type", Object)
], Content.prototype, "babs", void 0);
__decorate([
    Orm_1.manyToMany(() => Category_1.default),
    __metadata("design:type", Object)
], Content.prototype, "categories", void 0);
__decorate([
    Orm_1.manyToMany(() => Author_1.default),
    __metadata("design:type", Object)
], Content.prototype, "authors", void 0);
__decorate([
    Orm_1.hasMany(() => Like_1.default),
    __metadata("design:type", Object)
], Content.prototype, "likes", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Content.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Content.prototype, "updatedAt", void 0);
__decorate([
    Orm_1.beforeDelete(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Content]),
    __metadata("design:returntype", Promise)
], Content, "beforeDeleteHook", null);
__decorate([
    Orm_1.afterCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Content]),
    __metadata("design:returntype", Promise)
], Content, "afterCreateContent", null);
__decorate([
    Orm_1.afterDelete(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Content]),
    __metadata("design:returntype", Promise)
], Content, "afterDeleteHook", null);
exports.default = Content;
//# sourceMappingURL=Content.js.map