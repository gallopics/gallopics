import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon' | 'white';
  size?: 'small' | 'medium' | 'large' | 'floating'; // added floating (48px)
  shape?: 'default' | 'circle'; // explicit shape control
  disabled?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
  title?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  shape = 'default',
  disabled = false,
  icon,
  children,
  onClick,
  className = '',
  type = 'button',
  style,
  title,
}) => {
  const isCircle = shape === 'circle';
  const isIconOnly = icon && !children && shape !== 'circle';

  // Base classes
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold border-none rounded-full cursor-pointer transition-all duration-200 ease-in-out whitespace-nowrap no-underline disabled:opacity-50 disabled:cursor-not-allowed';

  // Size classes (non-circle)
  const sizeClasses: Record<string, string> = {
    small: 'px-4 py-[6px] text-[0.8125rem] min-h-[36px] h-auto font-semibold',
    medium:
      'px-6 py-[10px] text-[0.875rem] min-h-[44px] h-[44px] font-semibold',
    large: 'px-9 py-4 text-[1.125rem] min-h-[56px] h-auto font-bold',
    floating:
      'px-6 py-[10px] text-[0.875rem] min-h-[44px] h-[44px] font-semibold',
  };

  // Icon-only padding overrides
  const iconOnlyClasses: Record<string, string> = {
    small: 'p-[6px]',
    medium: 'p-[10px]',
    large: 'p-[14px]',
    floating: 'p-[10px]',
  };

  // Circle size classes
  const circleSizeClasses: Record<string, string> = {
    small: 'w-9 h-9',
    medium: 'w-11 h-11',
    large:
      'w-14 h-14 shadow-[var(--shadow-hover)] hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[var(--shadow-overlay)]',
    floating:
      'w-12 h-12 shadow-none border border-[var(--color-border)] hover:not-disabled:bg-[var(--ui-bg-subtle)]',
  };

  // Variant classes
  const variantClasses: Record<string, string> = {
    primary:
      'bg-[var(--color-brand-primary)] text-white hover:not-disabled:bg-[var(--color-brand-primary-hover)] active:not-disabled:bg-[var(--color-brand-primary-active)]',
    secondary: [
      'bg-white text-[var(--color-text-primary)]',
      'border border-[var(--color-border)]',
      'hover:not-disabled:bg-[var(--color-brand-tint)]',
      'hover:not-disabled:border-[var(--color-brand-primary)]',
      'hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[0_4px_12px_rgba(0,0,0,0.05)]',
      'active:not-disabled:bg-[var(--color-brand-tint-strong)]',
      'active:not-disabled:translate-y-0 active:not-disabled:shadow-none',
    ].join(' '),
    ghost:
      'bg-transparent text-[var(--color-text-secondary)] hover:not-disabled:bg-[var(--ui-bg-subtle)] hover:not-disabled:text-[var(--color-text-primary)] active:not-disabled:bg-[var(--color-border)]',
    icon: 'bg-transparent text-[var(--color-text-secondary)] p-2 hover:not-disabled:bg-[var(--ui-bg-subtle)] hover:not-disabled:text-[var(--color-text-primary)] active:not-disabled:bg-[var(--color-border)]',
    white:
      'bg-white text-[var(--color-text-primary)] border border-[var(--color-border)] hover:not-disabled:bg-white hover:not-disabled:text-[var(--color-text-primary)] hover:not-disabled:scale-105 hover:not-disabled:shadow-[0_4px_12px_rgba(0,0,0,0.08)]',
  };

  let classes = base;

  if (isCircle) {
    // Circle shape
    classes +=
      ' rounded-full p-0 flex items-center justify-center flex-shrink-0 border border-transparent';
    classes += ' ' + (circleSizeClasses[size] || circleSizeClasses.medium);

    // Variant overrides for circle
    if (variant === 'primary' && size === 'floating') {
      classes +=
        ' bg-[var(--color-brand-primary)] text-white !border-none hover:not-disabled:bg-[var(--color-brand-primary-hover)]';
    } else {
      classes += ' ' + variantClasses[variant];
    }
  } else if (isIconOnly) {
    classes += ' ' + (iconOnlyClasses[size] || iconOnlyClasses.medium);
    classes += ' ' + variantClasses[variant];
  } else {
    classes += ' ' + (sizeClasses[size] || sizeClasses.medium);
    classes += ' ' + variantClasses[variant];
  }

  classes += ' ' + className;

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      type={type}
      title={title || (typeof children === 'string' ? children : undefined)}
      style={style}
    >
      {icon && <span className="flex items-center leading-none">{icon}</span>}
      {children && <span className="leading-none">{children}</span>}
    </button>
  );
};
