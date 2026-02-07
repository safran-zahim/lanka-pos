"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, product_controller_1.getProducts); // All
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), product_controller_1.createProduct); // Admin
router.patch('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['manager', 'admin']), product_controller_1.updateProduct); // Manager+
router.get('/low-stock', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['manager', 'admin']), product_controller_1.getLowStock); // Manager+
exports.default = router;
