"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const staff_controller_1 = require("../controllers/staff.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Manager+ for performance
router.get('/performance', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['manager', 'admin']), staff_controller_1.getPerformance);
// All allowed for clock-in (but maybe only for themselves? keeping it simple for now)
router.post('/clock-in', auth_middleware_1.authenticate, staff_controller_1.clockIn);
exports.default = router;
