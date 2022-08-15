"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const s3 = new client_s3_1.S3Client({
    apiVersion: "latest",
    region: 'id-jkt-1',
    credentials: {
        accessKeyId: Env_1.default.get("CK_ACCESS"),
        secretAccessKey: Env_1.default.get("CK_SECRET")
    },
    endpoint: 'http://s3-id-jkt-1.kilatstorage.id/'
});
exports.default = s3;
//# sourceMappingURL=s3.js.map