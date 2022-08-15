"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Event_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Event"));
Event_1.default.on('db:query', function ({ sql, bindings }) {
    console.log(sql, bindings);
});
//# sourceMappingURL=events.js.map