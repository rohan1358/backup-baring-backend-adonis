"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const makeQuery_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Helpers/makeQuery"));
const CheckoutDetail_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/CheckoutDetail"));
const Checkout_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Checkout"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
class SubscriptionsController {
    async packageList({ response, auth }) {
        let axiosResponse = {}, haveTrial = false;
        if (auth.use('userApi').isLoggedIn) {
            if (auth.use('userApi').user?.haveTrial && !auth.use('userApi').user?.inTrial) {
                haveTrial = true;
            }
        }
        try {
            axiosResponse = await axios_1.default.get(`${Env_1.default.get('AMEMBER_URL')}/api/products?${makeQuery_1.default({
                _key: Env_1.default.get('AMEMBER_KEY'),
                _nested: ['billing-plans', 'product-product-category'],
            }).string()}`);
        }
        catch (e) {
            return response.internalServerError();
        }
        if (axiosResponse.data.error) {
            return response.badRequest();
        }
        const products = [];
        for (let product of Object.values(axiosResponse.data)) {
            const detail = product;
            if (detail.nested &&
                detail.nested['product-product-category'][0]?.product_category_id === '1' &&
                !(detail.product_id === 6 && !haveTrial)) {
                products.push({
                    id: detail.product_id,
                    title: detail.title,
                    description: detail.description,
                    price: Number(detail.nested['billing-plans'][0]?.first_price),
                });
            }
        }
        return products;
    }
    _randUnique() {
        return Math.floor(Math.random() * (999 - 100 + 1) + 100);
    }
    async _checkTotalExist(total) {
        const payment = await Checkout_1.default.query().where('total', total).andWhere('is_paid', false).first();
        if (!payment) {
            return false;
        }
        return true;
    }
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
    _createInvoice(userId, uniqueNumber, productId) {
        return new Promise((resolve) => {
            ;
            (async () => {
                const data = {
                    _key: Env_1.default.get('AMEMBER_KEY'),
                    user_id: userId,
                    paysys_id: 'moota',
                    currency: 'IDR',
                    first_subtotal: '0.00',
                    first_discount: '0.00',
                    first_tax: '0.00',
                    first_shipping: '0.00',
                    first_total: '0.00',
                    first_period: '1m',
                    rebill_times: 99999,
                    is_confirmed: 1,
                    status: 0,
                    nested: {
                        'invoice-items': [],
                    },
                };
                const product = await this._getProduct(productId);
                if (product) {
                    data.nested['invoice-items'].push({
                        item_id: productId,
                        item_type: 'product',
                        item_title: product.title,
                        item_description: product.description,
                        qty: 1,
                        first_discount: '0.00',
                        first_price: (Number(product.nested['billing-plans'][0]?.first_price) + uniqueNumber).toFixed(2),
                        first_tax: '0.00',
                        first_shipping: '0.00',
                        first_period: product.nested['billing-plans'][0].first_period,
                        second_price: uniqueNumber.toFixed(2),
                        second_total: uniqueNumber.toFixed(2),
                        rebill_times: product.nested['billing-plans'][0].rebill_times,
                        currency: 'IDR',
                        billing_plan_id: product.nested['billing-plans'][0].plan_id,
                    });
                    uniqueNumber = 0;
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
    async create({ auth, response, params }) {
        let axiosResponse;
        try {
            axiosResponse = await axios_1.default.get(`${Env_1.default.get('AMEMBER_URL')}/api/products/${params.id}?${makeQuery_1.default({
                _key: Env_1.default.get('AMEMBER_KEY'),
                _nested: ['billing-plans', 'product-product-category'],
            }).string()}`);
        }
        catch (e) {
            return response.internalServerError();
        }
        if (axiosResponse.data.error) {
            return response.badRequest();
        }
        const [item] = axiosResponse.data;
        const items = [];
        const productItem = new CheckoutDetail_1.default();
        productItem.title = item.title;
        productItem.price = Number(item.nested['billing-plans'][0]?.first_price);
        productItem.qty = 1;
        productItem.isSub = true;
        items.push(productItem);
        const total = Number(item.nested['billing-plans'][0]?.first_price);
        let detail = {};
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
            const invoice = await this._createInvoice(auth.use('userApi').user?.amemberId, uniqueNumber, params.id);
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
}
exports.default = SubscriptionsController;
//# sourceMappingURL=SubscriptionsController.js.map