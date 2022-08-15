"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AdminRole {
    async handle({ auth, response }, next, roles) {
        if (auth.use('adminApi').isLoggedIn) {
            const adminRole = auth.use('adminApi').user?.role || 'super';
            if (!roles.length) {
                return next();
            }
            else if (roles.includes(adminRole)) {
                return next();
            }
            else {
                return response.methodNotAllowed();
            }
        }
        else {
            return next();
        }
    }
}
exports.default = AdminRole;
//# sourceMappingURL=AdminRole.js.map