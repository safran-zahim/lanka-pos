import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, Customer } from '../db/db';
import { useSettingsStore } from './useSettingsStore';

export interface CartItem extends Product {
    quantity: number;
    note?: string;
    batch_id?: number;
}

interface CartState {
    items: CartItem[];
    customer: Customer | null;
    subtotal: number;
    total: number;
    tax: number;
    discount: number;
    roundOffDiscount: number;
    pointsRedeemed: number;
    manualDiscountMode: 'amount' | 'percent';
    manualDiscountValue: number;

    addItem: (product: Product & { batch_id?: number }) => void;
    removeItem: (productId: number, batchId?: number) => void;
    updateQuantity: (productId: number, quantity: number, batchId?: number) => void;
    setCustomer: (customer: Customer | null) => void;
    toggleRedeemPoints: () => void;
    clearCart: () => void;
    setCart: (items: CartItem[], customer?: Customer | null, pointsRedeemed?: number, manualDiscountValue?: number, manualDiscountMode?: 'amount' | 'percent') => void;
    setManualDiscount: (discount: { mode: 'amount' | 'percent'; value: number }) => void;
    updatePrice: (productId: number, price: number, batchId?: number) => void;
    updateItem: (productId: number, updates: { quantity?: number; price?: number; note?: string }, batchId?: number) => void;
}

const calculateTotals = (
    items: CartItem[],
    pointsRedeemed: number,
    manualDiscountValue: number,
    manualDiscountMode: 'amount' | 'percent',
    taxRate: number,
    taxEnabled: boolean,
    loyaltyEnabled: boolean,
    loyaltyPointValue: number,
    roundOffEnabled: boolean,
    roundOffDecimals: number
) => {
    const subtotal = items.reduce((sum, item) => sum + (item.retail_price * item.quantity), 0);
    const tax = taxEnabled ? subtotal * taxRate : 0;
    const loyaltyDiscount = loyaltyEnabled ? pointsRedeemed * loyaltyPointValue : 0;
    const manualDiscount = manualDiscountMode === 'percent'
        ? (subtotal * manualDiscountValue) / 100
        : manualDiscountValue;
    const safeManualDiscount = Math.min(subtotal, Math.max(0, manualDiscount));
    const totalDiscount = loyaltyDiscount + safeManualDiscount;
    const total = Math.max(0, subtotal - totalDiscount);
    const final = total + tax;
    let roundOffDiscount = 0;
    if (roundOffEnabled && roundOffDecimals >= 0) {
        const factor = 10 ** roundOffDecimals;
        const roundedFinal = Math.floor(final * factor) / factor;
        roundOffDiscount = Math.max(0, parseFloat((final - roundedFinal).toFixed(roundOffDecimals)));
    }
    return { subtotal, total, tax, discount: totalDiscount, roundOffDiscount };
};

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => {
            const getTotals = (items: CartItem[], pointsRedeemed: number, manualDiscountValue: number, manualDiscountMode: 'amount' | 'percent') => {
                const { taxRate, taxEnabled, loyaltyEnabled, loyaltyPointValue, roundOffEnabled, roundOffDecimals } = useSettingsStore.getState();
                return calculateTotals(
                    items,
                    pointsRedeemed,
                    manualDiscountValue,
                    manualDiscountMode,
                    taxRate,
                    taxEnabled,
                    loyaltyEnabled,
                    loyaltyPointValue,
                    roundOffEnabled,
                    roundOffDecimals
                );
            };

            return {
                items: [],
                customer: null,
                subtotal: 0,
                total: 0,
                tax: 0,
                discount: 0,
                roundOffDiscount: 0,
                pointsRedeemed: 0,
                manualDiscountMode: 'amount',
                manualDiscountValue: 0,

                addItem: (product) => {
                    const { items, pointsRedeemed, manualDiscountValue, manualDiscountMode } = get();
                    const existingItem = items.find(item => item.product_id === product.product_id && item.batch_id === product.batch_id);

                    let newItems;
                    if (existingItem) {
                        newItems = items.map(item =>
                            item.product_id === product.product_id && item.batch_id === product.batch_id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        );
                    } else {
                        newItems = [...items, { ...product, quantity: 1, note: '' }];
                    }

                    const { subtotal, total, tax, discount, roundOffDiscount } = getTotals(newItems, pointsRedeemed, manualDiscountValue, manualDiscountMode);
                    set({ items: newItems, subtotal, total, tax, discount, roundOffDiscount });
                },

                removeItem: (productId, batchId) => {
                    const { items, pointsRedeemed, manualDiscountValue, manualDiscountMode } = get();
                    const newItems = items.filter(item => !(item.product_id === productId && item.batch_id === batchId));
                    const { subtotal, total, tax, discount, roundOffDiscount } = getTotals(newItems, pointsRedeemed, manualDiscountValue, manualDiscountMode);
                    set({ items: newItems, subtotal, total, tax, discount, roundOffDiscount });
                },

                updateQuantity: (productId, quantity, batchId) => {
                    const { items, pointsRedeemed, manualDiscountValue, manualDiscountMode } = get();
                    if (quantity <= 0) {
                        get().removeItem(productId, batchId);
                        return;
                    }
                    const newItems = items.map(item =>
                        item.product_id === productId && item.batch_id === batchId ? { ...item, quantity } : item
                    );
                    const { subtotal, total, tax, discount, roundOffDiscount } = getTotals(newItems, pointsRedeemed, manualDiscountValue, manualDiscountMode);
                    set({ items: newItems, subtotal, total, tax, discount, roundOffDiscount });
                },

                updatePrice: (productId, price, batchId) => {
                    const { items, pointsRedeemed, manualDiscountValue, manualDiscountMode } = get();
                    const newItems = items.map(item =>
                        item.product_id === productId && item.batch_id === batchId ? { ...item, retail_price: price } : item
                    );
                    const { subtotal, total, tax, discount, roundOffDiscount } = getTotals(newItems, pointsRedeemed, manualDiscountValue, manualDiscountMode);
                    set({ items: newItems, subtotal, total, tax, discount, roundOffDiscount });
                },

                updateItem: (productId, updates, batchId) => {
                    const { items, pointsRedeemed, manualDiscountValue, manualDiscountMode } = get();
                    const newItems = items.map(item => {
                        if (item.product_id !== productId || item.batch_id !== batchId) return item;
                        return {
                            ...item,
                            quantity: updates.quantity ?? item.quantity,
                            retail_price: updates.price ?? item.retail_price,
                            note: updates.note ?? item.note
                        };
                    });
                    const { subtotal, total, tax, discount, roundOffDiscount } = getTotals(newItems, pointsRedeemed, manualDiscountValue, manualDiscountMode);
                    set({ items: newItems, subtotal, total, tax, discount, roundOffDiscount });
                },

                setCustomer: (customer) => {
                    // Reset points redemption when customer changes
                    const { items, manualDiscountValue, manualDiscountMode } = get();
                    const { subtotal, total, tax, discount, roundOffDiscount } = getTotals(items, 0, manualDiscountValue, manualDiscountMode);
                    set({ customer, pointsRedeemed: 0, subtotal, total, tax, discount, roundOffDiscount });
                },

                toggleRedeemPoints: () => {
                    const { customer, pointsRedeemed, items, manualDiscountValue, manualDiscountMode } = get();
                    const { loyaltyEnabled, loyaltyPointValue } = useSettingsStore.getState();
                    if (!customer || !loyaltyEnabled) return;

                    let newPointsRedeemed = 0;
                    if (pointsRedeemed === 0) {
                        const subtotal = items.reduce((sum, item) => sum + (item.retail_price * item.quantity), 0);
                        if (loyaltyPointValue > 0) {
                            newPointsRedeemed = Math.min(customer.loyalty_points_balance, Math.floor(subtotal / loyaltyPointValue));
                        }
                    } else {
                        newPointsRedeemed = 0;
                    }

                    const { subtotal, total, tax, discount, roundOffDiscount } = getTotals(items, newPointsRedeemed, manualDiscountValue, manualDiscountMode);
                    set({ pointsRedeemed: newPointsRedeemed, subtotal, total, tax, discount, roundOffDiscount });
                },

                setManualDiscount: (discount) => {
                    const { items, pointsRedeemed } = get();
                    const { subtotal, total, tax, discount: totalDiscount, roundOffDiscount } = getTotals(items, pointsRedeemed, discount.value, discount.mode);
                    set({ manualDiscountValue: discount.value, manualDiscountMode: discount.mode, subtotal, total, tax, discount: totalDiscount, roundOffDiscount });
                },

                clearCart: () => set({ items: [], customer: null, subtotal: 0, total: 0, tax: 0, discount: 0, roundOffDiscount: 0, pointsRedeemed: 0, manualDiscountValue: 0, manualDiscountMode: 'amount' }),

                setCart: (items, customer = null, pointsRedeemed = 0, manualDiscountValue = 0, manualDiscountMode = 'amount') => {
                    const { subtotal, total, tax, discount, roundOffDiscount } = getTotals(items, pointsRedeemed, manualDiscountValue, manualDiscountMode);
                    set({ items, customer, pointsRedeemed, manualDiscountValue, manualDiscountMode, subtotal, total, tax, discount, roundOffDiscount });
                },
            };
        },
        {
            name: 'pos-cart-storage',
        }
    )
);

