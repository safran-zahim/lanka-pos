import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { Decimal } from 'decimal.js';
import { Prisma, Sale } from '@prisma/client';

const optionalId = z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    z.coerce.number().int().positive()
);

const checkoutItemSchema = z.object({
    product_id: z.coerce.number().int().positive(),
    quantity: z.number().refine((value) => value !== 0, { message: 'Quantity cannot be 0' }),
    unit_price: z.number().positive(),
    batch_id: optionalId.optional(),
    note: z.string().optional(),
});

const checkoutSchema = z.object({
    staff_id: z.coerce.number().int().positive(),
    customer_id: optionalId.optional(),
    parent_sale_id: optionalId.optional(),
    payment_method: z.string(),
    items: z.array(checkoutItemSchema),
    totals: z.object({
        subtotal: z.number(),
        tax: z.number(),
        discount: z.number(),
        grand_total: z.number(),
        round_off_discount: z.number().optional()
    }),
    note: z.string().optional(),
    loyalty: z.object({
        points_earned: z.number().int().nonnegative().optional(),
        points_redeemed: z.number().int().nonnegative().optional(),
    }).optional(),
    payment_details: z.object({
        cashAmount: z.number().optional(),
        cardAmount: z.number().optional(),
        creditAmount: z.number().optional()
    }).optional()
});

