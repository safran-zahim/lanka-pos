import { useEffect, useMemo, useState } from 'react';
import {
    Search, Trash2, Plus, Minus, Calculator, Tag, CreditCard,
    User, Settings, LogOut, Package, RefreshCw, Layers,
    ShoppingCart, X, Check, Save, Clock, ArrowLeft, ArrowRight,
    PauseCircle, LayoutDashboard, History, Menu, Award, Users,
    AlertCircle, RotateCcw, UserPlus, StickyNote, Edit2, Percent,
    CreditCard as CardIcon, Wallet, DollarSign
} from 'lucide-react';
import { useCartStore, type CartItem } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import type { Transaction, TransactionItem, Product, Customer } from '../db/db';
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
import { RegisterManager } from '../components/RegisterManager';
import { ActiveRegisterModal } from '../components/ActiveRegisterModal';
import { POSCashModal } from '../components/POSCashModal';
import { PaymentModal } from '../components/PaymentModal';
import { useSettingsStore } from '../store/useSettingsStore';
import { useCurrency } from '../hooks/useCurrency';
import { getApiUrl } from '../config/api';

export const POS = () => {
    const { items, addItem, removeItem, updateQuantity, subtotal, total, tax, discount, roundOffDiscount, pointsRedeemed, manualDiscountMode, manualDiscountValue, toggleRedeemPoints, clearCart, customer, setCustomer, setManualDiscount, updateItem } = useCartStore();
    const { user, token } = useAuthStore();
    const { addToast } = useToast();
    const { taxRate, taxEnabled, loyaltyEnabled, loyaltyEarnRate, loadSettings, updateSetting, allowOverSelling, enableDailyRegister, enableCustomerCredit, developerFooter, developerFooterEnabled } = useSettingsStore();
    const { currencySymbol, formatCurrency } = useCurrency();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [isProcessing, setIsProcessing] = useState(false);

    // Register State
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [showActiveRegister, setShowActiveRegister] = useState(false);
    const [showCashPanel, setShowCashPanel] = useState(false);

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
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [checkoutNote, setCheckoutNote] = useState('');
    const [showCheckoutNote, setShowCheckoutNote] = useState(false);

    // Price/Qty/Note Edit State
    const [editingItem, setEditingItem] = useState<CartItem | null>(null);

    // Tax Edit State
    const [showTaxModal, setShowTaxModal] = useState(false);

    // Return Flow State
    const [showReturnLookup, setShowReturnLookup] = useState(false);
    const [returnSearch, setReturnSearch] = useState('');
    const [selectedReturnTransaction, setSelectedReturnTransaction] = useState<Transaction | null>(null);
    const [selectedReturnSaleId, setSelectedReturnSaleId] = useState<string | null>(null);

    // Batch Selection State
    const [batchProduct, setBatchProduct] = useState<null | { productId: number | string; product: Product }>(null);
    const [batchOptions, setBatchOptions] = useState<any[]>([]);

    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
    const [categoriesList, setCategoriesList] = useState<{ id: string; name: string }[]>([]);
    const [recentSales, setRecentSales] = useState<any[]>([]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const [selectedBrand, setSelectedBrand] = useState<string>('All');

    const [productBatches, setProductBatches] = useState<Record<string, any[]>>({});

    useEffect(() => {
        const loadReferenceData = async () => {
            if (!token) return;
            try {
                const headers = { Authorization: `Bearer ${token} ` };
                const [productsRes, customersRes, brandsRes, categoriesRes, salesRes] = await Promise.all([
                    fetch(getApiUrl('/products'), { headers }),
                    fetch(getApiUrl('/customers'), { headers }),
                    fetch(getApiUrl('/brands'), { headers }),
                    fetch(getApiUrl('/categories'), { headers }),
                    fetch(getApiUrl('/sales?limit=50'), { headers })
                ]);

                if (productsRes.ok) {
                    const productPayload = await productsRes.json();
                    const mappedProducts = (productPayload || []).map((product: any): Product => ({
                        product_id: product.id,
                        sku_code: product.skuCode || '',
                        name: product.name,
                        description: product.description || '',
                        category_id: product.categoryId || '',
                        brand_id: product.brandId || '',
                        unit_id: product.unitId || '',
                        sub_category_id: '',
                        cost_price: Number(product.costPrice || 0),
                        retail_price: Number(product.retailPrice ?? product.price ?? 0),
                        stock_quantity: Number(product.stock || 0),
                        alert_quantity: Number(product.reorderLevel || 0),
                        manage_stock: true,
                        barcode: product.barcode || '',
                        barcode_type: product.barcodeType || 'EAN13',
                        image: undefined,
                        tax_type: undefined,
                        tax_amount: undefined,
                        business_locations: [],
                        reorder_level: Number(product.reorderLevel || 0)
                    }));
                    setProducts(mappedProducts);
                }

                if (customersRes.ok) {
                    const customerPayload = await customersRes.json();
                    const mappedCustomers = (customerPayload || []).map((c: any): Customer => ({
                        customer_id: c.id,
                        name: c.name,
                        phone: c.phone,
                        email: c.email || undefined,
                        loyalty_points_balance: c.pointsBalance ?? 0,
                        total_spend_to_date: Number(c.totalSpend || 0)
                    }));
                    setCustomers(mappedCustomers);
                }

                if (brandsRes.ok) {
                    const brandsPayload = await brandsRes.json();
                    setBrands((brandsPayload || []).map((b: any) => ({ id: b.id, name: b.name })));
                }

                if (categoriesRes.ok) {
                    const categoriesPayload = await categoriesRes.json();
                    setCategoriesList((categoriesPayload || []).map((c: any) => ({ id: c.id, name: c.name })));
                }

                if (salesRes.ok) {
                    const salesPayload = await salesRes.json();
                    setRecentSales(Array.isArray(salesPayload) ? salesPayload : salesPayload.data || []);
                }
            } catch (error) {
                console.error('Failed to load POS reference data', error);
            }
        };

        loadReferenceData();
    }, [token]);

    const refetchCustomers = async () => {
        if (!token) return;
        try {
            const headers = { Authorization: `Bearer ${token} ` };
            const customersRes = await fetch(getApiUrl('/customers'), { headers });
            if (customersRes.ok) {
                const customerPayload = await customersRes.json();
                const mappedCustomers = (customerPayload || []).map((c: any): Customer => ({
                    customer_id: c.id,
                    name: c.name,
                    phone: c.phone,
                    email: c.email || undefined,
                    loyalty_points_balance: c.pointsBalance ?? 0,
                    total_spend_to_date: Number(c.totalSpend || 0)
                }));
                setCustomers(mappedCustomers);
            }
        } catch (error) {
            console.error('Failed to refetch customers', error);
        }
    };

    const refetchSales = async () => {
        if (!token) return;
        try {
            const headers = { Authorization: `Bearer ${token} ` };
            const salesRes = await fetch(getApiUrl('/sales?limit=50'), { headers });
            if (salesRes.ok) {
                const salesPayload = await salesRes.json();
                setRecentSales(Array.isArray(salesPayload) ? salesPayload : salesPayload.data || []);
            }
        } catch (error) {
            console.error('Failed to refetch sales', error);
        }
    };

    const refetchProducts = async () => {
        if (!token) return;
        try {
            const headers = { Authorization: `Bearer ${token} ` };
            const productsRes = await fetch(getApiUrl('/products'), { headers });
            if (productsRes.ok) {
                const productPayload = await productsRes.json();
                const mappedProducts = (productPayload || []).map((product: any): Product => ({
                    product_id: product.id,
                    sku_code: product.skuCode || '',
                    name: product.name,
                    description: product.description || '',
                    category_id: product.categoryId || '',
                    brand_id: product.brandId || '',
                    unit_id: product.unitId || '',
                    sub_category_id: '',
                    cost_price: Number(product.costPrice || 0),
                    retail_price: Number(product.retailPrice ?? product.price ?? 0),
                    stock_quantity: Number(product.stock || 0),
                    alert_quantity: Number(product.reorderLevel || 0),
                    manage_stock: true,
                    barcode: product.barcode || '',
                    barcode_type: product.barcodeType || 'EAN13',
                    image: undefined,
                    tax_type: undefined,
                    tax_amount: undefined,
                    business_locations: [],
                    reorder_level: Number(product.reorderLevel || 0)
                }));
                setProducts(mappedProducts);
            }
        } catch (error) {
            console.error('Failed to refetch products', error);
        }
    };

    const cartQtyByProduct = useMemo(() => {
        const map = new Map<number | string, number>();
        items.forEach(item => {
            if (!item.product_id) return;
            map.set(item.product_id, (map.get(item.product_id) || 0) + item.quantity);
        });
        return map;
    }, [items]);

    const cartQtyByBatch = useMemo(() => {
        const map = new Map<string, number>();
        items.forEach(item => {
            if (!item.product_id || !item.batch_id) return;
            const key = `${item.product_id} -${item.batch_id} `;
            map.set(key, (map.get(key) || 0) + item.quantity);
        });
        return map;
    }, [items]);

    const productMap = useMemo(
        () => new Map((products || []).map(p => [p.product_id!, p])),
        [products]
    );

    // Filter products
    const filteredProducts = useMemo(() => {
        if (!products) return [];
        const normalizedQuery = searchQuery.toLowerCase().trim();
        if (!normalizedQuery) {
            return products.filter(p => {
                const matchesCategory = selectedCategory === 'All' || p.category_id === selectedCategory;
                const matchesBrand = selectedBrand === 'All' || p.brand_id === selectedBrand;
                return matchesCategory && matchesBrand;
            });
        }

        // 1. Check for exact barcode/SKU match first
        const exactMatch = products.find(p =>
            p.barcode === normalizedQuery ||
            p.sku_code.toLowerCase() === normalizedQuery
        );

        if (exactMatch) {
            // Check if exact match satisfies category/brand filters OR if searching by code we ignore filters
            return [exactMatch];
        }

        // 2. Fallback to normal filtering
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(normalizedQuery) ||
                p.sku_code.toLowerCase().includes(normalizedQuery) ||
                (p.barcode && p.barcode.includes(normalizedQuery));
            const matchesCategory = selectedCategory === 'All' || p.category_id === selectedCategory;
            const matchesBrand = selectedBrand === 'All' || p.brand_id === selectedBrand;

            return matchesSearch && matchesCategory && matchesBrand;
        });
    }, [products, searchQuery, selectedCategory, selectedBrand]);

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

    const loadProductBatches = async (productId: number | string) => {
        if (!token) return [];
        const key = String(productId);
        // Always fetch fresh data from endpoint (no caching)

        try {
            const response = await fetch(getApiUrl(`/products/${key}/batches`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) return [];
            const payload = await response.json();
            // No caching - always fetch fresh data
            return payload || [];
        } catch (error) {
            console.error('Failed to load product batches', error);
            return [];
        }
    };

    const getMaxBatchQuantity = async (item: CartItem) => {
        if (!item.product_id || !item.batch_id) return null;
        const batches = await loadProductBatches(item.product_id);
        const batch = batches.find((b: any) => b.batch_id === item.batch_id);
        if (!batch) return 0;
        const dbStock = batch.quantity ?? batch.remaining_in_stock ?? batch.remaining_stock ?? 0;
        const key = `${item.product_id}-${item.batch_id}`;
        const cartQty = cartQtyByBatch.get(key) || 0;
        const currentQty = item.quantity || 0;
        return Math.max(0, dbStock - (cartQty - currentQty));
    };

    const [batchRemainingByKey, setBatchRemainingByKey] = useState<Record<string, number>>({});

    useEffect(() => {
        const loadBatchRemaining = async () => {
            if (!token) return;
            const batchItems = items.filter(item => item.product_id && item.batch_id);
            if (batchItems.length === 0) {
                setBatchRemainingByKey({});
                return;
            }

            const uniqueProductIds = Array.from(new Set(batchItems.map(item => String(item.product_id))));

            try {
                const results = await Promise.all(
                    uniqueProductIds.map((productId) => loadProductBatches(productId))
                );

                const nextRemaining: Record<string, number> = {};
                results.forEach((batches) => {
                    (batches || []).forEach((batch: any) => {
                        const key = `${batch.product_id}-${batch.batch_id}`;
                        const dbStock = batch.quantity ?? batch.remaining_in_stock ?? batch.remaining_stock ?? 0;
                        const cartQty = cartQtyByBatch.get(key) || 0;
                        nextRemaining[key] = Math.max(0, dbStock - cartQty);
                    });
                });

                setBatchRemainingByKey(nextRemaining);
            } catch (error) {
                console.error('Failed to load batch stock for cart items', error);
            }
        };

        loadBatchRemaining();
    }, [items, token, cartQtyByBatch]);

    const handleAddProduct = async (product: Product) => {
        if (!product.product_id) return;

        // 1. Check total available stock first
        const currentCartQty = cartQtyByProduct.get(product.product_id) || 0;
        const totalStockAvailable = Number(product.stock_quantity || 0) - currentCartQty;

        if (totalStockAvailable <= 0 && !allowOverSelling) {
            addToast('Product out of stock', 'error');
            return;
        }

        const allBatches = (await loadProductBatches(product.product_id))
            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        // Calculate how much of this product is already in cart per batch
        const cartQtyByBatch = new Map<number, number>();
        items.forEach(item => {
            if (item.product_id === product.product_id && item.batch_id) {
                const current = cartQtyByBatch.get(item.batch_id) || 0;
                cartQtyByBatch.set(item.batch_id, current + item.quantity);
            }
        });

        // Adjust batch quantities based on what's in cart (real-time stock)
        const batchesWithRealTimeStock = allBatches.map((b: any) => {
            const cartQty = cartQtyByBatch.get(b.batch_id) || 0;
            // Use the database remaining stock (from API) and subtract cart qty
            const dbStock = b.quantity ?? b.remaining_in_stock ?? b.remaining_stock ?? 0;

            // Limit the available stock in this batch to the total available stock
            // This handles cases where sum(positive_batches) > total_stock (due to negative batches)
            const absoluteAvailableInBatch = Math.max(0, dbStock - cartQty);
            const limitedBatchStock = Math.min(absoluteAvailableInBatch, totalStockAvailable);

            return {
                ...b,
                remaining_in_stock: limitedBatchStock,
                original_quantity: dbStock,
                purchased_quantity: b.purchased_quantity
            };
        });

        // Filter: ONLY keep batches with remaining stock > 0
        const availableBatches = batchesWithRealTimeStock.filter((b: any) =>
            b.remaining_in_stock > 0
        );

        if (availableBatches.length === 0) {
            if (allowOverSelling) {
                // If over-selling is enabled, add it without a batch
                addItem({ ...product, retail_price: product.retail_price, batch_id: undefined });
                return;
            }
            addToast('Product out of stock', 'error');
            return;
        }

        // If all available batches have the same price, auto-select the oldest one
        const uniquePrices = new Set(availableBatches.map((b: any) => b.retail_price));
        if (uniquePrices.size === 1) {
            const batch = availableBatches[0];
            addItem({ ...product, retail_price: batch.retail_price, batch_id: batch.batch_id });
            return;
        }

        // Multiple prices - show selection modal
        setBatchProduct({ productId: product.product_id, product });
        setBatchOptions(availableBatches);
    };

    const filteredSales = recentSales
        ?.filter((t) => !returnSearch
            ? true
            : String(t.id || t.transaction_id || '').includes(returnSearch) || String(t.customerId || t.customer_id || '').includes(returnSearch)
        ) || [];

    // Refetch sales when return lookup opens
    useEffect(() => {
        if (showReturnLookup) {
            refetchSales();
        }
    }, [showReturnLookup]);

    const handlePayment = async (paymentDetails?: { cash: number, card: number }, method: string = 'cash', customDiscount: number = 0, receivedAmountFromModal?: number) => {
        if (items.length === 0) return;
        if (!user) {
            addToast("No user logged in!", 'error');
            return;
        }
        if (!token) {
            addToast("Missing auth token", 'error');
            return;
        }

        setIsProcessing(true);
        try {
            const batchItems = items.filter(item => item.product_id && item.batch_id);
            if (batchItems.length > 0) {
                const qtyByBatch = new Map<string, number>();
                batchItems.forEach(item => {
                    const key = `${item.product_id}-${item.batch_id}`;
                    qtyByBatch.set(key, (qtyByBatch.get(key) || 0) + item.quantity);
                });

                const uniqueProductIds = Array.from(new Set(batchItems.map(item => String(item.product_id))));
                const batchResults = await Promise.all(
                    uniqueProductIds.map((productId) => loadProductBatches(productId))
                );

                const remainingByBatch = new Map<string, number>();
                batchResults.forEach((batches) => {
                    (batches || []).forEach((batch: any) => {
                        const key = `${batch.product_id}-${batch.batch_id}`;
                        const dbStock = batch.quantity ?? batch.remaining_in_stock ?? batch.remaining_stock ?? 0;
                        remainingByBatch.set(key, dbStock);
                    });
                });

                for (const [key, qty] of qtyByBatch.entries()) {
                    const remaining = remainingByBatch.get(key) ?? 0;
                    if (qty > remaining && !allowOverSelling) {
                        addToast('Batch stock is not enough for this item', 'error');
                        return;
                    }
                }
            }

            const finalTotal = total + tax - roundOffDiscount - customDiscount;
            const pointsEarned = customer && loyaltyEnabled ? Math.floor(finalTotal * loyaltyEarnRate) : 0;
            const pointsRedeemedValue = customer && loyaltyEnabled ? pointsRedeemed : 0;

            const response = await fetch(getApiUrl('/sales/checkout'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    staff_id: user.user_id,
                    customer_id: customer?.customer_id,
                    payment_method: paymentDetails ? 'split' : method,
                    payment_details: paymentDetails ? {
                        cashAmount: paymentDetails.cash,
                        cardAmount: paymentDetails.card
                    } : (method === 'cash' && receivedAmountFromModal !== undefined ? { cashAmount: receivedAmountFromModal } : undefined),
                    items: items.map(item => ({
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_price: item.retail_price,
                        batch_id: item.batch_id,
                        note: item.note
                    })),
                    note: checkoutNote,
                    totals: {
                        subtotal,
                        tax,
                        discount: discount + customDiscount,
                        grand_total: finalTotal,
                        round_off_discount: roundOffDiscount
                    },
                    loyalty: customer ? {
                        points_earned: pointsEarned,
                        points_redeemed: pointsRedeemedValue
                    } : undefined
                })
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || 'Checkout failed');
            }

            const sale = await response.json();

            setLastTransaction({
                transaction_id: sale.id,
                user_id: user.user_id || user.username || 'system',
                customer_id: sale.customerId || customer?.customer_id,
                timestamp: new Date(sale.createdAt || new Date()),
                total_amount: Number(sale.total || 0),
                tax_amount: Number(sale.tax || 0),
                discount: Number(sale.discount || 0),
                round_off_discount: Number(sale.roundOffDiscount || 0),
                payment_method: (sale.paymentMethod || method || (paymentDetails ? 'split' : 'cash')),
                status: 'completed',
                type: 'sale',
                payment_details: paymentDetails ? {
                    cashAmount: paymentDetails.cash,
                    cardAmount: paymentDetails.card
                } : (method === 'cash' && receivedAmountFromModal !== undefined ? { cashAmount: receivedAmountFromModal } : undefined),
                note: sale.note || checkoutNote
            });

            setLastItems((sale.items || []).map((item: any) => {
                const cartItem = items.find(i => String(i.product_id) === String(item.productId) && i.batch_id === item.batchId);
                return {
                    transaction_id: sale.id,
                    product_id: item.productId,
                    quantity: item.quantity,
                    price_at_sale: Number(item.price || 0),
                    note: item.note || cartItem?.note || '',
                    isOverSale: item.isOverSale || false,
                    name: productMap.get(item.productId)?.name || 'Unknown Product'
                };
            }));

            // Staff-only notification if any over-sold items
            const overSoldItems = (sale.items || []).filter((item: any) => item.isOverSale);
            if (overSoldItems.length > 0) {
                const names = overSoldItems
                    .map((item: any) => productMap.get(item.productId)?.name || 'Unknown Product')
                    .join(', ');
                addToast(`⚠️ Over-sold (no stock): ${names}. Please restock.`, 'error');
            }

            if (token) {
                try {
                    const productsResponse = await fetch(getApiUrl('/products'), {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (productsResponse.ok) {
                        const productPayload = await productsResponse.json();
                        const mappedProducts = (productPayload || []).map((product: any): Product => ({
                            product_id: product.id,
                            sku_code: product.skuCode || '',
                            name: product.name,
                            description: product.description || '',
                            category_id: product.categoryId || '',
                            brand_id: product.brandId || '',
                            unit_id: product.unitId || '',
                            sub_category_id: '',
                            cost_price: Number(product.costPrice || 0),
                            retail_price: Number(product.retailPrice ?? product.price ?? 0),
                            stock_quantity: Number(product.stock || 0),
                            alert_quantity: Number(product.reorderLevel || 0),
                            manage_stock: true,
                            barcode: product.barcode || '',
                            barcode_type: product.barcodeType || 'EAN13',
                            image: undefined,
                            tax_type: undefined,
                            tax_amount: undefined,
                            business_locations: [],
                            reorder_level: Number(product.reorderLevel || 0)
                        }));
                        setProducts(mappedProducts);
                    }
                } catch (error) {
                    console.error('Failed to refresh products after checkout', error);
                }
            }

            // Clear cart, customer, and local stock caches immediately after successful payment
            clearCart();
            setCustomer(null);
            setCheckoutNote('');
            setBatchRemainingByKey({}); // Fix: Force batch stock fetch logic to pull fresh DB values on next scan
            setProductBatches({}); // Clear old cache format just in case
            addToast("Payment successful!", 'success');

        } catch (error) {
            console.error("Payment failed", error);
            const message = error instanceof Error && error.message
                ? error.message
                : "Payment failed. Please try again.";
            addToast(message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReceiptClose = () => {
        setLastTransaction(null);
        setLastItems([]);
    };

    const handleConfirmHold = async (note: string) => {
        if (items.length === 0) return;

        try {
            if (!token) {
                addToast("Missing auth token", 'error');
                return;
            }

            const response = await fetch(getApiUrl('/sales/held'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    customer_id: customer?.customer_id,
                    items: items.map(i => ({
                        product: { ...i },
                        quantity: i.quantity,
                        note: i.note
                    })),
                    note
                })
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || 'Failed to hold sale');
            }
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

        const cartItems = (sale.items || []).map((i: any) => ({
            ...i.product,
            quantity: i.quantity,
            note: i.note
        }));

        const restoredCustomer = sale.customerId
            ? customers.find(c => String(c.customer_id) === String(sale.customerId))
            : null;

        // Use the new setCart function
        // @ts-ignore - store types might not update immediately in IDE but runtime works
        useCartStore.getState().setCart(cartItems, restoredCustomer || null, 0);

        if (token) {
            await fetch(getApiUrl(`/sales/held/${sale.id}`), {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        }

        setShowHeldSalesList(false);
        addToast("Sale restored!", 'success');
    };



    return (
        <div className="flex w-full h-full relative flex-row bg-gray-100 dark:bg-gray-900 overflow-hidden">
            {enableDailyRegister && !isRegisterOpen && (
                <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-md text-center border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                            <Wallet size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Register Closed</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            You must open a register shift before you can process sales or accept payments.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors w-full shadow-lg shadow-blue-600/30"
                        >
                            Open Register Now
                        </button>
                    </div>
                </div>
            )}
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
                                onClick={() => setSelectedCategory(String(cat))}
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
                            const cartQty = product.product_id ? (cartQtyByProduct.get(product.product_id) || 0) : 0;
                            const remainingStock = product.manage_stock ? product.stock_quantity - cartQty : null;
                            const isLowStock = product.manage_stock && (remainingStock ?? 0) <= (product.alert_quantity || 0);
                            const isOutOfStock = product.manage_stock && (remainingStock ?? 0) <= 0;
                            const stockLabel = product.manage_stock
                                ? (isOutOfStock ? 'Out of stock' : `Stock: ${remainingStock}`)
                                : 'Stock: Unlimited';
                            const stockClass = isOutOfStock
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-emerald-600 dark:text-emerald-400';
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
                                        <div className={`text-[10px] font-semibold ${stockClass}`}>
                                            {stockLabel}
                                        </div>
                                        {isLowStock && (
                                            <div className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 font-medium">
                                                <AlertCircle size={10} />
                                                <span>Low Stock: {remainingStock}</span>
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
                    <div className="flex items-center gap-2">
                        {items.length > 0 && <span className="text-sm text-gray-500 dark:text-gray-400">{items.reduce((acc, i) => acc + i.quantity, 0)} Items</span>}
                        {enableDailyRegister && (
                            <button
                                onClick={() => setShowActiveRegister(true)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${isRegisterOpen
                                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50'
                                    : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 border-red-200 dark:border-red-800 animate-pulse'
                                    }`}
                                title={isRegisterOpen ? 'Register Open — click to view' : 'Register closed'}
                            >
                                <Wallet size={13} />
                                {isRegisterOpen ? 'Register' : 'Open Register'}
                            </button>
                        )}
                        <button
                            onClick={() => setShowCashPanel(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            title="Petty Cash & Expenses"
                        >
                            <DollarSign size={13} />
                            Cash
                        </button>
                        <button
                            onClick={() => setShowReturnLookup(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
                            title="History"
                        >
                            <RotateCcw size={14} />
                            History
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
                    {items.map((item) => {
                        const product = item.product_id ? productMap.get(item.product_id) : undefined;
                        const manageStock = product?.manage_stock ?? item.manage_stock;
                        const baseStock = product?.stock_quantity ?? item.stock_quantity;
                        const cartQty = item.product_id ? (cartQtyByProduct.get(item.product_id) || 0) : 0;
                        const batchKey = item.batch_id ? `${item.product_id}-${item.batch_id}` : null;
                        const batchRemaining = batchKey ? batchRemainingByKey[batchKey] : undefined;
                        const remainingStock = manageStock ? baseStock - cartQty : null;
                        const effectiveRemaining = typeof batchRemaining === 'number' ? batchRemaining : remainingStock;
                        const remainingLabel = manageStock
                            ? (typeof batchRemaining === 'number'
                                ? `Batch Remaining: ${batchRemaining}`
                                : (remainingStock !== null && remainingStock <= 0 ? 'Remaining: 0' : `Remaining: ${remainingStock}`))
                            : 'Remaining: Unlimited';
                        const remainingClass = effectiveRemaining !== null && effectiveRemaining !== undefined && effectiveRemaining <= 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400';
                        return (
                            <div
                                key={item.product_id}
                                className="bg-white dark:bg-gray-800 p-3 rounded-xl flex flex-col gap-2 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:ring-2 hover:ring-blue-200 dark:hover:ring-blue-900/40"
                                onClick={() => setEditingItem(item)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="font-medium text-gray-900 dark:text-white leading-tight">
                                        {item.name} <span className="text-xs text-gray-500">({item.sku_code})</span>
                                        <div className={`text-[10px] font-semibold ${remainingClass}`}>
                                            {remainingLabel}
                                        </div>
                                    </div>
                                </div>

                                {item.note ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                                        className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full text-left line-clamp-1 group"
                                    >
                                        <StickyNote size={10} className="text-blue-500 flex-shrink-0" />
                                        <span className="flex-1 truncate">Note: {item.note}</span>
                                        <Edit2 size={10} className="text-gray-400 group-hover:text-blue-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                                        className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1 hover:text-blue-500 transition-colors"
                                    >
                                        <StickyNote size={10} />
                                        <span>Add Item Note</span>
                                    </button>
                                )}

                                <div className="flex justify-between items-center">
                                    {/* Quantity Controls */}
                                    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateQuantity(Number(item.product_id!), item.quantity - 1, item.batch_id);
                                            }}
                                            className="p-1 hover:text-red-500 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-all"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-8 text-center font-bold text-sm text-gray-800 dark:text-gray-200">{item.quantity}</span>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (item.batch_id) {
                                                    const maxQty = await getMaxBatchQuantity(item);
                                                    if (maxQty !== null && item.quantity + 1 > maxQty) {
                                                        addToast('Batch stock is not enough for this item', 'error');
                                                        return;
                                                    }
                                                }
                                                updateQuantity(Number(item.product_id!), item.quantity + 1, item.batch_id);
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
                                                removeItem(Number(item.product_id!), item.batch_id);
                                            }}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-green-600 dark:text-green-400 text-sm font-medium">
                                <span>
                                    {manualDiscountMode === 'percent' && manualDiscountValue > 0
                                        ? `Discount (${manualDiscountValue}%)`
                                        : 'Discount'}
                                </span>
                                <span>-{currencySymbol}{discount.toFixed(2)}</span>
                            </div>
                        )}
                        {roundOffDiscount > 0 && (
                            <div className="flex justify-between text-green-600 dark:text-green-400 text-sm font-medium">
                                <span>Round off discount</span>
                                <span>-{currencySymbol}{roundOffDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        {taxEnabled && (
                            <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                                <div className="flex items-center gap-2">
                                    <span>Tax ({(taxRate * 100).toFixed(2)}%)</span>
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
                        )}
                        <div className="flex justify-between items-end border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                            <span className="text-lg font-bold text-gray-800 dark:text-white">Total</span>
                            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(total + tax - roundOffDiscount)}</span>
                        </div>
                    </div>

                    {/* Total Discount Row (NEW) */}
                    <div className="mb-4 space-y-2">
                        <button
                            onClick={() => setShowDiscountModal(true)}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600 group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                                    <Tag size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Apply Bill Discount</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Coupon or manual discount</p>
                                </div>
                            </div>
                            <Plus size={18} className="text-gray-400 group-hover:text-blue-500" />
                        </button>

                        <button
                            onClick={() => setShowCheckoutNote(prev => !prev)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors border group ${checkoutNote || showCheckoutNote
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${checkoutNote || showCheckoutNote
                                    ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300'
                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                                    }`}>
                                    <StickyNote size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Add Bill Note</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {checkoutNote ? `Note: ${checkoutNote.slice(0, 30)}${checkoutNote.length > 30 ? '...' : ''}` : 'Special instructions for this bill'}
                                    </p>
                                </div>
                            </div>
                            <Plus size={18} className={`${showCheckoutNote ? 'rotate-45' : ''} transition-transform text-gray-400 group-hover:text-blue-500`} />
                        </button>

                        {showCheckoutNote && (
                            <div className="animate-in slide-in-from-top-2 duration-200">
                                <textarea
                                    value={checkoutNote}
                                    onChange={(e) => setCheckoutNote(e.target.value)}
                                    placeholder="Enter checkout note here..."
                                    className="w-full bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                                    autoFocus
                                />
                            </div>
                        )}
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
                            onClick={() => setShowSplitPaymentModal(true)}
                            disabled={isProcessing || items.length === 0}
                            className="flex flex-col items-center justify-center py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                        >
                            <CardIcon size={20} />
                            <span className="text-[10px] uppercase font-bold mt-1">Split</span>
                        </button>

                        <button
                            onClick={() => setShowPaymentModal(true)}
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
                    onSuccess={(createdCustomer) => {
                        refetchCustomers();
                        if (createdCustomer) {
                            // Auto-select the newly created customer
                            setCustomer({
                                customer_id: createdCustomer.id,
                                name: createdCustomer.name,
                                phone: createdCustomer.phone,
                                email: createdCustomer.email || undefined,
                                loyalty_points_balance: createdCustomer.pointsBalance ?? 0,
                                total_spend_to_date: Number(createdCustomer.totalSpend || 0)
                            });
                        }
                        addToast("Customer Added!", 'success');
                        setShowCustomerModal(false);
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
                    developerFooter={developerFooter}
                    developerFooterEnabled={developerFooterEnabled}
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

            {/* Standard Payment Modal */}
            {showPaymentModal && (
                <PaymentModal
                    total={total + tax - roundOffDiscount}
                    enableCustomerCredit={enableCustomerCredit}
                    hasCustomer={!!customer}
                    onConfirm={(method, receivedAmount) => {
                        setShowPaymentModal(false);
                        handlePayment(undefined, method, 0, receivedAmount);
                    }}
                    onClose={() => setShowPaymentModal(false)}
                />
            )}

            {/* Discount Modal */}
            {showDiscountModal && (
                <DiscountModal
                    subtotal={subtotal}
                    total={total + tax - roundOffDiscount}
                    currentDiscount={discount}
                    onConfirm={(d) => {
                        setManualDiscount(d);
                        setShowDiscountModal(false);
                    }}
                    onClose={() => setShowDiscountModal(false)}
                />
            )}

            {/* Edit Cart Item Modal */}
            {editingItem && (
                <EditCartItemModal
                    item={editingItem}
                    onConfirm={async (updates) => {
                        if (editingItem.batch_id && typeof updates.quantity === 'number') {
                            const maxQty = await getMaxBatchQuantity(editingItem);
                            if (maxQty !== null && updates.quantity > maxQty) {
                                addToast('Batch stock is not enough for this item', 'error');
                                return;
                            }
                        }
                        updateItem(Number(editingItem.product_id!), {
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

            {batchProduct && batchOptions.length > 0 && (
                <SelectBatchModal
                    key={`${batchProduct.product.product_id}-${Date.now()}`}
                    product={batchProduct.product}
                    batches={batchOptions}
                    onSelect={(batch, quantity) => {
                        // Add items with the selected quantity
                        const productWithBatch = {
                            ...batchProduct.product,
                            retail_price: batch.retail_price,
                            batch_id: batch.batch_id
                        };

                        // Add the specified quantity
                        for (let i = 0; i < quantity; i++) {
                            addItem(productWithBatch);
                        }

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
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sales History</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Search history by transaction or customer ID</p>
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
                                    placeholder="Search history by sale ID or customer ID..."
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
                                    const saleId = String(txn.id || txn.transaction_id || '');
                                    const customerName = customers?.find(c => String(c.customer_id) === String(txn.customerId || txn.customer_id))?.name;
                                    return (
                                        <button
                                            key={saleId}
                                            onClick={() => {
                                                setSelectedReturnSaleId(saleId);
                                                setSelectedReturnTransaction(txn);
                                                setShowReturnLookup(false);
                                                setReturnSearch('');
                                            }}
                                            className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between"
                                        >
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white">#{saleId} • {customerName || 'Walk-in'}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(txn.createdAt || txn.timestamp).toLocaleString()}</div>
                                            </div>
                                            <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(Number(txn.total || txn.total_amount || 0))}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedReturnSaleId && (
                <ReturnModal
                    saleId={selectedReturnSaleId}
                    onClose={() => {
                        setSelectedReturnSaleId(null);
                        setSelectedReturnTransaction(null);
                    }}
                    onSuccess={() => {
                        refetchSales();
                        refetchProducts();
                        setProductBatches({});
                        setBatchRemainingByKey({});
                        addToast('Return processed', 'success');
                    }}
                />
            )}

            {enableDailyRegister && (
                <ActiveRegisterModal
                    isOpen={showActiveRegister}
                    onClose={() => setShowActiveRegister(false)}
                    onRegisterClosed={() => {
                        setIsRegisterOpen(false);
                        setShowActiveRegister(false);
                    }}
                />
            )}

            {enableDailyRegister && (
                <RegisterManager
                    onRegisterStatusKnown={(open) => setIsRegisterOpen(open)}
                />
            )}

            {showCashPanel && (
                <POSCashModal onClose={() => setShowCashPanel(false)} />
            )}
        </div>
    );
};
