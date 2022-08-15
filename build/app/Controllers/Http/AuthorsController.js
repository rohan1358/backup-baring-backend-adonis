"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Author_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Author"));
class AuthorsController {
    async index() {
        const authors = await Author_1.default.all();
        return authors;
    }
}
exports.default = AuthorsController;
//# sourceMappingURL=AuthorsController.js.map