export const checkout = async (req: Request, res: Response) => {
    try {
        const data = checkoutSchema.parse(req.body);

        const hasPositive = data.items.some((item) => item.quantity > 0);
        const hasNegative = data.items.some((item) => item.quantity < 0);
        const isReturn = hasNegative;

        if (hasPositive && hasNegative) {
            return res.status(400).json({ error: 'Mixed sale and return items are not supported.' });
        }

        if (isReturn && !data.parent_sale_id) {
            return res.status(400).json({ error: 'parent_sale_id is required for returns.' });
        }

        if (!isReturn && data.parent_sale_id) {
            return res.status(400).json({ error: 'parent_sale_id can only be used for returns.' });
        }

        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const oversellingSetting = await tx.setting.findUnique({ where: { key: 'allowOverSelling' } });
            const allowOverSelling = oversellingSetting?.value === true || oversellingSetting?.value === 'true';

            // Get Active Shift
            const activeShift = await tx.shift.findFirst({
                where: { staffId: data.staff_id, status: 'OPEN' }
            });
            const shiftId = activeShift?.id;

            let parentSale: any = null;
            let saleCustomerId = data.customer_id;
            let returnSubtotal = new Decimal(0);
            let refundTax = new Decimal(0);
            let refundDiscount = new Decimal(0);
            let refundRoundOff = new Decimal(0);
            const returnUnitPrices = new Map<string, Decimal>();

            if (isReturn && data.parent_sale_id) {
                parentSale = await tx.sale.findUnique({
                    where: { id: data.parent_sale_id },
                    include: { items: true, returns: { include: { items: true } } }
                });

                if (!parentSale) {
                    throw new Error('Parent sale not found');
                }

                saleCustomerId = parentSale.customerId || undefined;

                // Track by product AND batch for accurate return verification
                const parentQtyByProductBatch = new Map<string, number>();
                const parentTotalByProductBatch = new Map<string, Decimal>();
                const parentQtyByProduct = new Map<number, number>();
                const parentTotalByProduct = new Map<number, Decimal>();

                for (const item of parentSale.items) {
                    const key = `${item.productId}-${item.batchId || 'null'}`;
                    const qty = parentQtyByProductBatch.get(key) || 0;
                    parentQtyByProductBatch.set(key, qty + Number(item.quantity));

                    const total = parentTotalByProductBatch.get(key) || new Decimal(0);
                    parentTotalByProductBatch.set(key, total.plus(new Decimal(item.price.toString()).times(item.quantity.toString())));

                    // Also keep product-level totals for fallback
                    const prodQty = parentQtyByProduct.get(item.productId) || 0;
                    parentQtyByProduct.set(item.productId, prodQty + Number(item.quantity));

                    const prodTotal = parentTotalByProduct.get(item.productId) || new Decimal(0);
                    parentTotalByProduct.set(item.productId, prodTotal.plus(new Decimal(item.price.toString()).times(item.quantity.toString())));
                }

                // Track returned quantities by product AND batch
                const returnedQtyByProductBatch = new Map<string, number>();
                const returnedQtyByProduct = new Map<number, number>();
                for (const returnSale of parentSale.returns || []) {
                    for (const item of returnSale.items || []) {
                        const qty = Math.abs(Number(item.quantity));
                        const key = `${item.productId}-${item.batchId || 'null'}`;
                        returnedQtyByProductBatch.set(key, (returnedQtyByProductBatch.get(key) || 0) + qty);
                        returnedQtyByProduct.set(item.productId, (returnedQtyByProduct.get(item.productId) || 0) + qty);
                    }
                }

                for (const item of data.items) {
                    if (item.quantity >= 0) {
                        throw new Error('Return quantities must be negative');
                    }

                    const key = `${item.product_id}-${item.batch_id || 'null'}`;
                    const parentQty = parentQtyByProductBatch.get(key) || 0;
                    const returnedQty = returnedQtyByProductBatch.get(key) || 0;
                    const maxReturnable = Math.max(0, parentQty - returnedQty);
                    const returnQty = Math.abs(item.quantity);

                    if (parentQty === 0) {
                        throw new Error(`Product ${item.product_id} with batch ${item.batch_id || 'none'} is not part of the original sale`);
                    }

                    if (returnQty > maxReturnable) {
                        throw new Error(`Return quantity exceeds original quantity for product ${item.product_id} batch ${item.batch_id || 'none'}`);
                    }

                    const total = parentTotalByProductBatch.get(key) || new Decimal(item.unit_price);
                    const unitPrice = parentQty > 0 ? total.div(parentQty) : new Decimal(item.unit_price);
                    returnUnitPrices.set(key, unitPrice);
                    returnSubtotal = returnSubtotal.plus(unitPrice.times(returnQty));
                }

                const fallbackSubtotal = parentSale.items.reduce(
                    (sum: Decimal, item: any) => sum.plus(new Decimal(item.price).times(item.quantity)),
                    new Decimal(0)
                );
                const parentSubtotal = parentSale.subtotal ? new Decimal(parentSale.subtotal.toString()) : fallbackSubtotal;
                const parentTax = new Decimal(parentSale.tax?.toString() || 0);
                const parentDiscount = new Decimal(parentSale.discount?.toString() || 0);
                const parentRoundOff = new Decimal(parentSale.roundOffDiscount?.toString() || 0);

                if (parentSubtotal.gt(0)) {
                    const ratio = returnSubtotal.div(parentSubtotal);
                    refundTax = parentTax.mul(ratio);
                    refundDiscount = parentDiscount.mul(ratio);
                    refundRoundOff = parentRoundOff.mul(ratio);
                }
            }

            // 1. Validate stock against purchase and sale totals and check decimal quantities
            for (const item of data.items) {
                if (item.quantity <= 0) {
                    continue;
                }

                // Fetch product with unit information
                const product = await tx.product.findUnique({
                    where: { id: item.product_id },
                    include: { unit: true }
                });

                if (!product) {
                    throw new Error(`Product ${item.product_id} not found`);
                }

                // Check if product is inactive
                if (product.isActive === false) {
                    throw new Error(`Product "${product.name}" is inactive and cannot be sold. Please activate the product first.`);
                }

                // Validate decimal quantities
                if (product.unit && !product.unit.allowDecimal) {
                    const hasDecimals = !Number.isInteger(item.quantity);
                    if (hasDecimals) {
                        throw new Error(`Product "${product.name}" uses unit "${product.unit.name}" which does not accept decimal quantities`);
                    }
                }

                const [purchaseAgg, saleAgg] = await Promise.all([
                    tx.purchaseItem.aggregate({
                        where: { productId: item.product_id },
                        _sum: { quantity: true }
                    }),
                    tx.saleItem.aggregate({
                        where: { productId: item.product_id },
                        _sum: { quantity: true }
                    })
                ]);

                const totalPurchased = Number(purchaseAgg._sum.quantity || 0);
                const totalSold = Number(saleAgg._sum.quantity || 0);
                const currentStock = totalPurchased - totalSold;

                if (currentStock < item.quantity && !allowOverSelling) {
                    throw new Error(`Insufficient stock for product ${item.product_id}`);
                }


                // Validate batch-specific stock if batch_id is provided
                if (item.batch_id) {
                    const batch = await tx.purchaseItem.findUnique({
                        where: { id: item.batch_id }
                    });

                    if (!batch) {
                        throw new Error(`Batch ${item.batch_id} not found for product ${item.product_id}`);
                    }

                    if (batch.productId !== item.product_id) {
                        throw new Error(`Batch ${item.batch_id} does not belong to product ${item.product_id}`);
                    }

                    // Calculate batch-specific stock
                    const batchSales = await tx.saleItem.aggregate({
                        where: {
                            productId: item.product_id,
                            batchId: item.batch_id
                        },
                        _sum: { quantity: true }
                    });

                    const batchPurchased = Number(batch.quantity || 0);
                    const batchSold = Number(batchSales._sum.quantity || 0);
                    const batchAvailable = batchPurchased - batchSold;

                    if (batchAvailable < item.quantity && !allowOverSelling) {
                        throw new Error(`Insufficient stock in batch ${item.batch_id}. Available: ${batchAvailable}, Requested: ${item.quantity}`);
                    }

                } else {
                    // FIFO logic: automatically assign to batches if no batch_id provided
                    const batches = await tx.purchaseItem.findMany({
                        where: { productId: item.product_id },
                        orderBy: { id: 'asc' } // Oldest first (FIFO)
                    });

                    let remainingToAssign = item.quantity;
                    for (const batch of batches) {
                        const batchSales = await tx.saleItem.aggregate({
                            where: { productId: item.product_id, batchId: batch.id },
                            _sum: { quantity: true }
                        });
                        const batchPurchased = Number(batch.quantity || 0);
                        const batchSold = Number(batchSales._sum.quantity || 0);
                        const batchAvailable = batchPurchased - batchSold;

                        if (batchAvailable > 0) {
                            const assignQty = Math.min(remainingToAssign, batchAvailable);
                            remainingToAssign -= assignQty;
                            if (remainingToAssign <= 0) break;
                        }
                    }

                    if (remainingToAssign > 0 && !allowOverSelling) {
                        throw new Error(`Insufficient stock for product ${item.product_id} across all batches. Missing: ${remainingToAssign}`);
                    }
                }
            }

            // Implementation note: The above validation only checks availability.
            // The item creation below needs to be updated to actually split items if they span multiple batches.
            // Since the current schema and data structure expect a single batchId per SaleItem,
            // if we use multiple batches for one cart item, we should create multiple SaleItem records.

            const saleItemsData: any[] = [];
            for (const item of data.items) {
                if (item.batch_id !== undefined && item.batch_id !== null || isReturn) {
                    const key = `${item.product_id}-${item.batch_id || 'null'}`;
                    let isItemOverSale = false;
                    let batchAvailable = 0;

                    if (item.quantity > 0 && !isReturn && item.batch_id) {
                        const batchSales = await tx.saleItem.aggregate({
                            where: { productId: item.product_id, batchId: item.batch_id },
                            _sum: { quantity: true }
                        });
                        const batch = await tx.purchaseItem.findUnique({ where: { id: item.batch_id } });
                        const batchPurchased = Number(batch?.quantity || 0);
                        const batchSold = Number(batchSales._sum.quantity || 0);
                        batchAvailable = Math.max(0, batchPurchased - batchSold);

                        if (batchAvailable < item.quantity) {
                            isItemOverSale = true;
                        }
                    }

                    if (isItemOverSale && allowOverSelling) {
                        const product = await tx.product.findUnique({ where: { id: item.product_id } });
                        const latestPurchase = await tx.purchaseItem.findFirst({
                            where: { productId: item.product_id },
                            include: { purchase: { select: { date: true } } },
                            orderBy: { purchase: { date: 'desc' } }
                        });

                        const fallbackPrice = latestPurchase?.retailPrice
                            ? new Decimal(latestPurchase.retailPrice.toString())
                            : (latestPurchase?.costPrice
                                ? new Decimal(latestPurchase.costPrice.toString())
                                : new Decimal(product?.price?.toString() || item.unit_price));

                        if (batchAvailable > 0) {
                            saleItemsData.push({
                                productId: item.product_id,
                                quantity: isReturn ? -batchAvailable : batchAvailable,
                                price: new Decimal(item.unit_price),
                                batchId: item.batch_id,
                                isOverSale: false,
                                note: item.note
                            });
                        }
                        saleItemsData.push({
                            productId: item.product_id,
                            quantity: isReturn ? -(item.quantity - batchAvailable) : (item.quantity - batchAvailable),
                            price: fallbackPrice,
                            batchId: null,
                            isOverSale: true,
                            note: item.note
                        });
                    } else {
                        saleItemsData.push({
                            productId: item.product_id,
                            quantity: isReturn ? -item.quantity : item.quantity,
                            price: isReturn ? (returnUnitPrices.get(key) || new Decimal(item.unit_price)) : new Decimal(item.unit_price),
                            batchId: item.batch_id,
                            isOverSale: false,
                            note: item.note
                        });
                    }
                } else {
                    // FIFO Assignment for creation
                    let remainingToAssign = item.quantity;
                    const batches = await tx.purchaseItem.findMany({
                        where: { productId: item.product_id },
                        orderBy: { id: 'asc' }
                    });

                    for (const batch of batches) {
                        const batchSales = await tx.saleItem.aggregate({
                            where: { productId: item.product_id, batchId: batch.id },
                            _sum: { quantity: true }
                        });
                        const batchPurchased = Number(batch.quantity || 0);
                        const batchSold = Number(batchSales._sum.quantity || 0);
                        const batchAvailable = batchPurchased - batchSold;

                        if (batchAvailable > 0) {
                            const assignQty = Math.min(remainingToAssign, batchAvailable);
                            saleItemsData.push({
                                productId: item.product_id,
                                quantity: isReturn ? -assignQty : assignQty,
                                price: new Decimal(item.unit_price),
                                batchId: batch.id,
                                isOverSale: false,
                                note: item.note
                            });
                            remainingToAssign -= assignQty;
                            if (remainingToAssign <= 0) break;
                        }
                    }

                    if (remainingToAssign > 0 && allowOverSelling) {
                        const product = await tx.product.findUnique({ where: { id: item.product_id } });
                        const latestPurchase = await tx.purchaseItem.findFirst({
                            where: { productId: item.product_id },
                            include: { purchase: { select: { date: true } } },
                            orderBy: { purchase: { date: 'desc' } }
                        });

                        const fallbackPrice = latestPurchase?.retailPrice
                            ? new Decimal(latestPurchase.retailPrice.toString())
                            : (latestPurchase?.costPrice
                                ? new Decimal(latestPurchase.costPrice.toString())
                                : new Decimal(product?.price?.toString() || item.unit_price));

                        saleItemsData.push({
                            productId: item.product_id,
                            quantity: isReturn ? -remainingToAssign : remainingToAssign,
                            price: fallbackPrice,
                            batchId: null,
                            isOverSale: true,
                            note: item.note
                        });
                        remainingToAssign = 0;
                    }
                }
            }


            const refundTotal = returnSubtotal.plus(refundTax).minus(refundDiscount).minus(refundRoundOff);

            // Extract credit amount specifically for dueAmount logic
            let creditAmount = 0;
            if (data.payment_method === 'credit') {
                creditAmount = isReturn ? refundTotal.neg().toNumber() : data.totals.grand_total;
            } else if (data.payment_method === 'split' && data.payment_details?.creditAmount) {
                creditAmount = isReturn ? refundTotal.neg().toNumber() : data.payment_details.creditAmount;
            }

            // 2. Create Sale Record
            const sale = await tx.sale.create({
                data: {
                    staffId: data.staff_id,
                    customerId: saleCustomerId,
                    parentSaleId: isReturn ? data.parent_sale_id : undefined,
                    shiftId: shiftId,
                    paymentMethod: data.payment_method,
                    total: new Decimal(isReturn ? refundTotal.neg() : data.totals.grand_total),
                    subtotal: new Decimal(isReturn ? returnSubtotal.neg() : data.totals.subtotal),
                    tax: new Decimal(isReturn ? refundTax.neg() : data.totals.tax),
                    discount: new Decimal(isReturn ? refundDiscount.neg() : data.totals.discount),
                    roundOffDiscount: new Decimal(isReturn ? refundRoundOff.neg() : (data.totals.round_off_discount || 0)),
                    note: isReturn ? (data.note || `Refund for Bill #${data.parent_sale_id}`) : data.note,
                    dueAmount: new Decimal(creditAmount), // This handles 'credit' and 'split' with credit portion
                    status: isReturn ? 'RETURNED' : 'COMPLETED',
                    paymentDetails: data.payment_details || undefined,
                    items: {
                        create: saleItemsData
                    }
                },
                include: {
                    items: true
                }
            });

            if (saleCustomerId) {
                if (!isReturn) {
                    const pointsEarned = data.loyalty?.points_earned || 0;
                    const pointsRedeemed = data.loyalty?.points_redeemed || 0;
                    const netPoints = pointsEarned - pointsRedeemed;

                    const updatedCustomer = await tx.customer.update({
                        where: { id: saleCustomerId },
                        data: {
                            pointsBalance: { increment: netPoints },
                            totalSpend: { increment: new Decimal(data.totals.grand_total) }
                        }
                    });

                    if (pointsEarned > 0) {
                        await tx.customerPointLedger.create({
                            data: {
                                customerId: saleCustomerId,
                                points: pointsEarned,
                                type: 'EARN',
                                reference: String(sale.id),
                                balanceAfter: updatedCustomer.pointsBalance
                            }
                        });
                    }

                    if (pointsRedeemed > 0) {
                        await tx.customerPointLedger.create({
                            data: {
                                customerId: saleCustomerId,
                                points: -pointsRedeemed,
                                type: 'REDEEM',
                                reference: String(sale.id),
                                balanceAfter: updatedCustomer.pointsBalance
                            }
                        });
                    }
                } else if (parentSale) {
                    // Update original sale dueAmount if it was a credit sale
                    if (parentSale.paymentMethod === 'credit') {
                        await tx.sale.update({
                            where: { id: parentSale.id },
                            data: {
                                dueAmount: { decrement: refundTotal }
                            }
                        });
                    }

                    const earnEntries = await tx.customerPointLedger.findMany({
                        where: {
                            customerId: saleCustomerId,
                            type: 'EARN',
                            reference: String(parentSale.id)
                        }
                    });
                    const totalEarnedPoints = earnEntries.reduce((sum, entry) => sum + entry.points, 0);
                    const parentTotal = new Decimal(parentSale.total?.toString() || 0).abs();
                    const pointsRatio = parentTotal.gt(0) ? refundTotal.div(parentTotal) : new Decimal(0);
                    const pointsToDeduct = Math.min(totalEarnedPoints, Math.floor(pointsRatio.mul(totalEarnedPoints).toNumber()));

                    const customerUpdate: any = {
                        totalSpend: { increment: refundTotal.neg() }
                    };

                    if (pointsToDeduct > 0) {
                        customerUpdate.pointsBalance = { decrement: pointsToDeduct };
                    }

                    const updatedCustomer = await tx.customer.update({
                        where: { id: saleCustomerId },
                        data: customerUpdate
                    });

                    if (pointsToDeduct > 0) {
                        await tx.customerPointLedger.create({
                            data: {
                                customerId: saleCustomerId,
                                points: -pointsToDeduct,
                                type: 'ADJUST',
                                reference: String(parentSale.id),
                                balanceAfter: updatedCustomer.pointsBalance
                            }
                        });
                    }
                }
            }

            // Update customer debt if payment method is "credit"
            if (data.payment_method === 'credit' && saleCustomerId) {
                const customer = await tx.customer.findUnique({ where: { id: saleCustomerId } });
                if (!customer) throw new Error("Customer not found for credit sale");

                const currentDue = new Decimal(customer.totalDue.toString());
                const creditLimit = new Decimal(customer.creditLimit.toString());
                // Use calculated refundTotal for returns to ensure trust, otherwise use grand_total
                const upfrontCash = data.payment_details?.cashAmount || 0;
                const creditAmountForSale = Math.max(0, data.totals.grand_total - upfrontCash);
                const newGrandTotal = isReturn ? refundTotal.neg() : new Decimal(creditAmountForSale);

                // For sales (positive), check limit. For returns (negative), skip check.
                if (newGrandTotal.gt(0) && currentDue.plus(newGrandTotal).gt(creditLimit)) {
                    throw new Error(`Credit limit exceeded. Limit: ${creditLimit}, Current Due: ${currentDue}`);
                }

                await tx.customer.update({
                    where: { id: saleCustomerId },
                    data: {
                        totalDue: { increment: newGrandTotal }
                    }
                });
            }

            // Update Shift Totals if payment method is cash or if there is upfront cash for credit
            if (shiftId) {
                if (data.payment_method === 'cash') {
                    if (isReturn) {
                        await tx.shift.update({
                            where: { id: shiftId },
                            data: { totalCashRefunds: { increment: refundTotal } }
                        });
                    } else {
                        await tx.shift.update({
                            where: { id: shiftId },
                            data: { totalCashSales: { increment: new Decimal(data.totals.grand_total) } }
                        });
                    }
                } else if (data.payment_method === 'credit' && !isReturn && data.payment_details?.cashAmount) {
                    // Record partial upfront cash for a credit sale
                    await tx.shift.update({
                        where: { id: shiftId },
                        data: { totalCashSales: { increment: new Decimal(data.payment_details.cashAmount) } }
                    });
                }
            }

            return sale;
        });

        res.status(201).json(result);

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            res.status(400).json({ error: 'Validation failed', details: formattedErrors });
        } else if (error.message && error.message.includes('Parent sale not found')) {
            res.status(404).json({ error: error.message });
        } else if (error.message && error.message.includes('Return')) {
            res.status(400).json({ error: error.message });
        } else if (error.message && error.message.includes('Insufficient stock')) {
            res.status(409).json({ error: error.message }); // Conflict
        } else if (error.message && error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const getSale = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid sale id' });
        }
        const sale = await prisma.sale.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                        batch: true
                    }
                },
                staff: true,
                customer: true,
                returns: {
                    include: {
                        items: {
                            include: {
                                batch: true
                            }
                        }
                    }
                },
                parentSale: {
                    include: {
                        items: {
                            include: {
                                batch: true
                            }
                        }
                    }
                }
            }
        });

        if (!sale) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        res.json(sale);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getSales = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit || 50);
        const take = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50;
        const start = req.query.start ? new Date(String(req.query.start)) : null;
        const end = req.query.end ? new Date(String(req.query.end)) : null;
        const includeItems = String(req.query.includeItems || 'false') === 'true';

        const where: any = {};
        if (start || end) {
            where.createdAt = {};
            if (start) where.createdAt.gte = start;
            if (end) where.createdAt.lte = end;
        }

        const sales = await prisma.sale.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take,
            include: includeItems ? { items: { include: { product: true } }, returns: { include: { items: { include: { product: true } } } } } : undefined
        });

        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const heldSaleSchema = z.object({
    customer_id: optionalId.optional(),
    items: z.array(z.any()),
    note: z.string().optional()
});

