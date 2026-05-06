import { create } from 'zustand';
import { getApiUrl } from '../config/api';
import { useAuthStore } from './useAuthStore';

interface SettingsState {
    taxEnabled: boolean;
    taxRate: number;
    roundOffEnabled: boolean;
    roundOffDecimals: number;
    loyaltyEnabled: boolean;
    loyaltyEarnRate: number;
    loyaltyPointValue: number;
    allowOverSelling: boolean;
    enableDailyRegister: boolean;
    enableCustomerCredit: boolean;
    developerFooter: string;
    developerFooterEnabled: boolean;
    toastEnabled: boolean;
    currencySymbol: string;
    currencyCode: string;
    locale: string;
    timeZone: string;
    loading: boolean;
    loadSettings: () => Promise<void>;
    updateSetting: (key: string, value: any) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    taxEnabled: false,
    taxRate: 0, // Default 8%
    roundOffEnabled: false,
    roundOffDecimals: 0,
    loyaltyEnabled: false,
    loyaltyEarnRate: 0.1, // points per 1 currency unit (1 point per 10 currency units)
    loyaltyPointValue: 0.10, // currency value per point
    allowOverSelling: false,
    enableDailyRegister: false, // Default false: Users must opt-in to shift tracking
    enableCustomerCredit: true, // Default true as per user request
    developerFooter: 'Developed by Tap Lanka POS 0705083388',
    developerFooterEnabled: true,
    toastEnabled: true,
    currencySymbol: 'Rs.',
    currencyCode: 'LKR',
    locale: typeof window !== 'undefined' && window.navigator?.language ? window.navigator.language : 'en-US',
    timeZone: typeof window !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'UTC',
    loading: true,

    loadSettings: async () => {
        try {
            const token = useAuthStore.getState().token;
            // If no token, use defaults and stop loading
            if (!token) {
                set({ loading: false });
                return;
            }

            const response = await fetch(getApiUrl('/settings'), {
                headers: { Authorization: `Bearer ${token}` }
            });

            // If 401/403, just skip and use defaults
            if (!response.ok) {
                set({ loading: false });
                return;
            }

            const settingsList = await response.json();
            const settingsMap = (settingsList || []).reduce((acc: Record<string, any>, setting: any) => {
                acc[setting.key] = setting.value;
                return acc;
            }, {});

            const systemTimeZone = typeof window !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone
                ? Intl.DateTimeFormat().resolvedOptions().timeZone
                : 'UTC';

            set({
                taxEnabled: settingsMap.taxEnabled ?? false,
                taxRate: settingsMap.taxRate ?? 0.08,
                roundOffEnabled: settingsMap.roundOffEnabled ?? false,
                roundOffDecimals: settingsMap.roundOffDecimals ?? 2,
                loyaltyEnabled: settingsMap.loyaltyEnabled ?? true,
                loyaltyEarnRate: settingsMap.loyaltyEarnRate ?? 0.1,
                loyaltyPointValue: settingsMap.loyaltyPointValue ?? 0.10,
                allowOverSelling: settingsMap.allowOverSelling ?? false,
                enableDailyRegister: settingsMap.enableDailyRegister ?? false,
                toastEnabled: settingsMap.toastEnabled ?? true,
                currencySymbol: settingsMap.currencySymbol ?? 'Rs.',
                currencyCode: settingsMap.currencyCode ?? 'LKR',
                locale: settingsMap.locale ?? 'en-US',
                timeZone: settingsMap.timeZone ?? systemTimeZone,
                enableCustomerCredit: settingsMap.enableCustomerCredit ?? true,
                developerFooter: settingsMap.developerFooter ?? 'Developed by Tap Lanka POS 0705083388',
                developerFooterEnabled: settingsMap.developerFooterEnabled ?? true
            });
            set({ loading: false });
        } catch (error) {
            console.error('Failed to load settings:', error);
            set({ loading: false });
        }
    },

    updateSetting: async (key: string, value: any) => {
        try {
            const token = useAuthStore.getState().token;
            const response = await fetch(getApiUrl(`/settings/${key}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ value })
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || 'Failed to update setting');
            }
            if (key === 'taxRate') set({ taxRate: value });
            if (key === 'taxEnabled') set({ taxEnabled: value });
            if (key === 'roundOffEnabled') set({ roundOffEnabled: value });
            if (key === 'roundOffDecimals') set({ roundOffDecimals: value });
            if (key === 'loyaltyEnabled') set({ loyaltyEnabled: value });
            if (key === 'loyaltyEarnRate') set({ loyaltyEarnRate: value });
            if (key === 'loyaltyPointValue') set({ loyaltyPointValue: value });
            if (key === 'allowOverSelling') set({ allowOverSelling: value });
            if (key === 'enableDailyRegister') set({ enableDailyRegister: value });
            if (key === 'toastEnabled') set({ toastEnabled: value });
            if (key === 'currencySymbol') set({ currencySymbol: value });
            if (key === 'currencyCode') set({ currencyCode: value });
            if (key === 'locale') set({ locale: value });
            if (key === 'timeZone') set({ timeZone: value });
            if (key === 'enableCustomerCredit') set({ enableCustomerCredit: value });
            if (key === 'developerFooter') set({ developerFooter: value });
            if (key === 'developerFooterEnabled') set({ developerFooterEnabled: value });
        } catch (error) {
            console.error('Failed to update setting:', error);
            throw error;
        }
    }
}));
