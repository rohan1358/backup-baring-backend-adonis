"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class AddAudioSubjects extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'subjects';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('pdf').nullable().alter();
            table.string('audio').nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('audio');
            table.string('audio').notNullable().alter();
        });
    }
}
exports.default = AddAudioSubjects;
//# sourceMappingURL=1636957991306_add_audio_subjects.js.map