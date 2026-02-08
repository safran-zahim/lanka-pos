"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = require("../controllers/customer.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// "Cashier+" for all
router.get('/', auth_middleware_1.authenticate, auth_middleware_1.requireActiveSubscription, customer_controller_1.getCustomers);
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.requireActiveSubscription, customer_controller_1.createCustomer);
router.get('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireActiveSubscription, customer_controller_1.getCustomerDetails);
router.patch('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireActiveSubscription, customer_controller_1.updateCustomer);
router.delete('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireActiveSubscription, customer_controller_1.deleteCustomer);
router.get('/:id/points', auth_middleware_1.authenticate, auth_middleware_1.requireActiveSubscription, customer_controller_1.getCustomerPointsHistory);
router.get('/:id/history', auth_middleware_1.authenticate, auth_middleware_1.requireActiveSubscription, customer_controller_1.getCustomerHistory);
exports.default = router;
