"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const form_data_1 = __importDefault(require("form-data"));
const mailgun_js_1 = __importDefault(require("mailgun.js"));
class Mail {
    _mailInstance() {
        const mg = new mailgun_js_1.default(form_data_1.default).client({
            username: 'api',
            key: Env_1.default.get('MAILGUN_API_KEY'),
        });
        return mg;
    }
    send(data) {
        this._mailInstance().messages.create(Env_1.default.get('MAILGUN_DOMAIN'), data);
    }
}
exports.default = Mail;
//# sourceMappingURL=Mail.js.map