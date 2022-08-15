"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Bank_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bank"));
const bankSchema = Validator_1.schema.create({
    account_name: Validator_1.schema.string(),
    account_number: Validator_1.schema.string(),
    bank_name: Validator_1.schema.string(),
});
class BanksController {
    async create({ request }) {
        const { account_name: accountName, account_number: accountNumber, bank_name: bankName, } = await request.validate({
            schema: bankSchema,
        });
        const bank = new Bank_1.default();
        bank.accountName = accountName;
        bank.accountNumber = accountNumber;
        bank.bankName = bankName;
        await bank.save();
        return bank.serialize();
    }
    async edit({ request, params }) {
        const bank = await Bank_1.default.findOrFail(params.id);
        const { account_name: accountName, account_number: accountNumber, bank_name: bankName, } = await request.validate({
            schema: bankSchema,
        });
        bank.accountName = accountName;
        bank.accountNumber = accountNumber;
        bank.bankName = bankName;
        await bank.save();
        return bank.serialize();
    }
    async index() {
        const banks = await Bank_1.default.query();
        return banks.map((bank) => bank.serialize());
    }
    async delete({ params }) {
        const bank = await Bank_1.default.findOrFail(params.id);
        await bank.delete();
        return bank;
    }
}
exports.default = BanksController;
//# sourceMappingURL=BanksController.js.map