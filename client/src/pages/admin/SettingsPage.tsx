import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Save, Loader, Percent, Tag, Scale, Gift, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '../../store/useToast';
import { BrandingPage } from './BrandingPage';
import { Switch } from '../../components/ui/switch';
import { Input } from '../../components/ui/Input';

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
                <Loader className="animate-spin text-primary" size={32} />
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
            <div className="bg-background text-foreground border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-shrink-0 justify-between items-center z-20">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <SettingsIcon className="text-primary" size={28} />
                        System Settings
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    {(() => {
                        const config = getSaveConfig();
                        const isBusy = activeTab === 'branding' ? brandingSaving : isSaving;
                        const colorClass = config.color === 'gray'
                            ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary/90 shadow-blue-600/20';
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
                <div className="w-64 bg-background text-foreground border-r border-gray-200 dark:border-gray-800 flex-shrink-0 flex flex-col p-4 space-y-2 overflow-y-auto">
                    <div className="px-3 mb-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Configuration</p>
                    </div>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
                                    <h2 className="text-2xl font-extrabold text-foreground">General & Tax</h2>
                                    <p className="text-muted-foreground">Manage your business tax rates and system preferences</p>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">Notifications</h3>
                                    <div className="flex items-center justify-between bg-muted border border-border rounded-lg px-4 py-3">
                                        <div>
                                            <p className="font-semibold text-foreground">Show toast messages</p>
                                            <p className="text-sm text-muted-foreground">Enable or disable pop-up notifications</p>
                                        </div>
                                            <Switch 
                                                checked={toastEnabledInput} 
                                                onCheckedChange={setToastEnabledInput} 
                                            />
                                    </div>
                                    <div className="flex items-center justify-between bg-muted border border-border rounded-lg px-4 py-3">
                                        <div>
                                            <p className="font-semibold text-foreground">Allow Over-Selling</p>
                                            <p className="text-sm text-muted-foreground">Allow selling products even when stock is zero</p>
                                        </div>
                                            <Switch 
                                                checked={allowOverSellingInput} 
                                                onCheckedChange={setAllowOverSellingInput} 
                                            />
                                    </div>
                                    <div className="flex items-center justify-between bg-muted border border-border rounded-lg px-4 py-3">
                                        <div>
                                            <p className="font-semibold text-foreground">Enable Daily Register</p>
                                            <p className="text-sm text-muted-foreground">Require cashiers to open a shift with a starting cash float before selling. Tracks all register cash movements.</p>
                                        </div>
                                            <Switch 
                                                checked={enableDailyRegisterInput} 
                                                onCheckedChange={setEnableDailyRegisterInput} 
                                            />
                                    </div>
                                    <div className="flex items-center justify-between bg-muted border border-border rounded-lg px-4 py-3">
                                        <div>
                                            <p className="font-semibold text-foreground">Enable Customer Credit</p>
                                            <p className="text-sm text-muted-foreground">Allow customers to purchase items on credit. Requires customer selection.</p>
                                        </div>
                                            <Switch 
                                                checked={enableCustomerCreditInput} 
                                                onCheckedChange={setEnableCustomerCreditInput} 
                                            />
                                    </div>
                                </div>


                                {/* TAX SECTION */}
                                <section className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border overflow-hidden">
                                    <div className="p-6 border-b border-border flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/50">
                                        <div className="p-2 bg-primary/20 text-primary rounded-lg">
                                            <Percent size={20} />
                                        </div>
                                        <h3 className="font-bold text-foreground">Tax Configuration</h3>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
                                            <div>
                                                <p className="font-bold text-foreground">Enable Sales Tax</p>
                                                <p className="text-sm text-gray-500">Apply standard tax to all invoices</p>
                                            </div>
                                                <Switch 
                                                    checked={taxEnabledInput} 
                                                    onCheckedChange={setTaxEnabledInput} 
                                                />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Default Tax Rate (%)</label>
                                                <div className="relative">
                                                    <Input
                                                        type="number" step="0.01" min="0" max="100" disabled={!taxEnabledInput}
                                                        value={rateInput} onChange={(e) => setRateInput(e.target.value)} placeholder="0.00"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* ROUNDING SECTION */}
                                <section className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border overflow-hidden">
                                    <div className="p-6 border-b border-border flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/50">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg">
                                            <Scale size={20} />
                                        </div>
                                        <h3 className="font-bold text-foreground">Precision & Rounding</h3>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
                                            <div>
                                                <p className="font-bold text-foreground">Enable Auto Rounding</p>
                                                <p className="text-sm text-gray-500">Round final totals automatically</p>
                                            </div>
                                                <Switch 
                                                    checked={roundOffEnabledInput} 
                                                    onCheckedChange={setRoundOffEnabledInput} 
                                                />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Rounding Precision</label>
                                            <select
                                                disabled={!roundOffEnabledInput}
                                                className="w-full bg-muted text-foreground p-3 rounded-md border border-input focus:ring-2 focus:ring-purple-500 outline-none transition-all disabled:opacity-50"
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
                                <section className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border overflow-hidden">
                                    <div className="p-6 border-b border-border flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/50">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/40 text-success rounded-lg">
                                            <Gift size={20} />
                                        </div>
                                        <h3 className="font-bold text-foreground">Loyalty Rewards</h3>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
                                            <div>
                                                <p className="font-bold text-foreground">Loyalty Program</p>
                                                <p className="text-sm text-gray-500">Allow customers to earn and spend points</p>
                                            </div>
                                                <Switch 
                                                    checked={loyaltyEnabledInput} 
                                                    onCheckedChange={setLoyaltyEnabledInput} 
                                                />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Earn Rate (Points per {currencySymbolInput}1)</label>
                                                <Input
                                                    type="number" step="0.01" min="0" disabled={!loyaltyEnabledInput}
                                                    value={loyaltyEarnRateInput} onChange={(e) => setLoyaltyEarnRateInput(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Point Value ({currencySymbolInput} per point)</label>
                                                <Input
                                                    type="number" step="0.01" min="0" disabled={!loyaltyEnabledInput}
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
                                    <h2 className="text-2xl font-extrabold text-foreground">Currency</h2>
                                    <p className="text-muted-foreground">Auto‑detected from system with editable dropdowns</p>
                                </div>
                                <section className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border overflow-hidden">
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Currency Symbol</label>
                                            <Input
                                                type="text"
                                                value={currencySymbolInput}
                                                onChange={(e) => setCurrencySymbolInput(e.target.value)}
                                                placeholder="$"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Currency Code</label>
                                            <Input
                                                type="text"
                                                value={currencyCodeInput}
                                                onChange={(e) => setCurrencyCodeInput(e.target.value.toUpperCase())}
                                                placeholder="USD"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Locale</label>
                                            <select
                                                className="w-full bg-muted text-foreground p-3 rounded-md border border-input focus:ring-2 focus:ring-amber-500 outline-none transition-all"
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
                                                className="w-full bg-muted text-foreground p-3 rounded-md border border-input focus:ring-2 focus:ring-amber-500 outline-none transition-all"
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
                                    <h2 className="text-2xl font-extrabold text-foreground">Branding</h2>
                                    <p className="text-muted-foreground">Company identity, logo, and contact details</p>
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
