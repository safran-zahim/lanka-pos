import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: ReactNode;
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
                        bg-input/20 
                        text-foreground 
                        p-3 rounded-lg 
                        border ${error ? 'border-destructive' : 'border-border'}
                        focus:ring-2 ${error ? 'focus:ring-destructive' : 'focus:ring-ring'}
                        focus:border-transparent 
                        outline-none 
                        transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                        placeholder:text-muted-foreground/50
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
                <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
            )}
        </div>
    );
});
