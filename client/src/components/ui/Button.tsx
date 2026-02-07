import React, { ButtonHTMLAttributes } from 'react';
import { Loader } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

    const variantStyles = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg shadow-gray-600/20',
        success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20',
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20',
        warning: 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-600/20',
        ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600',
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <Loader size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} className="animate-spin" />
            ) : icon}
            {children}
        </button>
    );
};
