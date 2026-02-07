import { useEffect, useState } from 'react';
import { Search, User, Trash2, CreditCard, UserPlus, X, Award, Plus, Minus, Edit2, AlertCircle, StickyNote, Percent, Clock, PauseCircle, Calculator, Tag, RotateCcw } from 'lucide-react';
import { useCartStore, type CartItem } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Transaction, TransactionItem, ProductBatch, Product } from '../db/db';
import { useToast } from '../store/useToast';
import { CustomerModal } from '../components/admin/CustomerModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { HoldSaleModal } from '../components/HoldSaleModal';
import { HeldSalesList } from '../components/HeldSalesList';
import { SplitPaymentModal } from '../components/SplitPaymentModal';
import { DiscountModal } from '../components/DiscountModal';
import { EditCartItemModal } from '../components/EditCartItemModal';
import { EditTaxModal } from '../components/EditTaxModal';
import { ReturnModal } from '../components/ReturnModal';
import { SelectBatchModal } from '../components/SelectBatchModal';
import { useSettingsStore } from '../store/useSettingsStore';
import { useCurrency } from '../hooks/useCurrency';

export const POS = () => {
    const { items, addItem, removeItem, updateQuantity, total, tax, discount, roundOffDiscount, pointsRedeemed, toggleRedeemPoints, clearCart, customer, setCustomer, setManualDiscount, updateItem } = useCartStore();
    const { user } = useAuthStore();
    const { addToast } = useToast();
    const { taxRate, taxEnabled, loyaltyEnabled, loyaltyEarnRate, loadSettings, updateSetting } = useSettingsStore();
    const { currencySymbol, formatCurrency } = useCurrency();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [isProcessing, setIsProcessing] = useState(false);

    // Customer State
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');


    // Receipt State
    const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
    const [lastItems, setLastItems] = useState<(TransactionItem & { name: string })[]>([]);

    // Hold Sale State
    const [showHoldModal, setShowHoldModal] = useState(false);
    const [showHeldSalesList, setShowHeldSalesList] = useState(false);
    const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);

    // Price/Qty/Note Edit State
    const [editingItem, setEditingItem] = useState<CartItem | null>(null);

    // Tax Edit State
    const [showTaxModal, setShowTaxModal] = useState(false);

    // Return Flow State
    const [showReturnLookup, setShowReturnLookup] = useState(false);
    const [returnSearch, setReturnSearch] = useState('');
    const [selectedReturnTransaction, setSelectedReturnTransaction] = useState<Transaction | null>(null);

    // Batch Selection State
    const [batchProduct, setBatchProduct] = useState<null | { productId: number; product: Product }>(null);
    const [batchOptions, setBatchOptions] = useState<ProductBatch[]>([]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Fetch products
    const products = useLiveQuery(
        () => db.products.toArray()
    );

    // Fetch customers
    const customers = useLiveQuery(
        () => db.customers.toArray()
    );

    const [selectedBrand, setSelectedBrand] = useState<string>('All');

    // Fetch brands
    const brands = useLiveQuery(
        () => db.brands.toArray()
    );

    // Fetch categories
    const categoriesList = useLiveQuery(
        () => db.categories.toArray()
    );

    const productBatches = useLiveQuery(
        () => db.product_batches.toArray()
    );

    // Recent sales for return lookup
    const recentSales = useLiveQuery(
        () => db.transactions.orderBy('timestamp').reverse().toArray()
    );

    // Filter products
    const filteredProducts = products?.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku_code.includes(searchQuery);
        const matchesCategory = selectedCategory === 'All' || p.category_id === selectedCategory;
        const matchesBrand = selectedBrand === 'All' || p.brand_id === selectedBrand;

        return matchesSearch && matchesCategory && matchesBrand;
    });

    // Filter customers
    const filteredCustomers = customers?.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch)
    );

    // Get categories from settings + fall back to product categories
    const categoryNames = categoriesList?.map(c => c.name) || [];
    const productCategoryNames = Array.from(new Set(products?.map(p => p.category_id).filter(Boolean) || []));
    const mergedCategories = Array.from(new Set([...categoryNames, ...productCategoryNames]));
    const categories = ['All', ...mergedCategories];

    const handleAddProduct = (product: Product) => {
        if (!product.product_id) return;
        const batches = (productBatches || [])
            .filter(b => b.product_id === product.product_id && b.quantity > 0)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        if (batches.length === 0) {
            addItem(product);
            return;
        }

        if (batches.length === 1) {
            const batch = batches[0];
            addItem({ ...product, retail_price: batch.retail_price, batch_id: batch.batch_id });
            return;
        }

        setBatchProduct({ productId: product.product_id, product });
        setBatchOptions(batches);
    };

    const filteredSales = recentSales
        ?.filter(t => t.type === 'sale')
        .filter(t =>
            !returnSearch
                ? true
                : t.transaction_id?.toString().includes(returnSearch) || t.customer_id?.toString().includes(returnSearch)
        ) || [];

    const handlePayment = async (paymentDetails?: { cash: number, card: number }) => {
        if (items.length === 0) return;
        if (!user) {
            addToast("No user logged in!", 'error');
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Create Transaction
            const finalTotal = total + tax - roundOffDiscount;
            const transactionData: Transaction = {
                user_id: user.user_id!,
                customer_id: customer?.customer_id,
                timestamp: new Date(),
                total_amount: finalTotal, // Store final total paid
                tax_amount: tax,
                round_off_discount: roundOffDiscount,
                payment_method: paymentDetails ? 'split' : 'cash', // Default for now
                status: 'completed',
                type: 'sale',
                payment_details: paymentDetails ? {
                    cashAmount: paymentDetails.cash,
                    cardAmount: paymentDetails.card
                } : undefined
            };

            const transactionId = await db.transactions.add(transactionData);

            // 2. Create Transaction Items & Update Stock
            const transactionItems = items.map(item => ({
                transaction_id: transactionId as number,
                product_id: item.product_id!,
                batch_id: item.batch_id,
                quantity: item.quantity,
                price_at_sale: item.retail_price,
                note: item.note
            }));
            await db.transaction_items.bulkAdd(transactionItems);

            // Update Stock
            for (const item of items) {
                const product = await db.products.get(item.product_id!);
                if (product) {
                    await db.products.update(item.product_id!, {
                        stock_quantity: product.stock_quantity - item.quantity
                    });
                }
                if (item.batch_id) {
                    const batch = await db.product_batches.get(item.batch_id);
                    if (batch) {
                        await db.product_batches.update(item.batch_id, {
                            quantity: Math.max(0, batch.quantity - item.quantity)
                        });
                    }
                }
            }

            // 3. Update Customer Loyalty
            if (customer) {
                const pointsEarned = loyaltyEnabled ? Math.floor(finalTotal * loyaltyEarnRate) : 0;
                const newBalance = customer.loyalty_points_balance - pointsRedeemed + pointsEarned;
                const newTotalSpend = customer.total_spend_to_date + finalTotal;

                await db.customers.update(customer.customer_id!, {
                    loyalty_points_balance: newBalance,
                    total_spend_to_date: newTotalSpend
                });

                if (pointsEarned > 0) {
                    await db.customer_points.add({
                        customer_id: customer.customer_id!,
                        timestamp: new Date(),
                        type: 'earn',
                        points: pointsEarned,
                        transaction_id: transactionId as number
                    });
                }
                if (pointsRedeemed > 0) {
                    await db.customer_points.add({
                        customer_id: customer.customer_id!,
                        timestamp: new Date(),
                        type: 'redeem',
                        points: -pointsRedeemed,
                        transaction_id: transactionId as number
                    });
                }
            }

            // Prepare Receipt Data
            setLastTransaction({ ...transactionData, transaction_id: transactionId as number });
            setLastItems(items.map(i => ({
                ...i,
                transaction_id: transactionId as number,
                price_at_sale: i.retail_price,
                product_id: i.product_id!,
                note: i.note
            })));

        } catch (error) {
            console.error("Payment failed", error);
            addToast("Payment failed. Please try again.", 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReceiptClose = () => {
        setLastTransaction(null);
        setLastItems([]);
        clearCart();
    };

    const handleConfirmHold = async (note: string) => {
        if (items.length === 0) return;

        try {
            await db.held_sales.add({
                customer_id: customer?.customer_id,
                items: items.map(i => ({
                    product: { ...i }, // Store copy of product state
                    quantity: i.quantity,
                    note: i.note
                })),
                timestamp: new Date(),
                note
            });
            clearCart();
            setCustomer(null);
            setShowHoldModal(false);
            addToast("Sale held successfully!", 'success');
        } catch (error) {
            console.error("Failed to hold sale:", error);
            addToast("Failed to hold sale.", 'error');
        }
    };

    const handleRestoreSale = async (sale: any) => {
        // Clear current cart first? Or warn? Let's just overwrite for now as is typical
        if (items.length > 0) {
            if (!confirm("Current cart will be replaced. Continue?")) return;
        }

        // Restore Items
        // We need to fetch customer if it exists
        let restoredCustomer = null;
        if (sale.customer_id) {
            restoredCustomer = await db.customers.get(sale.customer_id);
        }

        // The items in HeldSale are { product: Product, quantity: number }
        // CartItem extends Product and has quantity.
        // So we can map them directly.
        const cartItems = sale.items.map((i: any) => ({
            ...i.product,
            quantity: i.quantity,
            note: i.note
        }));

        // Use the new setCart function
        // @ts-ignore - store types might not update immediately in IDE but runtime works
        useCartStore.getState().setCart(cartItems, restoredCustomer || null, 0);

        // Delete from held sales
        await db.held_sales.delete(sale.id);

        setShowHeldSalesList(false);
        addToast("Sale restored!", 'success');
    };



    return (
        <div className="flex w-full h-full relative flex-row bg-gray-100 dark:bg-gray-900 overflow-hidden">
            {/* LEFT PANEL: PRODUCTS (60%) */}
            <div className="w-[60%] flex flex-col h-full border-r border-gray-200 dark:border-gray-700 order-1">
                {/* Search & Categories - Fixed Height Header */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    {/* Search Bar - Fixed Height */}
                    <div className="h-16 px-4 flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search products (Name/SKU)..."
                                className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-700 font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {/* Brand Filter */}
                        <select
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 border-2 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-w-[150px] font-medium"
                        >
                            <option value="All">All Brands</option>
                            {brands?.map(b => (
                                <option key={b.name} value={b.name}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Category Filters */}
                    <div className="px-4 pb-3 flex space-x-2 overflow-x-auto scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${selectedCategory === cat
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {filteredProducts?.map((product) => {
                            const isLowStock = product.manage_stock && product.stock_quantity <= (product.alert_quantity || 0);
                            return (
                                <button
                                    key={product.product_id}
                                    onClick={() => handleAddProduct(product)}
                                    className={`bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 p-3 rounded-xl flex flex-col justify-between h-28 transition-all active:scale-95 shadow-sm border ${isLowStock ? 'border-red-300 dark:border-red-800 ring-1 ring-red-100 dark:ring-red-900/30' : 'border-gray-200 dark:border-gray-700'}`}
                                >
                                    <div className="w-full text-left">
                                        <div className="font-medium text-sm leading-tight line-clamp-2 text-gray-900 dark:text-white mb-1">
                                            {product.name} <span className="text-xs text-gray-500">({product.sku_code})</span>
                                        </div>
                                        {isLowStock && (
                                            <div className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 font-medium">
                                                <AlertCircle size={10} />
                                                <span>Low Stock: {product.stock_quantity}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-full flex justify-between items-end mt-1">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[50%]">{product.brand_id}</div>
                                        <div className="text-blue-600 dark:text-blue-400 font-bold text-sm">{formatCurrency(product.retail_price)}</div>
                                    </div>
                                </button>
                            );
                        })}

                        {!products?.length && (
                            <div className="col-span-full text-center text-gray-500 py-10 flex flex-col items-center">
                                <Search size={48} className="opacity-20 mb-4" />
                                <p>No products found. Add items to inventory.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: CART (40%) */}
            <div className="w-[40%] flex flex-col h-full bg-white dark:bg-gray-800 order-2 shadow-xl z-10 border-l border-gray-200 dark:border-gray-700">
                {/* Customer Header - Fixed Height */}
                <div className="h-16 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Current Sale</h2>
                    <div className="flex items-center gap-3">
                        {items.length > 0 && <span className="text-sm text-gray-500 dark:text-gray-400">{items.reduce((acc, i) => acc + i.quantity, 0)} Items</span>}
                        <button
                            onClick={() => setShowReturnLookup(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
                            title="Process Return"
                        >
                            <RotateCcw size={14} />
                            Return
                        </button>
                    </div>
                </div>

                {/* Customer Search Section */}
                <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">

                    {!customer ? (
                        <div className="relative">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search Customer (Name/Phone)..."
                                        className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                        value={customerSearch}
                                        onChange={e => setCustomerSearch(e.target.value)}
                                    />
                                    {/* Dropdown Results */}
                                    {customerSearch && (
                                        <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mt-1 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                            {filteredCustomers?.map(c => (
                                                <button
                                                    key={c.customer_id}
                                                    onClick={() => {
                                                        setCustomer(c);
                                                        setCustomerSearch('');
                                                    }}
                                                    className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 flex justify-between items-center"
                                                >
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">{c.name}</div>
                                                        <div className="text-xs text-gray-500">{c.phone}</div>
                                                    </div>
                                                    <div className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                                                        {c.loyalty_points_balance} pts
                                                    </div>
                                                </button>
                                            ))}
                                            {filteredCustomers?.length === 0 && (
                                                <div className="text-gray-500 text-sm text-center p-3">No customers found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowCustomerModal(true)}
                                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex-shrink-0 shadow-sm transition-colors"
                                    title="Add New Customer"
                                >
                                    <UserPlus size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex justify-between items-center animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300">
                                    <User size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white">{customer.name}</div>
                                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Points: {customer.loyalty_points_balance}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setCustomer(null)}
                                className="text-gray-400 hover:text-red-500 p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors"
                                title="Remove Customer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                    {items.map((item) => (
                        <div
                            key={item.product_id}
                            className="bg-white dark:bg-gray-800 p-3 rounded-xl flex flex-col gap-2 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:ring-2 hover:ring-blue-200 dark:hover:ring-blue-900/40"
                            onClick={() => setEditingItem(item)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="font-medium text-gray-900 dark:text-white leading-tight">
                                    {item.name} <span className="text-xs text-gray-500">({item.sku_code})</span>
                                </div>
                                <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(item.retail_price * item.quantity)}</div>
                            </div>

                            {item.note && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <StickyNote size={12} />
                                    <span className="line-clamp-1">{item.note}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                {/* Quantity Controls */}
                                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateQuantity(item.product_id!, item.quantity - 1, item.batch_id);
                                        }}
                                        className="p-1 hover:text-red-500 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-all"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-8 text-center font-bold text-sm text-gray-800 dark:text-gray-200">{item.quantity}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateQuantity(item.product_id!, item.quantity + 1, item.batch_id);
                                        }}
                                        className="p-1 hover:text-green-500 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-all"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                {/* Price Edit & Remove */}
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingItem(item);
                                        }}
                                        className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                    >
                                        <Edit2 size={12} />
                                        <span>{formatCurrency(item.retail_price)}</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeItem(item.product_id!, item.batch_id);
                                        }}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 opacity-50">
                            <CreditCard size={48} className="mb-2" />
                            <p>Cart is empty</p>
                        </div>
                    )}
                </div>

                {/* Cart Footer / Totals */}
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                            <span>Subtotal</span>
                            <span>{formatCurrency(total + discount)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-green-600 dark:text-green-400 text-sm font-medium">
                                <span>Discount ({pointsRedeemed} pts)</span>
                                <span>-{currencySymbol}{discount.toFixed(2)}</span>
                            </div>
                        )}
                        {roundOffDiscount > 0 && (
                            <div className="flex justify-between text-green-600 dark:text-green-400 text-sm font-medium">
                                <span>Round off discount</span>
                                <span>-{currencySymbol}{roundOffDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                            <div className="flex items-center gap-2">
                                <span>Tax {taxEnabled ? `(${(taxRate * 100).toFixed(2)}%)` : '(Disabled)'}</span>
                                <button
                                    onClick={() => setShowTaxModal(true)}
                                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center gap-1"
                                >
                                    <Percent size={12} />
                                    Edit
                                </button>
                            </div>
                            <span>{formatCurrency(tax)}</span>
                        </div>
                        <div className="flex justify-between items-end border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                            <span className="text-lg font-bold text-gray-800 dark:text-white">Total</span>
                            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(total + tax - roundOffDiscount)}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                        <button
                            onClick={clearCart}
                            className="flex flex-col items-center justify-center py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-all shadow-md active:scale-95"
                        >
                            <Trash2 size={20} />
                            <span className="text-[10px] uppercase font-bold mt-1">Void</span>
                        </button>

                        <button
                            onClick={() => setShowHoldModal(true)}
                            disabled={items.length === 0}
                            className="flex flex-col items-center justify-center py-2 bg-orange-500 dark:bg-orange-600 text-white rounded-lg hover:bg-orange-600 dark:hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                        >
                            <PauseCircle size={20} />
                            <span className="text-[10px] uppercase font-bold mt-1">Hold</span>
                        </button>

                        <button
                            onClick={() => setShowHeldSalesList(true)}
                            className="flex flex-col items-center justify-center py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-all shadow-md active:scale-95"
                        >
                            <Clock size={20} />
                            <span className="text-[10px] uppercase font-bold mt-1">Recall</span>
                        </button>

                        <button
                            onClick={toggleRedeemPoints}
                            disabled={!loyaltyEnabled || !customer || customer.loyalty_points_balance === 0}
                            className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all shadow-md active:scale-95 ${pointsRedeemed > 0
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-purple-500 dark:bg-purple-600 text-white hover:bg-purple-600 dark:hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                        >
                            <Award size={20} />
                            <span className="text-[10px] uppercase font-bold mt-1">{pointsRedeemed > 0 ? 'Remove' : 'Points'}</span>
                        </button>

                        <button
                            onClick={() => setShowDiscountModal(true)}
                            className="flex flex-col items-center justify-center py-2 bg-purple-500 dark:bg-purple-600 text-white rounded-lg hover:bg-purple-600 dark:hover:bg-purple-700 transition-all shadow-md active:scale-95"
                        >
                            <Tag size={20} />
                            <span className="text-[10px] uppercase font-bold mt-1">Discount</span>
                        </button>

                        <button
                            onClick={() => setShowSplitPaymentModal(true)}
                            disabled={items.length === 0}
                            className="flex flex-col items-center justify-center py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                        >
                            <Calculator size={20} />
                            <span className="text-[10px] uppercase font-bold mt-1">Split</span>
                        </button>

                        <button
                            onClick={() => handlePayment()}
                            disabled={isProcessing || items.length === 0}
                            className="col-span-2 flex flex-col items-center justify-center py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/30 transition-all active:scale-95"
                        >
                            <CreditCard size={24} className="mb-0.5" />
                            <span className="text-xs uppercase font-extrabold">{isProcessing ? 'Processing...' : 'Pay Now'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {/* Customer Modal */}
            {showCustomerModal && (
                <CustomerModal
                    onClose={() => setShowCustomerModal(false)}
                    onSuccess={() => {
                        addToast("Customer Added!", 'success');
                    }}
                />
            )}

            {/* Receipt Modal */}
            {lastTransaction && (
                <ReceiptModal
                    transaction={lastTransaction}
                    items={lastItems}
                    customer={customer}
                    user={user}
                    onClose={handleReceiptClose}
                />
            )}

            {/* Hold Sale Modal */}
            {showHoldModal && (
                <HoldSaleModal
                    onConfirm={handleConfirmHold}
                    onClose={() => setShowHoldModal(false)}
                />
            )}

            {/* Held Sales List */}
            {showHeldSalesList && (
                <HeldSalesList
                    onRestore={handleRestoreSale}
                    onClose={() => setShowHeldSalesList(false)}
                />
            )}

            {/* Split Payment Modal */}
            {showSplitPaymentModal && (
                <SplitPaymentModal
                    total={total + tax - roundOffDiscount}
                    onConfirm={(details) => {
                        setShowSplitPaymentModal(false);
                        handlePayment(details);
                    }}
                    onClose={() => setShowSplitPaymentModal(false)}
                />
            )}

            {/* Discount Modal */}
            {showDiscountModal && (
                <DiscountModal
                    subtotal={total}
                    onConfirm={(amount) => {
                        setManualDiscount(amount);
                        setShowDiscountModal(false);
                    }}
                    onClose={() => setShowDiscountModal(false)}
                />
            )}

            {/* Edit Cart Item Modal */}
            {editingItem && (
                <EditCartItemModal
                    item={editingItem}
                    onConfirm={(updates) => {
                        updateItem(editingItem.product_id!, {
                            price: updates.price,
                            quantity: updates.quantity,
                            note: updates.note
                        }, editingItem.batch_id);
                        setEditingItem(null);
                    }}
                    onClose={() => setEditingItem(null)}
                />
            )}

            {/* Edit Tax Modal */}
            {showTaxModal && (
                <EditTaxModal
                    currentRate={taxRate}
                    onConfirm={async (rate) => {
                        await updateSetting('taxRate', rate);
                        setShowTaxModal(false);
                        addToast('Tax rate updated', 'success');
                    }}
                    onClose={() => setShowTaxModal(false)}
                />
            )}

            {batchProduct && (
                <SelectBatchModal
                    product={batchProduct.product}
                    batches={batchOptions}
                    onSelect={(batch) => {
                        addItem({ ...batchProduct.product, retail_price: batch.retail_price, batch_id: batch.batch_id });
                        setBatchProduct(null);
                        setBatchOptions([]);
                    }}
                    onClose={() => {
                        setBatchProduct(null);
                        setBatchOptions([]);
                    }}
                />
            )}

            {showReturnLookup && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 w-[560px] max-h-[80vh] rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Find Sale for Return</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Search by transaction or customer ID</p>
                            </div>
                            <button
                                onClick={() => setShowReturnLookup(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by sale ID or customer ID..."
                                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={returnSearch}
                                    onChange={(e) => setReturnSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 pb-4">
                            <div className="space-y-2">
                                {filteredSales.length === 0 && (
                                    <div className="text-center text-sm text-gray-500 py-8">No sales found.</div>
                                )}
                                {filteredSales.slice(0, 20).map((txn) => {
                                    const customerName = customers?.find(c => c.customer_id === txn.customer_id)?.name;
                                    return (
                                        <button
                                            key={txn.transaction_id}
                                            onClick={() => {
                                                setSelectedReturnTransaction(txn);
                                                setShowReturnLookup(false);
                                                setReturnSearch('');
                                            }}
                                            className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between"
                                        >
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white">#{txn.transaction_id} • {customerName || 'Walk-in'}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(txn.timestamp).toLocaleString()}</div>
                                            </div>
                                            <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(txn.total_amount)}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedReturnTransaction && (
                <ReturnModal
                    transaction={selectedReturnTransaction}
                    onClose={() => setSelectedReturnTransaction(null)}
                    onSuccess={() => {
                        setSelectedReturnTransaction(null);
                        addToast('Return processed', 'success');
                    }}
                />
            )}
        </div>
    );
};
