import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, RefreshCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'products' | 'customers' | 'suppliers';
    onSuccess?: () => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, type, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [preview, setPreview] = useState<any[]>([]);

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setStatus(null);

            // Preview
            const reader = new FileReader();
            reader.onload = (evt) => {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                setPreview(data.slice(0, 5)); // Preview first 5 rows
            };
            reader.readAsBinaryString(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setStatus(null);

        try {
            const data = await new Promise<any[]>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const bstr = evt.target?.result;
                        const wb = XLSX.read(bstr, { type: 'binary' });
                        const wsname = wb.SheetNames[0];
                        const ws = wb.Sheets[wsname];
                        const jsonData = XLSX.utils.sheet_to_json(ws);
                        resolve(jsonData);
                    } catch (e) {
                        reject(new Error('Failed to parse Excel file'));
                    }
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsBinaryString(file);
            });

            const normalizedData = data.map((row: any) => {
                const newRow: any = {};
                Object.keys(row).forEach(key => {
                    const normalizedKey = key.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '');

                    // Product Mapping
                    if (type === 'products') {
                        if (['name', 'productname', 'itemname', 'title'].includes(normalizedKey)) newRow.name = row[key];
                        else if (['sku', 'skucode', 'code', 'itemcode'].includes(normalizedKey)) newRow.skuCode = String(row[key]);
                        else if (['barcode', 'barcodenumber', 'barcodevalue'].includes(normalizedKey)) newRow.barcode = String(row[key]);
                        else if (['barcodetype', 'barcodeformat', 'codetype'].includes(normalizedKey)) newRow.barcodeType = String(row[key]);
                        else if (['category', 'categoryname', 'cat'].includes(normalizedKey)) newRow.category_id = row[key];
                        else if (['subcategory', 'subcat', 'subcategoryname'].includes(normalizedKey)) newRow.sub_category_id = row[key];
                        else if (['unit', 'unitname', 'uom'].includes(normalizedKey)) newRow.unit_id = row[key];
                        else if (['brand', 'brandname'].includes(normalizedKey)) newRow.brand_id = row[key];
                        else if (['description', 'productdescription', 'desc'].includes(normalizedKey)) newRow.description = row[key];
                        else if (['retailprice', 'sellingprice', 'price', 'retail'].includes(normalizedKey)) newRow.price = Number(row[key]);
                        else if (['costprice', 'buyprice', 'cost'].includes(normalizedKey)) newRow.costPrice = Number(row[key]);
                        else if (['qty', 'quantity', 'stock', 'initialstock'].includes(normalizedKey)) newRow.stock = Number(row[key]);
                        else if (['minstock', 'lowstock', 'alertqty', 'reorderlevel'].includes(normalizedKey)) newRow.minStock = Number(row[key]);
                    }
                    // Customer/Supplier Mapping
                    else {
                        if (['name', 'customername', 'suppliername', 'fullname'].includes(normalizedKey)) newRow.name = row[key];
                        else if (['phone', 'phonenumber', 'contact', 'mobile', 'tel'].includes(normalizedKey)) {
                            // Clean phone number: remove non-digits
                            newRow.phone = String(row[key]).replace(/\D/g, '');
                        }
                        else if (['email', 'emailaddress', 'mail'].includes(normalizedKey)) {
                            const val = String(row[key]).trim();
                            // Only set if it looks like an email, otherwise leave empty
                            if (val.includes('@') && val.includes('.')) newRow.email = val;
                            else newRow.email = '';
                        }
                        else if (['address', 'street', 'location'].includes(normalizedKey)) newRow.address = row[key];
                        else if (['loyaltypoints', 'points', 'balance'].includes(normalizedKey)) newRow.loyaltyPointsBalance = Number(row[key]);
                    }
                });

                // Fallbacks and defaults
                if (!newRow.name && row.name) newRow.name = row.name;
                if (type === 'products') {
                    if (!newRow.price) newRow.price = 0;
                    if (!newRow.stock) newRow.stock = 0;
                    if (!newRow.skuCode && row.sku) newRow.skuCode = String(row.sku);
                }
                return newRow;
            });

            const endpoint = type === 'products' ? '/bulk/products' : (type === 'customers' ? '/bulk/customers' : '/bulk/suppliers');
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(normalizedData)
            });

            const result = await response.json();

            if (!response.ok) {
                let errorMsg = 'Upload failed';
                if (Array.isArray(result.error)) {
                    errorMsg = result.error.map((err: any) => `${err.path.join('.')}: ${err.message}`).slice(0, 3).join(', ');
                    if (result.error.length > 3) errorMsg += ` (and ${result.error.length - 3} more errors)`;
                } else if (result.error) {
                    errorMsg = result.error;
                } else if (result.message) {
                    errorMsg = result.message;
                }
                throw new Error(errorMsg);
            }

            setStatus({ type: 'success', message: result.message || 'Import successful!' });
            if (onSuccess) onSuccess();
            setTimeout(onClose, 2000);
        } catch (error: any) {
            console.error('Import error:', error);
            setStatus({ type: 'error', message: error.message || 'An unexpected error occurred' });
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadSample = () => {
        const headers = type === 'products'
            ? ['Name', 'SKU', 'Barcode', 'BarcodeType', 'Category', 'SubCategory', 'Brand', 'Unit', 'RetailPrice', 'AlertQty', 'Description']
            : ['Name', 'Phone', 'Email', 'Address', 'City', 'LoyaltyPoints'];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        XLSX.utils.book_append_sheet(wb, ws, "Sample");

        // Standard approach to generate Excel file in browser
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${type}_sample.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-lg p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-border">
                    <div className="flex justify-between items-center">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                            <Upload size={24} className="text-primary" />
                            Bulk Import {type === 'products' ? 'Products' : 'Customers'}
                        </DialogTitle>
                        <Button onClick={onClose} variant="ghost" size="sm">
                            <X size={24} />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Removed top-right sample button to align in footer */}

                    {/* File Drop / Select */}
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center bg-muted/50 hover:bg-accent hover:text-accent-foreground transition-colors">
                        <FileSpreadsheet className="mx-auto text-green-600 mb-4" size={48} />
                        <label className="cursor-pointer">
                            <span className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Select Excel/CSV File</span>
                            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
                        </label>
                        <p className="mt-2 text-sm text-gray-500">{file ? file.name : 'Supported formats: .xlsx, .csv'}</p>
                    </div>

                    {status && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <p className="text-sm font-medium">{status.message}</p>
                        </div>
                    )}

                    {preview.length > 0 && (
                        <div className="bg-muted rounded-lg p-4">
                            <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Preview (First 5 rows)</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead>
                                        <tr className="border-b dark:border-gray-700">
                                            {Object.keys(preview[0]).map(key => <th key={key} className="p-1">{key}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, i) => (
                                            <tr key={i} className="border-b dark:border-gray-700">
                                                {Object.values(row).map((val: any, j) => <td key={j} className="p-1">{String(val)}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border">
                        <Button
                            onClick={handleDownloadSample}
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary hover:text-primary/80 flex items-center gap-2 h-9"
                        >
                            <Download size={14} /> Download Sample Template
                        </Button>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <Button onClick={onClose} variant="ghost" size="sm" className="flex-1 sm:flex-none">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                variant="primary"
                                size="sm"
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <RefreshCcw size={16} className="animate-spin" />
                                ) : (
                                    <Upload size={16} />
                                )}
                                {uploading ? 'Importing...' : 'Start Import'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
