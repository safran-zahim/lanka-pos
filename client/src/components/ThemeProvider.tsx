import { useEffect } from 'react';
import { useThemeStore } from '../store/useThemeStore';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { theme } = useThemeStore();

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    return <>{children}</>;
};
