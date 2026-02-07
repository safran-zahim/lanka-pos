"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sales_controller_1 = require("../controllers/sales.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/checkout', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['cashier', 'manager', 'admin']), sales_controller_1.checkout); // Cashier+
router.get('/daily-summary', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['manager', 'admin']), sales_controller_1.getDailySummary); // Manager+
router.get('/:id', auth_middleware_1.authenticate, sales_controller_1.getSale); // All (authenticated)
router.post('/:id/refund', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['manager', 'admin']), sales_controller_1.refundSale); // Manager+
exports.default = router;
