import { useEffect, useState } from 'react';
import { useCurrency } from '../hooks/useCurrency';
import { useLocale } from '../hooks/useLocale';
import { getApiUrl } from '../config/api';
import { useAuthStore } from '../store/useAuthStore';
import { APP_CONFIG } from '../config/appConfig';

interface RegisterSummaryReceiptProps {
    shiftData: any;
    countedCash: number;
    variance: number;
    closeNote: string;
    onClose: () => void;
}

export const RegisterSummaryReceipt = ({ shiftData, countedCash, variance, closeNote, onClose }: RegisterSummaryReceiptProps) => {
    const { formatCurrency } = useCurrency();
    const { formatDateTime } = useLocale();
    const token = useAuthStore((state) => state.token);
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [loadingSettings, setLoadingSettings] = useState(true);

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
            } finally {
                setLoadingSettings(false);
            }
        };
        fetchSettings();
    }, [token]);

    useEffect(() => {
        if (loadingSettings) return;

        // Timeout to allow DOM to render the receipt
        const timer = setTimeout(() => {
            window.print();
        }, 300);

        // Optional: listen for print close to auto-close the modal
        const handleAfterPrint = () => {
            // Re-enable app interaction
            onClose();
        };

        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [loadingSettings, onClose]);

    if (loadingSettings) return null;

    const header = settings['receipt.header'] || APP_CONFIG.company.name;
    const address = settings['receipt.address'] || APP_CONFIG.company.address;
    const phone = settings['receipt.phone'] || APP_CONFIG.company.supportPhone;

    return (
        <div id="receipt-modal" className="fixed inset-0 bg-white z-[200] flex justify-center text-black overflow-y-auto">
            <div className="w-[80mm] min-h-screen bg-white text-black p-4 text-[12px] font-mono leading-tight shadow-none border-none mx-auto relative">
                {/* Print action buttons visible only on screen, hidden via @media print in index.css */}
                <div className="absolute top-2 right-2 flex gap-2 print:hidden z-10">
                    <button onClick={() => window.print()} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300">
                        Print Again
                    </button>
                    <button onClick={onClose} className="bg-red-100 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-200">
                        Close
                    </button>
                </div>

                <div className="text-center mb-4">
                    <h1 className="text-xl font-bold mb-1">{header}</h1>
                    <div className="text-[10px] text-gray-600 whitespace-pre-wrap">{address}</div>
                    {phone && <div className="text-[10px] text-gray-600">Tel: {phone}</div>}
                </div>

                <div className="text-center font-bold text-sm border-y border-dashed border-gray-400 py-2 mb-4 uppercase">
                    Register Closure Shift Summary
                </div>

                <div className="mb-4 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Opened:</span>
                        <span>{formatDateTime(new Date(shiftData.startTime))}</span>
                    </div>
                    {shiftData.endTime && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Closed:</span>
                            <span>{formatDateTime(new Date(shiftData.endTime))}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-gray-600">Printed:</span>
                        <span>{formatDateTime(new Date())}</span>
                    </div>
                </div>

                <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-1">
                    <div className="flex justify-between font-bold">
                        <span>Starting Float:</span>
                        <span>{formatCurrency(shiftData.startingCash)}</span>
                    </div>
                </div>

                <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-1">
                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Sales & Cash In (+)</div>
                    <div className="flex justify-between pl-2">
                        <span>Cash Sales:</span>
                        <span>{formatCurrency(shiftData.totalCashSales)}</span>
                    </div>
                    <div className="flex justify-between pl-2">
                        <span>Customer Payments:</span>
                        <span>{formatCurrency(shiftData.totalCustomerPayments)}</span>
                    </div>
                </div>

                <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-1">
                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Non-Cash Sales (Info)</div>
                    <div className="flex justify-between pl-2 text-gray-600">
                        <span>Card Sales:</span>
                        <span>{formatCurrency(shiftData.totalCardSales || 0)}</span>
                    </div>
                    <div className="flex justify-between pl-2 text-gray-600">
                        <span>Credit Sales:</span>
                        <span>{formatCurrency(shiftData.totalCreditSales || 0)}</span>
                    </div>
                </div>

                <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-1">
                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Cash Out (-)</div>
                    <div className="flex justify-between pl-2">
                        <span>Cash Refunds:</span>
                        <span>{formatCurrency(shiftData.totalCashRefunds)}</span>
                    </div>
                    <div className="flex justify-between pl-2">
                        <span>Supplier Payments:</span>
                        <span>{formatCurrency(shiftData.totalSupplierPayments)}</span>
                    </div>
                    <div className="flex justify-between pl-2">
                        <span>General Expenses:</span>
                        <span>{formatCurrency(shiftData.totalExpenses)}</span>
                    </div>
                </div>

                <div className="border-b border-dashed border-gray-800 pb-2 mb-2 space-y-2 mt-4">
                    <div className="flex justify-between font-bold text-sm">
                        <span>Expected Drawer:</span>
                        <span>{formatCurrency(shiftData.liveExpectedCash)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm">
                        <span>Actual Counted:</span>
                        <span>{formatCurrency(countedCash)}</span>
                    </div>
                </div>

                <div className="mb-4">
                    <div className={`flex justify-between font-bold ${variance === 0 ? '' : 'text-[13px]'}`}>
                        <span>Variance:</span>
                        <span>
                            {variance === 0 ? 'Exact Match' :
                                (variance > 0 ? `+${formatCurrency(variance)} (Over)` : `-${formatCurrency(Math.abs(variance))} (Short)`)}
                        </span>
                    </div>
                    {closeNote && (
                        <div className="mt-2 text-[10px] text-gray-600 italic break-words">
                            Note: {closeNote}
                        </div>
                    )}
                </div>

                <div className="text-center text-[10px] text-gray-500 mt-8 mb-4">
                    <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
                        Powered by {APP_CONFIG.appName}
                    </div>
                </div>
            </div>
        </div>
    );
};
