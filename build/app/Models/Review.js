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
const User_1 = __importDefault(require("./User"));
const Course_1 = __importDefault(require("./Course"));
class Review extends Orm_1.BaseModel {
}
__decorate([
    Orm_1.column({ isPrimary: true }),
    __metadata("design:type", Number)
], Review.prototype, "id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Review.prototype, "userId", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Review.prototype, "courseId", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Review.prototype, "star", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Review.prototype, "body", void 0);
__decorate([
    Orm_1.belongsTo(() => User_1.default),
    __metadata("design:type", Object)
], Review.prototype, "user", void 0);
__decorate([
    Orm_1.belongsTo(() => Course_1.default),
    __metadata("design:type", Object)
], Review.prototype, "course", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Review.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Review.prototype, "updatedAt", void 0);
exports.default = Review;
//# sourceMappingURL=Review.js.map