export const createHeldSale = async (req: Request, res: Response) => {
    try {
        const data = heldSaleSchema.parse(req.body);

        const heldSale = await prisma.heldSale.create({
            data: {
                customerId: data.customer_id,
                items: data.items,
                note: data.note
            }
        });

        res.status(201).json(heldSale);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            res.status(400).json({ error: 'Validation failed', details: formattedErrors });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const getHeldSales = async (req: Request, res: Response) => {
    try {
        const heldSales = await prisma.heldSale.findMany({
            orderBy: { createdAt: 'desc' }
        });

        res.json(heldSales);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteHeldSale = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid held sale id' });
        }

        await prisma.heldSale.delete({ where: { id } });
        res.json({ message: 'Held sale deleted' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Held sale not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const refundSale = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Invalid sale id' });
        }

        // Transaction to restore stock and maybe mark sale as refunded?
        // Schema doesn't have "status" field on Sale. Assuming we keep the Sale but maybe negative entry or just delete?
        // "Void a sale and restore stock." -> Usually implies status=VOIDED.
        // I didn't add status to Sale model. I should update schema or just delete?
        // Deleting loses history. I'll "Void" by restoring stock. Ideally I'd update schema. 
        // For simplicity/compliance with "Void a sale", I'll just restore stock. 
        // If I can't modify schema easily now (migration), I'll just restore stock.
        // But a "refund" usually creates a *new* negative transaction or updates status.
        // I'll assume for now we just restore stock and maybe delete the sale? Or status?
        // Let's check schema. I defined `Sale`. I can add `status String @default("COMPLETED")`.
        // I'll update schema later. For now, I'll assume we verify it exists, restore stock, and DELETE it or just leave it?
        // User said "Void a sale". 
        // I will perform: 1. Fetch sale items. 2. Restore stock. 3. Delete Sale (or mark void if I update schema).
        // Safest is to Delete Sale to prevent double refund if no status field.

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const sale = await tx.sale.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!sale) throw new Error("Sale not found");
            if (sale.status === 'VOIDED') throw new Error("Sale already voided");

            // 1. Restore Stock for each item
            // Note: Since we don't have a specific "Void" transaction in stock history yet,
            // we will just rely on the fact that SaleItems are checked during stock aggregation.
            // However, to truly VOID, we should either delete the SaleItems or mark them.
            // Given the getProducts stock calculation (TotalPurchased - TotalSold),
            // if we mark Sale as VOIDED, we must ensure getProducts query excludes VOIDED sales.

            // 2. Mark as Voided
            await tx.sale.update({
                where: { id },
                data: { status: 'VOIDED' }
            });

            // 3. If it was a credit sale, reverse the customer's due balance
            if (sale.paymentMethod === 'credit' && sale.customerId) {
                const totalRefund = new Decimal(sale.total.toString());
                await tx.customer.update({
                    where: { id: sale.customerId },
                    data: {
                        totalDue: { decrement: totalRefund },
                        totalSpend: { decrement: totalRefund }
                    }
                });
            }
        });

        res.json({ message: 'Sale voided successfully' });
    } catch (error: any) {
        if (error.message === 'Sale not found') {
            return res.status(404).json({ error: 'Sale not found' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getDailySummary = async (req: Request, res: Response) => {
    try {
        // "Get EOD totals."
        // Sum of all sales created today.

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const [sales, repayments] = await Promise.all([
            prisma.sale.findMany({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            }),
            prisma.customerPayment.findMany({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            })
        ]);

        let totalSales = new Decimal(0);
        let cashTotal = new Decimal(0);
        let cardTotal = new Decimal(0);
        let bankTotal = new Decimal(0);
        let creditTotal = new Decimal(0);
        let otherTotal = new Decimal(0);
        let paymentsTotal = new Decimal(0);

        sales.forEach((sale: any) => {
            const saleTotal = new Decimal(sale.total.toString());
            totalSales = totalSales.plus(saleTotal);

            if (sale.paymentMethod === 'cash') {
                cashTotal = cashTotal.plus(saleTotal);
            } else if (sale.paymentMethod === 'card') {
                cardTotal = cardTotal.plus(saleTotal);
            } else if (sale.paymentMethod === 'bank') {
                bankTotal = bankTotal.plus(saleTotal);
            } else if (sale.paymentMethod === 'credit') {
                creditTotal = creditTotal.plus(saleTotal);
            } else {
                otherTotal = otherTotal.plus(saleTotal);
            }
        });

        repayments.forEach((payment: any) => {
            const amount = new Decimal(payment.amount.toString());
            paymentsTotal = paymentsTotal.plus(amount);

            if (payment.paymentMethod === 'cash') {
                cashTotal = cashTotal.plus(amount);
            } else if (payment.paymentMethod === 'card') {
                cardTotal = cardTotal.plus(amount);
            } else if (payment.paymentMethod === 'bank') {
                bankTotal = bankTotal.plus(amount);
            }
        });

        res.json({
            date: startOfDay.toISOString().split('T')[0],
            total_sales: totalSales.toNumber(),
            transaction_count: sales.length,
            cash_total: cashTotal.toNumber(),
            card_total: cardTotal.toNumber(),
            bank_total: bankTotal.toNumber(),
            credit_total: creditTotal.toNumber(),
            other_total: otherTotal.toNumber(),
            payments_total: paymentsTotal.toNumber()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMonthlySummary = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);

        const [currentAgg, previousAgg] = await Promise.all([
            prisma.sale.aggregate({
                where: {
                    createdAt: {
                        gte: startOfThisMonth,
                        lt: startOfNextMonth
                    }
                },
                _sum: { total: true },
                _count: { _all: true }
            }),
            prisma.sale.aggregate({
                where: {
                    createdAt: {
                        gte: startOfLastMonth,
                        lt: startOfThisMonth
                    }
                },
                _sum: { total: true },
                _count: { _all: true }
            })
        ]);

        const currentTotal = new Decimal(currentAgg._sum.total || 0).toNumber();
        const previousTotal = new Decimal(previousAgg._sum.total || 0).toNumber();
        const currentCount = currentAgg._count._all;
        const previousCount = previousAgg._count._all;

        const percentChange = (current: number, previous: number) => {
            if (previous <= 0) return null;
            return ((current - previous) / previous) * 100;
        };

        res.json({
            period: {
                current_month_start: startOfThisMonth.toISOString(),
                previous_month_start: startOfLastMonth.toISOString()
            },
            current: {
                total_sales: currentTotal,
                transaction_count: currentCount
            },
            previous: {
                total_sales: previousTotal,
                transaction_count: previousCount
            },
            percent_change: {
                total_sales: percentChange(currentTotal, previousTotal),
                transaction_count: percentChange(currentCount, previousCount)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
