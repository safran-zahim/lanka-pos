import { useSettingsStore } from '../store/useSettingsStore';

export const useCurrency = () => {
    const { currencySymbol, currencyCode, locale } = useSettingsStore();
    const formatCurrency = (value: number) => {
        if (currencyCode) {
            try {
                const parts = new Intl.NumberFormat(locale || 'en-US', {
                    style: 'currency',
                    currency: currencyCode,
                    currencyDisplay: 'symbol'
                }).formatToParts(value);

                return parts.map(part => {
                    if (part.type === 'currency' && currencySymbol) {
                        return currencySymbol;
                    }
                    return part.value;
                }).join('');
            } catch (e) {
                // fallback if Intl fails
                return `${currencySymbol || ''}${value.toFixed(2)}`;
            }
        }
        return `${currencySymbol || ''}${value.toFixed(2)}`;
    };
    return { currencySymbol, currencyCode, locale, formatCurrency };
};
