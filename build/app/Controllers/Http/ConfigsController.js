"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const fs_1 = __importDefault(require("fs"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class ConfigsController {
    async getRajaongkir() {
        const rajaongkirConfig = JSON.parse(fs_1.default.readFileSync(Application_1.default.makePath('app/Services/rajaongkir.json')));
        return rajaongkirConfig;
    }
    async getConfig() {
        const config = JSON.parse(fs_1.default.readFileSync(Application_1.default.makePath('app/Services/config.json')));
        return config;
    }
    async setRajaongkir({ request }) {
        const { subdistrict, couriers } = await request.validate({
            schema: Validator_1.schema.create({
                subdistrict: Validator_1.schema.object().members({
                    subdistrict_id: Validator_1.schema.number(),
                    province_id: Validator_1.schema.number(),
                    province: Validator_1.schema.string(),
                    city_id: Validator_1.schema.number(),
                    city: Validator_1.schema.string(),
                    type: Validator_1.schema.string(),
                    subdistrict_name: Validator_1.schema.string(),
                }),
                couriers: Validator_1.schema.array().members(Validator_1.schema.string()),
            }),
        });
        const stringify = JSON.stringify({
            subdistrict,
            couriers,
        });
        fs_1.default.writeFileSync(Application_1.default.makePath('app/Services/rajaongkir.json'), stringify);
        return {
            subdistrict,
            couriers,
        };
    }
    async setConfig({ request }) {
        const { stickyCategory, paymentText } = await request.validate({
            schema: Validator_1.schema.create({
                stickyCategory: Validator_1.schema.array().members(Validator_1.schema.number()),
                paymentText: Validator_1.schema.string(),
            }),
        });
        const stringify = JSON.stringify({
            stickyCategory,
            paymentText,
        });
        fs_1.default.writeFileSync(Application_1.default.makePath('app/Services/config.json'), stringify);
        return {
            stickyCategory,
            paymentText,
        };
    }
}
exports.default = ConfigsController;
//# sourceMappingURL=ConfigsController.js.map