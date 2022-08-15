"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const axios_1 = __importDefault(require("axios"));
const Cart_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Cart"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const fs_1 = __importDefault(require("fs"));
class RajaongkirsController {
    constructor() {
        this.service = axios_1.default.create({
            baseURL: 'https://pro.rajaongkir.com',
            headers: {
                key: Env_1.default.get('RAJAONGKIR_KEY'),
            },
        });
    }
    async getProvince({ response }) {
        const promise = new Promise((resolve) => {
            this.service
                .get('/api/province')
                .then((response) => {
                const { data: { rajaongkir: { results }, }, } = response;
                resolve(results);
            })
                .catch(() => {
                resolve(false);
            });
        });
        const results = await promise;
        if (!results) {
            return response.internalServerError();
        }
        return results;
    }
    async getCity({ response, request }) {
        const id = request.input('id', '');
        if (!id) {
            return response.badRequest();
        }
        const promise = new Promise((resolve) => {
            this.service
                .get('/api/city', {
                params: {
                    province: id,
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
        const results = await promise;
        if (!results) {
            return response.internalServerError();
        }
        return results;
    }
    async getSubdistrict({ response, request }) {
        const id = request.input('id', '');
        if (!id) {
            return response.badRequest();
        }
        const promise = new Promise((resolve) => {
            this.service
                .get('/api/subdistrict', {
                params: {
                    city: id,
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
        const results = await promise;
        if (!results) {
            return response.internalServerError();
        }
        return results;
    }
    async cost({ request, response, auth }) {
        const destination = request.input('destination', '');
        if (!destination) {
            return response.badRequest();
        }
        const rajaongkirConfig = JSON.parse(fs_1.default.readFileSync(Application_1.default.makePath('app/Services/rajaongkir.json')));
        const carts = await Cart_1.default.query()
            .where('user_id', auth.use('userApi').user?.id)
            .preload('product');
        let weight = 0;
        for (let item of carts) {
            if (item.type === 'product') {
                weight = weight + (item.product.weight || 0);
            }
        }
        if (weight === 0) {
            return response.badRequest();
        }
        const promise = new Promise((resolve) => {
            this.service
                .post('/api/cost', {
                origin: rajaongkirConfig.subdistrict.subdistrict_id,
                originType: 'subdistrict',
                destination,
                destinationType: 'subdistrict',
                weight: 1000,
                courier: rajaongkirConfig.couriers.join(':'),
            })
                .then((response) => {
                const { data: { rajaongkir: { results }, }, } = response;
                const resultsFiltered = [];
                for (let courier of results) {
                    const costs = courier.costs.map((item) => {
                        const cost = item.cost.map((item) => item.etd
                            ? {
                                ...item,
                                etd: item.etd.replace(/[^0-9\-]+/g, ''),
                            }
                            : item);
                        return {
                            ...item,
                            cost,
                        };
                    });
                    resultsFiltered.push({
                        ...courier,
                        costs,
                    });
                }
                resolve(resultsFiltered);
            })
                .catch(() => {
                resolve(false);
            });
        });
        const results = await promise;
        if (!results) {
            return response.internalServerError();
        }
        return results;
    }
}
exports.default = RajaongkirsController;
//# sourceMappingURL=RajaongkirsController.js.map