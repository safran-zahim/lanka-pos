"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerHistory = exports.createCustomer = exports.getCustomers = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_1 = require("zod");
const customerSchema = zod_1.z.object({
    name: zod_1.z.string(),
    phone: zod_1.z.string(),
});
const getCustomers = async (req, res) => {
    try {
        const { search } = req.query;
        // "Search for a customer by phone or name."
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: String(search) } },
                { phone: { contains: String(search) } },
            ];
        }
        // Default limit to avoid fetching all if no search?
        // User request: "Search for a customer..." implies search is primary, but "List all" isn't explicitly forbidden.
        // I'll return all if no search, or empty? usually return all with pagination. 
        // Keeping it simple: return max 50 if no search.
        const customers = await prisma_1.default.customer.findMany({
            where,
            take: 50,
            orderBy: { createdAt: 'desc' }
        });
        res.json(customers);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getCustomers = getCustomers;
const createCustomer = async (req, res) => {
    try {
        const data = customerSchema.parse(req.body);
        const customer = await prisma_1.default.customer.create({
            data,
        });
        res.status(201).json(customer);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: error.errors });
        }
        else if (error.code === 'P2002') { // Unique constraint violation (phone)
            res.status(409).json({ error: 'Customer with this phone number already exists' });
        }
        else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
exports.createCustomer = createCustomer;
const getCustomerHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const sales = await prisma_1.default.sale.findMany({
            where: { customerId: String(id) },
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(sales);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getCustomerHistory = getCustomerHistory;
