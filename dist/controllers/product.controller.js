"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLowStock = exports.updateProduct = exports.createProduct = exports.getProducts = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_1 = require("zod");
const decimal_js_1 = require("decimal.js");
const productSchema = zod_1.z.object({
    name: zod_1.z.string(),
    category: zod_1.z.string(),
    price: zod_1.z.number().positive(),
    stock: zod_1.z.number().int().nonnegative(),
    minStock: zod_1.z.number().int().nonnegative().optional(),
});
const updateProductSchema = productSchema.partial();
const getProducts = async (req, res) => {
    try {
        const { search, category } = req.query;
        const where = {};
        if (search) {
            where.name = { contains: String(search) }; // SQLite contains is case-sensitive usually, but Prisma might handle it?
        }
        if (category) {
            where.category = String(category);
        }
        const products = await prisma_1.default.product.findMany({ where });
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getProducts = getProducts;
const createProduct = async (req, res) => {
    try {
        const data = productSchema.parse(req.body);
        // Check if product exists? Schema doesn't enforce unique name, but maybe good practice.
        // For now, just create.
        const product = await prisma_1.default.product.create({
            data: {
                ...data,
                price: new decimal_js_1.Decimal(data.price.toString()),
            },
        });
        res.status(201).json(product);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: error.errors });
        }
        else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateProductSchema.parse(req.body);
        const updateData = { ...data };
        if (data.price !== undefined) {
            updateData.price = new decimal_js_1.Decimal(data.price.toString());
        }
        const product = await prisma_1.default.product.update({
            where: { id: String(id) },
            data: updateData,
        });
        res.json(product);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: error.errors });
        }
        else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
exports.updateProduct = updateProduct;
const getLowStock = async (req, res) => {
    try {
        // "Get a list of items below the reorder threshold."
        // Prisma doesn't support direct field comparison in `where` (stock < minStock) easily in standard definition without raw query or extensions.
        // But wait, `minStock` is a field. 
        // `where: { stock: { lt: prisma.product.fields.minStock } }` is NOT supported.
        // We have to use raw query or fetch all/subset and filter.
        // Given scalable requirement, raw query is better.
        // SQLite: SELECT * FROM Product WHERE stock < minStock
        const products = await prisma_1.default.$queryRaw `SELECT * FROM Product WHERE stock < minStock`;
        // Note: Raw query returns generic objects. Dates/Decimals might need serialization if not handled by Prisma client properly in raw.
        // Prisma usually handles it.
        res.json(products);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getLowStock = getLowStock;
