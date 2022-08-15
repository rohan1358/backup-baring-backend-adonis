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
const s3_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/s3"));
const client_s3_1 = require("@aws-sdk/client-s3");
const notification_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/notification"));
class Product extends Orm_1.BaseModel {
    static async afterDeleteHook(product) {
        if (product.cover) {
            await s3_1.default.send(new client_s3_1.DeleteObjectCommand({ Key: product.cover, Bucket: 'product-images' }));
        }
    }
    static async afterCreateProduct(product) {
        notification_1.default.messaging()
            .sendToTopic('newProduct', {
            notification: {
                title: 'Produk Baru',
                body: product.title,
            },
        })
            .then(() => { });
    }
}
__decorate([
    Orm_1.column({ isPrimary: true }),
    __metadata("design:type", Number)
], Product.prototype, "id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Product.prototype, "title", void 0);
__decorate([
    Orm_1.column({
        serialize: (value) => {
            if (!value) {
                return '/no-image.png';
            }
            return '/api/stream/product-cover/' + value;
        },
    }),
    __metadata("design:type", String)
], Product.prototype, "cover", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Product.prototype, "amemberId", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Product.prototype, "weight", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Product.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Product.prototype, "updatedAt", void 0);
__decorate([
    Orm_1.afterDelete(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Product]),
    __metadata("design:returntype", Promise)
], Product, "afterDeleteHook", null);
__decorate([
    Orm_1.afterCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Product]),
    __metadata("design:returntype", Promise)
], Product, "afterCreateProduct", null);
exports.default = Product;
//# sourceMappingURL=Product.js.map