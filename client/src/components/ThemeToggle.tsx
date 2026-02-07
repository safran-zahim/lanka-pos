import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useThemeStore();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
            title="Toggle Theme"
        >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};
