"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Bab_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bab"));
const Clip_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Clip"));
class ClipsController {
    async create({ request, auth }) {
        const { body, bab_id: babId } = await request.validate({
            schema: Validator_1.schema.create({
                body: Validator_1.schema.string(),
                bab_id: Validator_1.schema.number(),
            }),
        });
        const bab = await Bab_1.default.findOrFail(babId);
        const clip = new Clip_1.default();
        clip.babId = bab.id;
        clip.userId = auth.use('userApi').user?.id;
        clip.body = body;
        await clip.save();
        return clip.serialize();
    }
    async delete({ params, auth }) {
        const clip = await Clip_1.default.query()
            .where('id', params.id)
            .andWhere('user_id', auth.use('userApi').user?.id)
            .firstOrFail();
        await clip.delete();
        return clip.serialize();
    }
    async index({ auth }) {
        const clips = await Clip_1.default.query()
            .where('user_id', auth.use('userApi').user?.id)
            .preload('bab', (query) => {
            query.select('id', 'content_id', 'title').preload('content', (query) => {
                query.select('id', 'title');
            });
        });
        return clips.map((clip) => clip.serialize());
    }
}
exports.default = ClipsController;
//# sourceMappingURL=ClipsController.js.map