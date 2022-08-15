"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Cart_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Cart"));
const Course_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Course"));
const Product_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Product"));
class CartsController {
    async index({ auth }) {
        const carts = await Cart_1.default.query()
            .where('user_id', auth.use('userApi').user?.id)
            .preload('product')
            .preload('course');
        return carts.map((cart) => {
            const serialize = cart.serialize();
            let item;
            if (serialize.type === 'product') {
                item = serialize.product;
            }
            else if (serialize.type === 'course') {
                item = serialize.course;
            }
            return {
                id: item.id,
                qty: serialize.qty,
                name: item.title,
                price: item.price,
                image: item.cover,
                type: serialize.type,
            };
        });
    }
    async increase({ auth, request, response }) {
        const { qty = 1, product_id, course_id, } = await request.validate({
            schema: Validator_1.schema.create({
                qty: Validator_1.schema.number.optional(),
                product_id: Validator_1.schema.number.optional(),
                course_id: Validator_1.schema.number.optional(),
            }),
        });
        let item = null;
        let cart = null;
        if (product_id) {
            item = await Product_1.default.findOrFail(product_id);
            cart = await Cart_1.default.query()
                .where('user_id', auth.use('userApi').user?.id)
                .andWhere('product_id', item.id)
                .first();
            if (!cart) {
                cart = new Cart_1.default();
                cart.userId = auth.use('userApi').user?.id;
                cart.productId = item.id;
                cart.qty = qty || 1;
            }
            else {
                cart.qty = cart.qty + qty;
            }
        }
        else if (course_id) {
            item = await Course_1.default.findOrFail(course_id);
            if (!item.price)
                return response.methodNotAllowed();
            cart = await Cart_1.default.query()
                .where('user_id', auth.use('userApi').user?.id)
                .andWhere('course_id', item.id)
                .first();
            if (!cart) {
                cart = new Cart_1.default();
                cart.userId = auth.use('userApi').user?.id;
                cart.courseId = item.id;
                cart.qty = 1;
            }
            else {
                cart.qty = cart.qty + qty;
            }
        }
        if (!item)
            return response.badRequest();
        await cart.save();
        return cart.serialize();
    }
    async decrease({ auth, request }) {
        const { qty, product_id } = await request.validate({
            schema: Validator_1.schema.create({
                qty: Validator_1.schema.number(),
                product_id: Validator_1.schema.number(),
            }),
        });
        const cart = await Cart_1.default.query()
            .where('product_id', product_id)
            .andWhere('user_id', auth.use('userApi').user?.id)
            .firstOrFail();
        if (cart.qty - qty <= 0) {
            await cart.delete();
        }
        else {
            cart.qty = cart.qty - qty;
            await cart.save();
        }
        return cart.serialize();
    }
    async reset({ auth, request, response }) {
        const { qty = 0, product_id, course_id, } = await request.validate({
            schema: Validator_1.schema.create({
                qty: Validator_1.schema.number.optional(),
                product_id: Validator_1.schema.number.optional(),
                course_id: Validator_1.schema.number.optional(),
            }),
        });
        let cart = null;
        let cartQuery = Cart_1.default.query().where('user_id', auth.use('userApi').user?.id);
        if (product_id) {
            cart = await cartQuery.andWhere('product_id', product_id).firstOrFail();
        }
        else if (course_id) {
            cart = await cartQuery.andWhere('course_id', course_id).firstOrFail();
        }
        if (!cart)
            return response.badRequest();
        if (qty <= 0) {
            await cart.delete();
        }
        else {
            cart.qty = product_id ? qty : 1;
            await cart.save();
        }
        return cart.serialize();
    }
}
exports.default = CartsController;
//# sourceMappingURL=CartsController.js.map