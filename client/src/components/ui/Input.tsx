import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    helperText,
    icon,
    fullWidth = false,
    className = '',
    ...props
}, ref) => {
    const widthStyle = fullWidth ? 'w-full' : '';

    return (
        <div className={`${widthStyle}`}>
            {label && (
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={`
                        bg-gray-50 dark:bg-gray-900 
                        text-gray-900 dark:text-white 
                        p-3 rounded-lg 
                        border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                        focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-blue-500'}
                        focus:border-transparent 
                        outline-none 
                        transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${icon ? 'pl-10' : ''}
                        ${widthStyle}
                        ${className}
                    `}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
            {helperText && !error && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helperText}</p>
            )}
        </div>
    );
});
