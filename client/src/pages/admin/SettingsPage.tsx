import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Save, Loader, Percent, Tag, Scale, Gift, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '../../store/useToast';
import { BrandingPage } from './BrandingPage';

export const SettingsPage = () => {
    const { taxRate, taxEnabled, roundOffEnabled, roundOffDecimals, loyaltyEnabled, loyaltyEarnRate, loyaltyPointValue, toastEnabled, currencySymbol, currencyCode, locale, timeZone, loadSettings, updateSetting, loading, allowOverSelling, enableDailyRegister, enableCustomerCredit } = useSettingsStore();
    const { addToast } = useToast();
    const [rateInput, setRateInput] = useState('');
    const [taxEnabledInput, setTaxEnabledInput] = useState(false);
    const [roundOffEnabledInput, setRoundOffEnabledInput] = useState(false);
    const [roundOffDecimalsInput, setRoundOffDecimalsInput] = useState('2');
    const [loyaltyEnabledInput, setLoyaltyEnabledInput] = useState(true);
    const [loyaltyEarnRateInput, setLoyaltyEarnRateInput] = useState('0.1');
    const [loyaltyPointValueInput, setLoyaltyPointValueInput] = useState('0.10');
    const [toastEnabledInput, setToastEnabledInput] = useState(true); // Added toastEnabledInput
    const [currencySymbolInput, setCurrencySymbolInput] = useState('Rs.');
    const [currencyCodeInput, setCurrencyCodeInput] = useState('LKR');
    const [localeInput, setLocaleInput] = useState('en-US');
    const [timeZoneInput, setTimeZoneInput] = useState('UTC');
    const [allowOverSellingInput, setAllowOverSellingInput] = useState(false);
    const [enableDailyRegisterInput, setEnableDailyRegisterInput] = useState(false);
    const [enableCustomerCreditInput, setEnableCustomerCreditInput] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [brandingSaving, setBrandingSaving] = useState(false);
    const [brandingSaveAction, setBrandingSaveAction] = useState<null | (() => Promise<void>)>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'currency' | 'branding'>('general');

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    useEffect(() => {
        setRateInput((taxRate * 100).toString());
    }, [taxRate]);

    useEffect(() => {
        setTaxEnabledInput(taxEnabled);
    }, [taxEnabled]);

    useEffect(() => {
        setRoundOffEnabledInput(roundOffEnabled);
        setRoundOffDecimalsInput(roundOffDecimals.toString());
    }, [roundOffEnabled, roundOffDecimals]);

    useEffect(() => {
        setLoyaltyEnabledInput(loyaltyEnabled);
        setLoyaltyEarnRateInput(loyaltyEarnRate.toString());
        setLoyaltyPointValueInput(loyaltyPointValue.toFixed(2));
    }, [loyaltyEnabled, loyaltyEarnRate, loyaltyPointValue]);

    useEffect(() => {
        setToastEnabledInput(toastEnabled);
    }, [toastEnabled]);

    useEffect(() => {
        setAllowOverSellingInput(allowOverSelling);
        setEnableDailyRegisterInput(enableDailyRegister);
        setEnableCustomerCreditInput(enableCustomerCredit);
    }, [allowOverSelling, enableDailyRegister, enableCustomerCredit]);


    useEffect(() => {
        const systemLocale = typeof window !== 'undefined' && window.navigator?.language ? window.navigator.language : 'en-US';
        const systemTimeZone = typeof window !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : 'UTC';
        setCurrencySymbolInput(currencySymbol);
        setCurrencyCodeInput(currencyCode);
        setLocaleInput(locale || systemLocale);
        setTimeZoneInput(timeZone || systemTimeZone);
    }, [currencySymbol, currencyCode, locale, timeZone]);

    const handleSaveTax = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const decimalRate = parseFloat(rateInput) / 100;
            if (isNaN(decimalRate) || decimalRate < 0) {
                addToast('Please enter a valid tax percentage.', 'error');
                setIsSaving(false);
                return;
            }
            const decimals = parseInt(roundOffDecimalsInput);
            if (isNaN(decimals) || decimals < 0 || decimals > 4) {
                addToast('Round-off decimals must be between 0 and 4.', 'error');
                setIsSaving(false);
                return;
            }
            const earnRate = parseFloat(loyaltyEarnRateInput);
            const pointValue = parseFloat(loyaltyPointValueInput);
            if (isNaN(earnRate) || earnRate < 0) {
                addToast('Please enter a valid loyalty earn rate.', 'error');
                setIsSaving(false);
                return;
            }
            if (isNaN(pointValue) || pointValue < 0) {
                addToast('Please enter a valid loyalty point value.', 'error');
                setIsSaving(false);
                return;
            }

            await updateSetting('taxEnabled', taxEnabledInput);
            await updateSetting('taxRate', decimalRate);
            await updateSetting('roundOffEnabled', roundOffEnabledInput);
            await updateSetting('roundOffDecimals', decimals);
            await updateSetting('loyaltyEnabled', loyaltyEnabledInput);
            await updateSetting('loyaltyEarnRate', earnRate);
            await updateSetting('loyaltyPointValue', pointValue);
            await updateSetting('allowOverSelling', allowOverSellingInput);
            await updateSetting('enableDailyRegister', enableDailyRegisterInput);
            await updateSetting('enableCustomerCredit', enableCustomerCreditInput);
            await updateSetting('toastEnabled', toastEnabledInput); // Save toastEnabled
            await updateSetting('currencySymbol', currencySymbolInput.trim() || '$');
            await updateSetting('currencyCode', currencyCodeInput.trim().toUpperCase() || 'USD');
            await updateSetting('locale', localeInput.trim() || 'en-US');
            await updateSetting('timeZone', timeZoneInput.trim() || 'UTC');
            addToast('Settings saved successfully!', 'success');
        } catch (error) {
            console.error(error);
            addToast('Failed to save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveCurrency = async () => {
        setIsSaving(true);
        try {
            await updateSetting('currencySymbol', currencySymbolInput.trim() || '$');
            await updateSetting('currencyCode', currencyCodeInput.trim().toUpperCase() || 'USD');
            await updateSetting('locale', localeInput.trim() || 'en-US');
            await updateSetting('timeZone', timeZoneInput.trim() || 'UTC');
            addToast('Currency & localization saved!', 'success');
        } catch (error) {
            console.error(error);
            addToast('Failed to save currency settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBrandingSaveReady = React.useCallback((action: () => Promise<void>) => {
        setBrandingSaveAction(() => action);
    }, []);

    const getSaveConfig = () => {
        if (activeTab === 'general') {
            return { label: 'Save Settings', onClick: handleSaveTax, color: 'blue', disabled: isSaving };
        }
        if (activeTab === 'currency') {
            return { label: 'Save Changes', onClick: handleSaveCurrency, color: 'blue', disabled: isSaving };
        }
        if (activeTab === 'branding') {
            return {
                label: 'Save Branding',
                onClick: () => brandingSaveAction?.(),
                color: 'blue',
                disabled: brandingSaving || !brandingSaveAction
            };
        }
        return { label: 'Saved automatically', onClick: undefined, color: 'gray', disabled: true };
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center h-full">
                <Loader className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    const tabs = [
        { id: 'general', label: 'General & Tax', icon: <Percent size={18} /> },
        { id: 'currency', label: 'Currency', icon: <Tag size={18} /> },
        { id: 'branding', label: 'Branding', icon: <Tag size={18} /> },
    ] as const;

    const systemLocale = typeof window !== 'undefined' && window.navigator?.language ? window.navigator.language : 'en-US';
    const systemTimeZone = typeof window !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'UTC';

    const localeOptions = [
        systemLocale,
        'en-US',
        'en-GB',
        'fr-FR',
        'de-DE',
        'es-ES',
        'pt-BR',
        'hi-IN',
        'ta-IN',
        'si-LK',
        'ar-SA',
        'ja-JP',
        'zh-CN'
    ].filter((v, i, a) => a.indexOf(v) === i);

    const timeZoneOptions = [
        systemTimeZone,
        'UTC',
        'Asia/Colombo',
        'Asia/Kolkata',
        'Asia/Dubai',
        'Asia/Singapore',
        'Asia/Tokyo',
        'Europe/London',
        'Europe/Berlin',
        'America/New_York',
        'America/Chicago',
        'America/Los_Angeles',
        'Australia/Sydney'
    ].filter((v, i, a) => a.indexOf(v) === i);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-950">
            {/* STICKY HEADER */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-shrink-0 justify-between items-center z-20">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <SettingsIcon className="text-blue-600" size={28} />
                        System Settings
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    {(() => {
                        const config = getSaveConfig();
                        const isBusy = activeTab === 'branding' ? brandingSaving : isSaving;
                        const colorClass = config.color === 'gray'
                            ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20';
                        return (
                            <button
                                onClick={config.onClick}
                                disabled={config.disabled}
                                className={`flex items-center justify-center gap-2 px-6 py-2 text-white rounded-lg font-bold disabled:opacity-50 transition-all shadow-lg active:scale-95 text-sm ${colorClass}`}
                            >
                                {isBusy ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                                {isBusy ? 'Saving...' : config.label}
                            </button>
                        );
                    })()}
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
                    <div className="max-w-4xl mx-auto space-y-8 pb-20">
                        {activeTab === 'general' && (
                            <form onSubmit={handleSaveTax} className="space-y-8">
                                <div className="space-y-1 mb-6">
                                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">General & Tax</h2>
                                    <p className="text-gray-500 dark:text-gray-400">Manage your business tax rates and system preferences</p>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Notifications</h3>
                                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">Show toast messages</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Enable or disable pop-up notifications</p>
                                        </div>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={toastEnabledInput}
                                                onChange={(e) => setToastEnabledInput(e.target.checked)}
                                            />
                                            <div className={`w-11 h-6 rounded-full transition-colors ${toastEnabledInput ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${toastEnabledInput ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">Allow Over-Selling</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Allow selling products even when stock is zero</p>
                                        </div>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={allowOverSellingInput}
                                                onChange={(e) => setAllowOverSellingInput(e.target.checked)}
                                            />
                                            <div className={`w-11 h-6 rounded-full transition-colors ${allowOverSellingInput ? 'bg-orange-600' : 'bg-gray-300'}`}>
                                                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${allowOverSellingInput ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">Enable Daily Register</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Require cashiers to open a shift with a starting cash float before selling. Tracks all register cash movements.</p>
                                        </div>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={enableDailyRegisterInput}
                                                onChange={(e) => setEnableDailyRegisterInput(e.target.checked)}
                                            />
                                            <div className={`w-11 h-6 rounded-full transition-colors ${enableDailyRegisterInput ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${enableDailyRegisterInput ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">Enable Customer Credit</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Allow customers to purchase items on credit. Requires customer selection.</p>
                                        </div>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={enableCustomerCreditInput}
                                                onChange={(e) => setEnableCustomerCreditInput(e.target.checked)}
                                            />
                                            <div className={`w-11 h-6 rounded-full transition-colors ${enableCustomerCreditInput ? 'bg-amber-600' : 'bg-gray-300'}`}>
                                                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${enableCustomerCreditInput ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </div>
                                        </label>
                                    </div>
                                </div>


                                {/* TAX SECTION */}
                                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/50">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                                            <Percent size={20} />
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Tax Configuration</h3>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">Enable Sales Tax</p>
                                                <p className="text-sm text-gray-500">Apply standard tax to all invoices</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={taxEnabledInput} onChange={(e) => setTaxEnabledInput(e.target.checked)} className="sr-only peer" />
                                                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Default Tax Rate (%)</label>
                                                <div className="relative">
                                                    <input
                                                        type="number" step="0.01" min="0" max="100" disabled={!taxEnabledInput}
                                                        className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all disabled:opacity-50"
                                                        value={rateInput} onChange={(e) => setRateInput(e.target.value)} placeholder="0.00"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* ROUNDING SECTION */}
                                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/50">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg">
                                            <Scale size={20} />
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Precision & Rounding</h3>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">Enable Auto Rounding</p>
                                                <p className="text-sm text-gray-500">Round final totals automatically</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={roundOffEnabledInput} onChange={(e) => setRoundOffEnabledInput(e.target.checked)} className="sr-only peer" />
                                                <div className="w-12 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                            </label>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Rounding Precision</label>
                                            <select
                                                disabled={!roundOffEnabledInput}
                                                className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-xl border-2 border-transparent focus:border-purple-500 outline-none transition-all disabled:opacity-50"
                                                value={roundOffDecimalsInput} onChange={(e) => setRoundOffDecimalsInput(e.target.value)}
                                            >
                                                <option value="0">0 (No Decimals)</option>
                                                <option value="1">1 Decimal (0.0)</option>
                                                <option value="2">2 Decimals (0.00)</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                {/* LOYALTY SECTION */}
                                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/50">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-lg">
                                            <Gift size={20} />
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Loyalty Rewards</h3>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">Loyalty Program</p>
                                                <p className="text-sm text-gray-500">Allow customers to earn and spend points</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={loyaltyEnabledInput} onChange={(e) => setLoyaltyEnabledInput(e.target.checked)} className="sr-only peer" />
                                                <div className="w-12 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Earn Rate (Points per {currencySymbolInput}1)</label>
                                                <input
                                                    type="number" step="0.01" min="0" disabled={!loyaltyEnabledInput}
                                                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-xl border-2 border-transparent focus:border-green-500 outline-none transition-all disabled:opacity-50"
                                                    value={loyaltyEarnRateInput} onChange={(e) => setLoyaltyEarnRateInput(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Point Value ({currencySymbolInput} per point)</label>
                                                <input
                                                    type="number" step="0.01" min="0" disabled={!loyaltyEnabledInput}
                                                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-xl border-2 border-transparent focus:border-green-500 outline-none transition-all disabled:opacity-50"
                                                    value={loyaltyPointValueInput} onChange={(e) => setLoyaltyPointValueInput(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                            </form>
                        )}

                        {activeTab === 'currency' && (
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Currency</h2>
                                    <p className="text-gray-500 dark:text-gray-400">Auto‑detected from system with editable dropdowns</p>
                                </div>
                                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Currency Symbol</label>
                                            <input
                                                type="text"
                                                className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-xl border-2 border-transparent focus:border-amber-500 outline-none transition-all"
                                                value={currencySymbolInput}
                                                onChange={(e) => setCurrencySymbolInput(e.target.value)}
                                                placeholder="$"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Currency Code</label>
                                            <input
                                                type="text"
                                                className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-xl border-2 border-transparent focus:border-amber-500 outline-none transition-all"
                                                value={currencyCodeInput}
                                                onChange={(e) => setCurrencyCodeInput(e.target.value.toUpperCase())}
                                                placeholder="USD"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Locale</label>
                                            <select
                                                className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-xl border-2 border-transparent focus:border-amber-500 outline-none transition-all"
                                                value={localeInput}
                                                onChange={(e) => setLocaleInput(e.target.value)}
                                            >
                                                {localeOptions.map(loc => (
                                                    <option key={loc} value={loc}>
                                                        {loc === systemLocale ? `System (${loc})` : loc}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Time Zone</label>
                                            <select
                                                className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-xl border-2 border-transparent focus:border-amber-500 outline-none transition-all"
                                                value={timeZoneInput}
                                                onChange={(e) => setTimeZoneInput(e.target.value)}
                                            >
                                                {timeZoneOptions.map(tz => (
                                                    <option key={tz} value={tz}>
                                                        {tz === systemTimeZone ? `System (${tz})` : tz}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'branding' && (
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Branding</h2>
                                    <p className="text-gray-500 dark:text-gray-400">Company identity, logo, and contact details</p>
                                </div>
                                <BrandingPage
                                    hideSave
                                    onSaveReady={handleBrandingSaveReady}
                                    onSavingChange={setBrandingSaving}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
