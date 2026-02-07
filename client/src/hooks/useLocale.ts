import { useSettingsStore } from '../store/useSettingsStore';

export const useLocale = () => {
    const { locale, timeZone } = useSettingsStore();

    const formatDateTime = (date: Date) => {
        return new Intl.DateTimeFormat(locale || 'en-US', {
            timeZone: timeZone || 'UTC',
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat(locale || 'en-US', {
            timeZone: timeZone || 'UTC',
            dateStyle: 'medium'
        }).format(date);
    };

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat(locale || 'en-US', {
            timeZone: timeZone || 'UTC',
            timeStyle: 'short'
        }).format(date);
    };

    return { locale, timeZone, formatDateTime, formatDate, formatTime };
};
