import { useSettingsStore } from '../store/useSettingsStore';

export const useCurrency = () => {
    const { currencySymbol, currencyCode, locale } = useSettingsStore();
    const formatCurrency = (value: number) => {
        if (currencyCode) {
            return new Intl.NumberFormat(locale || 'en-US', {
                style: 'currency',
                currency: currencyCode,
                currencyDisplay: 'symbol'
            }).format(value);
        }
        return `${currencySymbol}${value.toFixed(2)}`;
    };
    return { currencySymbol, currencyCode, locale, formatCurrency };
};
