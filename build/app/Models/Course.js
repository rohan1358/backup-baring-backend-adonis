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
const Orm_1 = global[Symbol.for('ioc.use')]("Adonis/Lucid/Orm");
const luxon_1 = require("luxon");
const User_1 = __importDefault(require("./User"));
const Subject_1 = __importDefault(require("./Subject"));
const s3_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/s3"));
const client_s3_1 = require("@aws-sdk/client-s3");
const Review_1 = __importDefault(require("./Review"));
const notification_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/notification"));
class Course extends Orm_1.BaseModel {
    serializeExtras() {
        return {
            is_access: this.$extras.is_access,
        };
    }
    static async beforeDeleteHook(course) {
        const subject = await Subject_1.default.findBy('course_id', course.id);
        await subject?.delete();
    }
    static async afterDeleteHook(course) {
        if (course.cover) {
            await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: course.cover, Bucket: 'cover-online-course' }));
        }
        const subject = await Subject_1.default.findBy('course_id', course.id);
        if (subject) {
            subject.delete();
        }
    }
    static async afterCreateCourse(course) {
        notification_1.default.messaging()
            .sendToTopic('newCourse', {
            notification: {
                title: 'Online Course Baru',
                body: course.title,
            },
        })
            .then(() => { });
    }
}
__decorate([
    Orm_1.column({ isPrimary: true }),
    __metadata("design:type", Number)
], Course.prototype, "id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Course.prototype, "title", void 0);
__decorate([
    Orm_1.column({
        serialize: (value) => {
            if (!value) {
                return '/no-image.png';
            }
            return '/api/stream/course-cover/' + value;
        },
    }),
    __metadata("design:type", String)
], Course.prototype, "cover", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Course.prototype, "description", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Course.prototype, "price", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Course.prototype, "amemberId", void 0);
__decorate([
    Orm_1.column({
        serialize: (value) => {
            if (!value) {
                return null;
            }
            return '/api/stream/course-pdf/' + value;
        },
    }),
    __metadata("design:type", String)
], Course.prototype, "pdf", void 0);
__decorate([
    Orm_1.manyToMany(() => User_1.default, { pivotTable: 'member_course', pivotColumns: ['mentor'] }),
    __metadata("design:type", Object)
], Course.prototype, "users", void 0);
__decorate([
    Orm_1.hasMany(() => Subject_1.default),
    __metadata("design:type", Object)
], Course.prototype, "subjects", void 0);
__decorate([
    Orm_1.hasMany(() => Review_1.default),
    __metadata("design:type", Object)
], Course.prototype, "reviews", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Course.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Course.prototype, "updatedAt", void 0);
__decorate([
    Orm_1.beforeDelete(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Course]),
    __metadata("design:returntype", Promise)
], Course, "beforeDeleteHook", null);
__decorate([
    Orm_1.afterDelete(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Course]),
    __metadata("design:returntype", Promise)
], Course, "afterDeleteHook", null);
__decorate([
    Orm_1.afterCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Course]),
    __metadata("design:returntype", Promise)
], Course, "afterCreateCourse", null);
exports.default = Course;
//# sourceMappingURL=Course.js.map