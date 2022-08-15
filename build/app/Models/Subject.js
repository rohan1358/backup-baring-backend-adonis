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
const client_s3_1 = require("@aws-sdk/client-s3");
const Orm_1 = global[Symbol.for('ioc.use')]("Adonis/Lucid/Orm");
const s3_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/s3"));
const luxon_1 = require("luxon");
const Boost_1 = __importDefault(require("./Boost"));
const Comment_1 = __importDefault(require("./Comment"));
const Course_1 = __importDefault(require("./Course"));
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
class Subject extends Orm_1.BaseModel {
    static async beforeDeleteHook(subject) {
        const childs = await Subject.findBy('parent_id', subject.id);
        await childs?.delete();
    }
    static async afterDeleteHook(subject) {
        if (subject.video) {
            await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: subject.video, Bucket: 'video-online-course' }));
        }
        if (subject.pdf) {
            await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: subject.pdf, Bucket: 'pdf-course' }));
        }
        if (subject.audio) {
            await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: subject.audio, Bucket: 'audio-course' }));
        }
        const child = await Subject.findBy('parent_id', subject.id);
        if (child) {
            subject.delete();
        }
    }
}
__decorate([
    Orm_1.column({ isPrimary: true }),
    __metadata("design:type", Number)
], Subject.prototype, "id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Subject.prototype, "title", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Subject.prototype, "body", void 0);
__decorate([
    Orm_1.column({
        serializeAs: null,
    }),
    __metadata("design:type", String)
], Subject.prototype, "video", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Object)
], Subject.prototype, "parentId", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Subject.prototype, "courseId", void 0);
__decorate([
    Orm_1.column({
        serialize: (value) => {
            if (!value) {
                return null;
            }
            return Route_1.default.makeSignedUrl('streamSubjectPDF', {
                filename: value,
            }, {
                expiresIn: '30m',
            });
        },
    }),
    __metadata("design:type", String)
], Subject.prototype, "pdf", void 0);
__decorate([
    Orm_1.column({
        serialize: (value) => {
            if (!value) {
                return null;
            }
            return Route_1.default.makeSignedUrl('streamSubjectAudio', {
                filename: value,
            }, {
                expiresIn: '30m',
            });
        },
    }),
    __metadata("design:type", String)
], Subject.prototype, "audio", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Subject.prototype, "position", void 0);
__decorate([
    Orm_1.belongsTo(() => Subject, { foreignKey: 'parentId' }),
    __metadata("design:type", Object)
], Subject.prototype, "parent", void 0);
__decorate([
    Orm_1.hasMany(() => Subject, { foreignKey: 'parentId' }),
    __metadata("design:type", Object)
], Subject.prototype, "childs", void 0);
__decorate([
    Orm_1.belongsTo(() => Course_1.default),
    __metadata("design:type", Object)
], Subject.prototype, "course", void 0);
__decorate([
    Orm_1.hasMany(() => Comment_1.default),
    __metadata("design:type", Object)
], Subject.prototype, "comments", void 0);
__decorate([
    Orm_1.hasMany(() => Boost_1.default),
    __metadata("design:type", Object)
], Subject.prototype, "boosts", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Subject.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Subject.prototype, "updatedAt", void 0);
__decorate([
    Orm_1.beforeDelete(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Subject]),
    __metadata("design:returntype", Promise)
], Subject, "beforeDeleteHook", null);
__decorate([
    Orm_1.afterDelete(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Subject]),
    __metadata("design:returntype", Promise)
], Subject, "afterDeleteHook", null);
exports.default = Subject;
//# sourceMappingURL=Subject.js.map