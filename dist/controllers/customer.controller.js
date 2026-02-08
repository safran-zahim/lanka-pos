"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerPointsHistory = exports.deleteCustomer = exports.updateCustomer = exports.getCustomerDetails = exports.getCustomerHistory = exports.createCustomer = exports.getCustomers = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_1 = require("zod");
const customerSchema = zod_1.z.object({
    name: zod_1.z.string(),
    phone: zod_1.z.string(),
    email: zod_1.z.string().email().optional(),
    address: zod_1.z.string().optional(),
});
const customerUpdateSchema = customerSchema.partial();
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
const getCustomerDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await prisma_1.default.customer.findUnique({
            where: { id: String(id) },
            include: {
                sales: { include: { items: { include: { product: true } } }, orderBy: { createdAt: 'desc' } },
                pointsLedger: { orderBy: { createdAt: 'desc' } }
            }
        });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getCustomerDetails = getCustomerDetails;
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const data = customerUpdateSchema.parse(req.body);
        const updated = await prisma_1.default.customer.update({
            where: { id: String(id) },
            data,
        });
        res.json(updated);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: error.errors });
        }
        else if (error.code === 'P2025') {
            res.status(404).json({ error: 'Customer not found' });
        }
        else if (error.code === 'P2002') {
            res.status(409).json({ error: 'Customer with this phone number already exists' });
        }
        else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
exports.updateCustomer = updateCustomer;
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.customer.delete({ where: { id: String(id) } });
        res.json({ message: 'Customer deleted' });
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Customer not found' });
        }
        else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
exports.deleteCustomer = deleteCustomer;
const getCustomerPointsHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const points = await prisma_1.default.customerPointLedger.findMany({
            where: { customerId: String(id) },
            orderBy: { createdAt: 'desc' }
        });
        res.json(points);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getCustomerPointsHistory = getCustomerPointsHistory;
