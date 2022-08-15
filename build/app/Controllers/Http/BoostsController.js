"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Subject_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Subject"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Boost_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Boost"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
class BoostsController {
    async create({ auth, params, request }) {
        const subject = await Subject_1.default.query()
            .where('subjects.id', params.id)
            .andWhereHas('course', (query) => {
            query.whereHas('users', (query) => {
                query.where('users.id', auth.use('userApi').user?.id);
            });
        })
            .andWhereDoesntHave('boosts', (query) => {
            query.whereHas('user', (query) => {
                query.where('users.id', auth.use('userApi').user?.id);
            });
        })
            .firstOrFail();
        const { body } = await request.validate({
            schema: Validator_1.schema.create({
                body: Validator_1.schema.string(),
            }),
        });
        const boost = new Boost_1.default();
        boost.userId = auth.use('userApi').user?.id;
        boost.subjectId = subject.id;
        boost.body = body;
        await boost.save();
        return {
            ...boost.toJSON(),
            user: await User_1.default.query()
                .select('id', 'avatar')
                .where('id', auth.use('userApi').user?.id)
                .first(),
        };
    }
    async index({ auth, params }) {
        const subject = await Subject_1.default.query()
            .where('subjects.id', params.id)
            .andWhereHas('course', (query) => {
            query.whereHas('users', (query) => {
                query.where('users.id', auth.use('userApi').user?.id);
            });
        })
            .firstOrFail();
        const ids = [];
        const boosts = (await Boost_1.default.query().where('boosts.subject_id', subject.id)).map((boost) => {
            if (!ids.includes(boost.userId)) {
                ids.push(boost.userId);
            }
            return boost.serialize();
        });
        const users = await User_1.default.query().select('id', 'avatar').whereIn('id', ids);
        return boosts.map((boost) => {
            const user = users.find((el) => Number(el.id) === boost.user_id);
            return {
                ...boost,
                user: user ? user.serialize() : null,
            };
        });
    }
}
exports.default = BoostsController;
//# sourceMappingURL=BoostsController.js.map