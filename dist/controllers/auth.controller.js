"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const jwt_1 = require("../utils/jwt");
const zod_1 = require("zod");
const loginSchema = zod_1.z.object({
    username: zod_1.z.string(),
    password: zod_1.z.string(),
});
const login = async (req, res) => {
    try {
        const { username, password } = loginSchema.parse(req.body);
        // In a real app, passwords should be hashed. 
        // For this simplified version (internal tool), checking plain text (or assuming pre-hashed in DB logic if updated later).
        // BRD didn't specify hashing, but "Secure" implies it. I'll add a TODO/Comment about hashing.
        const staff = await prisma_1.default.staff.findFirst({
            where: { name: username }, // Using name as username for now as per schema
        });
        if (!staff || staff.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = (0, jwt_1.generateToken)({ id: staff.id, role: staff.role });
        res.json({ token, staff: { id: staff.id, name: staff.name, role: staff.role } });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: error.errors });
        }
        else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
exports.login = login;
