import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Save, Loader, Printer, MessageSquare, FileText, Maximize2 } from 'lucide-react';
import { useToast } from '../../store/useToast';
import { useCurrency } from '../../hooks/useCurrency';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';

import { APP_CONFIG } from '../../config/appConfig';

export const ReceiptSettingsPage = () => {
    const { loadSettings, updateSetting, loading } = useSettingsStore();
    const { addToast } = useToast();
    const { currencySymbol } = useCurrency();
    const token = useAuthStore((state) => state.token);
    const [isSaving, setIsSaving] = useState(false);

    // Receipt Type & Size Settings
    const [receiptType, setReceiptType] = useState<'thermal' | 'a4'>('thermal');
    const [receiptTemplate, setReceiptTemplate] = useState('thermal-classic');
    const [thermalWidth, setThermalWidth] = useState<'58mm' | '80mm'>('80mm');
    const [a4Orientation, setA4Orientation] = useState<'portrait' | 'landscape'>('portrait');

    // Receipt Content Settings
    const [header, setHeader] = useState(APP_CONFIG.appName);
    const [address, setAddress] = useState(APP_CONFIG.company.address);
    const [phone, setPhone] = useState(APP_CONFIG.company.supportPhone);
    const [email, setEmail] = useState('');
    const [footer, setFooter] = useState('Developed by Tap Lanka POS 0705083388');
    const [logoUrl, setLogoUrl] = useState('');
    const [showTaxID, setShowTaxID] = useState(true);
    const [taxID, setTaxID] = useState('');
    const [showLogo, setShowLogo] = useState(false);
    const [showBarcode, setShowBarcode] = useState(false);

    // Digital Receipt Settings State
    const [enableDigitalReceipts, setEnableDigitalReceipts] = useState(false);
    const [enableWhatsAppShare, setEnableWhatsAppShare] = useState(true); // WhatsApp share button
    const [whatsappApiUrl, setWhatsappApiUrl] = useState('');
    const [whatsappApiKey, setWhatsappApiKey] = useState('');

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Fetch settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            if (!token) return;
            const response = await fetch(getApiUrl('/settings'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            const settings = response.ok ? await response.json() : [];
            const settingsMap = (settings || []).reduce((acc: Record<string, any>, curr: any) => ({
                ...acc,
                [curr.key]: curr.value
            }), {} as Record<string, any>);

            // Receipt Type & Size
            if (settingsMap['receiptType']) setReceiptType(settingsMap['receiptType']);
            if (settingsMap['receiptTemplate']) setReceiptTemplate(settingsMap['receiptTemplate']);
            if (settingsMap['thermalWidth']) setThermalWidth(settingsMap['thermalWidth']);
            if (settingsMap['a4Orientation']) setA4Orientation(settingsMap['a4Orientation']);

            // Content
            if (settingsMap['receiptHeader']) setHeader(settingsMap['receiptHeader']);
            if (settingsMap['receiptAddress']) setAddress(settingsMap['receiptAddress']);
            if (settingsMap['receiptPhone']) setPhone(settingsMap['receiptPhone']);
            if (settingsMap['receiptEmail']) setEmail(settingsMap['receiptEmail']);
            if (settingsMap['receiptFooter']) setFooter(settingsMap['receiptFooter']);
            if (settingsMap['receiptLogo']) setLogoUrl(settingsMap['receiptLogo']);
            if (settingsMap['showTaxID'] !== undefined) setShowTaxID(settingsMap['showTaxID']);
            if (settingsMap['taxID']) setTaxID(settingsMap['taxID']);
            if (settingsMap['showLogo'] !== undefined) setShowLogo(settingsMap['showLogo']);
            if (settingsMap['showBarcode'] !== undefined) setShowBarcode(settingsMap['showBarcode']);

            // Digital
            if (settingsMap['enableDigitalReceipts'] !== undefined) setEnableDigitalReceipts(settingsMap['enableDigitalReceipts']);
            if (settingsMap['enableWhatsAppShare'] !== undefined) setEnableWhatsAppShare(settingsMap['enableWhatsAppShare']);
            if (settingsMap['whatsappApiUrl']) setWhatsappApiUrl(settingsMap['whatsappApiUrl']);
            if (settingsMap['whatsappApiKey']) setWhatsappApiKey(settingsMap['whatsappApiKey']);
        };
        fetchSettings();
    }, [token]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Type & Size
            await updateSetting('receiptType', receiptType);
            await updateSetting('receiptTemplate', receiptTemplate);
            await updateSetting('thermalWidth', thermalWidth);
            await updateSetting('a4Orientation', a4Orientation);

            // Content
            await updateSetting('receiptHeader', header);
            await updateSetting('receiptAddress', address);
            await updateSetting('receiptPhone', phone);
            await updateSetting('receiptEmail', email);
            await updateSetting('receiptFooter', footer);
            await updateSetting('receiptLogo', logoUrl);
            await updateSetting('showTaxID', showTaxID);
            await updateSetting('taxID', taxID);
            await updateSetting('showLogo', showLogo);
            await updateSetting('showBarcode', showBarcode);

            // Digital
            await updateSetting('enableDigitalReceipts', enableDigitalReceipts);
            await updateSetting('enableWhatsAppShare', enableWhatsAppShare);
            await updateSetting('whatsappApiUrl', whatsappApiUrl);
            await updateSetting('whatsappApiKey', whatsappApiKey);

            addToast('Receipt settings saved successfully!', 'success');
        } catch (error) {
            console.error(error);
            addToast('Failed to save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const [activeTab, setActiveTab] = useState<'layout' | 'business' | 'appearance' | 'digital'>('layout');

    const tabs = [
        { id: 'layout', label: 'Layout & Size', icon: <Maximize2 size={18} /> },
        { id: 'business', label: 'Business Info', icon: <Printer size={18} /> },
        { id: 'appearance', label: 'Receipt Options', icon: <FileText size={18} /> },
        { id: 'digital', label: 'Digital & WhatsApp', icon: <MessageSquare size={18} /> },
    ] as const;

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center h-full min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader className="animate-spin text-blue-600" size={40} />
                    <p className="text-gray-500 font-medium animate-pulse">Initializing Receipt Settings...</p>
                </div>
            </div>
        );
    }

    const previewWidth = receiptType === 'thermal'
        ? (thermalWidth === '58mm' ? 'w-64' : 'w-80')
        : (a4Orientation === 'portrait' ? 'w-96' : 'w-[500px]');

    const thermalTemplates = [
        { value: 'thermal-classic', label: 'Thermal Classic' },
        { value: 'thermal-compact', label: 'Thermal Compact' }
    ];

    const a4Templates = [
        { value: 'a4-classic', label: 'A4 Classic' },
        { value: 'a4-modern', label: 'A4 Modern' },
        { value: 'a4-creative', label: 'A4 Creative' },
        { value: 'a4-elegant', label: 'A4 Elegant' },
        { value: 'a4-bold', label: 'A4 Bold' }
    ];

    const availableTemplates = receiptType === 'thermal' ? thermalTemplates : a4Templates;
    const isModern = receiptTemplate === 'a4-modern';
    const isCreative = receiptTemplate === 'a4-creative';
    const isElegant = receiptTemplate === 'a4-elegant';
    const isBold = receiptTemplate === 'a4-bold';
    const isThermalCompact = receiptTemplate === 'thermal-compact';


    useEffect(() => {
        const valid = availableTemplates.some((t) => t.value === receiptTemplate);
        if (!valid) {
            setReceiptTemplate(availableTemplates[0].value);
        }
    }, [receiptType, availableTemplates, receiptTemplate]);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-950">
            {/* STICKY HEADER */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-shrink-0 justify-between items-center z-20">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Printer className="text-blue-600" size={28} />
                        Receipt Configuration
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 active:scale-95 text-sm"
                    >
                        {isSaving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* SIDEBAR NAVIGATION */}
                <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0 flex flex-col p-4 space-y-2 overflow-y-auto">
                    <div className="px-3 mb-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Configuration</p>
                    </div>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            <span className={activeTab === tab.id ? 'text-white' : 'text-gray-400'}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 max-w-6xl mx-auto pb-24">

                        {/* FORM COLUMN */}
                        <div className="space-y-8">
                            {activeTab === 'layout' && (
                                <section className="space-y-6 animate-fadeIn">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Layout & Size</h2>
                                        <p className="text-gray-500 dark:text-gray-400">Choose your printer type and paper dimensions</p>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Printer Type</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setReceiptType('thermal')}
                                                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${receiptType === 'thermal'
                                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                                        : 'border-gray-100 dark:border-gray-700 hover:border-blue-400 text-gray-400'
                                                        }`}
                                                >
                                                    <Printer size={32} />
                                                    <div className="text-center">
                                                        <div className="font-bold text-gray-900 dark:text-white">Thermal</div>
                                                        <div className="text-xs">POS Printer</div>
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setReceiptType('a4')}
                                                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${receiptType === 'a4'
                                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                                        : 'border-gray-100 dark:border-gray-700 hover:border-blue-400 text-gray-400'
                                                        }`}
                                                >
                                                    <FileText size={32} />
                                                    <div className="text-center">
                                                        <div className="font-bold text-gray-900 dark:text-white">A4 Paper</div>
                                                        <div className="text-xs">Standard Printer</div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {receiptType === 'thermal' && (
                                            <div className="space-y-2 animate-fadeIn">
                                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Paper Width</label>
                                                <select
                                                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                                    value={thermalWidth}
                                                    onChange={(e) => setThermalWidth(e.target.value as '58mm' | '80mm')}
                                                >
                                                    <option value="58mm">58mm (Narrow / Compact)</option>
                                                    <option value="80mm">80mm (Standard POS)</option>
                                                </select>
                                            </div>
                                        )}

                                        {receiptType === 'a4' && (
                                            <div className="space-y-2 animate-fadeIn">
                                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Orientation</label>
                                                <select
                                                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                                    value={a4Orientation}
                                                    onChange={(e) => setA4Orientation(e.target.value as 'portrait' | 'landscape')}
                                                >
                                                    <option value="portrait">Portrait (Vertical)</option>
                                                    <option value="landscape">Landscape (Horizontal)</option>
                                                </select>
                                            </div>
                                        )}

                                        <div className="space-y-2 animate-fadeIn">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Template Style</label>
                                            <select
                                                className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                                value={receiptTemplate}
                                                onChange={(e) => setReceiptTemplate(e.target.value)}
                                            >
                                                {availableTemplates.map((tpl) => (
                                                    <option key={tpl.value} value={tpl.value}>{tpl.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'business' && (
                                <section className="space-y-6 animate-fadeIn">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Business Information</h2>
                                        <p className="text-gray-500 dark:text-gray-400">Details that will appear at the top of every receipt</p>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Business Name / Header</label>
                                            <input
                                                type="text"
                                                className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                                value={header}
                                                onChange={(e) => setHeader(e.target.value)}
                                                placeholder="TapLanka POS"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Address</label>
                                            <input
                                                type="text"
                                                className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="123 Main Street, City"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Phone</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="+94..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email</label>
                                                <input
                                                    type="email"
                                                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="info@business.com"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'appearance' && (
                                <section className="space-y-6 animate-fadeIn">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Receipt Options</h2>
                                        <p className="text-gray-500 dark:text-gray-400">Customize visual elements and additional info</p>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                                <span className="font-bold text-sm text-gray-700 dark:text-gray-300">Show Logo</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                                <span className="font-bold text-sm text-gray-700 dark:text-gray-300">Show Barcode</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={showBarcode} onChange={(e) => setShowBarcode(e.target.checked)} className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800 md:col-span-2">
                                                <span className="font-bold text-sm text-gray-700 dark:text-gray-300">Show Tax/VAT ID</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={showTaxID} onChange={(e) => setShowTaxID(e.target.checked)} className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                                </label>
                                            </div>
                                        </div>

                                        {showLogo && (
                                            <div className="space-y-2 animate-fadeIn">
                                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Logo Image (URL or Base64)</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                                    value={logoUrl}
                                                    onChange={(e) => setLogoUrl(e.target.value)}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        )}

                                        {showTaxID && (
                                            <div className="space-y-2 animate-fadeIn">
                                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Tax ID / VAT Number</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                                    value={taxID}
                                                    onChange={(e) => setTaxID(e.target.value)}
                                                    placeholder="VAT123..."
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Footer Message</label>
                                            <textarea
                                                rows={3}
                                                className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all resize-none"
                                                value={footer}
                                                onChange={(e) => setFooter(e.target.value)}
                                                placeholder="Developed by Tap Lanka POS 0705083388"
                                            />
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'digital' && (
                                <section className="space-y-6 animate-fadeIn">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Digital & WhatsApp</h2>
                                        <p className="text-gray-500 dark:text-gray-400">Setup how receipts are shared electronically</p>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-900/30">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">Enable WhatsApp Share Button</p>
                                                    <p className="text-xs text-gray-500">Show "Send via WhatsApp" in receipt modal</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={enableWhatsAppShare}
                                                        onChange={(e) => setEnableWhatsAppShare(e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-gray-800 dark:text-white">Digital Receipt API (PRO)</h3>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={enableDigitalReceipts} onChange={(e) => setEnableDigitalReceipts(e.target.checked)} className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                                </label>
                                            </div>

                                            {enableDigitalReceipts && (
                                                <div className="space-y-4 animate-fadeIn">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-gray-400">API Endpoint</label>
                                                        <input
                                                            type="text"
                                                            className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl border-2 border-transparent focus:border-green-500 outline-none transition-all"
                                                            value={whatsappApiUrl}
                                                            onChange={(e) => setWhatsappApiUrl(e.target.value)}
                                                            placeholder="https://api..."
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-gray-400">API Key</label>
                                                        <input
                                                            type="password"
                                                            className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl border-2 border-transparent focus:border-green-500 outline-none transition-all"
                                                            value={whatsappApiKey}
                                                            onChange={(e) => setWhatsappApiKey(e.target.value)}
                                                            placeholder="••••••••••••"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* PREVIEW COLUMN (Sticky) */}
                        <div className="hidden xl:block receipt-preview-wrapper">
                            <div className="sticky top-0 pt-2 space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Live Preview</h3>
                                    <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                        {receiptType === 'thermal' ? `Thermal ${thermalWidth}` : `A4 ${a4Orientation}`}
                                    </span>
                                </div>

                                <div className="bg-gray-200/50 dark:bg-gray-900/50 rounded-3xl p-8 flex justify-center border-2 border-dashed border-gray-300 dark:border-gray-800">
                                    <div
                                        id="receipt-preview-sample"
                                        className={`bg-white text-black p-8 shadow-2xl ${previewWidth} min-h-[500px] transition-all duration-300 ${isModern || isElegant || isBold ? 'font-sans' : 'font-mono'} ${isThermalCompact ? 'text-[10px]' : 'text-[11px]'} leading-relaxed scale-90 origin-top ${isCreative ? 'border-2 border-black' : ''} ${isElegant ? 'border border-gray-200 rounded-2xl' : ''} ${isBold ? 'border-2 border-black rounded-xl' : ''}`}
                                    >
                                        {(isModern || isBold) && (
                                            <div className="bg-blue-600 text-white rounded-xl p-4 mb-6 flex items-center justify-between">
                                                <div>
                                                    <div className="text-lg font-bold">{header || 'TAPLANKA POS'}</div>
                                                    <div className="text-[10px] opacity-90">{address || '123 Main Street, Colombo'}</div>
                                                </div>
                                                {showLogo && (
                                                    logoUrl ? (
                                                        <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain bg-white rounded" />
                                                    ) : (
                                                        <div className="h-12 w-12 bg-white/20 rounded flex items-center justify-center text-[9px]">LOGO</div>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {isElegant && (
                                            <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-2xl p-5 mb-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-lg font-bold tracking-wide">{header || 'TAPLANKA POS'}</div>
                                                        <div className="text-[10px] opacity-80">{address || '123 Main Street, Colombo'}</div>
                                                        {phone && <div className="text-[10px] opacity-80">Tel: {phone}</div>}
                                                    </div>
                                                    {showLogo && (
                                                        logoUrl ? (
                                                            <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain bg-white rounded" />
                                                        ) : (
                                                            <div className="h-12 w-12 bg-white/20 rounded flex items-center justify-center text-[9px]">LOGO</div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {!(isModern || isElegant || isBold) && showLogo && (
                                            <div className="flex justify-center mb-6">
                                                {logoUrl ? (
                                                    <img src={logoUrl} alt="Logo" className="max-h-20 object-contain" />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-full border-2 border-dashed border-gray-300">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Logo</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {!(isModern || isElegant || isBold) && (
                                            <div className="text-center font-bold text-sm mb-1 uppercase tracking-tighter">{header || 'TAPLANKA POS'}</div>
                                        )}
                                        {!(isModern || isElegant || isBold) && (
                                            <div className="text-center space-y-0.5 opacity-80 mb-6">
                                                <div className="break-words">{address || '123 Main Street, Colombo'}</div>
                                                {phone && <div>Tel: {phone}</div>}
                                                {email && <div>{email}</div>}
                                                {showTaxID && taxID && <div className="mt-1 font-bold">VAT: {taxID}</div>}
                                            </div>
                                        )}

                                        <div className={`border-b-2 ${isCreative || isBold ? 'border-black' : 'border-black border-dashed'} mb-4`}></div>

                                        <div className="grid grid-cols-2 gap-2 mb-4 opacity-80">
                                            <div>Date: {new Date().toLocaleDateString()}</div>
                                            <div className="text-right">Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div>Receipt: #R-123456</div>
                                            <div className="text-right font-bold">Cashier: Admin</div>
                                        </div>

                                        <div className={`border-b ${isCreative || isBold ? 'border-black' : 'border-black'} mb-4`}></div>

                                        <div className={`space-y-3 mb-6 ${isThermalCompact ? 'text-[10px]' : ''}`}>
                                            <div className="flex justify-between">
                                                <div className="flex-1">
                                                    <div className="font-bold">Organic Coffee Beans - 500g</div>
                                                    <div className="opacity-70">2 x {currencySymbol}15.50</div>
                                                </div>
                                                <div className="font-bold">{currencySymbol}31.00</div>
                                            </div>
                                            <div className="flex justify-between">
                                                <div className="flex-1">
                                                    <div className="font-bold">Fresh Milk - 1L</div>
                                                    <div className="opacity-70">1 x {currencySymbol}4.25</div>
                                                </div>
                                                <div className="font-bold">{currencySymbol}4.25</div>
                                            </div>
                                        </div>

                                        <div className={`border-b-2 ${isCreative ? 'border-black' : 'border-black border-dashed'} mb-4`}></div>

                                        <div className={`space-y-1.5 text-right mb-6 ${(isModern || isElegant || isBold) ? 'bg-gray-50 rounded-xl p-4 border border-gray-200' : ''}`}>
                                            <div className="flex justify-between opacity-80">
                                                <span>Subtotal</span>
                                                <span>{currencySymbol}35.25</span>
                                            </div>
                                            <div className="flex justify-between opacity-80">
                                                <span>Sales Tax (8%)</span>
                                                <span>{currencySymbol}2.82</span>
                                            </div>
                                            <div className="flex justify-between text-base font-black pt-1 border-t border-black/10">
                                                <span>TOTAL</span>
                                                <span>{currencySymbol}38.07</span>
                                            </div>
                                        </div>

                                        <div className={`p-3 text-center rounded-lg border ${isBold ? 'border-black bg-white' : 'border-black/5 bg-gray-50'} opacity-80 mb-6 text-[10px]`}>
                                            <div className="font-bold">Payment Method: CASH</div>
                                            <div>Paid: {currencySymbol}40.00 | Change: {currencySymbol}1.93</div>
                                        </div>

                                        {showBarcode && (
                                            <div className="flex flex-col items-center gap-1 mb-6">
                                                <div className="w-full h-8 bg-black"></div>
                                                <div className="text-[9px] tracking-[0.2em]">123456789012</div>
                                            </div>
                                        )}

                                        <div className="text-center space-y-1 mt-auto">
                                            <div className="font-bold italic">{footer || 'Developed by Tap Lanka POS 0705083388'}</div>
                                            <div className="text-[9px] opacity-50 uppercase tracking-widest">Powered by {APP_CONFIG.appName} - {APP_CONFIG.company.supportPhone}</div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
