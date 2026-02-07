import { create } from 'zustand';
import { db } from '../db/db';

interface SettingsState {
    taxEnabled: boolean;
    taxRate: number;
    roundOffEnabled: boolean;
    roundOffDecimals: number;
    loyaltyEnabled: boolean;
    loyaltyEarnRate: number;
    loyaltyPointValue: number;
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
    taxEnabled: true,
    taxRate: 0.08, // Default 8%
    roundOffEnabled: false,
    roundOffDecimals: 2,
    loyaltyEnabled: true,
    loyaltyEarnRate: 0.1, // points per 1 currency unit (1 point per 10 currency units)
    loyaltyPointValue: 0.10, // currency value per point
    toastEnabled: true,
    currencySymbol: '$',
    currencyCode: 'USD',
    locale: typeof window !== 'undefined' && window.navigator?.language ? window.navigator.language : 'en-US',
    timeZone: typeof window !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'UTC',
    loading: true,

    loadSettings: async () => {
        try {
            const [taxEnabled, taxRate, roundOffEnabled, roundOffDecimals, loyaltyEnabled, loyaltyEarnRate, loyaltyPointValue, toastEnabled, currencySymbol, currencyCode, locale, timeZone] = await Promise.all([
                db.settings.get('taxEnabled'),
                db.settings.get('taxRate'),
                db.settings.get('roundOffEnabled'),
                db.settings.get('roundOffDecimals'),
                db.settings.get('loyaltyEnabled'),
                db.settings.get('loyaltyEarnRate'),
                db.settings.get('loyaltyPointValue'),
                db.settings.get('toastEnabled'),
                db.settings.get('currencySymbol'),
                db.settings.get('currencyCode'),
                db.settings.get('locale'),
                db.settings.get('timeZone')
            ]);

            set({
                taxEnabled: taxEnabled?.value ?? true,
                taxRate: taxRate?.value ?? 0.08,
                roundOffEnabled: roundOffEnabled?.value ?? false,
                roundOffDecimals: roundOffDecimals?.value ?? 2,
                loyaltyEnabled: loyaltyEnabled?.value ?? true,
                loyaltyEarnRate: loyaltyEarnRate?.value ?? 0.1,
                loyaltyPointValue: loyaltyPointValue?.value ?? 0.10,
                toastEnabled: toastEnabled?.value ?? true,
                currencySymbol: currencySymbol?.value ?? '$',
                currencyCode: currencyCode?.value ?? 'USD',
                locale: locale?.value ?? 'en-US',
                timeZone: timeZone?.value ?? 'UTC'
            });
            set({ loading: false });
        } catch (error) {
            console.error('Failed to load settings:', error);
            set({ loading: false });
        }
    },

    updateSetting: async (key: string, value: any) => {
        try {
            await db.settings.put({ key, value });
            if (key === 'taxRate') set({ taxRate: value });
            if (key === 'taxEnabled') set({ taxEnabled: value });
            if (key === 'roundOffEnabled') set({ roundOffEnabled: value });
            if (key === 'roundOffDecimals') set({ roundOffDecimals: value });
            if (key === 'loyaltyEnabled') set({ loyaltyEnabled: value });
            if (key === 'loyaltyEarnRate') set({ loyaltyEarnRate: value });
            if (key === 'loyaltyPointValue') set({ loyaltyPointValue: value });
            if (key === 'toastEnabled') set({ toastEnabled: value });
            if (key === 'currencySymbol') set({ currencySymbol: value });
            if (key === 'currencyCode') set({ currencyCode: value });
            if (key === 'locale') set({ locale: value });
            if (key === 'timeZone') set({ timeZone: value });
        } catch (error) {
            console.error('Failed to update setting:', error);
            throw error;
        }
    }
}));