const recalcTotalsFromSettings = () => {
    const { items, pointsRedeemed, manualDiscountValue, manualDiscountMode } = useCartStore.getState();
    const { taxRate, taxEnabled, loyaltyEnabled, loyaltyPointValue, roundOffEnabled, roundOffDecimals } = useSettingsStore.getState();
    const effectivePoints = loyaltyEnabled ? pointsRedeemed : 0;
    const { subtotal, total, tax, discount, roundOffDiscount } = calculateTotals(
        items,
        effectivePoints,
        manualDiscountValue,
        manualDiscountMode,
        taxRate,
        taxEnabled,
        loyaltyEnabled,
        loyaltyPointValue,
        roundOffEnabled,
        roundOffDecimals
    );
    useCartStore.setState({ subtotal, total, tax, discount, roundOffDiscount, pointsRedeemed: effectivePoints });
};

useSettingsStore.subscribe((state, prevState) => {
    if (
        state.taxRate !== prevState.taxRate ||
        state.taxEnabled !== prevState.taxEnabled ||
        state.loyaltyEnabled !== prevState.loyaltyEnabled ||
        state.loyaltyPointValue !== prevState.loyaltyPointValue ||
        state.roundOffEnabled !== prevState.roundOffEnabled ||
        state.roundOffDecimals !== prevState.roundOffDecimals
    ) {
        recalcTotalsFromSettings();
    }
});
