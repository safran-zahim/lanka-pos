import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader } from 'lucide-react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/60 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
        secondary: 'bg-slate-600 text-white hover:bg-slate-700',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        warning: 'bg-amber-600 text-white hover:bg-amber-700',
        ghost:
          'border-border bg-transparent text-foreground hover:bg-muted dark:border-input dark:hover:bg-muted/50',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: ReactNode;
}

function Button({
  className,
  children,
  variant,
  size,
  fullWidth,
  loading = false,
  icon,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} className="animate-spin" />
      ) : (
        icon
      )}
      {children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
