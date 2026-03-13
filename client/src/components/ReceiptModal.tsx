import { useEffect, useState } from 'react';
import { Printer, Check, X, MessageSquare, Loader, MessageCircle } from 'lucide-react';
import type { Transaction, TransactionItem, Customer, User } from '../db/db';
import { useDigitalReceipt } from '../hooks/useDigitalReceipt';
import { useCurrency } from '../hooks/useCurrency';
import { useLocale } from '../hooks/useLocale';
import { getApiUrl } from '../config/api';
import { useAuthStore } from '../store/useAuthStore';

import { APP_CONFIG } from '../config/appConfig';

interface ReceiptModalProps {
    transaction: Transaction;
    items: (TransactionItem & { name: string; description?: string; image?: string })[];
    customer?: Customer | null;
    user?: User | null;
    autoPrint?: boolean;
    onClose: () => void;
    developerFooter?: string;
    developerFooterEnabled?: boolean;
}

export const ReceiptModal = ({ transaction, items, customer, user, autoPrint, onClose, developerFooter: propDeveloperFooter, developerFooterEnabled: propDeveloperFooterEnabled }: ReceiptModalProps) => {
    const { sendReceipt, sending } = useDigitalReceipt();
    const { currencySymbol, formatCurrency } = useCurrency();
    const { formatDate, formatTime, formatDateTime } = useLocale();
    const token = useAuthStore((state) => state.token);
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [settingsError, setSettingsError] = useState<string | null>(null);
    const [autoPrinted, setAutoPrinted] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch(getApiUrl('/settings'), {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined
                });
                const allSettings = response.ok ? await response.json() : [];
                const settingsMap = (allSettings || []).reduce((acc: Record<string, any>, curr: any) => ({
                    ...acc,
                    [curr.key]: curr.value
                }), {} as Record<string, any>);
                setSettings(settingsMap);
            } catch (error) {
                console.error('Failed to load receipt settings', error);
                setSettingsError('Failed to load receipt settings. Using defaults.');
            } finally {
                setLoadingSettings(false);
            }
        };
        fetchSettings();
    }, [token]);

    const handlePrint = () => {
        window.print();
    };

    useEffect(() => {
        if (!autoPrint || autoPrinted || loadingSettings) return;
        if (transaction.transaction_id !== undefined && transaction.transaction_id !== null) {
            const key = `receiptAutoPrint:${transaction.transaction_id}`;
            try {
                const lastPrinted = Number(sessionStorage.getItem(key) || 0);
                if (Date.now() - lastPrinted < 5000) {
                    return;
                }
                sessionStorage.setItem(key, String(Date.now()));
            } catch {
                // Ignore sessionStorage failures and proceed
            }
        }
        setAutoPrinted(true);
        const printTimer = setTimeout(() => {
            window.print();
        }, 300);
        return () => clearTimeout(printTimer);
    }, [autoPrint, autoPrinted, loadingSettings, transaction.transaction_id]);

    const handleSendDigital = async () => {
        if (!customer?.phone) return;
        const result = await sendReceipt(transaction.transaction_id!, customer.phone, {
            totalAmount: transaction.total_amount,
            items: items.map(i => ({ name: i.name, qty: i.quantity, price: i.price_at_sale, note: i.note })),
            date: transaction.timestamp
        });
        alert(result.message);
    };

    const handleWhatsAppShare = () => {
        const itemsTotal = items.reduce((sum, item) => sum + (item.price_at_sale * item.quantity), 0);
        const discountAmount = transaction.discount || 0;
        const subtotal = itemsTotal - discountAmount;
        const taxAmount = transaction.tax_amount || 0;
        const roundOff = transaction.round_off_discount || 0;
        const total = transaction.total_amount;
        const taxPercent = taxEnabled && taxAmount > 0 ? ((taxAmount / itemsTotal) * 100).toFixed(2).replace(/\.00$/, '') : '0';

        const receiptText = `🧾 *${header}*\n${address}\n${phone ? `Tel: ${phone}` : ''}\n${email ? `Email: ${email}` : ''}\n\n*Invoice:* #${transaction.transaction_id}\n*Date:* ${formatDateTime(new Date(transaction.timestamp))}\n${customer?.name ? `*Customer:* ${customer.name}\n` : ''}\n*Items:*\n${items.map(item => `• ${item.quantity} × ${item.name} (${formatCurrency(item.price_at_sale * item.quantity)})`).join('\n')}\n\n*Summary:*\nSubtotal: ${formatCurrency(subtotal)}\n${discountAmount > 0 ? `Discount: -${formatCurrency(discountAmount)}\n` : ''}${taxEnabled && taxAmount > 0 ? `Tax (${taxPercent}%): ${formatCurrency(taxAmount)}\n` : ''}${roundOffEnabled && roundOff > 0 ? `Round Off: -${formatCurrency(roundOff)}\n` : ''}*Total: ${formatCurrency(total)}*\n\nPayment Method: ${transaction.payment_method.toUpperCase()}\n\n${footer || 'Thank you for your business!'}`;

        // Clean phone number
        const phoneNumber = customer?.phone?.replace(/[^0-9]/g, '') || '';

        // Use WhatsApp API format
        const whatsappUrl = `https://api.whatsapp.com/send/?phone=${phoneNumber}&text=${encodeURIComponent(receiptText)}&type=phone_number&app_absent=0`;

        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
    };

    if (loadingSettings) {
        return (
            <div id="receipt-modal" className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]">
                <div className="bg-white text-black p-6 rounded-lg w-80">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Loader size={18} className="animate-spin" />
                        <span>Loading receipt...</span>
                    </div>
                </div>
            </div>
        );
    }

    const taxRate = typeof settings['taxRate'] === 'number' ? settings['taxRate'] : 0;
    const taxEnabled = settings['taxEnabled'] !== undefined ? settings['taxEnabled'] : true;
    const roundOffEnabled = settings['roundOffEnabled'] !== undefined ? settings['roundOffEnabled'] : false;

    // Receipt type settings
    const receiptType = settings['receiptType'] || 'thermal';
    const thermalWidth = settings['thermalWidth'] || '80mm';
    const a4Orientation = settings['a4Orientation'] || 'portrait';
    const receiptTemplate = settings['receiptTemplate'] || (receiptType === 'a4' ? 'a4-classic' : 'thermal-classic');
    const isModern = receiptTemplate === 'a4-modern';
    const isCreative = receiptTemplate === 'a4-creative';
    const isElegant = receiptTemplate === 'a4-elegant';
    const isBold = receiptTemplate === 'a4-bold';
    const isThermalCompact = receiptTemplate === 'thermal-compact';

    // Content settings
    const logoUrl = settings['companyLogo'] || settings['receiptLogo'] || '';
    const showLogo = Boolean(logoUrl) || settings['showLogo'] || false;
    const showTaxID = settings['showTaxID'] || false;
    const taxID = settings['taxID'] || '';
    const showBarcode = settings['showBarcode'] || false;

    // Content settings
    const header = settings['companyName'] || settings['receiptHeader'] || APP_CONFIG.appName;
    const address = settings['companyAddress'] || settings['receiptAddress'] || APP_CONFIG.company.address;
    const phone = settings['companyPhone'] || settings['receiptPhone'] || APP_CONFIG.company.supportPhone;
    const email = settings['companyEmail'] || settings['receiptEmail'] || '';
    const footer = settings['receiptFooter'] || 'Thank you for your business!';

    // Developer Footer Logic
    const devFooter = propDeveloperFooter || settings['developerFooter'] || 'Developed by Tap Lanka POS 0705083388';
    const devFooterEnabled = propDeveloperFooterEnabled !== undefined
        ? propDeveloperFooterEnabled
        : (settings['developerFooterEnabled'] !== false);

    // Dynamic width based on receipt type
    const receiptWidth = receiptType === 'thermal'
        ? (thermalWidth === '58mm' ? 'w-64' : (thermalWidth === '76mm' ? 'w-[76mm]' : 'w-96'))
        : (a4Orientation === 'portrait' ? 'w-[210mm]' : 'w-[297mm]');

    const receiptHeight = receiptType === 'a4'
        ? (a4Orientation === 'portrait' ? 'min-h-[297mm]' : 'min-h-[210mm]')
        : '';

    const printReceiptWidth = receiptType === 'thermal' ? `print:w-[${thermalWidth}]` : 'print:w-full';

    return (
        <div id="receipt-modal" className="fixed inset-0 bg-black/80 flex flex-col items-center pt-10 pb-10 overflow-y-auto print:overflow-visible z-[200] print:bg-white print:static print:h-auto print:w-full print:flex print:items-start print:justify-center">
            <div className={`bg-white text-black p-8 rounded-lg ${receiptWidth} ${receiptHeight} relative ${printReceiptWidth} print:shadow-none print:p-0 print:pt-0 print:pb-0 print:m-0`}>

                {/* Actions (Hidden on Print) */}
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <div className="flex items-center space-x-2 text-green-600 font-bold">
                        <Check size={24} />
                        <span>Success!</span>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-black">
                        <X size={24} />
                    </button>
                </div>

                {settingsError && (
                    <div className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 print:hidden">
                        {settingsError}
                    </div>
                )}

                {/* Receipt Content */}
                <div className={`text-sm space-y-2 print:border-box ${isModern || isElegant || isBold ? 'font-sans' : 'font-mono'} ${isThermalCompact ? 'text-xs' : ''} ${isCreative ? 'border-2 border-black print:border-black p-5 rounded-lg' : ''} ${isElegant ? 'border border-gray-200 print:border-gray-300 rounded-2xl p-5' : ''} ${isBold ? 'border-2 border-black print:border-black rounded-xl p-5' : ''}`}>
                    {(isModern || isBold) ? (
                        <div className="bg-blue-600 text-white rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-bold">{header}</h1>
                                <p className="text-xs opacity-90">{address}</p>
                                {phone && <p className="text-xs opacity-90">Tel: {phone}</p>}
                                {email && <p className="text-xs opacity-90">Email: {email}</p>}
                            </div>
                            {showLogo && (
                                logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="h-14 w-14 object-contain bg-white rounded" />
                                ) : (
                                    <div className="h-14 w-14 bg-white/20 rounded flex items-center justify-center text-[10px]">LOGO</div>
                                )
                            )}
                        </div>
                    ) : isElegant ? (
                        <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-2xl p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-xl font-bold tracking-wide">{header}</h1>
                                    <p className="text-xs opacity-90">{address}</p>
                                    {phone && <p className="text-xs opacity-90">Tel: {phone}</p>}
                                    {email && <p className="text-xs opacity-90">Email: {email}</p>}
                                </div>
                                {showLogo && (
                                    logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="h-14 w-14 object-contain bg-white rounded" />
                                    ) : (
                                        <div className="h-14 w-14 bg-white/20 rounded flex items-center justify-center text-[10px]">LOGO</div>
                                    )
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            {showLogo && (
                                <div className="flex justify-center mb-2">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain" />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded-full text-xs text-gray-500">LOGO</div>
                                    )}
                                </div>
                            )}
                            <h1 className="text-xl font-bold">{header}</h1>
                            <p className="text-xs">{address}</p>
                            {phone && <p className="text-xs">Tel: {phone}</p>}
                            {email && <p className="text-xs">Email: {email}</p>}
                            {taxEnabled && showTaxID && taxID && <p className="text-xs">VAT: {taxID}</p>}
                        </div>
                    )}

                    {/* REFUND INDICATOR */}
                    {transaction.type === 'return' && (
                        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-2 my-4 text-center">
                            <div className="text-red-700 font-bold text-xs">⚠️ REFUND RECEIPT ⚠️</div>
                            {transaction.parent_sale_id && (
                                <div className="text-red-600 text-xs mt-1">
                                    Original Sale: #{transaction.parent_sale_id}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={`border-b-2 ${isCreative || isBold ? 'border-black print:border-black' : 'border-dashed border-gray-400 print:border-gray-500'} my-4`}></div>

                    {/* Meta Information (Date, Time, Receipt #) */}
                    <div className="mb-1 text-[10px] font-bold">
                        <div>{formatDate(new Date(transaction.timestamp))} {formatTime(new Date(transaction.timestamp))}</div>
                        <div>#{transaction.transaction_id} | {user?.username || 'Admin'}</div>
                    </div>
                    {customer && (() => {
                        const hasCredit = transaction.payment_method === 'credit' || (transaction.payment_method === 'split' && transaction.payment_details && Number(transaction.payment_details.creditAmount || 0) > 0);
                        return (
                            <div className={`text-[10px] mb-1 font-bold ${hasCredit ? 'border border-black p-0.5 print:border-black print:p-0.5 text-[12px] uppercase' : ''}`}>
                                {customer.name}
                            </div>
                        );
                    })()}
                    <div className={`border-b ${isCreative || isBold ? 'border-black print:border-black' : 'border-black print:border-black'} my-1`}></div>

                    {transaction.note && (
                        <>
                            <div className="mb-1 mt-1 text-[10px] font-bold italic py-0.5 text-center">
                                Note: {transaction.note}
                            </div>
                            <div className={`border-b ${isCreative || isBold ? 'border-black print:border-black' : 'border-black print:border-black'} mb-1`}></div>
                        </>
                    )}

                    {/* Items List - Condensed */}
                    <div className={`space-y-1 mb-2 ${isThermalCompact ? 'text-[9px]' : 'text-[10px]'}`}>
                        {items.map((item, idx) => (
                            <div key={idx} className="flex gap-2 leading-tight">
                                <div className="flex-1 pr-1">
                                    <div className="font-bold">{item.name}</div>
                                    <div className="text-[9px] font-bold">
                                        {item.quantity} x {formatCurrency(item.price_at_sale)}
                                    </div>
                                </div>
                                <div className="font-bold flex-shrink-0">
                                    {formatCurrency(item.price_at_sale * item.quantity)}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={`border-b ${isCreative ? 'border-black print:border-black' : 'border-black border-dashed print:border-black print:border-dashed'} my-1`}></div>

                    {/* Totals Section - Condensed No Labels */}
                    <div className={`space-y-0.5 text-right mb-2 text-[10px] font-bold ${(isModern || isElegant || isBold) ? 'bg-gray-50 rounded-xl p-2 border border-gray-200 print:border-gray-300' : ''}`}>
                        {(transaction.discount ?? 0) > 0 ? (
                            <>
                                <div className="flex justify-end italic text-[9px]">
                                    <span>{formatCurrency(items.reduce((sum, item) => sum + (item.price_at_sale * item.quantity), 0))}</span>
                                </div>
                                <div className="flex justify-end text-[9px]">
                                    <span>-{formatCurrency(transaction.discount!)}</span>
                                </div>
                            </>
                        ) : null}
                        <div className="flex justify-end font-black border-t border-black/10 pt-0.5">
                            <span>{formatCurrency(transaction.total_amount)}</span>
                        </div>
                    </div>

                    {/* Payment Info Box - Borderless Condensed */}
                    <div className="text-left mb-2 text-[9px] font-bold leading-tight">
                        <div className="flex justify-between">
                            <span className="capitalize">{transaction.payment_method}</span>
                            <span>{formatCurrency(Number(transaction.total_amount))}</span>
                        </div>

                        {transaction.payment_method === 'split' && transaction.payment_details && (
                            <div className="space-y-0.5 ml-1 border-l border-black/20 pl-1 my-0.5">
                                {Number(transaction.payment_details.cashAmount || 0) > 0 && (
                                    <div className="flex justify-between">
                                        <span>Cash:</span>
                                        <span>{formatCurrency(Number(transaction.payment_details.cashAmount || 0))}</span>
                                    </div>
                                )}
                                {Number(transaction.payment_details.cardAmount || 0) > 0 && (
                                    <div className="flex justify-between">
                                        <span>Card:</span>
                                        <span>{formatCurrency(Number(transaction.payment_details.cardAmount || 0))}</span>
                                    </div>
                                )}
                                {Number(transaction.payment_details.creditAmount || 0) > 0 && (
                                    <div className="flex justify-between">
                                        <span>Credit:</span>
                                        <span>{formatCurrency(Number(transaction.payment_details.creditAmount || 0))}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {transaction.type !== 'return' && transaction.payment_details?.cashAmount && transaction.payment_method !== 'credit' && (() => {
                            const totalTendered = (Number(transaction.payment_details.cashAmount || 0) + Number(transaction.payment_details.cardAmount || 0) + Number(transaction.payment_details.creditAmount || 0));
                            const changeDue = totalTendered - Number(transaction.total_amount);
                            if (changeDue > 0) {
                                return (
                                    <div className="flex justify-between mt-0.5 pt-0.5 border-t border-black/10 font-black">
                                        <span>Change:</span>
                                        <span>{formatCurrency(changeDue)}</span>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>

                    {showBarcode && (
                        <div className="flex flex-col items-center gap-1 mb-2">
                            <div className="w-full h-8 bg-black print:bg-black" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}></div>
                            <div className="text-[9px] tracking-[0.2em] font-bold">#{transaction.transaction_id}</div>
                        </div>
                    )}

                    <div className="text-center font-bold">
                        <div className="text-[9px] mb-0.5">{footer || 'Thank you!'}</div>
                        {devFooterEnabled && (
                            <div className="text-[7px] opacity-60 uppercase tracking-tighter">{devFooter}</div>
                        )}
                    </div>

                    {/* Refund Notice Banner */}
                    {transaction.type === 'return' && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded text-center">
                            <p className="text-[10px] text-red-700 font-semibold">
                                This is a REFUND receipt.
                            </p>
                            {transaction.parent_sale_id && (
                                <p className="text-[9px] text-red-600 mt-1">
                                    Processed for Sale #{transaction.parent_sale_id}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Print & Digital Actions */}
                <div className="mt-4 flex flex-col gap-2 print:hidden pb-10">
                    <button
                        onClick={handlePrint}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded flex items-center justify-center space-x-2"
                    >
                        <Printer size={20} />
                        <span>{transaction.type === 'return' ? 'Print Return Receipt' : 'Print Receipt'}</span>
                    </button>

                    {/* WhatsApp Share Button - Controlled by Setting */}
                    {settings['enableWhatsAppShare'] !== false && (
                        <button
                            onClick={handleWhatsAppShare}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded flex items-center justify-center space-x-2"
                        >
                            <MessageCircle size={20} />
                            <span>Send via WhatsApp{customer?.phone ? ` (${customer.phone})` : ''}</span>
                        </button>
                    )}

                    {settings['enableDigitalReceipts'] && customer?.phone && (
                        <button
                            onClick={handleSendDigital}
                            disabled={sending}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                            {sending ? <Loader size={20} className="animate-spin" /> : <MessageSquare size={20} />}
                            <span>Send to API ({customer.phone})</span>
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                @media print {
                    @page {
                        size: ${receiptType === 'a4'
                    ? (a4Orientation === 'portrait' ? 'A4 portrait' : 'A4 landscape')
                    : (thermalWidth === '76mm' ? '76mm auto' : (thermalWidth === '58mm' ? '58mm auto' : '80mm auto'))
                };
                        margin: ${receiptType === 'a4' ? '10mm' : '2px'};
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </div >
    );
};
