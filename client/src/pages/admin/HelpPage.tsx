import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ShoppingCart, Package, Truck, Settings, FileText, Monitor } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

import { APP_CONFIG } from '../../config/appConfig';

const Section = ({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-4 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon className="text-blue-600 dark:text-blue-400" size={24} />
                    <span className="font-semibold text-lg text-gray-800 dark:text-gray-200">{title}</span>
                </div>
                {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
            {isOpen && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 space-y-4">
                    {children}
                </div>
            )}
        </div>
    );
};

export const HelpPage = () => {
    const { currencySymbol } = useCurrency();
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Help & Documentation</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Guide to using the {APP_CONFIG.appName} features and modules.</p>

            <Section title="POS Terminal & Sales" icon={ShoppingCart} defaultOpen={true}>
                <h3 className="font-bold text-gray-900 dark:text-white mt-2">Processing a Sale</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Scan a barcode or click a product to add it to the cart.</li>
                    <li>Adjust quantity using the <b>+</b> and <b>-</b> buttons in the cart.</li>
                    <li>Click <b>Pay Now</b> to finalize the transaction.</li>
                </ul>

                <h3 className="font-bold text-gray-900 dark:text-white mt-4">Advanced Cart Actions</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li><b>Hold Sale (Pause Icon)</b>: Temporarily save the current cart to serve another customer. Retrieve it later via the "Recall" button.</li>
                    <li><b>Discount (Tag Icon)</b>: Apply a manual discount (fixed amount or percentage) to the entire bill.</li>
                    <li><b>Split Payment (Calculator Icon)</b>: Pay with multiple methods (e.g., {currencySymbol}50 Cash and remaining on Card).</li>
                    <li><b>Price Override</b>: Click on an item's price in the cart to manually change it for this specific sale.</li>
                </ul>

                <h3 className="font-bold text-gray-900 dark:text-white mt-4">Returns & Refunds</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Go to the <b>Transactions</b> page or click "Returns" in POS.</li>
                    <li>Find the original transaction and select items to return.</li>
                    <li>Stock is automatically added back to inventory.</li>
                </ul>
            </Section>

            <Section title="Inventory Management" icon={Package}>
                <h3 className="font-bold text-gray-900 dark:text-white mt-2">Managing Products</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Go to <b>Inventory</b> to view all products.</li>
                    <li>Click <b>Add Product</b> to create a new item with SKU, Name, Price, and Category.</li>
                    <li><b>Edit/Delete</b> products using the buttons on the product card.</li>
                </ul>

                <h3 className="font-bold text-gray-900 dark:text-white mt-4">Stock Control</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Go to <b>Stock History</b> (Purchase History) to add stock.</li>
                    <li>Click <b>New Purchase</b> and select the product and supplier.</li>
                    <li>Stock levels update automatically with purchases and sales.</li>
                </ul>

                <h3 className="font-bold text-gray-900 dark:text-white mt-4">Categories</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Manage product categories to organize your inventory.</li>
                    <li>Products can be filtered by category in the POS view.</li>
                </ul>
            </Section>

            <Section title="Purchasing & Suppliers" icon={Truck}>
                <h3 className="font-bold text-gray-900 dark:text-white mt-2">Supplier Management</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Navigate to <b>Suppliers</b> in the admin menu.</li>
                    <li>Add new suppliers with contact details (Phone, Email, Address).</li>
                    <li>Link stock purchases to these suppliers for better tracking.</li>
                </ul>

                <h3 className="font-bold text-gray-900 dark:text-white mt-4">Purchase History</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Go to <b>Stock History</b> to view grouped purchase bills.</li>
                    <li>Click a bill to see all items purchased in that order.</li>
                    <li>Includes supplier, payment status, and totals.</li>
                </ul>
            </Section>

            <Section title="Receipts & Configuration" icon={Settings}>
                <h3 className="font-bold text-gray-900 dark:text-white mt-2">Currency</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Go to <b>Settings → Currency</b>.</li>
                    <li>Set the symbol and code used across the system.</li>
                </ul>

                <h3 className="font-bold text-gray-900 dark:text-white mt-4">Branding</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Go to <b>Settings → Branding</b>.</li>
                    <li>Upload your logo and set company name/address/contacts.</li>
                    <li>Branding appears in POS header and receipts.</li>
                </ul>

                <h3 className="font-bold text-gray-900 dark:text-white mt-2">Tax Settings</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Go to <b>Settings</b> to configure the global tax rate.</li>
                    <li>Enter the percentage (e.g., 10%) and save.</li>
                    <li>This rate applies to the subtotal of all sales.</li>
                </ul>

                <h3 className="font-bold text-gray-900 dark:text-white mt-4">Receipt Customization</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Go to <b>Receipts</b> to edit the print layout.</li>
                    <li>Customize the <b>Header</b> (Store Name) and <b>Footer</b> message.</li>
                    <li>Show or hide the <b>Logo</b> and <b>Tax ID</b>.</li>
                </ul>

                <h3 className="font-bold text-gray-900 dark:text-white mt-4">Digital Receipts</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Enable **Digital Receipts** in the Receipts menu.</li>
                    <li>Configure your WhatsApp/SMS API provider details.</li>
                    <li>Sends an automated receipt to registered customers after checkout.</li>
                </ul>
            </Section>

            <Section title="Reports & Reporting" icon={FileText}>
                <h3 className="font-bold text-gray-900 dark:text-white mt-2">Centralized Reports</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Go to <b>Reports</b> to access sales, low stock, low profit, supplier and customer reports.</li>
                    <li>Use daily/weekly/monthly/custom filters for sales.</li>
                    <li>Each report can be exported to CSV.</li>
                </ul>

                <h3 className="font-bold text-gray-900 dark:text-white mt-2">Transaction History</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>View all past sales in the <b>Transactions</b> page.</li>
                    <li>Click on a transaction to view details or reprint a receipt.</li>
                    <li>Process returns from this view.</li>
                </ul>
            </Section>

            <Section title="System Information" icon={Monitor}>
                <div className="text-sm">
                    <p><b>Version</b>: {APP_CONFIG.appVersion}</p>
                    <p><b>Database</b>: IndexedDB (Client-side)</p>
                    <p><b>Tech Stack</b>: React, TypeScript, Tailwind CSS, Dexie.js</p>
                </div>
            </Section>
        </div>
    );
};
