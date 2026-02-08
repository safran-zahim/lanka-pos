"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.getCategories = exports.createCategory = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_1 = require("zod");
const categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
});
const createCategory = async (req, res) => {
    try {
        const data = categorySchema.parse(req.body);
        const existing = await prisma_1.default.category.findUnique({
            where: { name: data.name },
        });
        if (existing) {
            return res.status(400).json({ error: "Category already exists" });
        }
        const category = await prisma_1.default.category.create({
            data: { name: data.name },
        });
        res.status(201).json(category);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: error.errors });
        }
        else {
            console.error("Error creating category:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
};
exports.createCategory = createCategory;
const getCategories = async (req, res) => {
    try {
        const categories = await prisma_1.default.category.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(categories);
    }
    catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getCategories = getCategories;
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.category.delete({
            where: { id },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.deleteCategory = deleteCategory;
