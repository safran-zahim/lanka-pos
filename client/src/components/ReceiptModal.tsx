import { useEffect, useState } from 'react';
import { Printer, Check, X, MessageSquare, Loader, MessageCircle } from 'lucide-react';
import type { Transaction, TransactionItem, Customer, User } from '../db/db';
import { db } from '../db/db';
import { useDigitalReceipt } from '../hooks/useDigitalReceipt';
import { useCurrency } from '../hooks/useCurrency';
import { useLocale } from '../hooks/useLocale';

import { APP_CONFIG } from '../config/appConfig';

interface ReceiptModalProps {
    transaction: Transaction;
    items: (TransactionItem & { name: string })[];
    customer?: Customer | null;
    user?: User | null;
    onClose: () => void;
}

export const ReceiptModal = ({ transaction, items, customer, user, onClose }: ReceiptModalProps) => {
    const { sendReceipt, sending } = useDigitalReceipt();
    const { currencySymbol, formatCurrency } = useCurrency();
    const { formatDateTime } = useLocale();
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [settingsError, setSettingsError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const allSettings = await db.settings.toArray();
                const settingsMap = allSettings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, any>);
                setSettings(settingsMap);
            } catch (error) {
                console.error('Failed to load receipt settings', error);
                setSettingsError('Failed to load receipt settings. Using defaults.');
            } finally {
                setLoadingSettings(false);
            }
        };
        fetchSettings();
    }, []);

    const handlePrint = () => {
        window.print();
    };

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
        const subtotal = items.reduce((sum, item) => sum + (item.price_at_sale * item.quantity), 0);
        const taxAmount = taxEnabled ? (subtotal * taxRate) : 0;
        const total = transaction.total_amount;
        const taxPercent = (taxRate * 100).toFixed(2).replace(/\.00$/, '');

        const divider = '────────────────────';
        const lines = [
            `🧾 ${header}`,
            address,
            phone ? `Tel: ${phone}` : null,
            email ? `Email: ${email}` : null,
            divider,
            `Invoice: #${transaction.transaction_id}`,
            `Date: ${formatDateTime(new Date(transaction.timestamp))}`,
            customer?.name ? `Customer: ${customer.name}` : null,
            divider,
            'Items',
            ...items.flatMap((item) => {
                const amount = formatCurrency(item.price_at_sale * item.quantity);
                const base = `• ${item.quantity} × ${item.name}  (${amount})`;
                return item.note ? [base, `  note: ${item.note}`] : [base];
            }),
            divider,
            'Summary',
            `Subtotal: ${formatCurrency(subtotal)}`,
            ...(taxEnabled ? [`Tax (${taxPercent}%): ${formatCurrency(taxAmount)}`] : []),
            `Total: ${formatCurrency(total)}`,
            `Payment: ${transaction.payment_method.toUpperCase()}`,
            divider,
            footer || 'Developed by Tap Lanka POS 0705083388',
            divider,
            `Powered by ${APP_CONFIG.appName} - ${APP_CONFIG.company.supportPhone}`
        ].filter(Boolean);

        const receiptText = lines.join('\n');

        // Clean phone number
        const phoneNumber = customer?.phone?.replace(/[^0-9]/g, '') || '';

        // Use WhatsApp API format (like the example)
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
    const header = settings['companyName'] || settings['receiptHeader'] || APP_CONFIG.appName;
    const address = settings['companyAddress'] || settings['receiptAddress'] || APP_CONFIG.company.address;
    const phone = settings['companyPhone'] || settings['receiptPhone'] || APP_CONFIG.company.supportPhone;
    const email = settings['companyEmail'] || settings['receiptEmail'] || '';
    const footer = settings['receiptFooter'] || 'Developed by Tap Lanka POS 0705083388';
    const logoUrl = settings['companyLogo'] || settings['receiptLogo'] || '';
    const showLogo = Boolean(logoUrl) || settings['showLogo'] || false;
    const showTaxID = settings['showTaxID'] || false;
    const taxID = settings['taxID'] || '';
    const showBarcode = settings['showBarcode'] || false;

    // Dynamic width based on receipt type
    const receiptWidth = receiptType === 'thermal'
        ? (thermalWidth === '58mm' ? 'w-64' : 'w-96')
        : (a4Orientation === 'portrait' ? 'w-[210mm]' : 'w-[297mm]');

    const receiptHeight = receiptType === 'a4'
        ? (a4Orientation === 'portrait' ? 'min-h-[297mm]' : 'min-h-[210mm]')
        : '';

    return (
        <div id="receipt-modal" className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] print:bg-white print:static print:h-auto print:w-auto">
            <div className={`bg-white text-black p-8 rounded-lg ${receiptWidth} ${receiptHeight} max-h-[90vh] overflow-y-auto print:w-full print:shadow-none print:p-0 print:max-h-none`}>

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
                <div className={`text-sm space-y-2 ${isModern || isElegant || isBold ? 'font-sans' : 'font-mono'} ${isThermalCompact ? 'text-xs' : ''} ${isCreative ? 'border-2 border-black p-5 rounded-lg' : ''} ${isElegant ? 'border border-gray-200 rounded-2xl p-5' : ''} ${isBold ? 'border-2 border-black rounded-xl p-5' : ''}`}>
                    {(isModern || isBold) ? (
                        <div className="bg-blue-600 text-white rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-bold">{header}</h1>
                                <p className="text-[11px] opacity-90">{address}</p>
                                {phone && <p className="text-[11px] opacity-90">Tel: {phone}</p>}
                                {email && <p className="text-[11px] opacity-90">Email: {email}</p>}
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
                                    <p className="text-[11px] opacity-90">{address}</p>
                                    {phone && <p className="text-[11px] opacity-90">Tel: {phone}</p>}
                                    {email && <p className="text-[11px] opacity-90">Email: {email}</p>}
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
                            {showTaxID && taxID && <p className="text-xs">VAT: {taxID}</p>}
                        </div>
                    )}

                    <div className={`border-b ${(isCreative || isBold) ? 'border-black' : 'border-dashed border-gray-400'} my-4`}></div>

                    <div className="text-left text-xs space-y-1">
                        <div className="flex justify-between">
                            <span>Date/Time: {formatDateTime(new Date(transaction.timestamp))}</span>
                        </div>
                        <div>Receipt #: {transaction.transaction_id}</div>
                        <div>Cashier: {user?.username}</div>
                        {customer && <div>Customer: {customer.name}</div>}
                    </div>

                    <div className="border-b border-dashed border-gray-400 my-4"></div>

                    <table className={`w-full text-left ${isThermalCompact ? 'text-[10px]' : 'text-xs'}`}>
                        <thead>
                            <tr className="border-b border-gray-300">
                                <th className="py-1">Item</th>
                                <th className="py-1 text-right">Qty</th>
                                <th className="py-1 text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-1">
                                        <div>{item.name}</div>
                                        {item.note && (
                                            <div className="text-[10px] text-gray-500">Note: {item.note}</div>
                                        )}
                                    </td>
                                    <td className="py-1 text-right">{item.quantity}</td>
                                    <td className="py-1 text-right">{formatCurrency(item.price_at_sale * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className={`border-b ${(isCreative || isBold) ? 'border-black' : 'border-dashed border-gray-400'} my-4`}></div>

                    <div className={`space-y-1 text-xs ${(isModern || isElegant || isBold) ? 'bg-gray-50 p-4 rounded-lg border border-gray-200' : ''}`}>
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{formatCurrency(transaction.total_amount - transaction.tax_amount + (transaction.round_off_discount || 0))}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax {taxEnabled ? `(${(taxRate * 100).toFixed(2)}%)` : '(Disabled)'}</span>
                            <span>{formatCurrency(transaction.tax_amount)}</span>
                        </div>
                        {transaction.round_off_discount && transaction.round_off_discount > 0 && (
                            <div className="flex justify-between text-green-700">
                                <span>Round off discount</span>
                                <span>-{currencySymbol}{transaction.round_off_discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-gray-300">
                            <span>TOTAL</span>
                            <span>{formatCurrency(transaction.total_amount)}</span>
                        </div>
                    </div>

                    <div className={`border-b ${(isCreative || isBold) ? 'border-black' : 'border-dashed border-gray-400'} my-4`}></div>

                    <div className="text-xs">
                        <div className="flex justify-between mb-1">
                            <span>Payment Method:</span>
                            <span className="capitalize">{transaction.payment_method}</span>
                        </div>
                        {transaction.payment_details?.cashAmount && (
                            <div className="flex justify-between">
                                <span>Cash Received:</span>
                                <span>{formatCurrency(transaction.payment_details.cashAmount)}</span>
                            </div>
                        )}
                        {transaction.payment_details?.cashAmount && transaction.payment_details.cashAmount > transaction.total_amount && (
                            <div className="flex justify-between">
                                <span>Change:</span>
                                <span>{formatCurrency(transaction.payment_details.cashAmount - transaction.total_amount)}</span>
                            </div>
                        )}
                    </div>

                    {showBarcode && (
                        <>
                            <div className={`border-b ${(isCreative || isBold) ? 'border-black' : 'border-dashed border-gray-400'} my-4`}></div>
                            <div className="flex justify-center my-3">
                                <div className="bg-gray-800 h-12 w-40 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold tracking-widest">|||||||||||</span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-600">#{String(transaction.transaction_id).padStart(8, '0')}</div>
                        </>
                    )}

                    <div className={`border-b ${(isCreative || isBold) ? 'border-black' : 'border-dashed border-gray-400'} my-4`}></div>

                    <p className="whitespace-pre-wrap text-xs">{footer}</p>

                    {receiptType === 'a4' && (
                        <div className="mt-8 text-xs text-gray-500">
                            <p>Powered by {APP_CONFIG.appName} - {APP_CONFIG.company.supportPhone}</p>
                            <p>{new Date().toLocaleString()}</p>
                        </div>
                    )}
                </div>

                {/* Print & Digital Actions */}
                <div className="mt-6 flex flex-col gap-2 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded flex items-center justify-center space-x-2"
                    >
                        <Printer size={20} />
                        <span>Print Receipt</span>
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
                    : (thermalWidth === '58mm' ? '58mm auto' : '80mm auto')
                };
                        margin: ${receiptType === 'a4' ? '10mm' : '0'};
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
};
