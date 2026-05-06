import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../db/db', () => {
    const settingsMap = new Map<string, any>();
    return {
        db: {
            settings: {
                get: (key: string) => Promise.resolve(settingsMap.has(key) ? { key, value: settingsMap.get(key) } : undefined),
                put: ({ key, value }: { key: string; value: any }) => {
                    settingsMap.set(key, value);
                    return Promise.resolve();
                }
            }
        }
    };
});

import { useSettingsStore } from '../store/useSettingsStore';

describe('useSettingsStore', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ([])
        }));

        useSettingsStore.setState({
            taxEnabled: true,
            taxRate: 0.08,
            roundOffEnabled: false,
            roundOffDecimals: 2,
            loyaltyEnabled: true,
            loyaltyEarnRate: 0.1,
            loyaltyPointValue: 0.1,
            toastEnabled: true,
            currencySymbol: '$',
            currencyCode: 'USD',
            locale: 'en-US',
            timeZone: 'UTC',
            loading: false
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('updates toastEnabled setting', async () => {
        await useSettingsStore.getState().updateSetting('toastEnabled', false);
        expect(useSettingsStore.getState().toastEnabled).toBe(false);
    });
});
