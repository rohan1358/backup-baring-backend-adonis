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
const CheckoutDetail_1 = __importDefault(require("./CheckoutDetail"));
const User_1 = __importDefault(require("./User"));
class Checkout extends Orm_1.BaseModel {
    static stringifyDetailInfo(checkout) {
        if (checkout.$dirty.detail && checkout.$dirty.detail instanceof Object) {
            checkout.detail = JSON.stringify(checkout.$dirty.detail);
        }
    }
}
__decorate([
    Orm_1.column({ isPrimary: true }),
    __metadata("design:type", Number)
], Checkout.prototype, "id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Checkout.prototype, "total", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Checkout.prototype, "userId", void 0);
__decorate([
    Orm_1.column({
        serialize: (value) => {
            return JSON.parse(value);
        },
    }),
    __metadata("design:type", Object)
], Checkout.prototype, "detail", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Boolean)
], Checkout.prototype, "isPaid", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Checkout.prototype, "invoiceId", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Checkout.prototype, "resi", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Checkout.prototype, "status", void 0);
__decorate([
    Orm_1.hasMany(() => CheckoutDetail_1.default),
    __metadata("design:type", Object)
], Checkout.prototype, "items", void 0);
__decorate([
    Orm_1.belongsTo(() => User_1.default),
    __metadata("design:type", Object)
], Checkout.prototype, "user", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Checkout.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Checkout.prototype, "updatedAt", void 0);
__decorate([
    Orm_1.beforeSave(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Checkout]),
    __metadata("design:returntype", void 0)
], Checkout, "stringifyDetailInfo", null);
exports.default = Checkout;
//# sourceMappingURL=Checkout.js.map