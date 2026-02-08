import Dexie, { type Table } from 'dexie';

export interface User {
    user_id?: number;
    username: string;
    password_hash: string;
    role: 'admin' | 'manager' | 'cashier' | 'super_admin';
    subscription_status?: 'active' | 'past_due' | 'blocked' | 'canceled';
    hourly_rate?: number;
    contact_info?: string;
}

export interface Brand {
    brand_id?: number;
    name: string;
    description?: string;
}

export interface Unit {
    unit_id?: number;
    name: string; // e.g. Pieces
    short_name: string; // e.g. pc
    allow_decimal: boolean;
}

export interface BusinessLocation {
    location_id?: number;
    name: string;
    address?: string;
}

export interface Product {
    product_id?: number;
    sku_code: string;
    name: string;
    description?: string; // Rich text
    category_id: string; // ID or name
    brand_id?: string; // ID or name
    unit_id?: string; // ID or short_name
    sub_category_id?: string;

    cost_price: number;
    retail_price: number;

    stock_quantity: number;
    alert_quantity: number; // Low stock alert
    manage_stock: boolean; // Track stock or not

    barcode_type: 'C128' | 'C39' | 'EAN13' | 'EAN8' | 'UPCA' | 'UPCE';

    image?: string; // Base64 string for now

    tax_type?: 'inclusive' | 'exclusive';
    tax_amount?: number;

    business_locations?: number[]; // IDs of locations
    reorder_level: number; // Deprecated in favor of alert_quantity, keeping for backward compat
}

export interface Customer {
    customer_id?: number;
    name: string;
    phone: string;
    email?: string;
    loyalty_points_balance: number;
    total_spend_to_date: number;
}

export interface CustomerPointHistory {
    id?: number;
    customer_id: number;
    timestamp: Date;
    type: 'earn' | 'redeem' | 'adjust';
    points: number;
    note?: string;
    transaction_id?: number;
}


export interface Transaction {
    transaction_id?: number;
    user_id: number;
    customer_id?: number;
    timestamp: Date;
    total_amount: number;
    tax_amount: number;
    round_off_discount?: number;
    payment_method: 'cash' | 'card' | 'split' | 'other';
    status: 'completed' | 'voided' | 'parked';
    type: 'sale' | 'return';
    payment_details?: {
        cashAmount?: number;
        cardAmount?: number;
        otherAmount?: number;
        notes?: string;
    };
}

export interface TransactionItem {
    line_id?: number;
    transaction_id: number;
    product_id: number;
    batch_id?: number;
    quantity: number;
    price_at_sale: number;
    note?: string;
}

export interface ProductBatch {
    batch_id?: number;
    product_id: number;
    quantity: number;
    cost_price: number;
    retail_price: number;
    created_at: Date;
    note?: string;
}

export interface Category {
    category_id?: number;
    name: string;
}

export interface Purchase {
    purchase_id?: number;
    product_id: number;
    quantity: number;
    cost_price: number;
    timestamp: Date;
    user_id: number; // Who added the stock
    supplier_id?: number;
    ref_number?: string;
    payment_status?: 'paid' | 'partial' | 'due';
    payment_method?: 'cash' | 'bank' | 'card' | 'cheque' | 'other';
    shipping_cost?: number;
    discount?: number;
    notes?: string;
    bill_total?: number;
}

export interface Supplier {
    supplier_id?: number;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
}

export interface Setting {
    key: string;
    value: any;
}

export interface HeldSale {
    id?: number;
    customer_id?: number;
    items: {
        product: Product;
        quantity: number;
        note?: string;
    }[];
    timestamp: Date;
    note?: string;
}

export class POSDatabase extends Dexie {
    users!: Table<User>;
    products!: Table<Product>;
    customers!: Table<Customer>;
    categories!: Table<Category>;
    purchases!: Table<Purchase>;
    transactions!: Table<Transaction>;
    transaction_items!: Table<TransactionItem>;
    product_batches!: Table<ProductBatch>;
    customer_points!: Table<CustomerPointHistory>;
    held_sales!: Table<HeldSale>;
    suppliers!: Table<Supplier>;
    settings!: Table<Setting>;
    brands!: Table<Brand>;
    units!: Table<Unit>;
    business_locations!: Table<BusinessLocation>;
    sub_categories!: Table<SubCategory>;

    constructor() {
        super('LankaPOSDB');
        this.version(1).stores({
            users: '++user_id, username, role',
            products: '++product_id, &sku_code, category_id, stock_quantity',
            customers: '++customer_id, &phone, email',
            transactions: '++transaction_id, user_id, customer_id, timestamp',
            transaction_items: '++line_id, transaction_id, product_id'
        });

        // Version 2: Add categories and purchases
        this.version(2).stores({
            categories: '++category_id, &name',
            purchases: '++purchase_id, product_id, timestamp'
        });

        // Version 3: Add held sales and suppliers
        this.version(3).stores({
            held_sales: '++id, timestamp',
            suppliers: '++supplier_id, &name, phone'
        });

        // Version 4: Add settings
        this.version(4).stores({
            settings: '&key'
        });

        // Version 5: Enhanced Product Management
        this.version(5).stores({
            brands: '++brand_id, &name',
            units: '++unit_id, &name, &short_name',
            business_locations: '++location_id, &name',
            // Updating products index if needed, but Dexie handles basic field additions without schema change if not indexed.
            // If we want to query by brand_id, we should add it.
            products: '++product_id, &sku_code, category_id, brand_id, stock_quantity'
        });

        // Version 6: Add SubCategories
        this.version(6).stores({
            sub_categories: '++sub_category_id, category_id, name, [category_id+name]'
        });

        // Version 7: Customer points history
        this.version(7).stores({
            customer_points: '++id, customer_id, timestamp, type, transaction_id'
        });

        // Version 8: Product batches (multi-price stock)
        this.version(8).stores({
            product_batches: '++batch_id, product_id, retail_price, created_at'
        });

    }
}

export interface SubCategory {
    sub_category_id?: number;
    category_id: number;
    name: string;
}

export const db = new POSDatabase();
