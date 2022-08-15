"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const moment_1 = __importDefault(require("moment"));
class SubscriptionCheck {
    async handle({ auth, response }, next) {
        if (auth.user instanceof User_1.default) {
            const user = auth.user;
            if (!user.subscriptionEnd ||
                (user.subscriptionEnd && moment_1.default(user.subscriptionEnd).toDate() > new Date())) {
                return response.methodNotAllowed();
            }
        }
        await next();
    }
}
exports.default = SubscriptionCheck;
//# sourceMappingURL=SubscriptionCheck.js.map