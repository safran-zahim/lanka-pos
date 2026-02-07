"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('POS Backend is running');
});
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const staff_routes_1 = __importDefault(require("./routes/staff.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const sales_routes_1 = __importDefault(require("./routes/sales.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
app.use('/auth', auth_routes_1.default);
app.use('/staff', staff_routes_1.default);
app.use('/products', product_routes_1.default);
app.use('/sales', sales_routes_1.default);
app.use('/customers', customer_routes_1.default);
exports.default = app;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
