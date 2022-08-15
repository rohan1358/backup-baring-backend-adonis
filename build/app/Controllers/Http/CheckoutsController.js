"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Cart_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Cart"));
const axios_1 = __importDefault(require("axios"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const Checkout_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Checkout"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const CheckoutDetail_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/CheckoutDetail"));
const Validator_2 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const makeQuery_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/makeQuery"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const fs_1 = __importDefault(require("fs"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const stream_1 = require("stream");
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
class CheckoutsController {
    _getProduct(id) {
        const promise = new Promise((resolve) => {
            axios_1.default
                .get(`${Env_1.default.get('AMEMBER_URL')}/api/products/${id}`, {
                params: {
                    _key: Env_1.default.get('AMEMBER_KEY'),
                    _nested: ['billing-plans'],
                },
            })
                .then((response) => {
                if (response.data.error) {
                    resolve(false);
                    return;
                }
                else if (response.data.length < 1) {
                    resolve(false);
                    return;
                }
                resolve(response.data[0]);
            })
                .catch(() => {
                resolve(false);
            });
        });
        return promise;
    }
    _randUnique() {
        return Math.floor(Math.random() * (999 - 100 + 1) + 100);
    }
    _createInvoice(userId, uniqueNumber, shipping, carts, paysys = 'moota') {
        return new Promise((resolve) => {
            ;
            (async () => {
                const data = {
                    _key: Env_1.default.get('AMEMBER_KEY'),
                    user_id: userId,
                    paysys_id: paysys,
                    currency: 'IDR',
                    first_subtotal: '0.00',
                    first_discount: '0.00',
                    first_tax: '0.00',
                    first_shipping: '0.00',
                    first_total: '0.00',
                    first_period: '1m',
                    second_subtotal: '22.00',
                    second_discount: '0.00',
                    second_tax: '0.00',
                    second_shipping: '0.00',
                    second_total: '00.00',
                    second_period: '1m',
                    rebill_times: 99999,
                    is_confirmed: 1,
                    status: 0,
                    nested: {
                        'invoice-items': [],
                    },
                };
                for (let item of carts) {
                    const product = await this._getProduct((item.product || item.course).amemberId);
                    if (product) {
                        for (let i = 0; i < item.qty; i++) {
                            data.nested['invoice-items'].push({
                                item_id: (item.product || item.course).amemberId,
                                item_type: 'product',
                                item_title: (item.product || item.course).title,
                                item_description: (item.product || item.course).description,
                                qty: 1,
                                first_discount: '0.00',
                                first_price: ((item.product || item.course).price +
                                    uniqueNumber +
                                    shipping).toFixed(2),
                                first_tax: '0.00',
                                first_shipping: shipping,
                                first_period: product.nested['billing-plans'][0].first_period,
                                second_price: (item.product || item.course).price + uniqueNumber.toFixed(2),
                                second_total: (item.product || item.course).price + uniqueNumber.toFixed(2),
                                rebill_times: product.nested['billing-plans'][0].rebill_times,
                                currency: 'IDR',
                                billing_plan_id: product.nested['billing-plans'][0].plan_id,
                            });
                            shipping = 0;
                            uniqueNumber = 0;
                        }
                    }
                }
                const query = makeQuery_1.default(data).string();
                axios_1.default
                    .post(`${Env_1.default.get('AMEMBER_URL')}/api/invoices`, query)
                    .then((response) => {
                    if (response.data.error) {
                        resolve(false);
                        return;
                    }
                    resolve(response.data[0].invoice_id);
                })
                    .catch(() => {
                    resolve(false);
                });
            })();
        });
    }
    async _checkTotalExist(total) {
        const payment = await Checkout_1.default.query().where('total', total).andWhere('is_paid', false).first();
        if (!payment) {
            return false;
        }
        return true;
    }
    _getShippingCost(courier, service, weight, destination) {
        const rajaongkirConfig = JSON.parse(fs_1.default.readFileSync(Application_1.default.makePath('app/Services/rajaongkir.json')));
        return new Promise((resolve) => {
            axios_1.default
                .post('https://pro.rajaongkir.com/api/cost', {
                origin: rajaongkirConfig.subdistrict.subdistrict_id,
                originType: 'subdistrict',
                destination,
                destinationType: 'subdistrict',
                weight,
                courier,
            }, {
                headers: {
                    key: Env_1.default.get('RAJAONGKIR_KEY'),
                },
            })
                .then((response) => {
                const { data: { rajaongkir: { results }, }, } = response;
                const shipping = results[0]?.costs?.find((el) => el.service === service);
                if (!service) {
                    resolve(false);
                    return;
                }
                const cost = shipping.cost[0].value;
                resolve(cost);
            })
                .catch(() => {
                resolve(false);
            });
        });
    }
    _getSubdistricts(id) {
        return new Promise((resolve) => {
            axios_1.default
                .get('https://pro.rajaongkir.com/api/subdistrict', {
                params: {
                    id,
                },
                headers: {
                    key: Env_1.default.get('RAJAONGKIR_KEY'),
                },
            })
                .then((response) => {
                const { data: { rajaongkir: { results }, }, } = response;
                resolve(results);
            })
                .catch(() => {
                resolve(false);
            });
        });
    }
    async create({ request, auth, response }) {
        const carts = await Cart_1.default.query()
            .where('user_id', auth.use('userApi').user?.id)
            .preload('product')
            .preload('course');
        let weight = 0;
        let total = 0;
        let withShipping = false;
        const items = [];
        const cartDeleted = [];
        for (let item of carts) {
            cartDeleted.push(item.id);
            if (item.type === 'product') {
                withShipping = true;
                weight = weight + (item.product.weight || 0);
                const productItem = new CheckoutDetail_1.default();
                productItem.title = item.product.title;
                productItem.price = item.product.price;
                productItem.qty = item.qty;
                productItem.productId = item.product.id;
                items.push(productItem);
            }
            else if (item.type === 'course') {
                const courseItem = new CheckoutDetail_1.default();
                courseItem.title = item.course.title;
                courseItem.price = item.course.price;
                courseItem.qty = item.qty;
                courseItem.courseId = item.course.id;
                items.push(courseItem);
            }
            total = total + (item.product || item.course).price * item.qty;
        }
        if (weight === 0 && withShipping) {
            return response.badRequest({
                error: 'Berat belum diatur',
            });
        }
        const { destination_rajaongkir, destination_first, recipient_name, recipient_phone, shipping_service, } = await request.validate({
            schema: Validator_1.schema.create({
                destination_rajaongkir: withShipping ? Validator_1.schema.number() : Validator_1.schema.number.optional(),
                destination_first: withShipping ? Validator_1.schema.string() : Validator_1.schema.string.optional(),
                recipient_name: withShipping ? Validator_1.schema.string() : Validator_1.schema.string.optional(),
                recipient_phone: withShipping ? Validator_1.schema.string() : Validator_1.schema.string.optional(),
                shipping_service: withShipping ? Validator_1.schema.string() : Validator_1.schema.string.optional(),
            }),
        });
        let detail = {};
        if (withShipping) {
            const subdistrict = await this._getSubdistricts(destination_rajaongkir);
            if (!subdistrict) {
                return response.badRequest({
                    error: 'Subdistrict tidak ditemukan',
                });
            }
            const splitShipping = shipping_service?.split('-');
            const courier = splitShipping[0].trim();
            const service = splitShipping[1] ? splitShipping[1].trim() : false;
            if (!service) {
                return response.badRequest({
                    error: 'Service tidak ditemukan',
                });
            }
            const cost = await this._getShippingCost(courier, service, weight, destination_rajaongkir);
            if (!cost) {
                return response.badRequest({
                    error: 'Gagal mendapatkan ongkos kirim',
                });
            }
            total = total + Number(cost);
            detail.shipping = {
                recipient_name,
                recipient_phone,
                destination: `${destination_first}, Kec. ${subdistrict.subdistrict_name}, ${subdistrict.type} ${subdistrict.city}, ${subdistrict.province}`,
                destination_rajaongkir,
                shipping_service: `${courier} - ${service}`.toUpperCase(),
                cost,
                weight,
            };
        }
        let uniqueNumber = 0;
        if (total > 0) {
            uniqueNumber = this._randUnique();
            while (Boolean(await this._checkTotalExist(total + uniqueNumber))) {
                uniqueNumber = this._randUnique();
            }
        }
        detail.payment = {
            total,
            unique_number: uniqueNumber,
        };
        const result = await Database_1.default.transaction(async (t) => {
            const checkout = new Checkout_1.default();
            checkout.total = total + uniqueNumber;
            checkout.detail = detail;
            checkout.isPaid = false;
            checkout.status = 0;
            checkout.userId = auth.use('userApi').user?.id;
            await Cart_1.default.query().useTransaction(t).whereIn('id', cartDeleted).delete();
            const invoice = await this._createInvoice(auth.use('userApi').user?.amemberId, uniqueNumber, detail.shipping?.cost || 0, carts, total > 0 ? 'moota' : 'free');
            if (!invoice) {
                throw new Error();
            }
            checkout.invoiceId = invoice;
            await checkout.useTransaction(t).save();
            await checkout.useTransaction(t).related('items').saveMany(items);
            return checkout;
        });
        return result.serialize();
    }
    async list({ request, auth }) {
        const { page } = await Validator_2.validator.validate({
            schema: Validator_1.schema.create({
                page: Validator_1.schema.number.optional(),
            }),
            data: request.all(),
        });
        const limit = 12;
        const offset = (page ? page - 1 : 0) * limit;
        const total = await Checkout_1.default.query()
            .where('user_id', auth.use('userApi').user?.id)
            .count('* as total');
        const checkouts = await Checkout_1.default.query()
            .preload('items', (query) => {
            query.preload('product');
            query.preload('course');
        })
            .where('user_id', auth.use('userApi').user?.id)
            .orderBy('created_at', 'desc')
            .limit(limit)
            .offset(offset);
        return {
            total: Math.ceil(Number(total[0]?.$extras.total || '0') / limit),
            data: checkouts.map((course) => course.serialize()),
        };
    }
    async read({ params, auth, response }) {
        const checkout = await Checkout_1.default.findOrFail(params.id);
        if (auth.use('userApi').isLoggedIn &&
            checkout.userId !== Number(auth.use('userApi').user?.id)) {
            return response.unauthorized();
        }
        return {
            ...checkout.serialize(),
            items: (await checkout.related('items').query()).map((item) => item.serialize()),
        };
    }
    async index({ request }) {
        const { page } = await Validator_2.validator.validate({
            schema: Validator_1.schema.create({
                page: Validator_1.schema.number.optional(),
            }),
            data: request.all(),
        });
        const limit = 10;
        const offset = (page ? page - 1 : 0) * limit;
        const ids = [];
        const total = await Checkout_1.default.query().count('* as total');
        const checkouts = (await Checkout_1.default.query().offset(offset).limit(limit).orderBy('created_at', 'desc')).map((checkout) => {
            if (!ids.includes(checkout.userId)) {
                ids.push(checkout.userId);
            }
            return checkout.serialize();
        });
        const users = await User_1.default.query().select('id', 'fullname').whereIn('id', ids);
        return {
            total: Math.ceil(Number(total[0]?.$original.total || '0') / limit),
            data: checkouts.map((checkout) => {
                return {
                    ...checkout,
                    user: users.find((el) => Number(el.id) === checkout.user_id),
                };
            }),
        };
    }
    async insertResi({ params, request, response }) {
        const checkout = await Checkout_1.default.findOrFail(params.id);
        const { resi } = await request.validate({
            schema: Validator_1.schema.create({
                resi: Validator_1.schema.string(),
            }),
        });
        const detail = checkout.detail ? JSON.parse(checkout.detail) : {};
        if (!detail.shipping || !checkout.isPaid) {
            return response.badRequest();
        }
        checkout.resi = resi;
        if (checkout.status === 1) {
            checkout.status = 2;
        }
        await checkout.save();
        return checkout.serialize();
    }
    async changeStatus({ params, request, response }) {
        const checkout = await Checkout_1.default.findOrFail(params.id);
        const { status } = await request.validate({
            schema: Validator_1.schema.create({
                status: Validator_1.schema.number(),
            }),
        });
        if (!checkout.isPaid) {
            return response.badRequest();
        }
        checkout.status = status;
        await checkout.save();
        return checkout.serialize();
    }
    async requestPrint() {
        return {
            url: Route_1.default.makeSignedUrl('print', {
                expiresIn: '30m',
            }),
        };
    }
    async print({ response, request }) {
        if (!request.hasValidSignature()) {
            return response.methodNotAllowed();
        }
        const checkouts = (await Checkout_1.default.query()
            .whereNot('status', 3)
            .whereNot('status', 0)
            .whereHas('items', (query) => {
            query.whereNotNull('checkout_details.product_id');
        })).map((checkout) => checkout.serialize());
        const file = new stream_1.PassThrough();
        const doc = new pdfkit_1.default({ size: 'A4' });
        const width = 243.64;
        const height = 140;
        let counts = 0;
        let x = 56;
        let y = 56;
        for (let item of checkouts) {
            counts = counts + 1;
            doc.rect(x - 6, y - 6, width, height).stroke();
            doc.text('Nama', x, y);
            doc.moveUp();
            doc.text(':', x + 44);
            doc.moveUp();
            doc.text('', x + 54);
            doc.text(item.detail?.shipping?.recipient_name, { width: 177.64 });
            doc.text('HP', x);
            doc.moveUp();
            doc.text(':', x + 44);
            doc.moveUp();
            doc.text('', x + 54);
            doc.text(item.detail?.shipping?.recipient_phone, { width: 177.64 });
            doc.text('Alamat', x);
            doc.moveUp();
            doc.text(':', x + 44);
            doc.moveUp();
            doc.text('', x + 54);
            doc.text(item.detail?.shipping?.destination, { width: 177.64 });
            doc.text('Kurir', x);
            doc.moveUp();
            doc.text(':', x + 44);
            doc.moveUp();
            doc.text('', x + 54);
            doc.text(item.detail?.shipping?.shipping_service, { width: 177.64 });
            const yChecking = Math.floor(counts / 2);
            if (!(counts % 2 === 0)) {
                x = width + 64;
            }
            else {
                x = 56;
                y = 50 + yChecking * (height + 8) + 6;
            }
            if (counts % 10 === 0) {
                doc.addPage({ size: 'A4' });
                x = 56;
                y = 56;
            }
        }
        doc.pipe(file);
        doc.end();
        response.stream(file);
    }
}
exports.default = CheckoutsController;
//# sourceMappingURL=CheckoutsController.js.map