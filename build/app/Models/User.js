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
const Boost_1 = __importDefault(require("./Boost"));
const Checkout_1 = __importDefault(require("./Checkout"));
const Clip_1 = __importDefault(require("./Clip"));
const Comment_1 = __importDefault(require("./Comment"));
const Course_1 = __importDefault(require("./Course"));
const Like_1 = __importDefault(require("./Like"));
const LoginLog_1 = __importDefault(require("./LoginLog"));
const Partner_1 = __importDefault(require("./Partner"));
const ReadLog_1 = __importDefault(require("./ReadLog"));
const Review_1 = __importDefault(require("./Review"));
class User extends Orm_1.BaseModel {
}
__decorate([
    Orm_1.column({ isPrimary: true }),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], User.prototype, "amemberId", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], User.prototype, "fullname", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    Orm_1.column({
        serialize: (value) => {
            if (!value) {
                return '/no-image.png';
            }
            return '/api/stream/user-avatar/' + value;
        },
    }),
    __metadata("design:type", String)
], User.prototype, "avatar", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", luxon_1.DateTime)
], User.prototype, "subscriptionEnd", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], User.prototype, "partnerId", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Boolean)
], User.prototype, "isMentor", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Boolean)
], User.prototype, "inTrial", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Boolean)
], User.prototype, "haveTrial", void 0);
__decorate([
    Orm_1.column({
        serializeAs: null,
    }),
    __metadata("design:type", String)
], User.prototype, "fcmToken", void 0);
__decorate([
    Orm_1.belongsTo(() => Partner_1.default),
    __metadata("design:type", Object)
], User.prototype, "partner", void 0);
__decorate([
    Orm_1.hasMany(() => LoginLog_1.default),
    __metadata("design:type", Object)
], User.prototype, "loginLogs", void 0);
__decorate([
    Orm_1.hasMany(() => ReadLog_1.default),
    __metadata("design:type", Object)
], User.prototype, "readLogs", void 0);
__decorate([
    Orm_1.hasMany(() => Like_1.default),
    __metadata("design:type", Object)
], User.prototype, "liked", void 0);
__decorate([
    Orm_1.hasMany(() => Checkout_1.default),
    __metadata("design:type", Object)
], User.prototype, "checkouts", void 0);
__decorate([
    Orm_1.manyToMany(() => Course_1.default, { pivotTable: 'member_course' }),
    __metadata("design:type", Object)
], User.prototype, "courses", void 0);
__decorate([
    Orm_1.hasMany(() => Comment_1.default),
    __metadata("design:type", Object)
], User.prototype, "comments", void 0);
__decorate([
    Orm_1.hasMany(() => Boost_1.default),
    __metadata("design:type", Object)
], User.prototype, "boosts", void 0);
__decorate([
    Orm_1.hasMany(() => Review_1.default),
    __metadata("design:type", Object)
], User.prototype, "reviews", void 0);
__decorate([
    Orm_1.hasMany(() => Clip_1.default),
    __metadata("design:type", Object)
], User.prototype, "clips", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], User.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], User.prototype, "updatedAt", void 0);
exports.default = User;
//# sourceMappingURL=User.js.map