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
    brand_id?: number | string;
    name: string;
    description?: string;
}

export interface Unit {
    unit_id?: number | string;
    name: string; // e.g. Pieces
    short_name: string; // e.g. pc
    allow_decimal: boolean;
}

export interface BusinessLocation {
    location_id?: number | string;
    name: string;
    address?: string;
}

export interface Product {
    product_id?: number | string;
    sku_code: string;
    name: string;
    barcode?: string;
    description?: string; // Rich text
    category_id: number | string; // ID or name
    brand_id?: number | string; // ID or name
    unit_id?: number | string; // ID or short_name
    sub_category_id?: number | string;

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

    has_purchase?: boolean;
    isActive?: boolean;
    categoryRel?: { id: number; name: string };
    subCategory?: { id: number; name: string };
    unit?: { id: number; name: string; shortName: string; allowDecimal: boolean };
}

export interface Customer {
    customer_id?: number | string;
    name: string;
    phone: string;
    email?: string;
    loyalty_points_balance: number;
    total_spend_to_date: number;
    total_due?: number;        // Current debt
    credit_limit?: number;     // Max debt
}

export interface CustomerPointHistory {
    id?: number;
    customer_id: number | string;
    timestamp: Date;
    type: 'earn' | 'redeem' | 'adjust';
    points: number;
    note?: string;
    transaction_id?: number | string;
}


export interface Transaction {
    transaction_id?: number | string;
    user_id: number | string;
    customer_id?: number | string;
    timestamp: Date;
    total_amount: number;
    tax_amount: number;
    discount?: number;
    round_off_discount?: number;
    payment_method: 'cash' | 'card' | 'split' | 'other' | 'credit';
    status: 'completed' | 'voided' | 'parked';
    type: 'sale' | 'return';
    parent_sale_id?: number | string;  // Reference to original sale for returns
    payment_details?: {
        cashAmount?: number;
        cardAmount?: number;
        creditAmount?: number;
        otherAmount?: number;
        notes?: string;
    };
    note?: string;
}

export interface TransactionItem {
    line_id?: number;
    transaction_id: number | string;
    product_id: number | string;
    batch_id?: number | string;
    quantity: number;
    price_at_sale: number;
    note?: string;
    isOverSale?: boolean;
}


export interface ProductBatch {
    batch_id?: number;
    product_id: number | string;
    quantity: number;
    cost_price: number;
    retail_price: number;
    created_at: Date;
    note?: string;
}

export interface Category {
    category_id?: number | string;
    name: string;
}

export interface Purchase {
    purchase_id?: number;
    product_id: number | string;
    quantity: number;
    cost_price: number;
    timestamp: Date;
    user_id: number | string; // Who added the stock
    supplier_id?: number | string;
    ref_number?: string;
    bill_id?: string; // For grouping unique bills
    payment_status?: 'paid' | 'partial' | 'due';
    payment_method?: 'cash' | 'bank' | 'card' | 'cheque' | 'other';
    shipping_cost?: number;
    discount?: number;
    notes?: string;
    bill_total?: number;
    amount_paid?: number; // How much was actually paid
}

export interface Supplier {
    supplier_id?: number | string;
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
    customer_id?: number | string;
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
        const v1Stores = {
            users: '++user_id, username, role',
            products: '++product_id, &sku_code, category_id, stock_quantity',
            customers: '++customer_id, &phone, email',
            transactions: '++transaction_id, user_id, customer_id, timestamp',
            transaction_items: '++line_id, transaction_id, product_id'
        };

        const v2Stores = {
            ...v1Stores,
            categories: '++category_id, &name',
            purchases: '++purchase_id, product_id, timestamp'
        };

        const v3Stores = {
            ...v2Stores,
            held_sales: '++id, timestamp',
            suppliers: '++supplier_id, &name, phone'
        };

        const v4Stores = {
            ...v3Stores,
            settings: '&key'
        };

        const v5Stores = {
            ...v4Stores,
            brands: '++brand_id, &name',
            units: '++unit_id, &name, &short_name',
            business_locations: '++location_id, &name',
            products: '++product_id, &sku_code, category_id, brand_id, stock_quantity'
        };

        const v6Stores = {
            ...v5Stores,
            sub_categories: '++sub_category_id, category_id, name, [category_id+name]'
        };

        const v7Stores = {
            ...v6Stores,
            customer_points: '++id, customer_id, timestamp, type, transaction_id'
        };

        const v8Stores = {
            ...v7Stores,
            product_batches: '++batch_id, product_id, retail_price, created_at'
        };

        const v9Stores = {
            ...v8Stores,
            purchases: '++purchase_id, product_id, timestamp, bill_id'
        };

        this.version(1).stores(v1Stores);
        this.version(2).stores(v2Stores);
        this.version(3).stores(v3Stores);
        this.version(4).stores(v4Stores);
        this.version(5).stores(v5Stores);
        this.version(6).stores(v6Stores);
        this.version(7).stores(v7Stores);
        this.version(8).stores(v8Stores);
        this.version(9).stores(v9Stores);

    }
}

export interface SubCategory {
    sub_category_id?: number | string;
    category_id: number | string;
    name: string;
}

export const db = new POSDatabase();
